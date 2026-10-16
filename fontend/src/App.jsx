import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Navbar from "./components/navbar";
import Footer from "./components/footer";
import { ProtectedRoute, GuestRoute } from "./components/RouteGuard";

import Login from "./pages/login";
import Signup from "./pages/signup";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import MyRegistrations from "./pages/MyRegistration";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <Navbar />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Navigate to="/events" replace />} />

          {/* Public */}
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />

          {/* Sirf logged-out users ke liye */}
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Route>

          {/* Logged-in users */}
          <Route element={<ProtectedRoute />}>
            <Route path="/my-registrations" element={<MyRegistrations />} />
          </Route>

          {/* Sirf admin */}
          <Route element={<ProtectedRoute role="admin" />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;