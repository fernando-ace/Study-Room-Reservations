import type { AvailabilitySlot, FloorMap, Reservation, Resource, Site, UserProfile } from "../types";

export const today = "2026-05-11";

export const sites: Site[] = [
  {
    id: "brown-kopel",
    name: "Brown-Kopel Center",
    shortName: "Brown-Kopel",
    databaseName: "Brown-Kopel Center Database",
    category: "Study rooms and event spaces",
    url: "https://brownkopel.eng.auburn.edu/reserve.php",
    nav: ["Home", "Reserve", "About/Help"],
    mapMode: "floor-plan",
  },
  {
    id: "aerospace",
    name: "Aerospace Engineering",
    shortName: "Aerospace",
    databaseName: "Aerospace Engineering Database",
    category: "Conference rooms and vehicle schedule",
    url: "https://aerospace.eng.auburn.edu/reserve.php",
    nav: ["Home", "Reserve", "About/Help"],
    mapMode: "resource-zones",
  },
  {
    id: "biosystems",
    name: "Biosystems Engineering",
    shortName: "Biosystems",
    databaseName: "Biosystems Engineering Database",
    category: "Vehicles, equipment, rooms, and chambers",
    url: "https://biosystems.eng.auburn.edu/reserve.php",
    nav: ["Home", "Training", "Reserve", "Services", "About/Help"],
    mapMode: "resource-zones",
  },
  {
    id: "makerspace",
    name: "Engineering Makerspace",
    shortName: "Makerspace",
    databaseName: "Engineering Makerspace Database",
    category: "Equipment, shops, tables, and classroom area",
    url: "https://makerspace.eng.auburn.edu/reserve.php",
    nav: ["Home", "Training", "Shops", "Reserve/Events", "Gallery", "Services", "About/Help"],
    mapMode: "resource-zones",
  },
  {
    id: "mechanical",
    name: "Mechanical Engineering",
    shortName: "Mechanical",
    databaseName: "Mechanical Engineering Database",
    category: "Wiggins Hall conference rooms",
    url: "https://mechanical.eng.auburn.edu/reserve.php",
    nav: ["Home", "Reserve", "About/Help"],
    mapMode: "resource-zones",
  },
  {
    id: "rbd-makerspace",
    name: "RBD Library MakerSpace",
    shortName: "RBD MakerSpace",
    databaseName: "RBD Library MakerSpace Database",
    category: "1st Floor Innovation & Commons",
    url: "https://rbdlibrary-makerspace.eng.auburn.edu/reserve.php",
    locationNote: "1st Floor Innovation & Commons",
    nav: ["Home", "Training", "Shops", "Reserve", "Gallery", "Services", "About/Help"],
    mapMode: "resource-zones",
  },
  {
    id: "microscopy",
    name: "Shared Use Research Lab",
    shortName: "Research Lab",
    databaseName: "Shared Use Research Lab Database",
    category: "Microscopy and sample prep equipment",
    url: "https://microscopy.eng.auburn.edu/reserve.php",
    nav: ["Home", "Training", "Reserve", "Services", "About/Help"],
    mapMode: "resource-zones",
  },
];

const brownKopelBottom: Resource[] = [
  resource("bk-0115", "brown-kopel", "0115", "Bottom Floor", 1, "Study Room", "Blocked", "reserve", ["Whiteboard", "Outlet access"]),
  resource("bk-0118", "brown-kopel", "0118", "Bottom Floor", 4, "Study Room", "Open", "reserve", ["Whiteboard", "Quiet zone"]),
  resource("bk-0122", "brown-kopel", "0122", "Bottom Floor", 4, "Study Room", "Closed", "reserve", ["Whiteboard"]),
  resource("bk-0132", "brown-kopel", "0132", "Bottom Floor", 4, "Study Room", "Blocked", "reserve", ["Whiteboard", "Near atrium"]),
  resource("bk-0134", "brown-kopel", "0134", "Bottom Floor", 4, "Study Room", "Blocked", "reserve", ["Display", "Whiteboard"]),
  resource("bk-0136", "brown-kopel", "0136", "Bottom Floor", 4, "Study Room", "Open", "reserve", ["Whiteboard"]),
  resource("bk-0138", "brown-kopel", "0138", "Bottom Floor", 4, "Study Room", "Open", "reserve", ["Quiet zone"]),
  resource("bk-0150", "brown-kopel", "0150", "Bottom Floor", 4, "Study Room", "Open", "reserve", ["Display"]),
  resource("bk-0152", "brown-kopel", "0152", "Bottom Floor", 4, "Study Room", "Open", "reserve", ["Whiteboard", "Close to makerspace"]),
  resource("bk-0154", "brown-kopel", "0154", "Bottom Floor", 4, "Study Room", "Blocked", "reserve", ["Whiteboard"]),
  resource("bk-0158", "brown-kopel", "0158", "Bottom Floor", 48, "Classroom", "Blocked", "request", ["Classroom seating", "Projector", "Event approval"]),
];

