import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { getGradient, isPast, formatDate } from "../utils/helper";

function DetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-44 bg-slate-200" />
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-3">
        <div className="card space-y-4 p-6 lg:col-span-2">
          <div className="h-7 w-2/3 rounded bg-slate-200" />
          <div className="h-4 w-full rounded bg-slate-200" />
          <div className="h-4 w-5/6 rounded bg-slate-200" />
        </div>
        <div className="card h-56 bg-slate-100" />
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-lg">
        {icon}
      </span>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    phone: "",
    college: "",
    year: "",
    reason: "",
  });

  const fetchEvent = async () => {
    try {
      const res = await api.get(`/events/${id}`);
      setEvent(res.data.event);
      setNotFound(false);
    } catch (err) {
      console.log("event error:", err.response?.status, err.response?.data);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setShowForm(false);
    fetchEvent();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const clean = name === "phone" ? value.replace(/\D/g, "") : value;
    setForm({ ...form, [name]: clean });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setBusy(true);

    try {
      const res = await api.post(`/events/${id}/register`, form);
      toast.success(res.data.message);
      setShowForm(false);
      await fetchEvent();
    } catch (err) {
      console.log("register error:", err.response?.status, err.response?.data);
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async (waitlisted) => {
    const text = waitlisted
      ? "Leave the waitlist?"
      : "Cancel your registration? Your seat will go to the next person on the waitlist.";
    if (!window.confirm(text)) return;

    setBusy(true);
    try {
      const res = await api.post(`/events/${id}/cancel`);
      toast.success(res.data.message);
      await fetchEvent();
    } catch (err) {
      console.log("cancel error:", err.response?.status, err.response?.data);
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <DetailSkeleton />;

  if (notFound || !event) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 text-5xl">🔍</div>
        <h1 className="text-xl font-bold text-slate-900">Event not found</h1>
        <p className="mt-1 text-sm text-slate-500">
          It may have been deleted or the link is wrong.
        </p>
        <Link to="/events" className="btn-primary mt-6">
          Back to events
        </Link>
      </div>
    );
  }

  const registered = event.registeredUsers.length;
  const seatsLeft = event.capacity - registered;
  const full = seatsLeft <= 0;
  const percent = Math.min(100, Math.round((registered / event.capacity) * 100));
  const past = isPast(event.date);

  const isRegistered = !!user && event.registeredUsers.includes(user.id);
  const waitlistIndex = user ? event.waitlist.indexOf(user.id) : -1;
  const isWaitlisted = waitlistIndex !== -1;

  const barColor = full
    ? "bg-rose-500"
    : percent >= 70
    ? "bg-amber-500"
    : "bg-emerald-500";

  return (
    <div>
      {/* Banner */}
      <div className={`bg-gradient-to-br ${getGradient(event.title)}`}>
        <div className="mx-auto flex h-44 max-w-5xl flex-col justify-between px-4 py-5 sm:h-52">
          <Link
            to="/events"
            className="inline-flex w-fit items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-sm font-medium text-white backdrop-blur hover:bg-white/30"
          >
            ← All events
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {past && (
              <span className="badge bg-slate-900/70 text-white">Ended</span>
            )}
            {!past && full && (
              <span className="badge bg-amber-100 text-amber-700">
                Full · Waitlist open
              </span>
            )}
            {!past && !full && (
              <span className="badge bg-emerald-100 text-emerald-700">
                {seatsLeft} seats left
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-3">
        {/* Left: details */}
        <div className="card p-6 sm:p-8 lg:col-span-2">
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {event.title}
          </h1>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <InfoRow icon="📅" label="Date" value={formatDate(event.date)} />
            <InfoRow icon="📍" label="Venue" value={event.venue} />
            <InfoRow
              icon="👥"
              label="Registered"
              value={`${registered} / ${event.capacity}`}
            />
            <InfoRow icon="⏳" label="Waitlist" value={`${event.waitlist.length} people`} />
          </div>

          <div className="mt-8">
            <h2 className="mb-2 text-lg font-bold text-slate-900">About this event</h2>
            <p className="whitespace-pre-line leading-relaxed text-slate-600">
              {event.description}
            </p>
          </div>
        </div>

        {/* Right: registration panel */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">Seats filled</span>
                <span className="text-slate-500">{percent}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            {/* State 1: event ended */}
            {past && (
              <p className="rounded-xl bg-slate-100 p-4 text-center text-sm text-slate-600">
                This event has ended. Registrations are closed.
              </p>
            )}

            {/* State 2: registered */}
            {!past && isRegistered && (
              <div>
                <div className="rounded-xl bg-emerald-50 p-4 text-center">
                  <div className="text-3xl">✅</div>
                  <p className="mt-1 font-bold text-emerald-700">
                    You are registered
                  </p>
                  <p className="text-sm text-emerald-600">See you at the event!</p>
                </div>
                <button
                  onClick={() => handleCancel(false)}
                  disabled={busy}
                  className="btn-outline mt-4 w-full text-rose-600"
                >
                  {busy ? "Please wait..." : "Cancel registration"}
                </button>
              </div>
            )}

            {/* State 3: waitlisted */}
            {!past && isWaitlisted && (
              <div>
                <div className="rounded-xl bg-amber-50 p-4 text-center">
                  <div className="text-3xl">⏳</div>
                  <p className="mt-1 font-bold text-amber-700">
                    You are #{waitlistIndex + 1} on the waitlist
                  </p>
                  <p className="text-sm text-amber-600">
                    You will be promoted automatically if a seat opens.
                  </p>
                </div>
                <button
                  onClick={() => handleCancel(true)}
                  disabled={busy}
                  className="btn-outline mt-4 w-full text-rose-600"
                >
                  {busy ? "Please wait..." : "Leave waitlist"}
                </button>
              </div>
            )}

            {/* State 4: not logged in */}
            {!past && !user && (
              <button
                onClick={() => navigate("/login")}
                className="btn-primary w-full"
              >
                Login to register
              </button>
            )}

            {/* State 5: can register */}
            {!past && user && !isRegistered && !isWaitlisted && !showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary w-full"
              >
                {full ? "Join waitlist" : "Register now"}
              </button>
            )}

            {!past && user && !isRegistered && !isWaitlisted && showForm && (
              <form onSubmit={handleRegister} className="space-y-3">
                <h3 className="font-bold text-slate-900">
                  {full ? "Join the waitlist" : "Your details"}
                </h3>

                <input
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="Phone (10 digits)"
                  value={form.phone}
                  onChange={handleChange}
                  maxLength={10}
                  minLength={10}
                  className="input"
                  required
                />

                <input
                  name="college"
                  placeholder="College name"
                  value={form.college}
                  onChange={handleChange}
                  className="input"
                  required
                />

                <select
                  name="year"
                  value={form.year}
                  onChange={handleChange}
                  className="input"
                  required
                >
                  <option value="">Select year</option>
                  <option value="1st">1st Year</option>
                  <option value="2nd">2nd Year</option>
                  <option value="3rd">3rd Year</option>
                  <option value="4th">4th Year</option>
                </select>

                <textarea
                  name="reason"
                  placeholder="Why do you want to join? (optional)"
                  value={form.reason}
                  onChange={handleChange}
                  rows={3}
                  className="input"
                />

                <div className="flex gap-2">
                  <button type="submit" disabled={busy} className="btn-primary flex-1">
                    {busy ? "Submitting..." : "Submit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn-outline"
                  >
                    Back
                  </button>
                </div>
              </form>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default EventDetail; 