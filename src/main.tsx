import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Bell,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  Clock3,
  Home,
  MapPin,
  Menu,
  MessageSquare,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import "./styles.css";
import type { AvailabilitySlot, Reservation, Room, Site, SpecialRequest } from "./types";
import {
  availableSlotsForRoom,
  cancelReservation,
  createReservation,
  createSpecialRequest,
  listAvailability,
  listReservations,
  listRooms,
  listSites,
  roomById,
} from "./services/reservationService";

type View = "reserve" | "upcoming" | "requests" | "settings";

const today = "2026-05-06";

function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour = hours % 12 || 12;
  return `${hour}:${minutes.toString().padStart(2, "0")} ${suffix}`;
}

function dateLabel(date: string) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(
    new Date(`${date}T12:00:00`),
  );
}

function statusLabel(status: Room["status"]) {
  return status === "open" ? "Open now" : status === "blocked" ? "Needs approval" : "Closed";
}

function App() {
  const [view, setView] = useState<View>("reserve");
  const [sites, setSites] = useState<Site[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedSite, setSelectedSite] = useState("brown-kopel");
  const [siteMenuOpen, setSiteMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [capacity, setCapacity] = useState(4);
  const [floor, setFloor] = useState("Any floor");
  const [date, setDate] = useState(today);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [bookingTitle, setBookingTitle] = useState("Study session");
  const [attendeeCount, setAttendeeCount] = useState(4);
  const [bookingComplete, setBookingComplete] = useState<Reservation | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [requestError, setRequestError] = useState("");

  useEffect(() => {
    void listSites().then(setSites);
    void listReservations().then(setReservations);
  }, []);

  const filters = useMemo(
    () => ({
      query,
      capacity,
      floor: floor === "Any floor" ? undefined : floor,
      category: view === "reserve" ? "Study Room" : undefined,
    }),
    [capacity, floor, query, view],
  );

  useEffect(() => {
    void listRooms(filters).then(setRooms);
    void listAvailability({ start: date, end: date }, filters).then(setSlots);
  }, [date, filters]);

  const currentSite = sites.find((site) => site.id === selectedSite) ?? sites[0];
  const selectedRoom = selectedSlot ? roomById(selectedSlot.roomId) : undefined;
  const availableRoomIds = new Set(slots.filter((slot) => slot.status === "available").map((slot) => slot.roomId));
  const recommendedRooms = rooms
    .filter((room) => room.siteId === "brown-kopel")
    .sort((a, b) => Number(!availableRoomIds.has(a.id)) - Number(!availableRoomIds.has(b.id)));

  async function confirmBooking() {
    if (!selectedSlot || !selectedRoom) return;
    const reservation = await createReservation({
      roomId: selectedRoom.id,
      title: bookingTitle || "Study session",
      date: selectedSlot.date,
      start: selectedSlot.start,
      end: selectedSlot.end,
      attendeeCount,
    });
    setReservations(await listReservations());
    setBookingComplete(reservation);
    setView("upcoming");
  }

  async function cancel(reservationId: string) {
    await cancelReservation(reservationId);
    setReservations(await listReservations());
  }

  async function submitSpecialRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestError("");
    setRequestSent(false);
    const form = new FormData(event.currentTarget);
    const request: SpecialRequest = {
      eventName: String(form.get("eventName") || ""),
      contactName: String(form.get("contactName") || ""),
      contactEmail: String(form.get("contactEmail") || ""),
      organization: String(form.get("organization") || ""),
      roomType: String(form.get("roomType") || ""),
      date: String(form.get("date") || ""),
      start: String(form.get("start") || ""),
      end: String(form.get("end") || ""),
      attendeeCount: Number(form.get("attendeeCount") || 0),
      details: String(form.get("details") || ""),
    };
    const missing = Object.entries(request).some(([key, value]) => key !== "details" && !value);
    if (missing) {
      setRequestError("Please complete every required field before sending the request.");
      return;
    }
    await createSpecialRequest(request);
    event.currentTarget.reset();
    setRequestSent(true);
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${navOpen ? "is-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">AU</div>
          <div>
            <p>College of Engineering</p>
            <strong>Brown-Kopel Reservations</strong>
          </div>
        </div>
        <button className="site-switch" type="button" onClick={() => setSiteMenuOpen((open) => !open)}>
          <Building2 size={18} />
          <span>
            {currentSite?.name ?? "Brown-Kopel Center"}
            <small>{currentSite?.category ?? "Study rooms"}</small>
          </span>
          <ChevronDown size={16} />
        </button>
        {siteMenuOpen ? (
          <div className="site-menu">
            {sites.map((site) => (
              <button
                className={site.id === selectedSite ? "active" : ""}
                key={site.id}
                type="button"
                onClick={() => {
                  setSelectedSite(site.id);
                  setSiteMenuOpen(false);
                }}
              >
                <span>{site.name}</span>
                <small>{site.enabled ? "Prototype active" : "Mock switcher"}</small>
              </button>
            ))}
          </div>
        ) : null}
        <nav className="nav-list" aria-label="Main navigation">
          <NavButton icon={<Home size={18} />} active={view === "reserve"} onClick={() => setView("reserve")}>
            Reserve
          </NavButton>
          <NavButton icon={<Calendar size={18} />} active={view === "upcoming"} onClick={() => setView("upcoming")}>
            Upcoming
          </NavButton>
          <NavButton icon={<MessageSquare size={18} />} active={view === "requests"} onClick={() => setView("requests")}>
            Special request
          </NavButton>
          <NavButton icon={<Settings size={18} />} active={view === "settings"} onClick={() => setView("settings")}>
            Preferences
          </NavButton>
        </nav>
      </aside>

      <main className="main-content">
        <header className="mobile-topbar">
          <button type="button" aria-label="Toggle navigation" onClick={() => setNavOpen((open) => !open)}>
            {navOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <span>Brown-Kopel</span>
          <button type="button" aria-label="Preferences" onClick={() => setView("settings")}>
            <Settings size={20} />
          </button>
        </header>

        {view === "reserve" ? (
          <ReserveView
            date={date}
            setDate={setDate}
            query={query}
            setQuery={setQuery}
            capacity={capacity}
            setCapacity={setCapacity}
            floor={floor}
            setFloor={setFloor}
            rooms={recommendedRooms}
            slots={slots}
            selectedSlot={selectedSlot}
            setSelectedSlot={setSelectedSlot}
            attendeeCount={attendeeCount}
            setAttendeeCount={setAttendeeCount}
            bookingTitle={bookingTitle}
            setBookingTitle={setBookingTitle}
            confirmBooking={confirmBooking}
          />
        ) : null}

        {view === "upcoming" ? (
          <UpcomingView
            reservations={reservations}
            bookingComplete={bookingComplete}
            cancel={cancel}
            returnToReserve={() => setView("reserve")}
          />
        ) : null}

        {view === "requests" ? (
          <SpecialRequestView
            onSubmit={submitSpecialRequest}
            requestSent={requestSent}
            requestError={requestError}
          />
        ) : null}

        {view === "settings" ? <SettingsView /> : null}
      </main>

      {view === "reserve" && selectedSlot && selectedRoom ? (
        <div className="mobile-booking-bar" role="region" aria-label="Selected booking">
          <div>
            <strong>Room {selectedRoom.name}</strong>
            <span>
              {formatTime(selectedSlot.start)} to {formatTime(selectedSlot.end)}
            </span>
          </div>
          <button type="button" onClick={() => void confirmBooking()}>
            Confirm
          </button>
        </div>
      ) : null}

      <nav className="bottom-nav" aria-label="Mobile navigation">
        <NavButton icon={<Home size={19} />} active={view === "reserve"} onClick={() => setView("reserve")}>
          Reserve
        </NavButton>
        <NavButton icon={<Calendar size={19} />} active={view === "upcoming"} onClick={() => setView("upcoming")}>
          Trips
        </NavButton>
        <NavButton icon={<MessageSquare size={19} />} active={view === "requests"} onClick={() => setView("requests")}>
          Request
        </NavButton>
        <NavButton icon={<Settings size={19} />} active={view === "settings"} onClick={() => setView("settings")}>
          Profile
        </NavButton>
      </nav>
    </div>
  );
}

type ReserveViewProps = {
  date: string;
  setDate: (value: string) => void;
  query: string;
  setQuery: (value: string) => void;
  capacity: number;
  setCapacity: (value: number) => void;
  floor: string;
  setFloor: (value: string) => void;
  rooms: Room[];
  slots: AvailabilitySlot[];
  selectedSlot: AvailabilitySlot | null;
  setSelectedSlot: (slot: AvailabilitySlot) => void;
  attendeeCount: number;
  setAttendeeCount: (value: number) => void;
  bookingTitle: string;
  setBookingTitle: (value: string) => void;
  confirmBooking: () => Promise<void>;
};

function ReserveView(props: ReserveViewProps) {
  const selectedRoom = props.selectedSlot ? roomById(props.selectedSlot.roomId) : undefined;

  return (
    <section className="view reserve-view">
      <div className="page-intro">
        <p>Mobile-first reservation prototype</p>
        <h1>Find a Brown-Kopel study room now.</h1>
      </div>

      <div className="quick-search" aria-label="Find a room now">
        <label className="field date-field">
          <span>Date</span>
          <input type="date" value={props.date} onChange={(event) => props.setDate(event.target.value)} />
        </label>
        <label className="field">
          <span>Group size</span>
          <select value={props.capacity} onChange={(event) => props.setCapacity(Number(event.target.value))}>
            <option value={1}>1+</option>
            <option value={4}>4+</option>
            <option value={6}>6+</option>
          </select>
        </label>
        <label className="field">
          <span>Floor</span>
          <select value={props.floor} onChange={(event) => props.setFloor(event.target.value)}>
            <option>Any floor</option>
            <option>Bottom Floor</option>
            <option>Second Floor</option>
          </select>
        </label>
        <label className="field search-field">
          <span>Room</span>
          <Search size={18} />
          <input
            type="search"
            placeholder="Search 0132, 2118..."
            value={props.query}
            onChange={(event) => props.setQuery(event.target.value)}
          />
        </label>
      </div>

      <div className="content-grid">
        <section className="room-results" aria-label="Room results">
          <div className="section-heading">
            <div>
              <p>Available matches</p>
              <h2>{props.rooms.length} study rooms</h2>
            </div>
          </div>
          {props.rooms.length === 0 ? (
            <EmptyState title="No rooms match those filters" body="Try a smaller group size, another floor, or clear the room search." />
          ) : (
            <div className="room-list">
              {props.rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  slots={props.slots.filter((slot) => slot.roomId === room.id)}
                  selectedSlot={props.selectedSlot}
                  onSelect={props.setSelectedSlot}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="booking-panel" aria-label="Booking review">
          <div className="section-heading">
            <div>
              <p>Review</p>
              <h2>Booking details</h2>
            </div>
          </div>
          {selectedRoom && props.selectedSlot ? (
            <>
              <div className="booking-summary">
                <strong>Room {selectedRoom.name}</strong>
                <span>{dateLabel(props.selectedSlot.date)}</span>
                <span>
                  {formatTime(props.selectedSlot.start)} to {formatTime(props.selectedSlot.end)}
                </span>
                <span>{selectedRoom.capacity} person capacity</span>
              </div>
              <label className="field stacked">
                <span>Title</span>
                <input value={props.bookingTitle} onChange={(event) => props.setBookingTitle(event.target.value)} />
              </label>
              <label className="field stacked">
                <span>Attendees</span>
                <input
                  type="number"
                  min={1}
                  max={selectedRoom.capacity}
                  value={props.attendeeCount}
                  onChange={(event) => props.setAttendeeCount(Number(event.target.value))}
                />
              </label>
              <button className="primary-action" type="button" onClick={() => void props.confirmBooking()}>
                <Check size={18} />
                Confirm mock reservation
              </button>
            </>
          ) : (
            <EmptyState
              title="Choose a time slot"
              body="Pick an available time on any room card and this panel becomes the final confirmation step."
            />
          )}
        </aside>
      </div>
    </section>
  );
}

function RoomCard({
  room,
  slots,
  selectedSlot,
  onSelect,
}: {
  room: Room;
  slots: AvailabilitySlot[];
  selectedSlot: AvailabilitySlot | null;
  onSelect: (slot: AvailabilitySlot) => void;
}) {
  const availableSlots = slots.filter((slot) => slot.status === "available");

  return (
    <article className="room-card">
      <div className="room-card-header">
        <div>
          <h3>{room.name}</h3>
          <p>
            <MapPin size={15} />
            {room.floor}
          </p>
        </div>
        <span className={`status-pill ${room.status}`}>{statusLabel(room.status)}</span>
      </div>
      <div className="room-meta">
        <span>
          <Users size={15} />
          Up to {room.capacity}
        </span>
        <span>{room.category}</span>
      </div>
      <div className="feature-row">
        {room.features.slice(0, 3).map((feature) => (
          <span key={feature}>{feature}</span>
        ))}
      </div>
      <div className="slot-row" aria-label={`Available slots for ${room.name}`}>
        {availableSlots.length > 0 ? (
          availableSlots.slice(0, 3).map((slot) => (
            <button
              className={selectedSlot === slot ? "slot-button selected" : "slot-button"}
              key={`${slot.roomId}-${slot.start}`}
              type="button"
              onClick={() => onSelect(slot)}
            >
              <Clock3 size={14} />
              {formatTime(slot.start)}
            </button>
          ))
        ) : (
          <span className="no-slots">No quick slots today</span>
        )}
      </div>
    </article>
  );
}

function UpcomingView({
  reservations,
  bookingComplete,
  cancel,
  returnToReserve,
}: {
  reservations: Reservation[];
  bookingComplete: Reservation | null;
  cancel: (id: string) => Promise<void>;
  returnToReserve: () => void;
}) {
  return (
    <section className="view">
      <div className="page-intro">
        <p>Your schedule</p>
        <h1>Upcoming reservations</h1>
      </div>
      {bookingComplete ? (
        <div className="success-banner">
          <Check size={20} />
          Mock reservation confirmed for Room {roomById(bookingComplete.roomId)?.name}.
        </div>
      ) : null}
      {reservations.length === 0 ? (
        <EmptyState
          title="No upcoming reservations"
          body="When you confirm a mock reservation, it will appear here immediately."
          action={<button type="button" onClick={returnToReserve}>Find a room</button>}
        />
      ) : (
        <div className="reservation-list">
          {reservations.map((reservation) => {
            const room = roomById(reservation.roomId);
            return (
              <article className="reservation-item" key={reservation.id}>
                <div>
                  <h2>{reservation.title}</h2>
                  <p>
                    Room {room?.name} · {dateLabel(reservation.date)} · {formatTime(reservation.start)} to{" "}
                    {formatTime(reservation.end)}
                  </p>
                </div>
                <button type="button" onClick={() => void cancel(reservation.id)}>
                  Cancel
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function SpecialRequestView({
  onSubmit,
  requestSent,
  requestError,
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  requestSent: boolean;
  requestError: string;
}) {
  return (
    <section className="view">
      <div className="page-intro">
        <p>Large rooms and events</p>
        <h1>Special request</h1>
      </div>
      {requestSent ? (
        <div className="success-banner">
          <Check size={20} />
          Request saved in prototype state.
        </div>
      ) : null}
      {requestError ? <div className="error-banner">{requestError}</div> : null}
      <form className="request-form" onSubmit={(event) => void onSubmit(event)}>
        <fieldset>
          <legend>Event contact</legend>
          <label className="field stacked">
            <span>Event name</span>
            <input name="eventName" />
          </label>
          <label className="field stacked">
            <span>Contact name</span>
            <input name="contactName" />
          </label>
          <label className="field stacked">
            <span>Contact email</span>
            <input name="contactEmail" type="email" />
          </label>
          <label className="field stacked">
            <span>Organization or department</span>
            <input name="organization" />
          </label>
        </fieldset>
        <fieldset>
          <legend>Space and time</legend>
          <label className="field stacked">
            <span>Type of space</span>
            <select name="roomType" defaultValue="">
              <option value="" disabled>
                Choose a space
              </option>
              <option>Conference Room</option>
              <option>Classroom</option>
              <option>Ballroom</option>
              <option>Other</option>
            </select>
          </label>
          <label className="field stacked">
            <span>Date</span>
            <input name="date" type="date" />
          </label>
          <div className="two-col">
            <label className="field stacked">
              <span>Start</span>
              <input name="start" type="time" />
            </label>
            <label className="field stacked">
              <span>End</span>
              <input name="end" type="time" />
            </label>
          </div>
          <label className="field stacked">
            <span>Estimated attendees</span>
            <input name="attendeeCount" type="number" min={1} />
          </label>
        </fieldset>
        <fieldset>
          <legend>Details</legend>
          <label className="field stacked">
            <span>Setup, food, agenda, or billing notes</span>
            <textarea name="details" rows={5} />
          </label>
          <button className="primary-action" type="submit">
            Submit mock request
          </button>
        </fieldset>
      </form>
    </section>
  );
}

function SettingsView() {
  return (
    <section className="view settings-view">
      <div className="page-intro">
        <p>Profile</p>
        <h1>Preferences</h1>
      </div>
      <div className="settings-grid">
        <section>
          <h2>Communication</h2>
          <label className="check-row">
            <input type="checkbox" defaultChecked />
            <span>Email confirmations</span>
          </label>
          <label className="check-row">
            <input type="checkbox" defaultChecked />
            <span>Text reminders</span>
          </label>
          <label className="check-row">
            <input type="checkbox" />
            <span>Events newsletter</span>
          </label>
        </section>
        <section>
          <h2>Default booking</h2>
          <label className="field stacked">
            <span>Default site</span>
            <select defaultValue="Brown-Kopel Center">
              <option>Brown-Kopel Center</option>
              <option>Engineering Makerspace</option>
              <option>Mechanical Engineering</option>
            </select>
          </label>
          <label className="field stacked">
            <span>Major or department</span>
            <select defaultValue="Aerospace">
              <option>Aerospace</option>
              <option>Biosystems</option>
              <option>Computer Science and Software</option>
              <option>Mechanical</option>
              <option>Other Engineering</option>
            </select>
          </label>
        </section>
      </div>
    </section>
  );
}

function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="empty-state">
      <Bell size={22} />
      <h3>{title}</h3>
      <p>{body}</p>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

function NavButton({
  children,
  icon,
  active,
  onClick,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={active ? "nav-button active" : "nav-button"} type="button" onClick={onClick}>
      {icon}
      <span>{children}</span>
    </button>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
