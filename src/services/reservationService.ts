import { availability, floorMaps, initialProfile, initialReservations, resources, sites } from "../data/mockData";
import type {
  AvailabilitySlot,
  Reservation,
  Resource,
  ResourceFilters,
  SpecialRequest,
  UserProfile,
} from "../types";

const STORAGE_KEYS = {
  reservations: "auburn-room-reservations:v3:reservations",
  requests: "auburn-room-reservations:v3:requests",
  profile: "auburn-room-reservations:v3:profile",
} as const;

const delay = async () => new Promise((resolve) => globalThis.setTimeout(resolve, 90));

let reservations = readStored(STORAGE_KEYS.reservations, initialReservations);
let requests = readStored<SpecialRequest[]>(STORAGE_KEYS.requests, []);
let profile = readStored(STORAGE_KEYS.profile, initialProfile);

export async function listSites() {
  await delay();
  return sites;
}

export async function listResources(filters: ResourceFilters) {
  await delay();
  return resources.filter((item) => {
    const query = filters.query?.trim().toLowerCase();
    const matchesSite = item.siteId === filters.siteId;
    const matchesQuery =
      !query ||
      item.name.toLowerCase().includes(query) ||
      item.features.join(" ").toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query);
    const matchesKind = !filters.kind || filters.kind === "All" || item.kind === filters.kind;
    const matchesFloor = !filters.floor || filters.floor === "All" || item.floor === filters.floor;
    const matchesStatus = !filters.status || filters.status === "All" || item.status === filters.status;
    const matchesCapacity = !filters.minCapacity || item.capacity >= filters.minCapacity;
    return matchesSite && matchesQuery && matchesKind && matchesFloor && matchesStatus && matchesCapacity;
  });
}

export async function listAvailability(siteId: string, startDate: string, endDate: string) {
  await delay();
  reservations = readStored(STORAGE_KEYS.reservations, initialReservations);
  const siteResourceIds = new Set(resources.filter((resource) => resource.siteId === siteId).map((resource) => resource.id));
  const confirmed = reservations.filter((reservation) => reservation.status === "confirmed");

  return availability
    .filter((slot) => siteResourceIds.has(slot.resourceId) && slot.date >= startDate && slot.date <= endDate)
    .flatMap((slot) => splitSlotAroundReservations(slot, confirmed)) satisfies AvailabilitySlot[];
}

export async function listReservations() {
  await delay();
  reservations = readStored(STORAGE_KEYS.reservations, initialReservations);
  return reservations.filter((reservation) => reservation.status === "confirmed");
}

export async function createReservation(input: Omit<Reservation, "id" | "status">) {
  await delay();
  reservations = readStored(STORAGE_KEYS.reservations, initialReservations);
  validateReservation(input);
  const reservation: Reservation = { ...input, id: uniqueId("res"), status: "confirmed" };
  reservations = [reservation, ...reservations];
  writeStored(STORAGE_KEYS.reservations, reservations);
  return reservation;
}

export async function updateReservation(id: string, input: Partial<Reservation>) {
  await delay();
  reservations = readStored(STORAGE_KEYS.reservations, initialReservations);
  const current = reservations.find((reservation) => reservation.id === id);
  if (!current) throw new Error("Reservation not found.");
  const next = { ...current, ...input };
  if (next.status === "confirmed") validateReservation(next, id);
  reservations = reservations.map((reservation) => (reservation.id === id ? next : reservation));
  writeStored(STORAGE_KEYS.reservations, reservations);
  return next;
}

export async function cancelReservation(id: string) {
  await delay();
  reservations = readStored(STORAGE_KEYS.reservations, initialReservations);
  if (!reservations.some((reservation) => reservation.id === id && reservation.status === "confirmed")) {
    throw new Error("Reservation not found.");
  }
  reservations = reservations.map((reservation) =>
    reservation.id === id ? { ...reservation, status: "cancelled" } : reservation,
  );
  writeStored(STORAGE_KEYS.reservations, reservations);
}

