import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import { formatDate, isPast, getGradient } from "../utils/helper";

function RegCard({ event, status, onCancel, busy }) {
  const d = new Date(event.date);
  const past = isPast(event.date);

  return (
    <div className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br text-white ${getGradient(
            event.title
          )}`}
        >
          <span className="text-xl font-bold leading-none">{d.getDate()}</span>
          <span className="text-[11px] font-semibold uppercase">
            {d.toLocaleString("en-IN", { month: "short" })}
          </span>
        </div>

        <div className="min-w-0">
          <Link
            to={`/events/${event._id}`}
            className="block truncate font-bold text-slate-900 hover:text-brand-600"
          >
            {event.title}
          </Link>
          <p className="text-sm text-slate-500">
            {formatDate(event.date)} · 📍 {event.venue}
          </p>

          <div className="mt-1.5 flex flex-wrap gap-2">
            {status === "registered" ? (
              <span className="badge bg-emerald-100 text-emerald-700">
                ✅ Registered
              </span>
            ) : (
              <span className="badge bg-amber-100 text-amber-700">
                ⏳ Waitlist #{event.position}
              </span>
            )}
            {past && <span className="badge bg-slate-100 text-slate-600">Ended</span>}
          </div>
        </div>
      </div>

      {!past && (
        <button
          onClick={() => onCancel(event._id, status)}
          disabled={busy}
          className="btn-outline w-full text-rose-600 sm:w-auto"
        >
          {status === "registered" ? "Cancel" : "Leave"}
        </button>
      )}
    </div>
  );
}

function EmptyState({ icon, title, text }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 text-5xl">{icon}</div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>
      <Link to="/events" className="btn-primary mt-5">
        Browse events
      </Link>
    </div>
  );
}

function MyRegistrations() {
  const [registered, setRegistered] = useState([]);
  const [waitlisted, setWaitlisted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("registered");

  const fetchData = async () => {
    try {
      const res = await api.get("/events/my-registrations");
      setRegistered(res.data.registered);
      setWaitlisted(res.data.waitlisted);
    } catch (err) {
      console.log("my-registrations error:", err.response?.status, err.response?.data);
      toast.error(err.response?.data?.message || "Couldn't load registrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancel = async (eventId, status) => {
    const text =
      status === "registered"
        ? "Cancel your registration?"
        : "Leave the waitlist?";
    if (!window.confirm(text)) return;

    setBusy(true);
    try {
      const res = await api.post(`/events/${eventId}/cancel`);
      toast.success(res.data.message);
      await fetchData();
    } catch (err) {
      console.log("cancel error:", err.response?.status, err.response?.data);
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const tabs = [
    { key: "registered", label: "Registered", count: registered.length },
    { key: "waitlisted", label: "Waitlisted", count: waitlisted.length },
  ];

  const list = tab === "registered" ? registered : waitlisted;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-extrabold text-slate-900">My Registrations</h1>
      <p className="mt-1 text-sm text-slate-500">
        All the events you have joined or are waiting for.
      </p>

      <div className="mt-6 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
            }`}
          >
            {t.label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                tab === t.key ? "bg-white/25" : "bg-slate-100"
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {loading ? (
          [1, 2, 3].map((n) => (
            <div key={n} className="card h-24 animate-pulse bg-slate-100" />
          ))
        ) : list.length === 0 ? (
          tab === "registered" ? (
            <EmptyState
              icon="🎟️"
              title="No registrations yet"
              text="Find an event you like and register in a few clicks."
            />
          ) : (
            <EmptyState
              icon="⏳"
              title="You are not on any waitlist"
              text="If an event is full, you can join its waitlist and get promoted automatically."
            />
          )
        ) : (
          list.map((event) => (
            <RegCard
              key={event._id}
              event={event}
              status={tab}
              onCancel={handleCancel}
              busy={busy}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default MyRegistrations;