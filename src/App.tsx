import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  FormEvent,
  InputHTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent,
  ReactNode,
} from "react";
import {
  Bell,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Filter,
  List,
  Map,
  MapPin,
  Plus,
  Search,
  Settings,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { AppHeader } from "./components/AppHeader";
import { FloorMapView } from "./components/FloorMapView";
import { today } from "./data/mockData";
import {
  cancelReservation,
  createReservation,
  createSpecialRequest,
  getProfile,
  groupedResources,
  listAvailability,
  listReservations,
  listResources,
  listSites,
  listSpecialRequests,
  resourceById,
  resourceFloors,
  resourceKinds,
  siteById,
  updateProfile,
} from "./services/reservationService";
import type {
  AvailabilitySlot,
  RequestRoom,
  Reservation,
  Resource,
  ResourceKind,
  ResourceStatus,
  Site,
  SpecialRequest,
  UserProfile,
  View,
} from "./types";

const timeRows = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
];

const policyHighlights = [
  "Submit event details at least 3 business days before the event.",
  "Tentative series or blanket bookings are not allowed.",
  "Food cleanup, setup changes, and no-shows may result in fees.",
  "Brown-Kopel is closed on home football Saturdays.",
  "Accessibility accommodation requests should be sent at least one week before the event.",
];

const pricingHints = [
  "Grand Halls: no charge for engineering organizations; $175-$600 for conference or outside engineering events.",
  "Classrooms 0158, 2117, and 2133: no charge for engineering organizations; $25-$100 otherwise.",
  "Conference rooms 2116 and 2174: no charge for engineering organizations; $50-$100 otherwise.",
  "Support items may add cost: podium $25, trash/recycling bins $10, stage $215, risers $25-$50.",
  "Extended hours, no-show fees, labor, and setup fees may apply. FOP/payment details are required before approval.",
];

