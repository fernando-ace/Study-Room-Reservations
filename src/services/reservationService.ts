import { availability, initialReservations, rooms, sites } from "../data/mockData";
import type {
  AvailabilitySlot,
  Reservation,
  ReservationInput,
  Room,
  RoomFilters,
  SpecialRequest,
} from "../types";

const delay = async () => new Promise((resolve) => window.setTimeout(resolve, 160));

let reservations: Reservation[] = [...initialReservations];
let specialRequests: SpecialRequest[] = [];

export async function listSites() {
  await delay();
  return sites;
}

export async function listRooms(filters: RoomFilters = {}) {
  await delay();
  return rooms.filter((room) => {
    const matchesQuery = !filters.query || room.name.toLowerCase().includes(filters.query.toLowerCase());
    const matchesCapacity = !filters.capacity || room.capacity >= filters.capacity;
    const matchesFloor = !filters.floor || room.floor === filters.floor;
    const matchesCategory = !filters.category || room.category === filters.category;
    return matchesQuery && matchesCapacity && matchesFloor && matchesCategory;
  });
}

export async function listAvailability(dateRange: { start: string; end: string }, filters: RoomFilters = {}) {
  await delay();
  const matchingRooms = await listRooms(filters);
  const matchingRoomIds = new Set(matchingRooms.map((room) => room.id));
  const cancelledReservationKeys = reservations
    .filter((reservation) => reservation.status === "cancelled")
    .map((reservation) => `${reservation.roomId}-${reservation.date}-${reservation.start}-${reservation.end}`);
  const cancelled = new Set(cancelledReservationKeys);

  return availability.filter((slot) => {
    const key = `${slot.roomId}-${slot.date}-${slot.start}-${slot.end}`;
    return (
      matchingRoomIds.has(slot.roomId) &&
      slot.date >= dateRange.start &&
      slot.date <= dateRange.end &&
      !cancelled.has(key)
    );
  });
}

export async function listReservations() {
  await delay();
  return reservations.filter((reservation) => reservation.status === "confirmed");
}

export async function createReservation(input: ReservationInput) {
  await delay();
  const reservation: Reservation = {
    ...input,
    id: `res-${Date.now()}`,
    status: "confirmed",
  };
  reservations = [reservation, ...reservations];
  return reservation;
}

export async function cancelReservation(id: string) {
  await delay();
  reservations = reservations.map((reservation) =>
    reservation.id === id ? { ...reservation, status: "cancelled" } : reservation,
  );
}

export async function createSpecialRequest(input: SpecialRequest) {
  await delay();
  specialRequests = [input, ...specialRequests];
  return { id: `request-${specialRequests.length}`, ...input };
}

export function roomById(roomId: string): Room | undefined {
  return rooms.find((room) => room.id === roomId);
}

export function availableSlotsForRoom(roomId: string, date: string): AvailabilitySlot[] {
  return availability.filter((slot) => slot.roomId === roomId && slot.date === date && slot.status === "available");
}