const brownKopelSecond: Resource[] = [
  resource("bk-2122", "brown-kopel", "2122", "Second Floor", 6, "Study Room", "Open", "reserve", ["Whiteboard", "Window"]),
  resource("bk-2120", "brown-kopel", "2120", "Second Floor", 6, "Study Room", "Open", "reserve", ["Whiteboard"]),
  resource("bk-2118", "brown-kopel", "2118", "Second Floor", 6, "Study Room", "Open", "reserve", ["Whiteboard", "Display"]),
  resource("bk-2132", "brown-kopel", "2132", "Second Floor", 6, "Study Room", "Open", "reserve", ["Whiteboard", "Display", "Window"]),
  resource("bk-2130", "brown-kopel", "2130", "Second Floor", 4, "Study Room", "Open", "reserve", ["Whiteboard"]),
  resource("bk-2128", "brown-kopel", "2128", "Second Floor", 6, "Study Room", "Closed", "reserve", ["Whiteboard"]),
  resource("bk-2125", "brown-kopel", "2125", "Second Floor", 6, "Study Room", "Open", "reserve", ["Display"]),
  resource("bk-2127", "brown-kopel", "2127", "Second Floor", 6, "Study Room", "Open", "reserve", ["Whiteboard", "Outlet access"]),
  resource("bk-2135", "brown-kopel", "2135", "Second Floor", 6, "Study Room", "Open", "reserve", ["Window"]),
  resource("bk-2137", "brown-kopel", "2137", "Second Floor", 6, "Study Room", "Open", "reserve", ["Whiteboard"]),
  resource("bk-2145", "brown-kopel", "2145", "Second Floor", 4, "Study Room", "Open", "reserve", ["Quiet zone"]),
  resource("bk-2147", "brown-kopel", "2147", "Second Floor", 4, "Study Room", "Open", "reserve", ["Whiteboard"]),
  resource("bk-2153", "brown-kopel", "2153", "Second Floor", 4, "Study Room", "Closed", "reserve", ["Whiteboard"]),
  resource("bk-2159", "brown-kopel", "2159", "Second Floor", 4, "Study Room", "Open", "reserve", ["Whiteboard"]),
  resource("bk-2161", "brown-kopel", "2161", "Second Floor", 4, "Study Room", "Open", "reserve", ["Window"]),
  resource("bk-2166", "brown-kopel", "2166", "Second Floor", 6, "Study Room", "Open", "reserve", ["Whiteboard"]),
  resource("bk-2164", "brown-kopel", "2164", "Second Floor", 6, "Study Room", "Open", "reserve", ["Whiteboard"]),
  resource("bk-2162", "brown-kopel", "2162", "Second Floor", 6, "Study Room", "Open", "reserve", ["Display"]),
  resource("bk-2172", "brown-kopel", "2172", "Second Floor", 6, "Study Room", "Open", "reserve", ["Whiteboard"]),
  resource("bk-2170", "brown-kopel", "2170", "Second Floor", 6, "Study Room", "Open", "reserve", ["Whiteboard"]),
  resource("bk-2168", "brown-kopel", "2168", "Second Floor", 6, "Study Room", "Open", "reserve", ["Whiteboard"]),
  resource("bk-2117", "brown-kopel", "2117", "Second Floor", 102, "Classroom", "Blocked", "request", ["Event approval"]),
  resource("bk-2133", "brown-kopel", "2133", "Second Floor", 102, "Classroom", "Blocked", "request", ["Event approval"]),
  resource("bk-2114", "brown-kopel", "2114", "Second Floor", 12, "Conference Room", "Approval needed", "request", ["Conference display"]),
  resource("bk-2174", "brown-kopel", "2174", "Second Floor", 15, "Conference Room", "Blocked", "request", ["Long table", "Porch access"]),
];

