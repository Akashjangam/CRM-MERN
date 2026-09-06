import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import {
  AppShell,
} from "./components/layout/AppShell";

import {
  ProtectedRoute,
  PublicOnlyRoute,
} from "./components/layout/RouteGuards";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Cases from "./pages/Cases";
import Activities from "./pages/Activities";
import Users from "./pages/Users";


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>

        <Routes>

          {/* ==================================================
              PUBLIC ROUTES
              ================================================== */}

          <Route
            path="/"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />

          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />


          {/* ==================================================
              PROTECTED ROUTES
              ================================================== */}

          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >

            {/* Dashboard */}

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />


            {/* Customers */}

            <Route
              path="/customers"
              element={<Customers />}
            />


            {/* Cases */}

            <Route
              path="/cases"
              element={<Cases />}
            />


            {/* Activities */}

            <Route
              path="/activities"
              element={<Activities />}
            />


            {/* ==================================================
                ADMIN USERS MANAGEMENT
                ================================================== */}

            <Route
              path="/users"
              element={
                <AdminRoute>
                  <Users />
                </AdminRoute>
              }
            />

          </Route>


          {/* ==================================================
              FALLBACK
              ================================================== */}

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>

      </BrowserRouter>
    </AuthProvider>
  );
}


/* =========================================================
   ADMIN ROUTE
   ========================================================= */

function AdminRoute({ children }) {
  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  if (user?.role !== "admin") {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}