import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import TeacherApp from "./pages/TeacherApp";
import RestaurantScanner from "./pages/RestaurantScanner";
import AdminDashboard from "./pages/AdminDashboard";
import DesignSystem from "./pages/DesignSystem";

function ProtectedRoute({ allowedRoles, children }) {
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("access_token");
  if (!token) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={["TEACHER"]}>
              <TeacherApp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/restaurant"
          element={
            <ProtectedRoute allowedRoles={["RESTAURANT_MANAGER", "ADMIN"]}>
              <RestaurantScanner />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/design-system" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}><DesignSystem /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