export const resources: Resource[] = [
  ...brownKopelBottom,
  resource("bk-1101", "brown-kopel", "1101", "Floor 1", 50, "Other", "Closed", "request", ["Event area", "View Reservations"]),
  resource("bk-1139d", "brown-kopel", "1139D", "Floor 1", 16, "Conference Room", "Blocked", "request", ["Camera", "Conference display"]),
  resource("bk-atrium-west", "brown-kopel", "Atrium-West end", "Floor 1", 200, "Other", "Blocked", "request", ["Atrium", "View Reservations"]),
  resource("bk-garage", "brown-kopel", "Garage Area", "Floor 1", 100, "Other", "Closed", "request", ["Event area", "View Reservations"]),
  resource("bk-gavin", "brown-kopel", "Gavin Garden", "Floor 1", 1000, "Other", "Blocked", "request", ["Outdoor event area", "View Reservations"]),
  resource("bk-2116", "brown-kopel", "2116", "Second Floor", 20, "Conference Room", "Blocked", "request", ["Hollow square", "Porch access"]),
  resource("bk-peo", "brown-kopel", "PEO Suite", "Second Floor", 20, "Conference Room", "Blocked", "request", ["Conference suite", "View Reservations"]),
  resource("bk-2143", "brown-kopel", "2143", "Second Floor", 150, "Ballroom", "Blocked", "request", ["Grand Hall", "Fee may apply"]),
  resource("bk-2151", "brown-kopel", "2151", "Second Floor", 100, "Ballroom", "Blocked", "request", ["Grand Hall", "Fee may apply"]),
  resource("bk-2157", "brown-kopel", "2157", "Second Floor", 150, "Ballroom", "Blocked", "request", ["Grand Hall", "Fee may apply"]),
  ...brownKopelSecond,
  card("aero-205", "aerospace", "Davis 205", "Conference room with whiteboard and camera system", 12, "Conference Room", "Open"),
  card("aero-207", "aerospace", "Davis 207", "Conference room with whiteboard and camera system", 10, "Conference Room", "Open"),
  card("aero-van", "aerospace", "Aerospace Box Van Schedule", "Box Van Scheduler", 1, "Vehicle", "Open"),
  card("aero-215", "aerospace", "Davis 215", "Conference room with whiteboard and camera system", 16, "Conference Room", "Open"),
  resource("bsen-caravan", "biosystems", "Dodge Caravan", undefined, 1, "Vehicle", "Not Checked-in", "reserve", ["White BSEN Minivan"]),
  resource("bsen-dodge", "biosystems", "Dodge Truck (2013)", undefined, 1, "Vehicle", "Not Checked-in", "reserve", ["License plate S4679B"]),
  resource("bsen-gmc", "biosystems", "GMC Truck (2012)", undefined, 1, "Vehicle", "Not Checked-in", "reserve", ["License plate S8477B"]),
  resource("bsen-tahoe", "biosystems", "Tahoe", undefined, 1, "Vehicle", "Not Checked-in", "reserve", ["Department vehicle"]),
  resource("bsen-gps", "biosystems", "Trimble GPS Kit", undefined, 1, "Equipment", "Open", "reserve", ["Geospatial Equipment"]),
  resource("bsen-conf", "biosystems", "Corley Conference Room", undefined, 18, "Conference Room", "Open", "both", ["Conference Room"]),
  resource("bsen-chamber", "biosystems", "Environmental Chamber", undefined, 1, "Chamber", "Closed", "reserve", ["Chambers"]),
  resource("bsen-scanner", "biosystems", "AURPI Scanner", undefined, 1, "Lab", "Open", "reserve", ["AURPI"]),
  resource("maker-car-bay", "makerspace", "Car Bay", undefined, 2, "Tables", "Closed", "request", ["Create Request", "View Calendar"]),
  resource("maker-canon", "makerspace", "Canon EOS Rebel SL2 DSLR camera", undefined, 1, "Equipment", "Open", "reserve", ["Camera"]),
  resource("maker-cricut", "makerspace", "Cricut Explore 3", undefined, 1, "Equipment", "Closed", "reserve", ["Equipment"]),
  resource("maker-gopro", "makerspace", "GOPRO Hero 6", undefined, 1, "Equipment", "Open", "reserve", ["Camera"]),
  resource("maker-janome", "makerspace", "Janome MB-4s Embroidery Machine", undefined, 1, "Equipment", "Open", "reserve", ["Textiles"]),
  resource("maker-waterjet", "makerspace", "Waterjet", undefined, 2, "Equipment", "Open", "reserve", ["Shop equipment"]),
  resource("maker-classroom", "makerspace", "Makerspace Classroom Area", undefined, 100, "Classroom", "Open", "request", ["Create Request", "View Calendar"]),
  card("mech-1409", "mechanical", "Wiggins 1409 (Large Conference Room)", "1st Floor, Wiggins Hall, located at the entrance of the building, seats up to 50 people.", 50, "Conference Room", "Open"),
  card("mech-1405", "mechanical", "Wiggins 1405 (Library)", "1st Floor, Wiggins Hall, located at the entrance of the building, seats up to 12 people.", 12, "Conference Room", "Open"),
  card("mech-2418a", "mechanical", "Wiggins 2418A", "2nd Floor, Wiggins Hall, seats up to 10 people.", 10, "Conference Room", "Open"),
  card("mech-3418a", "mechanical", "Wiggins 3418A", "3rd Floor, Wiggins Hall, seats up to 10 people.", 10, "Conference Room", "Open"),
  card("mech-1418a", "mechanical", "Wiggins 1418A", "1st Floor, Wiggins Hall inside the front office suite, seats up to 10 people.", 10, "Conference Room", "Open"),
  resource("rbd-tables", "rbd-makerspace", "Work Tables", undefined, 2, "Tables", "Closed", "request", ["Create Request", "View Calendar"]),
  resource("rbd-electronics", "rbd-makerspace", "Electronics Bench", undefined, 2, "Equipment", "Closed", "request", ["Create Request", "View Calendar"]),
  resource("rbd-embroidery", "rbd-makerspace", "Embroidery Machine", undefined, 1, "Equipment", "Closed", "request", ["Create Request", "View Calendar"]),
  resource("rbd-sewing", "rbd-makerspace", "Sewing Machine", undefined, 1, "Equipment", "Closed", "request", ["Create Request", "View Calendar"]),
  resource("rbd-spray", "rbd-makerspace", "Spray Booth", undefined, 1, "Equipment", "Closed", "request", ["Create Request", "View Calendar"]),
  resource("micro-sem", "microscopy", "SEM EVO-10", undefined, 1, "Equipment", "Not Checked-in", "reserve", ["Scanning electron microscope"]),
  resource("micro-sputter", "microscopy", "Sputter Coater", undefined, 1, "Equipment", "Open", "reserve", ["Sample prep"]),
];

