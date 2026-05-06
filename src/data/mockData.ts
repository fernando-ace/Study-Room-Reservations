import type { AvailabilitySlot, Reservation, Room, Site } from "../types";

export const sites: Site[] = [
  {
    id: "brown-kopel",
    name: "Brown-Kopel Center",
    category: "Study rooms and event spaces",
    url: "https://brownkopel.eng.auburn.edu/reserve.php",
    enabled: true,
  },
  {
    id: "aerospace",
    name: "Aerospace Engineering",
    category: "Conference rooms",
    url: "https://aerospace.eng.auburn.edu/reserve.php",
    enabled: false,
  },
  {
    id: "biosystems",
    name: "Biosystems Engineering",
    category: "Vehicles, equipment, and rooms",
    url: "https://biosystems.eng.auburn.edu/reserve.php",
    enabled: false,
  },
  {
    id: "makerspace",
    name: "Engineering Makerspace",
    category: "Equipment and project spaces",
    url: "https://makerspace.eng.auburn.edu/reserve.php",
    enabled: false,
  },
  {
    id: "mechanical",
    name: "Mechanical Engineering",
    category: "Conference rooms",
    url: "https://mechanical.eng.auburn.edu/reserve.php",
    enabled: false,
  },
  {
    id: "rbd-makerspace",
    name: "RBD Library MakerSpace",
    category: "Equipment and work tables",
    url: "https://rbdlibrary-makerspace.eng.auburn.edu/reserve.php",
    enabled: false,
  },
  {
    id: "microscopy",
    name: "Shared Use Research Lab",
    category: "Research equipment",
    url: "https://microscopy.eng.auburn.edu/reserve.php",
    enabled: false,
  },
];

export const rooms: Room[] = [
  { id: "52", siteId: "brown-kopel", name: "0132", floor: "Bottom Floor", capacity: 4, category: "Study Room", status: "blocked", features: ["Whiteboard", "Quiet zone", "Outlet access"] },
  { id: "53", siteId: "brown-kopel", name: "0134", floor: "Bottom Floor", capacity: 4, category: "Study Room", status: "blocked", features: ["Whiteboard", "Display", "Near atrium"] },
  { id: "54", siteId: "brown-kopel", name: "0136", floor: "Bottom Floor", capacity: 4, category: "Study Room", status: "open", features: ["Whiteboard", "Outlet access"] },
  { id: "55", siteId: "brown-kopel", name: "0138", floor: "Bottom Floor", capacity: 4, category: "Study Room", status: "open", features: ["Whiteboard", "Quiet zone"] },
  { id: "56", siteId: "brown-kopel", name: "0150", floor: "Bottom Floor", capacity: 4, category: "Study Room", status: "open", features: ["Display", "Outlet access"] },
  { id: "57", siteId: "brown-kopel", name: "0152", floor: "Bottom Floor", capacity: 4, category: "Study Room", status: "open", features: ["Whiteboard", "Close to makerspace"] },
  { id: "58", siteId: "brown-kopel", name: "0154", floor: "Bottom Floor", capacity: 4, category: "Study Room", status: "blocked", features: ["Whiteboard", "Quiet zone"] },
  { id: "26", siteId: "brown-kopel", name: "2118", floor: "Second Floor", capacity: 6, category: "Study Room", status: "open", features: ["Whiteboard", "Display", "Window"] },
  { id: "27", siteId: "brown-kopel", name: "2120", floor: "Second Floor", capacity: 6, category: "Study Room", status: "open", features: ["Whiteboard", "Window"] },
  { id: "29", siteId: "brown-kopel", name: "2125", floor: "Second Floor", capacity: 6, category: "Study Room", status: "open", features: ["Whiteboard", "Display"] },
  { id: "30", siteId: "brown-kopel", name: "2127", floor: "Second Floor", capacity: 6, category: "Study Room", status: "open", features: ["Whiteboard", "Outlet access"] },
  { id: "31", siteId: "brown-kopel", name: "2130", floor: "Second Floor", capacity: 4, category: "Study Room", status: "open", features: ["Whiteboard", "Quiet zone"] },
  { id: "33", siteId: "brown-kopel", name: "2132", floor: "Second Floor", capacity: 6, category: "Study Room", status: "open", features: ["Whiteboard", "Display", "Window"] },
  { id: "34", siteId: "brown-kopel", name: "2135", floor: "Second Floor", capacity: 6, category: "Study Room", status: "open", features: ["Whiteboard", "Window"] },
  { id: "157", siteId: "brown-kopel", name: "1139D", floor: "Event Space", capacity: 16, category: "Conference Room", status: "blocked", features: ["Conference display", "Camera", "Event approval"] },
  { id: "24", siteId: "brown-kopel", name: "2116", floor: "Event Space", capacity: 20, category: "Conference Room", status: "blocked", features: ["Conference display", "Whiteboard", "Event approval"] },
  { id: "61", siteId: "brown-kopel", name: "0158", floor: "Event Space", capacity: 48, category: "Classroom", status: "blocked", features: ["Classroom seating", "Projector", "Event approval"] },
  { id: "49", siteId: "brown-kopel", name: "2143", floor: "Event Space", capacity: 150, category: "Ballroom", status: "blocked", features: ["Large event", "Fee may apply", "Event approval"] },
];

export const availability: AvailabilitySlot[] = [
  { roomId: "54", date: "2026-05-06", start: "09:00", end: "10:30", status: "available" },
  { roomId: "54", date: "2026-05-06", start: "11:00", end: "12:30", status: "reserved" },
  { roomId: "55", date: "2026-05-06", start: "10:00", end: "11:30", status: "available" },
  { roomId: "56", date: "2026-05-06", start: "13:00", end: "14:30", status: "available" },
  { roomId: "26", date: "2026-05-06", start: "14:00", end: "15:30", status: "available" },
  { roomId: "27", date: "2026-05-06", start: "15:00", end: "16:30", status: "available" },
  { roomId: "29", date: "2026-05-06", start: "17:00", end: "18:30", status: "available" },
  { roomId: "30", date: "2026-05-06", start: "18:00", end: "19:30", status: "available" },
  { roomId: "31", date: "2026-05-07", start: "08:30", end: "10:00", status: "available" },
  { roomId: "33", date: "2026-05-07", start: "12:00", end: "13:30", status: "available" },
  { roomId: "34", date: "2026-05-07", start: "16:00", end: "17:30", status: "available" },
];

export const initialReservations: Reservation[] = [
  {
    id: "res-100",
    roomId: "26",
    title: "Senior design work session",
    date: "2026-05-07",
    start: "14:00",
    end: "15:30",
    attendeeCount: 5,
    status: "confirmed",
  },
];