export async function createSpecialRequest(input: Omit<SpecialRequest, "id" | "createdAt">) {
  await delay();
  requests = readStored<SpecialRequest[]>(STORAGE_KEYS.requests, []);
  validateSpecialRequestInput(input);
  const request: SpecialRequest = { ...input, id: uniqueId("req"), createdAt: new Date().toISOString() };
  requests = [request, ...requests];
  writeStored(STORAGE_KEYS.requests, requests);
  return request;
}

export async function listSpecialRequests() {
  await delay();
  requests = readStored<SpecialRequest[]>(STORAGE_KEYS.requests, []);
  return requests;
}

export async function getProfile() {
  await delay();
  profile = readStored(STORAGE_KEYS.profile, initialProfile);
  return profile;
}

export async function updateProfile(input: UserProfile) {
  await delay();
  validateProfile(input);
  profile = { ...input };
  writeStored(STORAGE_KEYS.profile, profile);
  return profile;
}

export function resourceById(resourceId: string): Resource | undefined {
  return resources.find((resource) => resource.id === resourceId);
}

export function siteById(siteId: string) {
  return sites.find((site) => site.id === siteId);
}

export function mapsForSite(siteId: string) {
  return floorMaps.filter((map) => map.siteId === siteId);
}

export function resourceKinds(siteId: string) {
  return Array.from(new Set(resources.filter((resource) => resource.siteId === siteId).map((resource) => resource.kind)));
}

export function resourceFloors(siteId: string) {
  return Array.from(
    new Set(resources.filter((resource) => resource.siteId === siteId && resource.floor).map((resource) => resource.floor!)),
  );
}

export function groupedResources(siteId: string) {
  const list = resources.filter((resource) => resource.siteId === siteId);
  if (siteId === "brown-kopel") {
    const bottomIds = floorMaps.find((map) => map.siteId === siteId && map.floor === "Bottom Floor")?.resourceIds ?? [];
    const secondIds = floorMaps.find((map) => map.siteId === siteId && map.floor === "Second Floor")?.resourceIds ?? [];
    const mappedIds = new Set([...bottomIds, ...secondIds]);
    const resourcesForIds = (ids: string[]) => ids.map((id) => list.find((resource) => resource.id === id)).filter((resource): resource is Resource => Boolean(resource));
    return [
      { label: "Bottom Floor", resources: resourcesForIds(bottomIds) },
      { label: "Second Floor", resources: resourcesForIds(secondIds) },
      { label: "Other event spaces", resources: list.filter((resource) => !mappedIds.has(resource.id)) },
      { label: "View All", resources: list },
    ];
  }
  return Array.from(new Set(list.map((resource) => categoryFor(resource)))).map((label) => ({
    label,
    resources: list.filter((resource) => categoryFor(resource) === label),
  }));
}

export function categoryFor(resource: Resource) {
  if (resource.siteId === "biosystems") {
    if (resource.kind === "Vehicle") return "Vehicles";
    if (resource.kind === "Conference Room") return "Conference Room";
    if (resource.kind === "Chamber") return "Chambers";
    if (resource.kind === "Lab") return "AURPI";
    return resource.features.includes("Geospatial Equipment") ? "Geospatial Equipment" : "Automotive Equipment";
  }
  return resource.kind === "Conference Room" ? "Conference Rooms" : `${resource.kind}`;
}

export function intervalsOverlap(startA: string, endA: string, startB: string, endB: string) {
  return startA < endB && endA > startB;
}