export const floorMaps: FloorMap[] = [
  {
    siteId: "brown-kopel",
    floor: "Ground",
    label: "Ground",
    source: "Official Brown-Kopel floor-plan PDF",
    zones: [
      zone("bk-0115", 53, 9, 10, 13), zone("bk-0118", 64, 9, 10, 13), zone("bk-0122", 75, 9, 10, 13),
      zone("bk-0132", 55, 34, 8, 12), zone("bk-0134", 64, 34, 8, 12), zone("bk-0136", 73, 34, 8, 12),
      zone("bk-0138", 82, 34, 8, 12), zone("bk-0150", 76, 56, 8, 12), zone("bk-0152", 85, 56, 8, 12),
      zone("bk-0154", 55, 56, 8, 12), zone("bk-0158", 64, 56, 11, 26),
    ],
  },
  {
    siteId: "brown-kopel",
    floor: "Floor 1",
    label: "Floor 1",
    source: "Official Brown-Kopel floor-plan PDF",
    zones: [zone("bk-1139d", 34, 21, 19, 19)],
  },
  {
    siteId: "brown-kopel",
    floor: "Floor 2",
    label: "Floor 2",
    source: "Official Brown-Kopel floor-plan PDF",
    zones: [
      zone("bk-2118", 10, 12, 10, 12), zone("bk-2120", 22, 12, 10, 12), zone("bk-2122", 34, 12, 10, 12),
      zone("bk-2125", 48, 12, 10, 12), zone("bk-2127", 60, 12, 10, 12), zone("bk-2128", 72, 12, 10, 12),
      zone("bk-2130", 12, 36, 10, 12), zone("bk-2132", 24, 36, 10, 12), zone("bk-2135", 36, 36, 10, 12),
      zone("bk-2137", 48, 36, 10, 12), zone("bk-2143", 62, 35, 24, 22), zone("bk-2145", 10, 62, 10, 12),
      zone("bk-2147", 22, 62, 10, 12), zone("bk-2153", 34, 62, 10, 12), zone("bk-2159", 46, 62, 10, 12),
      zone("bk-2161", 58, 62, 10, 12), zone("bk-2162", 70, 62, 10, 12), zone("bk-2164", 10, 78, 10, 12),
      zone("bk-2166", 22, 78, 10, 12), zone("bk-2168", 34, 78, 10, 12), zone("bk-2170", 46, 78, 10, 12),
      zone("bk-2172", 58, 78, 10, 12), zone("bk-2174", 72, 76, 16, 14),
    ],
  },
];

