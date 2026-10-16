import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const gradients = [
  "from-indigo-500 to-purple-500",
  "from-sky-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
];

const filters = [
  { key: "upcoming", label: "Upcoming" },
  { key: "open", label: "Seats open" },
  { key: "past", label: "Past" },
  { key: "all", label: "All" },
];

function EventCardSkeleton() {
  return (
    <div className="card animate-pulse overflow-hidden">
      <div className="h-28 bg-slate-200" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-3/4 rounded bg-slate-200" />
        <div className="h-3 w-1/2 rounded bg-slate-200" />
        <div className="h-2 w-full rounded bg-slate-200" />
      </div>
    </div>
  );
}

function EventCard({ event, past }) {
  const registered = event.registeredUsers.length;
  const seatsLeft = event.capacity - registered;
  const full = seatsLeft <= 0;
  const percent = Math.min(100, Math.round((registered / event.capacity) * 100));

  const d = new Date(event.date);
  const gradient = gradients[event.title.charCodeAt(0) % gradients.length];

  const barColor = full
    ? "bg-rose-500"
    : percent >= 70
    ? "bg-amber-500"
    : "bg-emerald-500";

  return (
    <Link
      to={`/events/${event._id}`}
      className="card group overflow-hidden transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className={`relative h-28 bg-gradient-to-br ${gradient}`}>
        <div className="absolute left-4 top-4 rounded-xl bg-white px-3 py-1.5 text-center shadow">
          <p className="text-lg font-bold leading-none text-slate-900">
            {d.getDate()}
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">
            {d.toLocaleString("en-IN", { month: "short" })}
          </p>
        </div>

        {past && (
          <span className="badge absolute right-4 top-4 bg-slate-900/70 text-white">
            Ended
          </span>
        )}
      </div>

      <div className="p-5">
        <h2 className="line-clamp-1 text-lg font-bold text-slate-900 group-hover:text-brand-600">
          {event.title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">📍 {event.venue}</p>
        <p className="mt-3 line-clamp-2 text-sm text-slate-600">
          {event.description}
        </p>

        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${barColor}`}
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {registered}/{event.capacity} registered
            </span>

            {past ? null : full ? (
              <span className="badge bg-amber-100 text-amber-700">
                Waitlist open
              </span>
            ) : (
              <span className="badge bg-emerald-100 text-emerald-700">
                {seatsLeft} left
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function Events() {
  const { user } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("upcoming");

  const fetchEvents = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/events");
      setEvents(res.data.events);
    } catch (err) {
      setError("Couldn't load events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return events.filter((e) => {
      const matches = `${e.title} ${e.venue}`.toLowerCase().includes(q);
      if (!matches) return false;

      const past = new Date(e.date) < today;
      const hasSeats = e.registeredUsers.length < e.capacity;

      if (filter === "upcoming") return !past;
      if (filter === "open") return !past && hasSeats;
      if (filter === "past") return past;
      return true;
    });
  }, [events, search, filter, today]);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <h1 className="max-w-2xl text-3xl font-extrabold leading-tight sm:text-4xl">
            Discover workshops, hackathons and fests
          </h1>
          <p className="mt-3 max-w-xl text-brand-100">
            Register in seconds. If an event is full, you join the waitlist and
            get promoted automatically when a seat opens.
          </p>

          {user?.role === "admin" && (
            <Link
              to="/admin"
              className="btn mt-5 bg-white text-brand-700 hover:bg-brand-50"
            >
              + Create Event
            </Link>
          )}

          <div className="relative mt-6 max-w-xl">
            <svg
              className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by title or venue"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input py-3 pl-11 text-slate-900"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                  filter === f.key
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {!loading && !error && (
            <p className="text-sm text-slate-500">
              {filtered.length} event{filtered.length !== 1 && "s"}
            </p>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <EventCardSkeleton key={n} />
            ))}
          </div>
        ) : error ? (
          <div className="card flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-4 text-5xl">⚠️</div>
            <h3 className="text-lg font-bold text-slate-900">
              Something went wrong
            </h3>
            <p className="mt-1 text-sm text-slate-500">{error}</p>
            <button onClick={fetchEvents} className="btn-primary mt-5">
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-4 text-5xl">🗓️</div>
            <h3 className="text-lg font-bold text-slate-900">No events found</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Try a different search or filter.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
                className="btn-outline"
              >
                Clear filters
              </button>

              {user?.role === "admin" && (
                <Link to="/admin" className="btn-primary">
                  + Create Event
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                past={new Date(event.date) < today}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default Events;