function validateReservation(input: Omit<Reservation, "id" | "status"> | Reservation, excludeId?: string) {
  const resource = resourceById(input.resourceId);
  if (!resource || resource.siteId !== input.siteId) throw new Error("That room is no longer available.");
  if (resource.status !== "Open" || resource.action === "request") {
    throw new Error("This space requires a special request and cannot be reserved instantly.");
  }
  if (input.start >= input.end) throw new Error("Choose an end time after the start time.");
  if (!Number.isFinite(input.attendeeCount) || !Number.isInteger(input.attendeeCount) || input.attendeeCount < 1 || input.attendeeCount > resource.capacity) {
    throw new Error(`Room ${resource.name} seats up to ${resource.capacity}.`);
  }

  const coveredByOpenSlot = availability.some(
    (slot) =>
      slot.resourceId === input.resourceId &&
      slot.date === input.date &&
      slot.status === "available" &&
      slot.start <= input.start &&
      slot.end >= input.end,
  );
  if (!coveredByOpenSlot) throw new Error("That time is outside the room's available booking window.");

  const conflict = reservations.some(
    (reservation) =>
      reservation.id !== excludeId &&
      reservation.status === "confirmed" &&
      reservation.resourceId === input.resourceId &&
      reservation.date === input.date &&
      intervalsOverlap(reservation.start, reservation.end, input.start, input.end),
  );
  if (conflict) throw new Error("That time was just reserved. Choose another open time.");
}

function splitSlotAroundReservations(slot: AvailabilitySlot, confirmed: Reservation[]): AvailabilitySlot[] {
  if (slot.status !== "available") return [slot];
  const conflicts = confirmed
    .filter(
      (reservation) =>
        reservation.resourceId === slot.resourceId &&
        reservation.date === slot.date &&
        intervalsOverlap(reservation.start, reservation.end, slot.start, slot.end),
    )
    .sort((a, b) => a.start.localeCompare(b.start));

  return conflicts.reduce<AvailabilitySlot[]>((segments, reservation) =>
    segments.flatMap((segment) => {
      if (segment.status !== "available" || !intervalsOverlap(reservation.start, reservation.end, segment.start, segment.end)) {
        return [segment];
      }
      const overlapStart = reservation.start > segment.start ? reservation.start : segment.start;
      const overlapEnd = reservation.end < segment.end ? reservation.end : segment.end;
      return [
        ...(segment.start < overlapStart ? [{ ...segment, end: overlapStart }] : []),
        { ...segment, start: overlapStart, end: overlapEnd, status: "reserved" as const },
        ...(overlapEnd < segment.end ? [{ ...segment, start: overlapEnd }] : []),
      ];
    }), [slot]);
}

function validateSpecialRequestInput(input: Omit<SpecialRequest, "id" | "createdAt">) {
  if (!siteById(input.siteId)) throw new Error("Choose a valid reservation site.");
  if (!input.eventName.trim() || !input.contactName.trim()) throw new Error("Event and contact names are required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.contactEmail)) throw new Error("Enter a valid contact email.");
  if (!Number.isFinite(input.attendeeCount) || !Number.isInteger(input.attendeeCount) || input.attendeeCount < 1) {
    throw new Error("Enter a whole-number attendee count.");
  }
  if (!input.rooms.length) throw new Error("Add at least one room or space.");
  input.rooms.forEach((room) => {
    if (room.siteId !== input.siteId) throw new Error("Every requested room must belong to the selected site.");
    if (`${room.endDate}T${room.endTime}` <= `${room.startDate}T${room.startTime}`) {
      throw new Error("Every room request must end after it starts.");
    }
    if (!Number.isFinite(room.attendees) || !Number.isInteger(room.attendees) || room.attendees < 1) {
      throw new Error("Every room needs a whole-number attendee count.");
    }
    if (room.requestedResourceId) {
      const resource = resourceById(room.requestedResourceId);
      if (!resource || resource.siteId !== input.siteId || (room.typeOfSpace !== "Any" && resource.kind !== room.typeOfSpace)) {
        throw new Error("A requested room does not match the selected site or space type.");
      }
    }
  });
}

function validateProfile(input: UserProfile) {
  if (!input.firstName.trim()) throw new Error("First name is required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) throw new Error("Enter a valid email address.");
  if (!siteById(input.defaultSiteId)) throw new Error("Choose a valid default site.");
  if (!['Email', 'Text', 'Both'].includes(input.notificationType)) throw new Error("Choose a valid notification preference.");
}

function uniqueId(prefix: string) {
  const value = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${value}`;
}

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return clone(fallback);
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : clone(fallback);
  } catch {
    return clone(fallback);
  }
}

function writeStored<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The in-memory state remains usable when storage is unavailable.
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
