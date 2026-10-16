import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

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
    } catch (err) {
      setError("Event load nahi ho paya");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegisterClick = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setShowForm(true);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await api.post(`/events/${id}/register`, form);
      setMessage(res.data.message);
      setShowForm(false);
      await fetchEvent();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await api.post(`/events/${id}/cancel`);
      setMessage(res.data.message);
      await fetchEvent();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <p className="p-10 text-center">Loading...</p>;
  if (!event) return <p className="p-10 text-center text-red-600">{error}</p>;

  const seatsLeft = event.capacity - event.registeredUsers.length;
  const isRegistered = user && event.registeredUsers.includes(user.id);
  const waitlistIndex = user ? event.waitlist.indexOf(user.id) : -1;
  const isWaitlisted = waitlistIndex !== -1;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-3">{event.title}</h1>

        <p className="text-gray-600 mb-1">
          📅 {new Date(event.date).toLocaleDateString()}
        </p>
        <p className="text-gray-600 mb-4">📍 {event.venue}</p>
        <p className="text-gray-800 mb-6">{event.description}</p>

        <div className="flex gap-3 mb-6 text-sm">
          <span className="bg-gray-100 px-3 py-1 rounded">
            Capacity: {event.capacity}
          </span>
          <span className="bg-gray-100 px-3 py-1 rounded">
            Registered: {event.registeredUsers.length}
          </span>
          <span className="bg-gray-100 px-3 py-1 rounded">
            Waitlist: {event.waitlist.length}
          </span>
        </div>

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

        {isRegistered && (
          <div>
            <p className="text-green-700 font-medium mb-3">
              ✅ Tum is event mein registered ho
            </p>
            <button
              onClick={handleCancel}
              disabled={actionLoading}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
            >
              Cancel Registration
            </button>
          </div>
        )}

        {isWaitlisted && (
          <div>
            <p className="text-amber-700 font-medium mb-3">
              ⏳ Tum waitlist mein #{waitlistIndex + 1} par ho
            </p>
            <button
              onClick={handleCancel}
              disabled={actionLoading}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
            >
              Leave Waitlist
            </button>
          </div>
        )}

        {!isRegistered && !isWaitlisted && !showForm && (
          <button
            onClick={handleRegisterClick}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {seatsLeft > 0 ? "Register" : "Join Waitlist"}
          </button>
        )}

        {!isRegistered && !isWaitlisted && showForm && (
          <form onSubmit={handleRegisterSubmit} className="border-t pt-6">
            <h2 className="text-lg font-semibold mb-4">
              {seatsLeft > 0 ? "Registration Form" : "Waitlist Form"}
            </h2>

            <input
              type="tel"
              name="phone"
              placeholder="Phone number (10 digit)"
              value={form.phone}
              onChange={handleChange}
              maxLength={10}
              className="w-full border p-2 rounded mb-3"
              required
            />

            <input
              type="text"
              name="college"
              placeholder="College name"
              value={form.college}
              onChange={handleChange}
              className="w-full border p-2 rounded mb-3"
              required
            />

            <select
              name="year"
              value={form.year}
              onChange={handleChange}
              className="w-full border p-2 rounded mb-3"
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
              placeholder="Kyun join karna chahte ho? (optional)"
              value={form.reason}
              onChange={handleChange}
              rows={3}
              className="w-full border p-2 rounded mb-4"
            />

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={actionLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? "Submitting..." : "Submit"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border px-4 py-2 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default EventDetail;