import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import { formatDate, isPast, getGradient } from "../utils/helper";

const emptyForm = {
  title: "",
  description: "",
  date: "",
  venue: "",
  capacity: "",
};

function StatCard({ icon, label, value }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-2xl">
        {icon}
      </span>
      <div>
        <p className="text-2xl font-extrabold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function AttendeeTable({ list }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2.5">#</th>
            <th className="px-3 py-2.5">Name</th>
            <th className="px-3 py-2.5">Phone</th>
            <th className="px-3 py-2.5">College</th>
            <th className="px-3 py-2.5">Year</th>
            <th className="px-3 py-2.5">Reason</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {list.map((a, i) => (
            <tr key={a.email} className="hover:bg-slate-50">
              <td className="px-3 py-2.5 text-slate-400">{i + 1}</td>
              <td className="px-3 py-2.5 font-medium text-slate-800">{a.name}</td>
              <td className="px-3 py-2.5">{a.phone}</td>
              <td className="px-3 py-2.5">{a.college}</td>
              <td className="px-3 py-2.5">{a.year}</td>
              <td className="px-3 py-2.5 text-slate-500">{a.reason || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [openEventId, setOpenEventId] = useState(null);
  const [attendees, setAttendees] = useState({ registered: [], waitlisted: [] });

  const todayStr = new Date().toISOString().slice(0, 10);

  const fetchEvents = async () => {
    try {
      const res = await api.get("/events/my-events");
      setEvents(res.data.events);
    } catch (err) {
      console.log("my-events error:", err.response?.status, err.response?.data);
      toast.error(err.response?.data?.message || "Couldn't load your events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (event) => {
    setEditingId(event._id);
    setForm({
      title: event.title,
      description: event.description,
      date: new Date(event.date).toISOString().slice(0, 10),
      venue: event.venue,
      capacity: event.capacity,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingId) {
        await api.put(`/events/${editingId}`, form);
        toast.success("Event updated");
      } else {
        await api.post("/events", form);
        toast.success("Event created");
      }
      closeModal();
      await fetchEvents();
    } catch (err) {
      console.log("save error:", err.response?.status, err.response?.data);
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Delete this event? All its registrations will be removed too."
      )
    ) {
      return;
    }

    try {
      await api.delete(`/events/${id}`);
      toast.success("Event deleted");
      if (openEventId === id) setOpenEventId(null);
      await fetchEvents();
    } catch (err) {
      console.log("delete error:", err.response?.status, err.response?.data);
      toast.error(err.response?.data?.message || "Couldn't delete event");
    }
  };

  const toggleAttendees = async (id) => {
    if (openEventId === id) {
      setOpenEventId(null);
      return;
    }

    try {
      const res = await api.get(`/events/${id}/attendees`);
      setAttendees(res.data);
      setOpenEventId(id);
    } catch (err) {
      console.log("attendees error:", err.response?.status, err.response?.data);
      toast.error(err.response?.data?.message || "Couldn't load attendees");
    }
  };

  const exportCsv = (title) => {
    const rows = [
      ["Status", "Position", "Name", "Email", "Phone", "College", "Year", "Reason"],
      ...attendees.registered.map((a, i) => [
        "Registered", i + 1, a.name, a.email, a.phone, a.college, a.year, a.reason || "",
      ]),
      ...attendees.waitlisted.map((a, i) => [
        "Waitlisted", i + 1, a.name, a.email, a.phone, a.college, a.year, a.reason || "",
      ]),
    ];

    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title}-attendees.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalRegistered = events.reduce((s, e) => s + e.registeredUsers.length, 0);
  const totalWaitlisted = events.reduce((s, e) => s + e.waitlist.length, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create events and manage who is attending.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          + New Event
        </button>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon="🗓️" label="My events" value={events.length} />
        <StatCard icon="✅" label="Total registered" value={totalRegistered} />
        <StatCard icon="⏳" label="On waitlists" value={totalWaitlisted} />
      </div>

      {/* Events */}
      <h2 className="mb-3 mt-10 text-lg font-bold text-slate-900">My events</h2>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="card h-28 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-14 text-center">
          <div className="mb-4 text-5xl">🎉</div>
          <h3 className="text-lg font-bold text-slate-900">No events yet</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Create your first event and students can start registering.
          </p>
          <button onClick={openCreate} className="btn-primary mt-5">
            + Create your first event
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const registered = event.registeredUsers.length;
            const percent = Math.min(
              100,
              Math.round((registered / event.capacity) * 100)
            );
            const d = new Date(event.date);
            const past = isPast(event.date);

            return (
              <div key={event._id} className="card p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br text-white ${getGradient(
                        event.title
                      )}`}
                    >
                      <span className="text-xl font-bold leading-none">
                        {d.getDate()}
                      </span>
                      <span className="text-[11px] font-semibold uppercase">
                        {d.toLocaleString("en-IN", { month: "short" })}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/events/${event._id}`}
                          className="truncate font-bold text-slate-900 hover:text-brand-600"
                        >
                          {event.title}
                        </Link>
                        {past && (
                          <span className="badge bg-slate-100 text-slate-600">Ended</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">
                        {formatDate(event.date)} · 📍 {event.venue}
                      </p>

                      <div className="mt-2 flex items-center gap-3">
                        <div className="h-2 w-36 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-brand-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">
                          {registered}/{event.capacity} · {event.waitlist.length} waiting
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => toggleAttendees(event._id)}
                      className="btn-outline"
                    >
                      {openEventId === event._id ? "Hide attendees" : "Attendees"}
                    </button>
                    <button onClick={() => openEdit(event)} className="btn-outline">
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(event._id)}
                      className="btn-outline text-rose-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {openEventId === event._id && (
                  <div className="mt-5 border-t border-slate-100 pt-5">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-bold text-slate-900">
                        ✅ Registered ({attendees.registered.length})
                      </h3>
                      {(attendees.registered.length > 0 ||
                        attendees.waitlisted.length > 0) && (
                        <button
                          onClick={() => exportCsv(event.title)}
                          className="btn-outline px-3 py-1.5"
                        >
                          ⬇ Export CSV
                        </button>
                      )}
                    </div>

                    {attendees.registered.length === 0 ? (
                      <p className="mb-5 text-sm text-slate-500">
                        No one has registered yet.
                      </p>
                    ) : (
                      <div className="mb-6">
                        <AttendeeTable list={attendees.registered} />
                      </div>
                    )}

                    <h3 className="mb-3 font-bold text-slate-900">
                      ⏳ Waitlist ({attendees.waitlisted.length})
                    </h3>
                    {attendees.waitlisted.length === 0 ? (
                      <p className="text-sm text-slate-500">Waitlist is empty.</p>
                    ) : (
                      <AttendeeTable list={attendees.waitlisted} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={closeModal}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="card max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-slate-900">
                {editingId ? "Edit event" : "Create new event"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1 text-2xl leading-none text-slate-400 hover:bg-slate-100"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Title
              </label>
              <input
                name="title"
                placeholder="e.g. React Workshop"
                value={form.title}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                name="description"
                placeholder="What will attendees learn or do?"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="input"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  min={editingId ? undefined : todayStr}
                  value={form.date}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Capacity
                </label>
                <input
                  type="number"
                  name="capacity"
                  min="1"
                  placeholder="e.g. 50"
                  value={form.capacity}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Venue
              </label>
              <input
                name="venue"
                placeholder="e.g. Seminar Hall"
                value={form.venue}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? "Saving..." : editingId ? "Save changes" : "Create event"}
              </button>
              <button type="button" onClick={closeModal} className="btn-outline">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;