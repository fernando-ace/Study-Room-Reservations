export type View = "reserve" | "map" | "bookings" | "requests" | "profile";

export type ResourceStatus = "Open" | "Closed" | "Blocked" | "Not Checked-in" | "Approval needed";

export type AvailabilityStatus = "available" | "reserved" | "blocked" | "selected";

export type ResourceKind =
  | "Study Room"
  | "Conference Room"
  | "Classroom"
  | "Ballroom"
  | "Equipment"
  | "Tables"
  | "Vehicle"
  | "Chamber"
  | "Lab"
  | "Other";

export type Site = {
  id: string;
  name: string;
  shortName: string;
  databaseName: string;
  category: string;
  url: string;
  locationNote?: string;
  nav: string[];
  mapMode: "floor-plan" | "resource-zones";
};

export type Resource = {
  id: string;
  siteId: string;
  name: string;
  description?: string;
  floor?: string;
  capacity: number;
  kind: ResourceKind;
  status: ResourceStatus;
  action: "reserve" | "request" | "both";
  features: string[];
  instructions?: string;
};

export type FloorMap = {
  siteId: string;
  floor: string;
  label: string;
  source: string;
  zones: FloorZone[];
};

export type FloorZone = {
  resourceId: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type AvailabilitySlot = {
  resourceId: string;
  date: string;
  start: string;
  end: string;
  status: AvailabilityStatus;
};

export type Reservation = {
  id: string;
  resourceId: string;
  siteId: string;
  title: string;
  date: string;
  start: string;
  end: string;
  attendeeCount: number;
  status: "confirmed" | "cancelled";
};

export type RequestRoom = {
  id: string;
  siteId: string;
  typeOfSpace: ResourceKind | "Any";
  requestedResourceId?: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  recurring: boolean;
  flexible: boolean;
  attendees: number;
  foodServed: boolean;
  accessories: string[];
  chairs: number;
  tables: number;
};

export type SpecialRequest = {
  id: string;
  siteId: string;
  eventName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  organization: string;
  collegeAffiliated: "Yes" | "No";
  rooms: RequestRoom[];
  trashAndRecycling: boolean;
  attendeeCount: number;
  details: string;
  itineraryFileName?: string;
  fop: string;
  createdAt: string;
};

export type UserProfile = {
  firstName: string;
  nickName: string;
  email: string;
  phone: string;
  classification: "Undergraduate" | "Graduate" | "Staff" | "Faculty" | "";
  department: string;
  defaultSiteId: string;
  notificationType: "Both" | "Email" | "Text";
  newsletter: boolean;
  events: boolean;
};

export type ResourceFilters = {
  siteId: string;
  query?: string;
  kind?: ResourceKind | "All";
  floor?: string;
  status?: ResourceStatus | "All";
  minCapacity?: number;
};
