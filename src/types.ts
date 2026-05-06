export type Site = {
  id: string;
  name: string;
  category: string;
  url: string;
  enabled: boolean;
};

export type RoomStatus = "open" | "blocked" | "closed";

export type Room = {
  id: string;
  siteId: string;
  name: string;
  floor: "Bottom Floor" | "Second Floor" | "Event Space";
  capacity: number;
  category: "Study Room" | "Conference Room" | "Classroom" | "Ballroom" | "Other";
  status: RoomStatus;
  features: string[];
};

export type AvailabilityStatus = "available" | "reserved" | "blocked";

export type AvailabilitySlot = {
  roomId: string;
  date: string;
  start: string;
  end: string;
  status: AvailabilityStatus;
};

export type Reservation = {
  id: string;
  roomId: string;
  title: string;
  date: string;
  start: string;
  end: string;
  attendeeCount: number;
  status: "confirmed" | "cancelled";
};

export type SpecialRequest = {
  eventName: string;
  contactName: string;
  contactEmail: string;
  organization: string;
  roomType: string;
  date: string;
  start: string;
  end: string;
  attendeeCount: number;
  details: string;
};

export type RoomFilters = {
  query?: string;
  capacity?: number;
  floor?: string;
  category?: string;
};

export type ReservationInput = Omit<Reservation, "id" | "status">;
