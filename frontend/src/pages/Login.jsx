import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

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

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    const email = form.email.trim();
    const password = form.password;

    if (!email) {
      setError("Email is required.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    try {
      setLoading(true);

      const data = await login({
        email,
        password,
      });

      const savedToken = localStorage.getItem("token");

      if (!savedToken) {
        throw new Error(
          "Login succeeded, but the authentication token was not saved."
        );
      }

      console.log("Login successful.");
      console.log("Authenticated user:", data?.user);

      const from =
        location.state?.from?.pathname ||
        "/dashboard";

      navigate(from, {
        replace: true,
      });
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      setError(
        getErrorMessage(
          error,
          "Invalid email or password."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">

      {/* =================================================
          BRAND PANEL
      ================================================= */}

      <section className="auth-brand">
        <div className="auth-brand-inner">

          <div className="brand-mark">
            <ShieldCheck size={22} />
          </div>

          <h1>
            Manage your CRM
            <br />
            with confidence.
          </h1>

          <p>
            Manage customers, cases, activities,
            and your team from one simple CRM workspace.
          </p>

          <div className="auth-feature-list">

            <div className="auth-feature">
              <span>
                <CheckCircle2 size={16} />
              </span>
              Customer management
            </div>

            <div className="auth-feature">
              <span>
                <CheckCircle2 size={16} />
              </span>
              Case tracking and assignment
            </div>

            <div className="auth-feature">
              <span>
                <CheckCircle2 size={16} />
              </span>
              Role-based access
            </div>

          </div>

        </div>
      </section>


      {/* =================================================
          LOGIN PANEL
      ================================================= */}

      <section className="auth-panel">

        <div className="auth-card">

          <div className="auth-logo-row">

            <div className="brand-mark">
              <ShieldCheck size={20} />
            </div>

            <span className="auth-logo">
              CRM
            </span>

          </div>


          <div className="auth-header">

            <div className="auth-kicker">
              Account access
            </div>

            <h2 className="auth-title">
              Welcome back
            </h2>

            <p className="auth-subtitle">
              Sign in to your CRM account
            </p>

          </div>


          {error && (
            <div
              className="alert alert-error"
              role="alert"
            >
              {error}
            </div>
          )}


          <form
            className="auth-form"
            onSubmit={handleSubmit}
            noValidate
          >

            {/* EMAIL */}

            <div className="field">

              <label
                className="field-label"
                htmlFor="email"
              >
                Email address
              </label>

              <div className="input-with-icon">

                <Mail
                  size={18}
                  aria-hidden="true"
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  disabled={loading}
                  required
                />

              </div>

            </div>


            {/* PASSWORD */}

            <div className="field">

              <label
                className="field-label"
                htmlFor="password"
              >
                Password
              </label>

              <div className="input-with-icon">

                <LockKeyhole
                  size={18}
                  aria-hidden="true"
                />

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value
                    )
                  }
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  title={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

            </div>


            {/* SUBMIT */}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner"
                    aria-hidden="true"
                  />
                  Signing in...
                </>
              ) : (
                <>
                  <LockKeyhole
                    size={17}
                    aria-hidden="true"
                  />
                  Sign in
                </>
              )}
            </button>

          </form>


          {/* FOOTER */}

          <div className="auth-footer">

            <span>
              Don't have an account?
            </span>{" "}

            <Link to="/register">
              Create account
            </Link>

          </div>

        </div>

      </section>

    </div>
  );
}