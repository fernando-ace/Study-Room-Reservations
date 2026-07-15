import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  DoorOpen,
  ExternalLink,
  List,
  Map as MapIcon,
  MapPin,
  Maximize2,
  Minus,
  Monitor,
  Plus,
  Users,
  X,
} from "lucide-react";
import { today } from "../data/mockData";
import { mapsForSite } from "../services/reservationService";
import type { AvailabilitySlot, FloorMap, Resource, Site } from "../types";

type FloorMapViewProps = {
  site?: Site;
  resources: Resource[];
  availability: AvailabilitySlot[];
  selectedResourceId: string;
  selectedSlot: AvailabilitySlot | null;
  onConfirm: (slot: AvailabilitySlot, attendeeCount: number) => void;
  onDateChange: (date: string) => void;
  onListView: () => void;
  onRequest: () => void;
  onResourceSelect: (id: string) => void;
  onSlotClear: () => void;
  onSlotSelect: (slot: AvailabilitySlot) => void;
};

const startTimes = Array.from({ length: 18 }, (_, index) => {
  const minutes = 8 * 60 + index * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});

export function FloorMapView({
  site,
  resources,
  availability,
  selectedResourceId,
  selectedSlot,
  onConfirm,
  onDateChange,
  onListView,
  onRequest,
  onResourceSelect,
  onSlotClear,
  onSlotSelect,
}: FloorMapViewProps) {
  const maps = mapsForSite(site?.id ?? "");
  const defaultFloor = maps.find((map) => map.floor === "Second Floor")?.floor ?? maps[0]?.floor ?? "";
  const [floor, setFloor] = useState(defaultFloor);
  const [searchDate, setSearchDate] = useState(today);
  const [startTime, setStartTime] = useState("13:00");
  const [duration, setDuration] = useState("60");
  const [groupSize, setGroupSize] = useState("4");
  const [zoom, setZoom] = useState(1);
  const [showAllRooms, setShowAllRooms] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [searchNote, setSearchNote] = useState("");
  const fullscreenTriggerRef = useRef<HTMLButtonElement>(null);
  const fullscreenCloseRef = useRef<HTMLButtonElement>(null);
  const fullscreenPanelRef = useRef<HTMLElement>(null);

  const activeMap = maps.find((map) => map.floor === floor) ?? maps[0];
  const resourceMap = useMemo(() => new Map(resources.map((resource) => [resource.id, resource])), [resources]);
  const floorResources = useMemo(
    () => activeMap?.resourceIds.map((id) => resourceMap.get(id)).filter((resource): resource is Resource => Boolean(resource)) ?? [],
    [activeMap, resourceMap],
  );
  const requestedEnd = addMinutes(startTime, Number(duration));
  const matchingRooms = useMemo(
    () =>
      floorResources
        .filter(
          (resource) =>
            resource.status === "Open" &&
            resource.action !== "request" &&
            resource.capacity >= Number(groupSize) &&
            availability.some(
              (slot) =>
                slot.resourceId === resource.id &&
                slot.date === searchDate &&
                slot.status === "available" &&
                slot.start <= startTime &&
                slot.end >= requestedEnd,
            ),
        )
        .sort((a, b) => a.capacity - b.capacity || a.name.localeCompare(b.name, undefined, { numeric: true })),
    [availability, floorResources, groupSize, requestedEnd, searchDate, startTime],
  );
  const fallbackResourceId =
    matchingRooms[0]?.id ?? floorResources.find((resource) => resource.status === "Open" && resource.action !== "request")?.id ?? floorResources[0]?.id;
  const selectedResource = resourceMap.get(selectedResourceId);
  const selectedAvailability = useMemo(() => {
    const resource = resourceMap.get(selectedResourceId);
    if (
      !resource ||
      resource.status !== "Open" ||
      resource.action === "request" ||
      resource.capacity < Number(groupSize)
    ) {
      return [];
    }
    const opening = availability.find(
      (slot) =>
        slot.resourceId === selectedResourceId &&
        slot.date === searchDate &&
        slot.status === "available" &&
        slot.start <= startTime &&
        slot.end >= requestedEnd,
    );
    return opening ? [{ ...opening, start: startTime, end: requestedEnd }] : [];
  }, [availability, groupSize, requestedEnd, resourceMap, searchDate, selectedResourceId, startTime]);
  const selectedSlotMatches =
    selectedSlot?.resourceId === selectedResourceId && selectedSlot.date === searchDate ? selectedSlot : null;
  const orderedMatchingRooms = useMemo(
    () => [
      ...matchingRooms.filter((resource) => resource.id === selectedResourceId),
      ...matchingRooms.filter((resource) => resource.id !== selectedResourceId),
    ],
    [matchingRooms, selectedResourceId],
  );
  const displayedRooms = showAllRooms ? orderedMatchingRooms : orderedMatchingRooms.slice(0, 6);
  const selectedMapLabel = selectedResource ? activeMap?.mapLabelsByResourceId[selectedResource.id] : undefined;

  useEffect(() => {
    const nextFloor = maps.find((map) => map.floor === "Second Floor")?.floor ?? maps[0]?.floor ?? "";
    setFloor(nextFloor);
    setZoom(1);
    setShowAllRooms(false);
    setSearchNote("");
  }, [site?.id]);

  useEffect(() => {
    if (!activeMap || !fallbackResourceId) return;
    const selectedFits = matchingRooms.some((resource) => resource.id === selectedResourceId);
    const selectionIsOnFloor = activeMap.resourceIds.includes(selectedResourceId);
    if (selectedFits || (!matchingRooms.length && selectionIsOnFloor)) return;
    onResourceSelect(fallbackResourceId);
  }, [activeMap, fallbackResourceId, matchingRooms, onResourceSelect, selectedResourceId]);

  useEffect(() => {
    if (!mapExpanded) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    fullscreenCloseRef.current?.focus();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMapExpanded(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      (previousFocus ?? fullscreenTriggerRef.current)?.focus();
    };
  }, [mapExpanded]);

  function changeFloor(nextFloor: string) {
    setFloor(nextFloor);
    setZoom(1);
    setShowAllRooms(false);
    setSearchNote("");
    onSlotClear();
  }

  function updateSearchDate(nextDate: string) {
    setSearchDate(nextDate);
    onDateChange(nextDate);
    onSlotClear();
  }

  function runSearch() {
    setSearchNote(
      matchingRooms.length
        ? `${matchingRooms.length} ${matchingRooms.length === 1 ? "room fits" : "rooms fit"} your time and group.`
        : "No rooms fit those details. Try another time, floor, or group size.",
    );
    if (matchingRooms[0]) onResourceSelect(matchingRooms[0].id);
  }

  function trapFullscreenFocus(event: ReactKeyboardEvent<HTMLElement>) {
    if (!mapExpanded || event.key !== "Tab") return;
    const focusable = Array.from(
      fullscreenPanelRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]') ?? [],
    );
    if (!focusable.length) return;
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
    <section className="view map-view">
      <div className="map-intro">
        <div>
          <h1>Find a room</h1>
          <p>Set your time once. We’ll show rooms that actually fit.</p>
        </div>
        <div className="view-toggle" aria-label="View options">
          <button className="active" type="button" aria-pressed="true"><MapIcon size={17} /> Map</button>
          <button type="button" aria-pressed="false" onClick={onListView}><List size={17} /> List</button>
        </div>
      </div>

      <div className="map-search-bar" aria-label="Room search details">
        <label>
          <span>Date</span>
          <div><CalendarDays size={18} /><input type="date" min={today} max={addDays(today, 5)} value={searchDate} onChange={(event) => updateSearchDate(event.target.value)} /></div>
        </label>
        <label>
          <span>Starts</span>
          <div><Clock3 size={18} /><select value={startTime} onChange={(event) => { setStartTime(event.target.value); onSlotClear(); }}>
            {startTimes.map((time) => <option value={time} key={time}>{formatTime(time)}</option>)}
          </select></div>
        </label>
        <label>
          <span>Duration</span>
          <div><Clock3 size={18} /><select value={duration} onChange={(event) => { setDuration(event.target.value); onSlotClear(); }}>
            <option value="60">1 hour</option>
            <option value="90">1.5 hours</option>
            <option value="120">2 hours</option>
            <option value="180">3 hours</option>
          </select></div>
        </label>
        <label>
          <span>Group</span>
          <div><Users size={18} /><select value={groupSize} onChange={(event) => { setGroupSize(event.target.value); onSlotClear(); }}>
            <option value="1">1 person</option>
            <option value="2">2 people</option>
            <option value="4">4 people</option>
            <option value="6">6 people</option>
            <option value="10">10+ people</option>
          </select></div>
        </label>
        <button className="find-button" type="button" onClick={runSearch}>Show available rooms</button>
      </div>
      {searchNote ? <p className="search-feedback" role="status">{searchNote}</p> : null}

      <div className="map-workspace">
        <aside className="room-result-rail" aria-label="Available rooms" data-testid="room-results">
          <div className="result-rail-heading">
            <strong>{matchingRooms.length} {matchingRooms.length === 1 ? "room" : "rooms"} match</strong>
            <span>{formatDate(searchDate)} · {formatTime(startTime)}</span>
          </div>
          <div className="compact-room-list">
            {displayedRooms.length ? displayedRooms.map((resource) => {
              const mapLabel = activeMap?.mapLabelsByResourceId[resource.id];
              return (
                <button
                  className={resource.id === selectedResourceId ? "selected" : ""}
                  type="button"
                  aria-pressed={resource.id === selectedResourceId}
                  key={resource.id}
                  onClick={() => onResourceSelect(resource.id)}
                >
                  <span>
                    <strong>Room {resource.name}</strong>
                    {mapLabel ? <small className="map-room-reference">Map {mapLabel}</small> : <small>Seats {resource.capacity}</small>}
                  </span>
                  <small>{mapLabel ? `Seats ${resource.capacity} · ` : ""}{resource.features.slice(0, 2).join(" · ")}</small>
                </button>
              );
            }) : (
              <div className="room-results-empty">
                <strong>No matching rooms</strong>
                <p>Try an earlier start, a shorter session, or a different floor.</p>
              </div>
            )}
          </div>
          {matchingRooms.length > 6 ? (
            <button className="show-more-rooms" type="button" onClick={() => setShowAllRooms((value) => !value)}>
              {showAllRooms ? "Show fewer rooms" : `Show ${matchingRooms.length - 6} more rooms`}
            </button>
          ) : null}
          <button className="request-link" type="button" onClick={onRequest}>Need a classroom or event space?</button>
        </aside>

        <section
          className={`official-map-panel ${mapExpanded ? "is-expanded" : ""}`}
          role={mapExpanded ? "dialog" : undefined}
          aria-modal={mapExpanded ? "true" : undefined}
          aria-labelledby="official-map-title"
          ref={fullscreenPanelRef}
          onKeyDown={trapFullscreenFocus}
        >
          <div className="official-map-toolbar">
            <div className="floor-tabs" aria-label="Choose floor">
              {maps.map((map) => (
                <button
                  className={map.floor === activeMap?.floor ? "active" : ""}
                  key={map.floor}
                  type="button"
                  aria-pressed={map.floor === activeMap?.floor}
                  onClick={() => changeFloor(map.floor)}
                >
                  {map.label}
                </button>
              ))}
            </div>
            <div className="map-actions">
              <button type="button" aria-label="Zoom out" disabled={zoom <= 1} onClick={() => setZoom((value) => Math.max(1, value - 0.2))}><Minus size={16} /><span>Zoom out</span></button>
              <button type="button" aria-label="Zoom in" disabled={zoom >= 1.8} onClick={() => setZoom((value) => Math.min(1.8, value + 0.2))}><Plus size={16} /><span>Zoom in</span></button>
              {mapExpanded ? (
                <button type="button" aria-label="Close larger map" ref={fullscreenCloseRef} onClick={() => setMapExpanded(false)}><X size={16} /><span>Close</span></button>
              ) : (
                <button type="button" aria-label="Open larger map" ref={fullscreenTriggerRef} onClick={() => setMapExpanded(true)}><Maximize2 size={16} /><span>Full screen</span></button>
              )}
            </div>
          </div>
          {activeMap ? (
            <figure className="official-map-figure" data-testid="official-floor-plan">
              <div className="official-map-scroll">
                <div className="official-map-media" style={{ width: `${Math.round(zoom * 100)}%` }}>
                  <img
                    src={activeMap.imageSrc}
                    alt={activeMap.imageAlt}
                    width={activeMap.nativeWidth}
                    height={activeMap.nativeHeight}
                  />
                </div>
              </div>
              <figcaption>
                <span className="map-caption-copy">
                  <span id="official-map-title">{activeMap.source}</span>
                  <small>Map numbers are wayfinding labels. Match them to the “Map” number beside each room.</small>
                </span>
                <a href={activeMap.sourceUrl} target="_blank" rel="noreferrer">View original <ExternalLink size={13} /></a>
              </figcaption>
            </figure>
          ) : (
            <div className="map-unavailable"><strong>No floor plan available</strong><p>Use list view to browse this site’s resources.</p></div>
          )}
        </section>

        <aside className="map-detail-panel" data-testid="reservation-summary">
          {selectedResource ? (
            <>
              <div className="room-detail-heading">
                <div className={selectedAvailability.length ? "available" : "unavailable"}>
                  <span className="status-dot" />
                  <strong>{selectedAvailability.length ? (searchDate === today ? "Available today" : `Available ${formatDate(searchDate)}`) : "No open times"}</strong>
                </div>
                <h2>{selectedResource.kind === "Study Room" ? "Room" : selectedResource.kind} {selectedResource.name}</h2>
                {selectedMapLabel ? (
                  <p className="room-map-note"><MapPin size={14} /> Shown as <strong>Map {selectedMapLabel}</strong> on the floor plan</p>
                ) : null}
              </div>
              <div className="room-facts">
                <span><Users size={18} /> Seats {selectedResource.capacity}</span>
                {selectedResource.features.slice(0, 3).map((feature, index) => (
                  <span key={feature}>{index === 0 ? <DoorOpen size={18} /> : index === 1 ? <Monitor size={18} /> : <Check size={18} />}{feature}</span>
                ))}
              </div>
              <div className="availability-list">
                <div><h3>Requested time</h3><span>{selectedAvailability.length ? "Fits" : "Unavailable"}</span></div>
                {selectedAvailability.length ? selectedAvailability.map((slot) => {
                  const active = selectedSlotMatches?.start === slot.start && selectedSlotMatches.end === slot.end;
                  return (
                    <button
                      className={active ? "active" : ""}
                      type="button"
                      aria-pressed={active}
                      key={`${slot.date}-${slot.start}`}
                      onClick={() => onSlotSelect(slot)}
                    >
                      <span>{active ? <Check size={17} /> : null}<strong>{formatTime(slot.start)}–{formatTime(slot.end)}</strong></span>
                       <small>Available</small><ChevronRight size={17} />
                    </button>
                  );
                }) : <div className="detail-empty"><strong>No instant openings</strong><p>Try another room, date, or floor.</p></div>}
              </div>
              {selectedResource.action === "request" ? (
                <button className="find-button reserve-cta" type="button" onClick={onRequest}>Request this space</button>
              ) : selectedSlotMatches ? (
                <button className="find-button reserve-cta" type="button" onClick={() => onConfirm(selectedSlotMatches, Number(groupSize))}>Reserve {formatTime(selectedSlotMatches.start)}–{formatTime(selectedSlotMatches.end)}</button>
              ) : (
                <button className="find-button reserve-cta" type="button" disabled>Select a time</button>
              )}
            </>
          ) : <div className="detail-empty"><strong>Choose a room</strong><p>Select an available room to see its open times.</p></div>}
        </aside>
      </div>
    </section>
  );
}

function addMinutes(time: string, minutes: number) {
  const [hours, mins] = time.split(":").map(Number);
  const value = hours * 60 + mins + minutes;
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

function addDays(date: string, amount: number) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + amount);
  return value.toISOString().slice(0, 10);
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(
    new Date(2026, 0, 1, hours, minutes),
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(`${date}T12:00:00`));
}
