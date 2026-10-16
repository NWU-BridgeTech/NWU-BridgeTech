import { useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  StickyNote,
  Trash2,
} from "lucide-react";

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPlannerStorageKey() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return `bridgetech:instructor-planner:${user?.userId || user?.email || "current"}`;
  } catch {
    return "bridgetech:instructor-planner:current";
  }
}

function readPlanner() {
  try {
    const stored = JSON.parse(localStorage.getItem(getPlannerStorageKey()) || "{}");
    return {
      events: Array.isArray(stored.events) ? stored.events : [],
      notes: Array.isArray(stored.notes)
        ? stored.notes
        : typeof stored.notes === "string" && stored.notes.trim()
          ? [
              {
                id: "saved-note",
                title: "My note",
                content: stored.notes,
                date: "Saved note",
              },
            ]
          : [],
    };
  } catch {
    return { events: [], notes: [] };
  }
}

function monthLabel(date) {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export default function InstructorPlanner({ pageLayout = false }) {
  const today = new Date();
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(() => dateKey(today));
  const [planner, setPlanner] = useState(readPlanner);
  const [eventTitle, setEventTitle] = useState("");
  const [eventTime, setEventTime] = useState("09:00");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeNoteIndex, setActiveNoteIndex] = useState(0);
  const [addNoteExpanded, setAddNoteExpanded] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  const firstDay = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth(),
    1,
  );
  const daysInMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
    0,
  ).getDate();
  const leadingDays = (firstDay.getDay() + 6) % 7;
  const calendarDays = [
    ...Array(leadingDays).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const selectedEvents = planner.events
    .filter((event) => event.date === selectedDate)
    .sort((left, right) => left.time.localeCompare(right.time));
  const allScheduledEvents = [...planner.events].sort((left, right) =>
    left.date.localeCompare(right.date) || left.time.localeCompare(right.time),
  );
  const scheduledEventGroups = allScheduledEvents.reduce((groups, event) => {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup?.date === event.date) {
      lastGroup.events.push(event);
    } else {
      groups.push({ date: event.date, events: [event] });
    }
    return groups;
  }, []);
  const selectedDateLabel = new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
    undefined,
    { weekday: "long", month: "long", day: "numeric" },
  );
  const displayedNotes = planner.notes;
  const activeNote = displayedNotes[activeNoteIndex] ?? displayedNotes[0];

  function persist(nextPlanner, successMessage) {
    try {
      localStorage.setItem(getPlannerStorageKey(), JSON.stringify(nextPlanner));
      setPlanner(nextPlanner);
      setError("");
      setMessage(successMessage);
    } catch {
      setError("Could not save your planner in this browser. Check browser storage settings and try again.");
      setMessage("");
    }
  }

  function changeMonth(offset) {
    setVisibleMonth(
      (month) => new Date(month.getFullYear(), month.getMonth() + offset, 1),
    );
  }

  function addEvent(event) {
    event.preventDefault();
    const title = eventTitle.trim();
    if (!title) {
      setError("Enter a title for this schedule item.");
      setMessage("");
      return;
    }

    persist(
      {
        ...planner,
        events: [
          ...planner.events,
          {
            id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
            date: selectedDate,
            time: eventTime,
            title,
          },
        ],
      },
      "Schedule item saved.",
    );
    setEventTitle("");
  }

  function removeEvent(eventId) {
    persist(
      {
        ...planner,
        events: planner.events.filter((event) => event.id !== eventId),
      },
      "Schedule item removed.",
    );
  }

  function saveNote(event) {
    event.preventDefault();
    const title = newNoteTitle.trim();
    const content = newNoteContent.trim();
    if (!title || !content) {
      setError("Enter a title and note before saving.");
      setMessage("");
      return;
    }

    const notes = [
      {
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        title,
        content,
        date: new Date().toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      },
      ...planner.notes,
    ];
    persist({ ...planner, notes }, "Note saved.");
    setActiveNoteIndex(0);
    setNewNoteTitle("");
    setNewNoteContent("");
  }

  function removeActiveNote() {
    if (!activeNote) return;
    removeNote(activeNote);
    setActiveNoteIndex((index) =>
      Math.min(index, Math.max(0, displayedNotes.length - 2)),
    );
  }

  function removeNote(note) {
    if (!note) return;
    const notes = planner.notes.filter((item) => item.id !== note.id);
    persist({ ...planner, notes }, "Note removed.");
  }

  function changeNote(offset) {
    setActiveNoteIndex((index) =>
      (index + offset + displayedNotes.length) % displayedNotes.length,
    );
  }

  function selectDay(day) {
    setSelectedDate(
      dateKey(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day)),
    );
    setMessage("");
    setError("");
  }

  const monthControls = (
    <div className="instructor-planner-month-controls">
      <button
        type="button"
        aria-label="Previous month"
        onClick={() => changeMonth(-1)}
      >
        <ChevronLeft size={17} aria-hidden="true" />
      </button>
      <strong aria-live="polite">{monthLabel(visibleMonth)}</strong>
      <button
        type="button"
        aria-label="Next month"
        onClick={() => changeMonth(1)}
      >
        <ChevronRight size={17} aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <aside
      className={`instructor-planner${pageLayout ? " instructor-planner-page-layout" : ""}`}
      aria-labelledby="instructor-planner-heading"
    >
      <header className="instructor-planner-header">
        <div className="instructor-planner-title">
          <CalendarDays size={19} aria-hidden="true" />
          <div>
            <h2 id="instructor-planner-heading">Calendar &amp; notes</h2>
            <p>Personal planning, saved in this browser.</p>
          </div>
        </div>
        {!pageLayout && monthControls}
      </header>

      <section className="instructor-planner-calendar-area">
        {pageLayout && monthControls}
        <div className="instructor-calendar" aria-label={monthLabel(visibleMonth)}>
          {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
            <span className="instructor-calendar-weekday" key={`${day}-${index}`}>
              {day}
            </span>
          ))}
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <span className="instructor-calendar-empty" key={`empty-${index}`} />;
            }
            const dayKey = dateKey(
              new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day),
            );
            const hasEvent = planner.events.some((event) => event.date === dayKey);
            const isToday = dayKey === dateKey(today);
            return (
              <button
                className={[
                  "instructor-calendar-day",
                  selectedDate === dayKey ? "is-selected" : "",
                  isToday ? "is-today" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                type="button"
                key={dayKey}
                aria-label={`${new Date(`${dayKey}T12:00:00`).toLocaleDateString(undefined, { month: "long", day: "numeric" })}${hasEvent ? ", scheduled items" : ""}`}
                aria-pressed={selectedDate === dayKey}
                onClick={() => selectDay(day)}
              >
                {day}
                {hasEvent && <span aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </section>

      <div className={pageLayout ? "instructor-planner-page-sidebar" : undefined}>
        <section className="instructor-planner-schedule" aria-labelledby="schedule-heading">
          <div className={pageLayout ? "instructor-planner-schedule-heading" : undefined}>
            <h3 id="schedule-heading">
              {pageLayout ? "Scheduled items" : selectedDateLabel}
            </h3>
            {pageLayout && (
              <span className="instructor-planner-event-count">
                {allScheduledEvents.length} {allScheduledEvents.length === 1 ? "item" : "items"}
              </span>
            )}
          </div>
          {pageLayout && (
            <form className="instructor-planner-event-form" onSubmit={addEvent}>
              <div className="instructor-planner-event-form-heading">
                <strong>Add a scheduled item</strong>
                <span>{selectedDateLabel}</span>
              </div>
              <label className="instructor-planner-event-field">
                <span>Time</span>
                <input
                  id="instructor-event-time"
                  type="time"
                  value={eventTime}
                  onChange={(event) => setEventTime(event.target.value)}
                />
              </label>
              <label className="instructor-planner-event-field">
                <span>Item</span>
                <input
                  id="instructor-event-title"
                  value={eventTitle}
                  maxLength={100}
                  onChange={(event) => setEventTitle(event.target.value)}
                  placeholder="e.g. Prepare lesson materials"
                />
              </label>
              <button type="submit">
                <Plus size={16} aria-hidden="true" />
                Add item
              </button>
            </form>
          )}
          {(pageLayout ? allScheduledEvents : selectedEvents).length > 0 ? (
            pageLayout ? (
              <div className="instructor-planner-event-groups">
                {scheduledEventGroups.map((group) => (
                  <section className="instructor-planner-event-group" key={group.date}>
                    <h4>
                      {group.date === dateKey(today)
                        ? "Today"
                        : new Date(`${group.date}T12:00:00`).toLocaleDateString(undefined, {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}
                    </h4>
                    <ul>
                      {group.events.map((item) => (
                        <li key={item.id}>
                          <time dateTime={`${item.date}T${item.time}`}>{item.time}</time>
                          <span>{item.title}</span>
                          <button
                            type="button"
                            aria-label={`Remove ${item.title}`}
                            onClick={() => removeEvent(item.id)}
                          >
                            <Trash2 size={14} aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            ) : (
              <ul>
                {selectedEvents.map((item) => (
                  <li key={item.id}>
                    <Clock3 size={15} aria-hidden="true" />
                    <time dateTime={`${item.date}T${item.time}`}>{item.time}</time>
                    <span>{item.title}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${item.title}`}
                      onClick={() => removeEvent(item.id)}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <p className="instructor-planner-empty">
              {pageLayout
                ? "Your calendar is clear. Use the form above to add a schedule item."
                : allScheduledEvents.length === 0
                  ? "Your calendar is clear. Add your first schedule item below to begin planning."
                  : "Nothing saved for this day yet. Add a schedule item below if you need a reminder."}
            </p>
          )}
          {!pageLayout && <form className="instructor-planner-event-form" onSubmit={addEvent}>
            <label className="visually-hidden" htmlFor="instructor-event-title">
              Schedule item
            </label>
            <input
              id="instructor-event-title"
              value={eventTitle}
              maxLength={100}
              onChange={(event) => setEventTitle(event.target.value)}
              placeholder="Add a schedule item"
            />
            <label className="visually-hidden" htmlFor="instructor-event-time">
              Time
            </label>
            <input
              id="instructor-event-time"
              type="time"
              value={eventTime}
              onChange={(event) => setEventTime(event.target.value)}
            />
            <button type="submit" aria-label="Save schedule item">
              <Plus size={17} aria-hidden="true" />
            </button>
          </form>}
        </section>

      <section className={`instructor-planner-notes${pageLayout ? " instructor-planner-all-notes" : ""}`} aria-labelledby="personal-notes-heading">
        <div className="instructor-planner-notes-heading">
          <h3 id="personal-notes-heading">Personal notes</h3>
          <button
            className="instructor-planner-note-toggle"
            type="button"
            aria-label={addNoteExpanded ? "Close add note form" : "Add a note"}
            aria-expanded={addNoteExpanded}
            aria-controls="instructor-add-note-form"
            onClick={() => setAddNoteExpanded((expanded) => !expanded)}
          >
            <StickyNote size={17} aria-hidden="true" />
          </button>
        </div>
        <div id="instructor-personal-notes-content">
          {pageLayout ? (
            displayedNotes.length > 0 ? (
              <div className="instructor-note-list">
                {displayedNotes.map((note, index) => (
                <article
                  className={`instructor-note-slide instructor-note-slide-color-${index % 6}`}
                  key={note.id}
                >
                  <div className="instructor-note-slide-meta">
                    <span>{note.date}</span>
                    <button
                      type="button"
                      aria-label={`Delete note ${note.title}`}
                      onClick={() => removeNote(note)}
                    >
                      <Trash2 size={13} aria-hidden="true" />
                    </button>
                  </div>
                  <h4>{note.title}</h4>
                  <p>{note.content}</p>
                </article>
                ))}
              </div>
            ) : (
              <div className="instructor-planner-empty-state">
                <p className="instructor-planner-empty">No notes saved yet. Capture your first teaching idea or reminder to get started.</p>
                <button
                  className="instructor-planner-empty-action"
                  type="button"
                  onClick={() => setAddNoteExpanded(true)}
                >
                  Write your first note
                </button>
              </div>
            )
          ) : (
          <>
          {displayedNotes.length > 0 ? (
          <>
          <div className="instructor-note-carousel">
            <button
              className="instructor-note-nav"
              type="button"
              aria-label="Previous note"
              disabled={displayedNotes.length < 2}
              onClick={() => changeNote(-1)}
            >
              <ChevronLeft size={17} aria-hidden="true" />
            </button>
            <article
              className={`instructor-note-slide instructor-note-slide-color-${activeNoteIndex % 6}`}
              aria-live="polite"
            >
              <div className="instructor-note-slide-meta">
                <span>{activeNote?.date}</span>
                {activeNote && (
                  <button
                    type="button"
                    aria-label={`Delete note ${activeNote?.title}`}
                    onClick={removeActiveNote}
                  >
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                )}
              </div>
              <h4>{activeNote?.title}</h4>
              <p>{activeNote?.content}</p>
            </article>
            <button
              className="instructor-note-nav"
              type="button"
              aria-label="Next note"
              disabled={displayedNotes.length < 2}
              onClick={() => changeNote(1)}
            >
              <ChevronRight size={17} aria-hidden="true" />
            </button>
          </div>
          </>
          ) : (
            <div className="instructor-planner-empty-state">
              <p className="instructor-planner-empty">No notes saved yet. Capture your first teaching idea or reminder to get started.</p>
              <button
                className="instructor-planner-empty-action"
                type="button"
                onClick={() => setAddNoteExpanded(true)}
              >
                Write your first note
              </button>
            </div>
          )}
          <div className="instructor-note-dots" aria-label="Choose a note">
            {displayedNotes.map((note, index) => (
              <button
                type="button"
                key={note.id}
                className={index === activeNoteIndex ? "is-active" : ""}
                aria-label={`Show note ${index + 1}: ${note.title}`}
                aria-current={index === activeNoteIndex ? "true" : undefined}
                onClick={() => setActiveNoteIndex(index)}
              />
            ))}
          </div>
          </>
          )}
          {addNoteExpanded && <form
            id="instructor-add-note-form"
            className="instructor-planner-note-form"
            onSubmit={saveNote}
          >
            <label htmlFor="instructor-note-title">Add a note</label>
            <input
              id="instructor-note-title"
              value={newNoteTitle}
              maxLength={80}
              onChange={(event) => setNewNoteTitle(event.target.value)}
              placeholder="Note title"
            />
            <textarea
              aria-label="Note details"
              value={newNoteContent}
              maxLength={1000}
              rows={2}
              onChange={(event) => setNewNoteContent(event.target.value)}
              placeholder="Write a reminder or note…"
            />
            <button type="submit">
              <Plus size={14} aria-hidden="true" />
              Save note
            </button>
          </form>}
        </div>
      </section>
      </div>
      {message && <p className="instructor-planner-message" role="status">{message}</p>}
      {error && <p className="instructor-planner-error" role="alert">{error}</p>}
    </aside>
  );
}
