import { useState } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

import { useAuth } from "../context/AuthContext";

import { getErrorMessage } from "../services/api";

export default function Login() {
  const navigate = useNavigate();

  const location = useLocation();

  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  /* =======================================================
     INPUT CHANGE
  ======================================================= */

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  /* =======================================================
     SUBMIT
  ======================================================= */

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!form.password) {
      setError("Password is required.");
      return;
    }

    try {
      setLoading(true);

      const data = await login({
        email: form.email.trim(),
        password: form.password,
      });

      console.log("LOGIN SUCCESS:", data);

      /* --------------------------------
         Verify JWT
      -------------------------------- */

      const savedToken = localStorage.getItem("token");

      console.log("SAVED JWT:", savedToken);

      if (!savedToken) {
        throw new Error("Login succeeded, but JWT token was not saved.");
      }

      /* --------------------------------
         Redirect
      -------------------------------- */

      const from = location.state?.from?.pathname || "/dashboard";

      navigate(from, {
        replace: true,
      });
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      setError(getErrorMessage(error, "Invalid email or password."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">
            <LockKeyhole size={24} />
          </div>

          <h1>Welcome back</h1>

          <p>Sign in to your CRM account</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* EMAIL */}

          <div className="form-group">
            <label htmlFor="email">Email</label>

            <div className="input-with-icon">
              <Mail size={18} />

              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                autoComplete="email"
              />
            </div>
          </div>

          {/* PASSWORD */}

          <div className="form-group">
            <label htmlFor="password">Password</label>

            <div className="input-with-icon">
              <LockKeyhole size={18} />

              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* SUBMIT */}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="auth-footer">
          <span>Don't have an account?</span>

          <Link to="/register">Create account</Link>
        </div>
      </div>
    </div>
  );
}
