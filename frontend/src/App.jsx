import { Navigate, Route, Routes } from "react-router-dom";

import AppShell from "./components/layout/AppShell";

import {
  ProtectedRoute,
  PublicOnlyRoute,
} from "./components/layout/RouteGuards";

import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Cases from "./pages/Cases";
import Activities from "./pages/Activities";
import Users from "./pages/Users";
import Login from "./pages/Login";
import Register from "./pages/Register";

import { useAuth } from "./context/AuthContext";

function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Users />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/users" element={<AdminRoute />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