export const availability: AvailabilitySlot[] = [
  slot("bk-2132", today, "09:00", "10:00", "available"),
  slot("bk-2132", today, "10:00", "11:30", "reserved"),
  slot("bk-2132", today, "13:00", "14:30", "available"),
  slot("bk-0115", today, "08:00", "09:30", "available"),
  slot("bk-0136", today, "11:00", "12:30", "available"),
  slot("bk-0150", today, "14:00", "15:30", "available"),
  slot("bk-2118", today, "15:00", "16:30", "available"),
  slot("bk-2127", "2026-05-12", "10:00", "11:30", "available"),
  slot("aero-205", today, "09:00", "10:00", "available"),
  slot("aero-van", today, "13:00", "17:00", "available"),
  slot("maker-canon", today, "12:00", "16:00", "available"),
  slot("maker-waterjet", "2026-05-12", "10:00", "12:00", "available"),
  slot("bsen-caravan", today, "08:00", "12:00", "blocked"),
  slot("micro-sputter", today, "09:00", "11:00", "available"),
];

export const initialReservations: Reservation[] = [
  {
    id: "res-100",
    resourceId: "bk-2118",
    siteId: "brown-kopel",
    title: "Senior design work session",
    date: "2026-05-12",
    start: "14:00",
    end: "15:30",
    attendeeCount: 5,
    status: "confirmed",
  },
];

export const initialProfile: UserProfile = {
  firstName: "Fernando",
  nickName: "",
  email: "fja0008@auburn.edu",
  phone: "",
  classification: "",
  department: "Aerospace",
  defaultSiteId: "brown-kopel",
  notificationType: "Both",
  newsletter: false,
  events: false,
};

function resource(
  id: string,
  siteId: string,
  name: string,
  floor: string | undefined,
  capacity: number,
  kind: Resource["kind"],
  status: Resource["status"],
  action: Resource["action"],
  features: string[],
): Resource {
  return { id, siteId, name, floor, capacity, kind, status, action, features };
}

function card(
  id: string,
  siteId: string,
  name: string,
  description: string,
  capacity: number,
  kind: Resource["kind"],
  status: Resource["status"],
): Resource {
  return resource(id, siteId, name, undefined, capacity, kind, status, "both", [description]);
}

function zone(resourceId: string, x: number, y: number, w: number, h: number) {
  return { resourceId, x, y, w, h };
}

function slot(
  resourceId: string,
  date: string,
  start: string,
  end: string,
  status: AvailabilitySlot["status"],
): AvailabilitySlot {
  return { resourceId, date, start, end, status };
}
