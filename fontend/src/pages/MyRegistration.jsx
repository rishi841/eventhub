import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

function MyRegistrations() {
  const { user, loading: authLoading } = useAuth();

  const [registered, setRegistered] = useState([]);
  const [waitlisted, setWaitlisted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const res = await api.get("/events/my-registrations");
      setRegistered(res.data.registered);
      setWaitlisted(res.data.waitlisted);
    } catch (err) {
      setError("Registrations load nahi ho payi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handleCancel = async (eventId) => {
    try {
      await api.post(`/events/${eventId}/cancel`);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Cancel nahi ho paya");
    }
  };

  if (authLoading) return <p className="p-10 text-center">Loading...</p>;
  if (!user) return <Navigate to="/login" />;
  if (loading) return <p className="p-10 text-center">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Registrations</h1>

      {error && (
        <p className="bg-red-100 text-red-600 p-2 rounded mb-4 text-sm">
          {error}
        </p>
      )}

      <h2 className="text-lg font-semibold mb-3">✅ Registered</h2>
      {registered.length === 0 ? (
        <p className="text-gray-500 mb-8">Abhi kisi event mein registered nahi ho</p>
      ) : (
        <div className="space-y-3 mb-8">
          {registered.map((event) => (
            <div
              key={event._id}
              className="bg-white p-4 rounded-lg shadow flex items-center justify-between"
            >
              <div>
                <Link
                  to={`/events/${event._id}`}
                  className="font-semibold text-blue-600 hover:underline"
                >
                  {event.title}
                </Link>
                <p className="text-sm text-gray-600">
                  📅 {new Date(event.date).toLocaleDateString()} · 📍 {event.venue}
                </p>
              </div>
              <button
                onClick={() => handleCancel(event._id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Cancel
              </button>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-lg font-semibold mb-3">⏳ Waitlisted</h2>
      {waitlisted.length === 0 ? (
        <p className="text-gray-500">Kisi waitlist mein nahi ho</p>
      ) : (
        <div className="space-y-3">
          {waitlisted.map((event) => (
            <div
              key={event._id}
              className="bg-white p-4 rounded-lg shadow flex items-center justify-between"
            >
              <div>
                <Link
                  to={`/events/${event._id}`}
                  className="font-semibold text-blue-600 hover:underline"
                >
                  {event.title}
                </Link>
                <p className="text-sm text-gray-600">
                  📅 {new Date(event.date).toLocaleDateString()} · 📍 {event.venue}
                </p>
                <p className="text-sm text-amber-700">
                  Waitlist position: #{event.position}
                </p>
              </div>
              <button
                onClick={() => handleCancel(event._id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Leave
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyRegistrations;