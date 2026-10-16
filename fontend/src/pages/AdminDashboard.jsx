import { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

function AttendeeTable({ list }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-gray-500 border-b">
          <tr>
            <th className="py-2 pr-3">#</th>
            <th className="pr-3">Name</th>
            <th className="pr-3">Phone</th>
            <th className="pr-3">College</th>
            <th className="pr-3">Year</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          {list.map((a, i) => (
            <tr key={a.email} className="border-b">
              <td className="py-2 pr-3">{i + 1}</td>
              <td className="pr-3">{a.name}</td>
              <td className="pr-3">{a.phone}</td>
              <td className="pr-3">{a.college}</td>
              <td className="pr-3">{a.year}</td>
              <td>{a.reason || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const emptyForm = {
  title: "",
  description: "",
  date: "",
  venue: "",
  capacity: "",
};

function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [openEventId, setOpenEventId] = useState(null);
  const [attendees, setAttendees] = useState({ registered: [], waitlisted: [] });

  const fetchEvents = async () => {
    try {
      const res = await api.get("/events/my-events");
      setEvents(res.data.events);
    } catch (err) {
      setError("Events load nahi ho paye");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "admin") fetchEvents();
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      if (editingId) {
        await api.put(`/events/${editingId}`, form);
        setMessage("Event update ho gaya");
      } else {
        await api.post("/events", form);
        setMessage("Event ban gaya");
      }

      resetForm();
      await fetchEvents();
    } catch (err) {
      setError(err.response?.data?.message || "Kuch galat hua");
    }
  };

  const handleEdit = (event) => {
    setError("");
    setMessage("");
    setEditingId(event._id);
    setForm({
      title: event.title,
      description: event.description,
      date: new Date(event.date).toISOString().slice(0, 10),
      venue: event.venue,
      capacity: event.capacity,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Pakka delete karna hai? Iski saari registrations bhi hat jayengi."
      )
    ) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await api.delete(`/events/${id}`);
      setMessage("Event delete ho gaya");
      if (openEventId === id) setOpenEventId(null);
      if (editingId === id) resetForm();
      await fetchEvents();
    } catch (err) {
      setError(err.response?.data?.message || "Delete nahi ho paya");
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
      setError(err.response?.data?.message || "Attendees load nahi ho paye");
    }
  };

  if (authLoading) return <p className="p-10 text-center">Loading...</p>;
  if (!user || user.role !== "admin") return <Navigate to="/login" />;
  if (loading) return <p className="p-10 text-center">Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {message && (
        <p className="bg-green-100 text-green-700 p-2 rounded mb-4 text-sm">
          {message}
        </p>
      )}
      {error && (
        <p className="bg-red-100 text-red-600 p-2 rounded mb-4 text-sm">
          {error}
        </p>
      )}

      {/* Create / Edit form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-5 rounded-lg shadow mb-8"
      >
        <h2 className="text-lg font-semibold mb-4">
          {editingId ? "Event Edit Karo" : "Naya Event Banao"}
        </h2>

        <input
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          className="w-full border p-2 rounded mb-3"
          required
        />

        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          className="w-full border p-2 rounded mb-3"
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
          <input
            name="venue"
            placeholder="Venue"
            value={form.venue}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
          <input
            type="number"
            name="capacity"
            placeholder="Capacity"
            min="1"
            value={form.capacity}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {editingId ? "Update Event" : "Create Event"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="border px-4 py-2 rounded hover:bg-gray-50"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {/* My events */}
      <h2 className="text-lg font-semibold mb-3">Mere Events</h2>

      {events.length === 0 ? (
        <p className="text-gray-500">Abhi tumne koi event nahi banaya</p>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event._id} className="bg-white p-5 rounded-lg shadow">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    to={`/events/${event._id}`}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    {event.title}
                  </Link>
                  <p className="text-sm text-gray-600">
                    📅 {new Date(event.date).toLocaleDateString()} · 📍{" "}
                    {event.venue}
                  </p>
                  <p className="text-sm text-gray-600">
                    Registered {event.registeredUsers.length}/{event.capacity} ·
                    Waitlist {event.waitlist.length}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleAttendees(event._id)}
                    className="border px-3 py-1 rounded hover:bg-gray-50"
                  >
                    {openEventId === event._id ? "Hide Attendees" : "Attendees"}
                  </button>
                  <button
                    onClick={() => handleEdit(event)}
                    className="border px-3 py-1 rounded hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(event._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {openEventId === event._id && (
                <div className="mt-5 border-t pt-4">
                  <h3 className="font-semibold mb-2">
                    ✅ Registered ({attendees.registered.length})
                  </h3>
                  {attendees.registered.length === 0 ? (
                    <p className="text-sm text-gray-500 mb-4">Koi nahi</p>
                  ) : (
                    <div className="mb-4">
                      <AttendeeTable list={attendees.registered} />
                    </div>
                  )}

                  <h3 className="font-semibold mb-2">
                    ⏳ Waitlist ({attendees.waitlisted.length})
                  </h3>
                  {attendees.waitlisted.length === 0 ? (
                    <p className="text-sm text-gray-500">Koi nahi</p>
                  ) : (
                    <AttendeeTable list={attendees.waitlisted} />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;