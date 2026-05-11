import { availability, floorMaps, initialProfile, initialReservations, resources, sites } from "../data/mockData";
import type {
  AvailabilitySlot,
  Reservation,
  Resource,
  ResourceFilters,
  SpecialRequest,
  UserProfile,
} from "../types";

const delay = async () => new Promise((resolve) => window.setTimeout(resolve, 90));

let reservations: Reservation[] = [...initialReservations];
let requests: SpecialRequest[] = [];
let profile: UserProfile = { ...initialProfile };

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
  const siteResourceIds = new Set(resources.filter((resource) => resource.siteId === siteId).map((resource) => resource.id));
  const confirmedKeys = new Set(
    reservations
      .filter((reservation) => reservation.status === "confirmed")
      .map((reservation) => `${reservation.resourceId}-${reservation.date}-${reservation.start}-${reservation.end}`),
  );
  return availability
    .filter((slot) => siteResourceIds.has(slot.resourceId) && slot.date >= startDate && slot.date <= endDate)
    .map((slot) => ({
      ...slot,
      status: confirmedKeys.has(`${slot.resourceId}-${slot.date}-${slot.start}-${slot.end}`) ? "reserved" : slot.status,
    })) satisfies AvailabilitySlot[];
}

export async function listReservations() {
  await delay();
  return reservations.filter((reservation) => reservation.status === "confirmed");
}

export async function createReservation(input: Omit<Reservation, "id" | "status">) {
  await delay();
  const reservation: Reservation = { ...input, id: `res-${Date.now()}`, status: "confirmed" };
  reservations = [reservation, ...reservations];
  return reservation;
}

export async function updateReservation(id: string, input: Partial<Reservation>) {
  await delay();
  reservations = reservations.map((reservation) => (reservation.id === id ? { ...reservation, ...input } : reservation));
  return reservations.find((reservation) => reservation.id === id);
}

export async function cancelReservation(id: string) {
  await delay();
  reservations = reservations.map((reservation) =>
    reservation.id === id ? { ...reservation, status: "cancelled" } : reservation,
  );
}

export async function createSpecialRequest(input: Omit<SpecialRequest, "id" | "createdAt">) {
  await delay();
  const request: SpecialRequest = { ...input, id: `req-${Date.now()}`, createdAt: new Date().toISOString() };
  requests = [request, ...requests];
  return request;
}

export async function listSpecialRequests() {
  await delay();
  return requests;
}

export async function getProfile() {
  await delay();
  return profile;
}

export async function updateProfile(input: UserProfile) {
  await delay();
  profile = { ...input };
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
    return [
      { label: "Bottom Floor", resources: list.filter((resource) => resource.floor === "Bottom Floor") },
      { label: "Second Floor", resources: list.filter((resource) => resource.floor === "Second Floor") },
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