export default function App() {
  const [sites, setSites] = useState<Site[]>([]);
  const [activeSiteId, setActiveSiteId] = useState("brown-kopel");
  const [view, setView] = useState<View>("map");
  const [siteMenuOpen, setSiteMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [requests, setRequests] = useState<SpecialRequest[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState("bk-2132");
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [pendingReservation, setPendingReservation] = useState<{
    slot: AvailabilitySlot;
    attendeeCount: number;
  } | null>(null);
  const [weekStart, setWeekStart] = useState(today);
  const [toast, setToast] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [mutationError, setMutationError] = useState("");
  const defaultSiteAppliedRef = useRef(false);

  const activeSite = siteById(activeSiteId) ?? sites[0];
  const selectedResource = resourceById(selectedResourceId);
  const findView: View = activeSite?.mapMode === "floor-plan" ? "map" : "reserve";
  const profileInitials = (profile?.nickName || profile?.firstName || "AU").trim().slice(0, 2).toUpperCase();

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError("");
    void Promise.all([listSites(), listReservations(), listSpecialRequests(), getProfile()])
      .then(([siteList, reservationList, requestList, userProfile]) => {
        if (!active) return;
        setSites(siteList);
        setReservations(reservationList);
        setRequests(requestList);
        setProfile(userProfile);
        if (!defaultSiteAppliedRef.current && siteById(userProfile.defaultSiteId)) {
          defaultSiteAppliedRef.current = true;
          setActiveSiteId(userProfile.defaultSiteId);
        }
      })
      .catch(() => {
        if (active) setLoadError("We couldn’t load reservation data. Check your connection and try again.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadAttempt]);

  useEffect(() => {
    let active = true;
    void Promise.all([
      listResources({ siteId: activeSiteId }),
      listAvailability(activeSiteId, weekStart, addDays(weekStart, 6)),
    ])
      .then(([siteResources, siteAvailability]) => {
        if (!active) return;
        setResources(siteResources);
        setAvailability(siteAvailability);
        setSelectedResourceId((current) =>
          siteResources.some((resource) => resource.id === current) ? current : (siteResources[0]?.id ?? ""),
        );
        setSelectedSlot((current) =>
          current && siteResources.some((resource) => resource.id === current.resourceId) ? current : null,
        );
      })
      .catch(() => {
        if (active) setLoadError("We couldn’t load rooms or availability. Try again.");
      });
    return () => {
      active = false;
    };
  }, [activeSiteId, loadAttempt, weekStart]);

  async function refreshBookings() {
    const [nextReservations, nextRequests] = await Promise.all([listReservations(), listSpecialRequests()]);
    setReservations(nextReservations);
    setRequests(nextRequests);
  }

  async function refreshAvailability() {
    setAvailability(await listAvailability(activeSiteId, weekStart, addDays(weekStart, 6)));
  }

  const navigate = useCallback((nextView: View) => {
    setView(nextView);
    setSiteMenuOpen(false);
    if (!['map', 'reserve'].includes(nextView)) setSelectedSlot(null);
  }, []);

  const changeWeek = useCallback((date: string) => {
    setWeekStart(date);
    setSelectedSlot(null);
    setPendingReservation(null);
  }, []);

  const selectResource = useCallback((id: string) => {
    setSelectedResourceId(id);
    setSelectedSlot(null);
    setMutationError("");
  }, []);

  const openReservationReview = useCallback((slot: AvailabilitySlot, attendeeCount = 4) => {
    const capacity = resourceById(slot.resourceId)?.capacity ?? attendeeCount;
    setMutationError("");
    setPendingReservation({ slot, attendeeCount: Math.min(attendeeCount, capacity) });
  }, []);

  async function confirmReservation(slot: AvailabilitySlot, attendeeCount: number, title = "Study session") {
    const resource = resourceById(slot.resourceId);
    if (!resource || resource.id !== selectedResourceId) throw new Error("Choose a room and time again before reserving.");
    await createReservation({
      resourceId: resource.id,
      siteId: resource.siteId,
      title,
      date: slot.date,
      start: slot.start,
      end: slot.end,
      attendeeCount,
    });
    setSelectedSlot(null);
    setToast(`${resource.name} reserved for ${formatTime(slot.start)}.`);
    setView("bookings");
    await Promise.all([refreshBookings(), refreshAvailability()]);
  }

  async function confirmPendingReservation() {
    if (!pendingReservation || isSaving) return;
    setIsSaving(true);
    setMutationError("");
    try {
      await confirmReservation(pendingReservation.slot, pendingReservation.attendeeCount);
      setPendingReservation(null);
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : "The reservation could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <AppHeader
        activeSite={activeSite}
        activeSiteId={activeSiteId}
        activeView={view}
        profileInitials={profileInitials}
        siteMenuOpen={siteMenuOpen}
        sites={sites}
        onHelp={() => setHelpOpen(true)}
        onHome={() => navigate(findView)}
        onNavigate={(nextView) => navigate(nextView === "map" ? findView : nextView)}
        onProfile={() => navigate("profile")}
        onSiteChange={(site) => {
          setActiveSiteId(site.id);
          setSiteMenuOpen(false);
          navigate(site.mapMode === "floor-plan" ? "map" : "reserve");
          setSelectedSlot(null);
          setPendingReservation(null);
          setWeekStart(today);
        }}
        onSiteMenuToggle={() => setSiteMenuOpen((open) => !open)}
      />

      <main className="main-content">
        {toast ? (
          <div className="toast" role="status">
            <Check size={18} />
            {toast}
            <button type="button" aria-label="Dismiss" onClick={() => setToast("")}>
              <X size={16} />
            </button>
          </div>
        ) : null}

        {isLoading ? (
          <section className="app-state" role="status" aria-live="polite">
            <div className="loading-mark" aria-hidden="true" />
            <h1>Loading rooms and availability</h1>
            <p>Preparing the Brown-Kopel reservation workspace.</p>
          </section>
        ) : loadError ? (
          <section className="app-state" role="alert">
            <h1>Reservation data didn’t load</h1>
            <p>{loadError}</p>
            <button className="primary-action" type="button" onClick={() => setLoadAttempt((value) => value + 1)}>Try again</button>
          </section>
        ) : (
          <>
        {view === "reserve" ? (
          <ReserveView
            activeSite={activeSite}
            resources={resources}
            availability={availability}
            selectedResource={selectedResource}
            selectedSlot={selectedSlot}
            weekStart={weekStart}
            onWeekChange={changeWeek}
            onResourceSelect={selectResource}
            onSlotSelect={setSelectedSlot}
            onConfirm={openReservationReview}
            onMapView={() => navigate("map")}
            onRequest={() => navigate("requests")}
          />
        ) : null}
        {view === "map" ? (
          <FloorMapView
            site={activeSite}
            resources={resources}
            availability={availability}
            selectedResourceId={selectedResourceId}
            selectedSlot={selectedSlot}
            onResourceSelect={selectResource}
            onSlotSelect={setSelectedSlot}
            onSlotClear={() => setSelectedSlot(null)}
            onConfirm={openReservationReview}
            onDateChange={changeWeek}
            onListView={() => navigate("reserve")}
            onRequest={() => navigate("requests")}
          />
        ) : null}
        {view === "bookings" ? (
          <BookingsView reservations={reservations} requests={requests} onCancel={async (id) => {
            if (isSaving) return;
            setIsSaving(true);
            try {
              await cancelReservation(id);
              await Promise.all([refreshBookings(), refreshAvailability()]);
              setToast("Reservation cancelled.");
            } catch {
              setToast("The reservation could not be cancelled. Try again.");
            } finally {
              setIsSaving(false);
            }
          }} />
        ) : null}
        {view === "requests" && activeSite ? (
          <SpecialRequestView
            site={activeSite}
            resources={resources}
            requests={requests}
            onSubmit={async (request) => {
              await createSpecialRequest(request);
              await refreshBookings();
              setToast("Special request saved in prototype state.");
              navigate("bookings");
            }}
          />
        ) : null}
        {view === "profile" && profile ? (
          <ProfileView
            profile={profile}
            sites={sites}
            onSave={async (nextProfile) => {
              setProfile(await updateProfile(nextProfile));
              setToast("Preferences updated.");
            }}
          />
        ) : null}
          </>
        )}
      </main>

      {(view === "map" || view === "reserve") && selectedSlot && selectedResource && selectedSlot.resourceId === selectedResource.id ? (
        <div className="mobile-booking-bar">
          <div>
            <strong>{selectedResource.name}</strong>
            <span>
              {dateShort(selectedSlot.date)} · {formatTime(selectedSlot.start)} to {formatTime(selectedSlot.end)}
            </span>
          </div>
            <button type="button" onClick={() => openReservationReview(selectedSlot)}>
              Confirm
            </button>
        </div>
      ) : null}

        {pendingReservation ? (
          <ModalShell
            className="reservation-confirm"
            closeDisabled={isSaving}
            initialFocusSelector="[data-modal-initial-focus]"
            onClose={() => {
              setPendingReservation(null);
              setMutationError("");
            }}
            titleId="reservation-confirm-title"
          >
              <div className="modal-header">
                <h2 id="reservation-confirm-title">Confirm reservation</h2>
                <button type="button" aria-label="Close" disabled={isSaving} onClick={() => { setPendingReservation(null); setMutationError(""); }}>
                  <X size={18} />
                </button>
              </div>
              <div className="booking-summary">
                <span>{resourceById(pendingReservation.slot.resourceId)?.name}</span>
                <strong>
                  {dateShort(pendingReservation.slot.date)} · {formatTime(pendingReservation.slot.start)} to{" "}
                  {formatTime(pendingReservation.slot.end)}
                </strong>
                <small>{pendingReservation.attendeeCount} {pendingReservation.attendeeCount === 1 ? "attendee" : "attendees"}</small>
                <p>Your reservation will be saved on this device and appear in My reservations immediately.</p>
              </div>
              {mutationError ? <div className="error-banner" role="alert">{mutationError}</div> : null}
              <div className="modal-actions">
                <button className="primary-action" data-modal-initial-focus type="button" disabled={isSaving} onClick={() => void confirmPendingReservation()}>
                  {isSaving ? "Reserving…" : "Confirm reservation"}
                </button>
                <button className="secondary-action" type="button" disabled={isSaving} onClick={() => { setPendingReservation(null); setMutationError(""); }}>
                  Cancel
                </button>
              </div>
          </ModalShell>
        ) : null}

        {helpOpen ? (
          <ModalShell
            className="help-dialog"
            initialFocusSelector="[data-modal-initial-focus]"
            onClose={() => setHelpOpen(false)}
            titleId="help-dialog-title"
          >
              <div className="modal-header">
                <h2 id="help-dialog-title">How room reservations work</h2>
                <button data-modal-initial-focus type="button" aria-label="Close help" onClick={() => setHelpOpen(false)}><X size={18} /></button>
              </div>
              <ol className="help-steps">
                <li><strong>Set your time and group.</strong><span>We only show rooms that fit the full session.</span></li>
                <li><strong>Choose a room and open time.</strong><span>The official floor plan stays visible for orientation.</span></li>
                <li><strong>Confirm once.</strong><span>The time updates immediately across the map and list.</span></li>
              </ol>
              <p className="prototype-note">This student prototype uses sample availability. Official Auburn bookings still require the production Brown-Kopel system.</p>
              <a className="primary-action" href={activeSite?.url} target="_blank" rel="noreferrer">Open official reservation site</a>
          </ModalShell>
        ) : null}

        <nav className="bottom-nav" aria-label="Mobile navigation">
          <NavButton icon={<Map size={18} />} active={view === "map" || view === "reserve"} onClick={() => navigate(findView)}>
            Find
          </NavButton>
          <NavButton icon={<Calendar size={18} />} active={view === "bookings"} onClick={() => navigate("bookings")}>
            Reservations
          </NavButton>
          <NavButton icon={<ClipboardList size={18} />} active={view === "requests"} onClick={() => navigate("requests")}>
            Requests
          </NavButton>
          <NavButton icon={<Settings size={18} />} active={view === "profile"} onClick={() => navigate("profile")}>
            Profile
          </NavButton>
        </nav>
    </div>
  );
}

function ModalShell({
  children,
  className = "",
  closeDisabled = false,
  initialFocusSelector,
  onClose,
  titleId,
}: {
  children: ReactNode;
  className?: string;
  closeDisabled?: boolean;
  initialFocusSelector?: string;
  onClose: () => void;
  titleId: string;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => {
      const dialog = dialogRef.current;
      const requestedTarget = initialFocusSelector
        ? dialog?.querySelector<HTMLElement>(initialFocusSelector)
        : null;
      const firstTarget = dialog?.querySelector<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      (requestedTarget ?? firstTarget ?? dialog)?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = priorOverflow;
      restoreFocusRef.current?.focus();
    };
  }, [initialFocusSelector]);

  function handleKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key === "Escape" && !closeDisabled) {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    ).filter((element) => !element.hasAttribute("hidden"));
    if (!focusable.length) {
      event.preventDefault();
      dialogRef.current?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !closeDisabled) onClose();
      }}
    >
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className={`modal ${className}`.trim()}
        onKeyDown={handleKeyDown}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        {children}
      </section>
    </div>
  );
}

function ReserveView({
  activeSite,
  resources,
  availability,
  selectedResource,
  selectedSlot,
  weekStart,
  onWeekChange,
  onResourceSelect,
  onSlotSelect,
  onConfirm,
  onMapView,
  onRequest,
}: {
  activeSite?: Site;
  resources: Resource[];
  availability: AvailabilitySlot[];
  selectedResource?: Resource;
  selectedSlot: AvailabilitySlot | null;
  weekStart: string;
  onWeekChange: (date: string) => void;
  onResourceSelect: (id: string) => void;
  onSlotSelect: (slot: AvailabilitySlot) => void;
  onConfirm: (slot: AvailabilitySlot) => void;
  onMapView: () => void;
  onRequest: () => void;
}) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<ResourceKind | "All">("All");
  const [floor, setFloor] = useState("All");
  const [status, setStatus] = useState<ResourceStatus | "All">("All");
  const [groupSizeInput, setGroupSizeInput] = useState("1");
  const [rangeStart, setRangeStart] = useState(today);
  const [rangeEnd, setRangeEnd] = useState(addDays(today, 1));
  const [rangeResults, setRangeResults] = useState<AvailabilitySlot[]>([]);
  const [rangeError, setRangeError] = useState("");

  useEffect(() => {
    setKind("All");
    setFloor("All");
    setStatus("All");
    setQuery("");
    setGroupSizeInput("1");
  }, [activeSite?.id]);

  const kinds = activeSite ? resourceKinds(activeSite.id) : [];
  const floors = activeSite ? resourceFloors(activeSite.id) : [];
  const minCapacity = Math.max(1, Number(groupSizeInput || "1"));
  const filtered = useMemo(
    () =>
      sortResourcesByFit(
        resources.filter((item) => {
          const matchesQuery =
            !query ||
            item.name.toLowerCase().includes(query.toLowerCase()) ||
            item.features.join(" ").toLowerCase().includes(query.toLowerCase());
          return (
            matchesQuery &&
            (kind === "All" || item.kind === kind) &&
            (floor === "All" || item.floor === floor) &&
            (status === "All" || item.status === status) &&
            item.capacity >= minCapacity
          );
        }),
        minCapacity,
      ),
    [floor, kind, minCapacity, query, resources, status],
  );

  useEffect(() => {
    if (!filtered.length || !selectedResource) return;
    const selectionVisible = filtered.some((resource) => resource.id === selectedResource.id);
    const selectionCanReserve = selectedResource.action !== "request" && selectedResource.status === "Open";
    if (!selectionVisible || (status === "All" && !selectionCanReserve)) {
      onResourceSelect(filtered.find((resource) => resource.action !== "request" && resource.status === "Open")?.id ?? filtered[0].id);
    }
  }, [filtered, onResourceSelect, selectedResource, status]);

  const grouped = activeSite?.id === "brown-kopel" ? groupedResources("brown-kopel") : groupedResources(activeSite?.id ?? "");
  const visibleGroups =
    minCapacity > 1
      ? [{ label: "Best fit", resources: filtered }]
      : grouped.map((group) => ({
          ...group,
          resources: group.resources.filter((resource) => filtered.some((item) => item.id === resource.id)),
        }));

  async function searchRange(event: FormEvent) {
    event.preventDefault();
    setRangeError("");
    if (!rangeStart || !rangeEnd) {
      setRangeError("Both dates and times required.");
      return;
    }
    if (!activeSite) return;
    const results = (await listAvailability(activeSite.id, rangeStart, rangeEnd)).filter((slot) => slot.status === "available");
    setRangeResults(results);
  }

  return (
    <section className="view reserve-view">
      <div className="page-intro">
        <div>
          <p>{activeSite?.databaseName}</p>
          <h1>{activeSite?.mapMode === "floor-plan" ? "Find your room" : "Find a resource"}</h1>
        </div>
        {activeSite?.mapMode === "floor-plan" ? (
          <div className="view-toggle" aria-label="View options">
            <button type="button" aria-pressed="false" onClick={onMapView}><Map size={17} /> Map</button>
            <button className="active" type="button" aria-pressed="true"><List size={17} /> List</button>
          </div>
        ) : null}
      </div>
      <div className="quick-search">
        <label className="field search-field">
          <span>Search</span>
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Room, item, feature..." />
        </label>
        <label className="field">
          <span>Type</span>
          <select value={kind} onChange={(event) => setKind(event.target.value as ResourceKind | "All")}>
            <option>All</option>
            {kinds.map((resourceKind) => (
              <option key={resourceKind}>{resourceKind}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Floor</span>
          <select value={floor} onChange={(event) => setFloor(event.target.value)}>
            <option>All</option>
            {floors.map((resourceFloor) => (
              <option key={resourceFloor}>{resourceFloor}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Group size</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={groupSizeInput}
            onChange={(event) => {
              const digits = event.target.value.replace(/\D/g, "");
              setGroupSizeInput(digits.replace(/^0+(?=\d)/, ""));
            }}
            onBlur={() => {
              if (!groupSizeInput) setGroupSizeInput("1");
            }}
          />
        </label>
        <label className="field">
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as ResourceStatus | "All")}>
            <option>All</option>
            <option>Open</option>
            <option>Blocked</option>
            <option>Closed</option>
            <option>Not Checked-in</option>
            <option>Approval needed</option>
          </select>
        </label>
      </div>

      <div className="workspace-grid">
        <section className="results-panel">
          <div className="section-heading">
            <div>
              <p>{activeSite?.id === "brown-kopel" ? "Rooms List" : "List of Items"}</p>
              <h2>{filtered.length} matching resources</h2>
            </div>
          </div>
          <div className="accordion-list">
            {visibleGroups.map((group) => (
              <ResourceGroup
                key={group.label}
                label={group.label}
                resources={group.resources}
                selectedResourceId={selectedResource?.id}
                onSelect={onResourceSelect}
                onRequest={onRequest}
              />
            ))}
          </div>
        </section>

        <aside className="detail-panel">
          <ResourceDetail resource={selectedResource} selectedSlot={selectedSlot} onRequest={onRequest} onConfirm={onConfirm} />
          <CalendarPanel
            resource={selectedResource}
            weekStart={weekStart}
            availability={availability}
            selectedSlot={selectedSlot}
            onWeekChange={onWeekChange}
            onSlotSelect={onSlotSelect}
          />
          <form className="availability-search" onSubmit={(event) => void searchRange(event)}>
            <div className="section-heading compact">
              <div>
                <p>Search for Availability</p>
                <h2>Date range</h2>
              </div>
            </div>
            {rangeError ? <div className="error-banner">{rangeError}</div> : null}
            <div className="two-col">
              <label className="field stacked">
                <span>From</span>
                <input type="date" value={rangeStart} onChange={(event) => setRangeStart(event.target.value)} />
              </label>
              <label className="field stacked">
                <span>To</span>
                <input type="date" value={rangeEnd} onChange={(event) => setRangeEnd(event.target.value)} />
              </label>
            </div>
            <button className="secondary-action" type="submit">
              <Filter size={16} />
              Submit
            </button>
            {rangeResults.length ? (
              <div className="range-results">
                {rangeResults.slice(0, 6).map((slot) => {
                  const resource = resourceById(slot.resourceId);
                  return (
                    <button key={`${slot.resourceId}-${slot.date}-${slot.start}`} type="button" onClick={() => onResourceSelect(slot.resourceId)}>
                      <strong>{resource?.name}</strong>
                      <span>
                        {dateShort(slot.date)} · {formatTime(slot.start)} to {formatTime(slot.end)}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </form>
        </aside>
      </div>
    </section>
  );
}

function ResourceGroup({
  label,
  resources,
  selectedResourceId,
  onSelect,
  onRequest,
}: {
  label: string;
  resources: Resource[];
  selectedResourceId?: string;
  onSelect: (id: string) => void;
  onRequest: () => void;
}) {
  const [open, setOpen] = useState(label !== "View All" && (label === "Best fit" || label === "Bottom Floor" || resources.length < 6));
  useEffect(() => {
    if (
      label !== "View All" &&
      (label === "Best fit" || resources.length < 6 || resources.some((resource) => resource.id === selectedResourceId))
    ) {
      setOpen(true);
    }
  }, [label, resources, selectedResourceId]);
  if (!resources.length) return null;
  return (
    <section className="resource-group">
      <button type="button" className="group-toggle" onClick={() => setOpen((value) => !value)}>
        <span>{label}</span>
        <strong>{resources.length}</strong>
      </button>
      {open ? (
        <div className="resource-list">
          {resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              active={resource.id === selectedResourceId}
              onSelect={onSelect}
              onRequest={onRequest}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ResourceCard({
  resource,
  active,
  onSelect,
  onRequest,
}: {
  resource: Resource;
  active: boolean;
  onSelect: (id: string) => void;
  onRequest: () => void;
}) {
  return (
    <article className={`resource-card ${active ? "active" : ""}`}>
      <button type="button" className="resource-main" onClick={() => onSelect(resource.id)}>
        <span className={`status-dot ${statusClass(resource.status)}`} />
        <span>
          <strong>{resource.kind === "Study Room" ? `Study Room ${resource.name}` : resource.name}</strong>
          <small>{resource.description ?? resource.features[0] ?? resource.kind}</small>
        </span>
      </button>
      <div className="resource-meta">
        <span>
          <Users size={14} />
          {resource.capacity}
        </span>
        <span>{resource.floor ?? resource.kind}</span>
        <span className={`status-chip ${statusClass(resource.status)}`}>{resource.status}</span>
      </div>
      <div className="resource-actions">
        {resource.action !== "request" ? (
          <button type="button" onClick={() => onSelect(resource.id)}>
            View Availability
          </button>
        ) : null}
        {resource.action !== "reserve" ? (
          <button type="button" onClick={onRequest}>
            Create Request
          </button>
        ) : null}
      </div>
    </article>
  );
}

function ResourceDetail({
  resource,
  selectedSlot,
  onRequest,
  onConfirm,
}: {
  resource?: Resource;
  selectedSlot: AvailabilitySlot | null;
  onRequest: () => void;
  onConfirm: (slot: AvailabilitySlot) => void;
}) {
  if (!resource) {
    return <EmptyState title="Choose a resource" body="Select a room, item, vehicle, or lab instrument to see calendar details." />;
  }
  const matchingSelectedSlot = selectedSlot?.resourceId === resource.id ? selectedSlot : null;
  return (
    <section className="resource-detail">
      <div>
        <p>{resource.kind}</p>
        <h2>{resource.name}</h2>
        <span className={`status-chip ${statusClass(resource.status)}`}>{resource.status}</span>
      </div>
      <div className="detail-facts">
        <span>
          <Users size={15} /> Capacity {resource.capacity}
        </span>
        <span>
          <MapPin size={15} /> {resource.floor ?? siteById(resource.siteId)?.shortName}
        </span>
      </div>
      <div className="feature-row">
        {resource.features.map((feature) => (
          <span key={feature}>{feature}</span>
        ))}
      </div>
      {matchingSelectedSlot && resource.status === "Open" && resource.action !== "request" ? (
        <button className="primary-action" type="button" onClick={() => void onConfirm(matchingSelectedSlot)}>
          <Check size={18} />
          Review reservation
        </button>
      ) : null}
      {resource.action !== "reserve" ? (
        <button className="secondary-action" type="button" onClick={onRequest}>
          <ClipboardList size={16} />
          Start request
        </button>
      ) : null}
    </section>
  );
}

function CalendarPanel({
  resource,
  weekStart,
  availability,
  selectedSlot,
  onWeekChange,
  onSlotSelect,
}: {
  resource?: Resource;
  weekStart: string;
  availability: AvailabilitySlot[];
  selectedSlot: AvailabilitySlot | null;
  onWeekChange: (date: string) => void;
  onSlotSelect: (slot: AvailabilitySlot) => void;
}) {
  const dragStartRef = useRef<AvailabilitySlot | null>(null);
  const isDraggingRef = useRef(false);
  const dragMovedRef = useRef(false);
  const days = Array.from({ length: 6 }, (_, index) => addDays(weekStart, index));
  const slots = availability.filter((slot) => slot.resourceId === resource?.id);

  function selectSlotRange(start: AvailabilitySlot, end: AvailabilitySlot) {
    if (start.resourceId !== end.resourceId || start.date !== end.date) return;
    const rangeStart = start.start <= end.start ? start : end;
    const rangeEnd = start.start <= end.start ? end : start;
    const coveredTimes = timeRows.filter((time) => time >= rangeStart.start && time <= rangeEnd.start);
    const continuous = coveredTimes.every((time) =>
      slots.some(
        (slot) =>
          slot.resourceId === rangeStart.resourceId &&
          slot.date === rangeStart.date &&
          slot.status === "available" &&
          slot.start <= time &&
          slot.end > time,
      ),
    );
    if (!continuous) return;
    onSlotSelect({
      ...rangeStart,
      end: rangeEnd.end,
      status: "available",
    });
  }

  function startDrag(slot: AvailabilitySlot) {
    dragStartRef.current = slot;
    isDraggingRef.current = true;
    dragMovedRef.current = false;
  }

  function extendDrag(slot: AvailabilitySlot) {
    const activeStart = dragStartRef.current;
    if (!isDraggingRef.current) return;
    if (!activeStart) return;
    if (activeStart.start === slot.start && activeStart.date === slot.date) return;
    dragMovedRef.current = true;
    selectSlotRange(activeStart, slot);
  }

  function stopDrag() {
    dragStartRef.current = null;
    isDraggingRef.current = false;
  }

  function selectCell(slot: AvailabilitySlot) {
    if (dragMovedRef.current) {
      dragMovedRef.current = false;
      return;
    }
    onSlotSelect(slot);
  }

  return (
    <section className="calendar-panel">
      <div className="calendar-tools">
        <button type="button" aria-label="Previous week" onClick={() => onWeekChange(addDays(weekStart, -6))}>
          <ChevronLeft size={17} />
        </button>
        <button type="button" onClick={() => onWeekChange(today)}>
          Today
        </button>
        <button type="button" aria-label="Next week" onClick={() => onWeekChange(addDays(weekStart, 6))}>
          <ChevronRight size={17} />
        </button>
      </div>
      <p className="instruction">Tap or drag across available cells to select the time desired.</p>
      <div className="week-grid" onPointerUp={stopDrag} onPointerLeave={stopDrag} onPointerCancel={stopDrag}>
        <div className="time-head" />
        {days.map((day) => (
          <div className="day-head" key={day}>
            <span>{dateShort(day)}</span>
          </div>
        ))}
        {timeRows.map((time) => (
          <TimeRow
            key={time}
            time={time}
            days={days}
            slots={slots}
            resource={resource}
            selectedSlot={selectedSlot}
            onSlotSelect={selectCell}
            onDragStart={startDrag}
            onDragEnter={extendDrag}
          />
        ))}
      </div>
    </section>
  );
}

function TimeRow({
  time,
  days,
  slots,
  resource,
  selectedSlot,
  onSlotSelect,
  onDragStart,
  onDragEnter,
}: {
  time: string;
  days: string[];
  slots: AvailabilitySlot[];
  resource?: Resource;
  selectedSlot: AvailabilitySlot | null;
  onSlotSelect: (slot: AvailabilitySlot) => void;
  onDragStart: (slot: AvailabilitySlot) => void;
  onDragEnter: (slot: AvailabilitySlot) => void;
}) {
  return (
    <>
      <div className="time-label">{formatTime(time)}</div>
      {days.map((day) => {
        const match = slots.find((slot) => slot.date === day && slot.start <= time && slot.end > time);
        const status =
          resource?.status === "Open" && resource.action !== "request" ? (match?.status ?? "blocked") : "blocked";
        const slot = match
          ? { ...match, start: time, end: match.end < addHour(time) ? match.end : addHour(time) }
          : {
              resourceId: resource?.id ?? "",
              date: day,
              start: time,
              end: addHour(time),
              status,
            };
        const selected =
          selectedSlot?.resourceId === slot.resourceId &&
          selectedSlot.date === slot.date &&
          slot.start >= selectedSlot.start &&
          slot.start < selectedSlot.end;
        const availableSlot = { ...slot, status: "available" as const };
        return (
          <button
            key={`${day}-${time}`}
            type="button"
            disabled={!resource || status !== "available"}
            aria-label={`${resource?.name ?? "Room"}, ${dateShort(day)}, ${formatTime(time)}, ${status === "available" ? "available" : status === "reserved" ? "reserved" : "unavailable"}`}
            className={`time-cell ${status} ${selected ? "selected" : ""}`}
            onClick={() => onSlotSelect(availableSlot)}
            onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
              event.preventDefault();
              onDragStart(availableSlot);
            }}
            onPointerEnter={() => onDragEnter(availableSlot)}
          >
            <span>{status === "available" ? "Available" : status === "reserved" ? "Reserved" : "Blocked"}</span>
          </button>
        );
      })}
    </>
  );
}

function sortResourcesByFit(resources: Resource[], minCapacity: number) {
  if (minCapacity <= 1) return resources;
  return [...resources].sort((a, b) => {
    const reserveRank = actionRank(a) - actionRank(b);
    if (reserveRank) return reserveRank;
    const statusRank = statusRankForFit(a) - statusRankForFit(b);
    if (statusRank) return statusRank;
    const capacityRank = a.capacity - b.capacity;
    if (capacityRank) return capacityRank;
    const kindRank = kindRankForFit(a) - kindRankForFit(b);
    if (kindRank) return kindRank;
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });
}

function actionRank(resource: Resource) {
  if (resource.action === "reserve") return 0;
  if (resource.action === "both") return 1;
  return 2;
}

function statusRankForFit(resource: Resource) {
  if (resource.status === "Open") return 0;
  if (resource.status === "Approval needed") return 1;
  return 2;
}

function kindRankForFit(resource: Resource) {
  if (resource.kind === "Study Room") return 0;
  if (resource.kind === "Conference Room") return 1;
  if (resource.kind === "Classroom") return 2;
  return 3;
}

function BookingsView({
  reservations,
  requests,
  onCancel,
}: {
  reservations: Reservation[];
  requests: SpecialRequest[];
  onCancel: (id: string) => Promise<void>;
}) {
  return (
    <section className="view">
      <div className="page-intro">
        <p>Your schedule</p>
        <h1>Upcoming reservations and requests.</h1>
      </div>
      <div className="booking-grid">
        <section>
          <div className="section-heading">
            <div>
              <p>Upcoming Reservations</p>
              <h2>{reservations.length || "None"}</h2>
            </div>
          </div>
          <div className="reservation-list">
            {reservations.length ? (
              reservations.map((reservation) => {
                const resource = resourceById(reservation.resourceId);
                return (
                  <article className="reservation-item" key={reservation.id}>
                    <div>
                      <h2>{reservation.title}</h2>
                      <p>
                        {siteById(reservation.siteId)?.shortName} · {resource?.name} · {dateShort(reservation.date)} ·{" "}
                        {formatTime(reservation.start)} to {formatTime(reservation.end)}
                      </p>
                    </div>
                    <button type="button" onClick={() => void onCancel(reservation.id)}>
                      <Trash2 size={16} />
                      Cancel
                    </button>
                  </article>
                );
              })
            ) : (
              <EmptyState title="None" body="Confirmed mock reservations will appear here immediately." />
            )}
          </div>
        </section>
        <section>
          <div className="section-heading">
            <div>
              <p>Special Requests</p>
              <h2>{requests.length || "None"}</h2>
            </div>
          </div>
          <div className="reservation-list">
            {requests.length ? (
              requests.map((request) => (
                <article className="reservation-item" key={request.id}>
                  <div>
                    <h2>{request.eventName}</h2>
                    <p>
                      {siteById(request.siteId)?.shortName} · {request.rooms.length} room request · {request.attendeeCount} attendees
                    </p>
                  </div>
                  <span className="status-chip approval">Pending review</span>
                </article>
              ))
            ) : (
              <EmptyState title="No requests" body="Submitted letters of agreement will be tracked here." />
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

function SpecialRequestView({
  site,
  resources,
  requests,
  onSubmit,
}: {
  site: Site;
  resources: Resource[];
  requests: SpecialRequest[];
  onSubmit: (request: Omit<SpecialRequest, "id" | "createdAt">) => Promise<void>;
}) {
  const [rooms, setRooms] = useState<RequestRoom[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [spaceType, setSpaceType] = useState<ResourceKind | "Any">("Any");
  const [requestedResourceId, setRequestedResourceId] = useState("");
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [requestErrors, setRequestErrors] = useState<string[]>([]);
  const [roomError, setRoomError] = useState("");
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const roomOptions = resources.filter((resource) => spaceType === "Any" || resource.kind === spaceType);
  const editingRoom = rooms.find((room) => room.id === editingRoomId);

  useEffect(() => {
    setRooms([]);
    setModalOpen(false);
    setSpaceType("Any");
    setRequestedResourceId("");
    setEditingRoomId(null);
    setRequestErrors([]);
    setRoomError("");
    setSent(false);
  }, [site.id]);

  function closeRoomModal() {
    setModalOpen(false);
    setEditingRoomId(null);
    setSpaceType("Any");
    setRequestedResourceId("");
    setRoomError("");
  }

  function addRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextRoom: RequestRoom = {
      id: editingRoomId ?? `room-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`}`,
      siteId: site.id,
      typeOfSpace: spaceType,
      requestedResourceId: requestedResourceId || undefined,
      startDate: String(form.get("startDate") || today),
      endDate: String(form.get("endDate") || today),
      startTime: String(form.get("startTime") || "09:00"),
      endTime: String(form.get("endTime") || "10:00"),
      recurring: Boolean(form.get("recurring")),
      flexible: Boolean(form.get("flexible")),
      attendees: Number(form.get("attendees") || 1),
      foodServed: String(form.get("foodServed")) === "Yes",
      accessories: ["Audio", "Visual", "Podium"].filter((item) => form.get(item)),
      chairs: Number(form.get("chairs") || 0),
      tables: Number(form.get("tables") || 0),
    };
    const roomErrors = validateRequestRoom(nextRoom);
    const requestedResource = nextRoom.requestedResourceId
      ? resources.find((resource) => resource.id === nextRoom.requestedResourceId)
      : undefined;
    if (
      nextRoom.requestedResourceId &&
      (!requestedResource ||
        requestedResource.siteId !== site.id ||
        (spaceType !== "Any" && requestedResource.kind !== spaceType))
    ) {
      roomErrors.push("Choose a room that matches this site and space type.");
    }
    if (roomErrors.length) {
      setRoomError(roomErrors[0]);
      return;
    }
    setRooms((current) =>
      editingRoomId ? current.map((room) => (room.id === editingRoomId ? nextRoom : room)) : [...current, nextRoom],
    );
    closeRoomModal();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const nextRequest: Omit<SpecialRequest, "id" | "createdAt"> = {
      siteId: site.id,
      eventName: String(form.get("eventName") || "").trim(),
      contactName: String(form.get("contactName") || ""),
      contactEmail: String(form.get("contactEmail") || ""),
      contactPhone: String(form.get("contactPhone") || ""),
      organization: String(form.get("organization") || ""),
      collegeAffiliated: String(form.get("collegeAffiliated") || "Yes") as "Yes" | "No",
      rooms,
      trashAndRecycling: String(form.get("trash")) === "Yes",
      attendeeCount: Number(form.get("attendeeCount") || 0),
      details: String(form.get("details") || ""),
      itineraryFileName: (form.get("itinerary") as File)?.name || undefined,
      fop: String(form.get("fop") || ""),
    };
    const errors = validateSpecialRequest(nextRequest);
    if (errors.length) {
      setRequestErrors(errors);
      setSent(false);
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(nextRequest);
      setRooms([]);
      setRequestErrors([]);
      setSent(true);
      formElement.reset();
    } catch (error) {
      setRequestErrors([error instanceof Error ? error.message : "The special request could not be saved."]);
      setSent(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="view">
      <div className="page-intro">
        <p>Special Requests</p>
        <h1>Letter of Agreement.</h1>
      </div>
      <div className="request-context">
        <section className="policy-panel">
          <h2>Reservation terms</h2>
          <ul>
            {policyHighlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section className="policy-panel">
          <h2>Pricing reminders</h2>
          <ul>
            {pricingHints.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
      {sent ? <div className="success-banner"><Check size={18} /> Request saved in prototype state.</div> : null}
      {requestErrors.length ? (
        <div className="error-banner validation-summary" role="alert">
          <Bell size={18} />
          <div>
            <strong>Review the request before submitting.</strong>
            <ul>
              {requestErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
      <form className="request-form" noValidate onSubmit={(event) => void submit(event)}>
        <fieldset>
          <legend>Event contact</legend>
          <Field name="eventName" label="Event Name" required />
          <Field name="contactName" label="Contact Name" required />
          <Field name="contactEmail" label="Contact Email" inputMode="email" required />
          <Field name="contactPhone" label="Contact Phone" type="tel" />
          <Field name="organization" label="Organization/Department" />
          <div className="notice">
            Charges may apply to events with external participants, attendance fees, or groups not directly affiliated with the College of Engineering.
          </div>
          <RadioGroup name="collegeAffiliated" label="Associated with College of Engineering?" options={["No", "Yes"]} defaultValue="Yes" />
        </fieldset>
        <fieldset>
          <legend>Space Requested and Dates</legend>
          <p className="field-note">Please include any setup or cleanup time in your reservation request.</p>
          <button className="secondary-action" type="button" onClick={() => setModalOpen(true)}>
            <Plus size={16} />
            Add Rooms
          </button>
          <div className="request-room-list">
            {rooms.map((room) => (
              <article key={room.id}>
                <div>
                  <strong>{resourceById(room.requestedResourceId ?? "")?.name ?? "Any Available"}</strong>
                  <span>
                    {room.startDate} to {room.endDate} · {formatTime(room.startTime)} to {formatTime(room.endTime)}
                  </span>
                  <span>
                    {room.attendees} attendees · {room.foodServed ? "Food served" : "No food"} ·{" "}
                    {room.flexible ? "Flexible" : "Fixed time"}
                  </span>
                </div>
                <div className="request-room-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRoomId(room.id);
                      setSpaceType(room.typeOfSpace);
                      setRequestedResourceId(room.requestedResourceId ?? "");
                      setRoomError("");
                      setModalOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" onClick={() => setRooms((current) => current.filter((item) => item.id !== room.id))}>
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Event Information</legend>
          <RadioGroup name="trash" label="Will this event require large 30-gallon trash cans and recycling cans? (+$10)" options={["No", "Yes"]} defaultValue="No" />
          <Field name="attendeeCount" label="Total estimated number of attendees for event" inputMode="numeric" required />
          <label className="field stacked">
            <span>Other Event Details</span>
            <textarea name="details" rows={5} />
          </label>
          <label className="file-drop">
            <span>Itinerary or Agenda (optional)</span>
            <input name="itinerary" type="file" />
          </label>
          <Field name="fop" label="FOP account to charge" />
          <button className="primary-action" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting…" : "Submit"}
          </button>
        </fieldset>
      </form>
      {requests.length ? <p className="history-note">{requests.length} prior request{requests.length === 1 ? "" : "s"} saved this session.</p> : null}
      {modalOpen ? (
        <ModalShell
          className="add-room-dialog"
          initialFocusSelector="[data-modal-initial-focus]"
          onClose={closeRoomModal}
          titleId="add-room-title"
        >
          <form className="add-room-form" onSubmit={addRoom}>
            <div className="modal-header">
              <h2 id="add-room-title">{editingRoom ? "Edit Room" : "Add Room"}</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={closeRoomModal}
              >
                <X size={18} />
              </button>
            </div>
            {roomError ? <div className="error-banner" role="alert">{roomError}</div> : null}
            <label className="field stacked">
              <span>Type of Space</span>
              <select
                data-modal-initial-focus
                value={spaceType}
                onChange={(event) => {
                  setSpaceType(event.target.value as ResourceKind | "Any");
                  setRequestedResourceId("");
                }}
              >
                <option>Any</option>
                <option>Ballroom</option>
                <option>Classroom</option>
                <option>Conference Room</option>
                <option>Other</option>
                <option>Study Room</option>
                <option>Equipment</option>
                <option>Tables</option>
                <option>Vehicle</option>
              </select>
            </label>
            <label className="field stacked">
              <span>Requested Room</span>
              <select value={requestedResourceId} onChange={(event) => setRequestedResourceId(event.target.value)}>
                <option value="">Any Available</option>
                {roomOptions.map((resource) => (
                  <option key={resource.id} value={resource.id}>{resource.name}</option>
                ))}
              </select>
            </label>
            <div className="two-col">
              <Field name="startDate" label="Start Date" type="date" defaultValue={editingRoom?.startDate ?? today} required />
              <Field name="endDate" label="End Date" type="date" defaultValue={editingRoom?.endDate ?? today} required />
              <Field name="startTime" label="Start Time" type="time" defaultValue={editingRoom?.startTime ?? "09:00"} required />
              <Field name="endTime" label="End Time" type="time" defaultValue={editingRoom?.endTime ?? "10:00"} required />
            </div>
            <label className="check-row"><input name="recurring" type="checkbox" defaultChecked={editingRoom?.recurring} /> <span>Recurring Event?</span></label>
            <label className="check-row"><input name="flexible" type="checkbox" defaultChecked={editingRoom?.flexible} /> <span>Are dates or times flexible?</span></label>
            <Field name="attendees" label="Number of Attendees" inputMode="numeric" defaultValue={String(editingRoom?.attendees ?? 1)} min={1} required />
            <RadioGroup name="foodServed" label="Will food be served at this event?" options={["No", "Yes"]} defaultValue={editingRoom?.foodServed ? "Yes" : "No"} />
            {["Conference Room", "Classroom", "Ballroom", "Any"].includes(spaceType) ? (
              <>
                <div className="accessory-grid">
                  {["Audio", "Visual", "Podium"].map((item) => (
                    <label className="check-row" key={item}><input name={item} type="checkbox" defaultChecked={editingRoom?.accessories.includes(item)} /> <span>{item}{item === "Podium" ? " (+$25)" : ""}</span></label>
                  ))}
                </div>
                <div className="two-col">
                  <Field name="chairs" label="Number of chairs" inputMode="numeric" defaultValue={String(editingRoom?.chairs ?? 0)} min={0} />
                  <Field name="tables" label="Number of tables" inputMode="numeric" defaultValue={String(editingRoom?.tables ?? 0)} min={0} />
                </div>
              </>
            ) : null}
            <div className="modal-actions">
              <button className="primary-action" type="submit">{editingRoom ? "Update" : "Insert"}</button>
              <button
                className="secondary-action"
                type="button"
                onClick={closeRoomModal}
              >
                Close
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </section>
  );
}

function validateRequestRoom(room: RequestRoom) {
  const errors: string[] = [];
  if (!room.startDate || !room.endDate || !room.startTime || !room.endTime) {
    errors.push("Room date and time fields are required.");
  }
  if (`${room.endDate}T${room.endTime}` <= `${room.startDate}T${room.startTime}`) {
    errors.push("Room end date and time must be after the start date and time.");
  }
  if (!Number.isFinite(room.attendees) || !Number.isInteger(room.attendees) || room.attendees < 1) {
    errors.push("Each room request needs a whole-number attendee count of at least 1.");
  }
  return errors;
}

function validateSpecialRequest(request: Omit<SpecialRequest, "id" | "createdAt">) {
  const errors: string[] = [];
  if (!request.eventName.trim()) errors.push("Event Name is required.");
  if (!request.contactName.trim()) errors.push("Contact Name is required.");
  if (!request.contactEmail.trim()) {
    errors.push("Contact Email is required.");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.contactEmail)) {
    errors.push("Contact Email must be valid.");
  }
  if (!request.rooms.length) errors.push("Add at least one room/date request.");
  if (!Number.isFinite(request.attendeeCount) || !Number.isInteger(request.attendeeCount) || request.attendeeCount < 1) {
    errors.push("Total estimated attendees must be a whole number of at least 1.");
  }
  request.rooms.flatMap(validateRequestRoom).forEach((error) => errors.push(error));
  return Array.from(new Set(errors));
}

function ProfileView({ profile, sites, onSave }: { profile: UserProfile; sites: Site[]; onSave: (profile: UserProfile) => Promise<void> }) {
  const [draft, setDraft] = useState(profile);
  const [saveError, setSaveError] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  return (
    <section className="view">
      <div className="page-intro">
        <p>Communication Preferences</p>
        <h1>Profile and defaults.</h1>
      </div>
      {saveError ? <div className="error-banner" role="alert">{saveError}</div> : null}
      <form className="profile-grid" onSubmit={(event) => {
        event.preventDefault();
        if (isSavingProfile) return;
        setIsSavingProfile(true);
        setSaveError("");
        void onSave(draft)
          .catch((error) => setSaveError(error instanceof Error ? error.message : "Preferences could not be saved."))
          .finally(() => setIsSavingProfile(false));
      }}>
        <section>
          <h2>Update User Information</h2>
          <ControlledField label="First Name" value={draft.firstName} onChange={(firstName) => setDraft({ ...draft, firstName })} />
          <ControlledField label="Nick Name (optional)" value={draft.nickName} onChange={(nickName) => setDraft({ ...draft, nickName })} />
          <ControlledField label="Email" value={draft.email} disabled onChange={() => undefined} />
          <ControlledField label="Phone Number" value={draft.phone} onChange={(phone) => setDraft({ ...draft, phone })} />
          <label className="field stacked">
            <span>Classification</span>
            <select value={draft.classification} onChange={(event) => setDraft({ ...draft, classification: event.target.value as UserProfile["classification"] })}>
              <option value="">Select one</option>
              <option>Undergraduate</option>
              <option>Graduate</option>
              <option>Staff</option>
              <option>Faculty</option>
            </select>
          </label>
          <label className="field stacked">
            <span>Affiliated Major/Department</span>
            <select value={draft.department} onChange={(event) => setDraft({ ...draft, department: event.target.value })}>
              <option value="">Select one</option>
              {["Aerospace", "Biosystems", "Chemical", "Civil and Environmental", "Computer Science and Software", "Electrical and Computer", "Industrial and Systems", "Material", "Mechanical", "Other Engineering", "Not Engineering"].map((department) => (
                <option key={department}>{department}</option>
              ))}
            </select>
          </label>
          <label className="field stacked">
            <span>Default Site</span>
            <select value={draft.defaultSiteId} onChange={(event) => setDraft({ ...draft, defaultSiteId: event.target.value })}>
              {sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
            </select>
          </label>
        </section>
        <section>
          <h2>Communication Preferences</h2>
          <RadioButtons
            label="Notification Type"
            value={draft.notificationType}
            options={["Both", "Email", "Text"]}
            onChange={(notificationType) => setDraft({ ...draft, notificationType: notificationType as UserProfile["notificationType"] })}
          />
          <h3>Email List Subscription</h3>
          <Toggle label="Newsletter" checked={draft.newsletter} onChange={(newsletter) => setDraft({ ...draft, newsletter })} />
          <Toggle label="Events" checked={draft.events} onChange={(events) => setDraft({ ...draft, events })} />
          <button className="primary-action" type="submit" disabled={isSavingProfile}>
            {isSavingProfile ? "Updating…" : "Update"}
          </button>
        </section>
      </form>
    </section>
  );
}

function Field({
  name,
  label,
  type = "text",
  defaultValue,
  required,
  min,
  inputMode,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  min?: number;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  const id = `field-${name}`;
  return (
    <div className="field stacked">
      <label htmlFor={id}>{label}</label>
      <input id={id} name={name} type={type} defaultValue={defaultValue} required={required} min={min} inputMode={inputMode} />
    </div>
  );
}

function ControlledField({ label, value, disabled, onChange }: { label: string; value: string; disabled?: boolean; onChange: (value: string) => void }) {
  const id = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div className="field stacked">
      <label htmlFor={id}>{label}</label>
      <input id={id} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function RadioGroup({ name, label, options, defaultValue }: { name: string; label: string; options: string[]; defaultValue: string }) {
  return (
    <div className="radio-group">
      <span>{label}</span>
      {options.map((option) => (
        <label key={option}><input type="radio" name={name} value={option} defaultChecked={option === defaultValue} /> {option}</label>
      ))}
    </div>
  );
}

function RadioButtons({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <div className="radio-group">
      <span>{label}</span>
      {options.map((option) => (
        <label key={option}><input type="radio" checked={value === option} onChange={() => onChange(option)} /> {option}</label>
      ))}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="check-row">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <Bell size={22} />
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function NavButton({ children, icon, active, onClick }: { children: React.ReactNode; icon: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button className={active ? "nav-button active" : "nav-button"} type="button" onClick={onClick}>
      {icon}
      <span>{children}</span>
    </button>
  );
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour = hours % 12 || 12;
  return `${hour}:${minutes.toString().padStart(2, "0")} ${suffix}`;
}

function dateShort(date: string) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "numeric", day: "numeric" }).format(new Date(`${date}T12:00:00`));
}

function addDays(date: string, days: number) {
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function addHour(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return `${String(Math.min(hour + 1, 23)).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function statusClass(status: ResourceStatus) {
  if (status === "Open") return "open";
  if (status === "Approval needed") return "approval";
  if (status === "Not Checked-in") return "checked-out";
  return "closed";
}
