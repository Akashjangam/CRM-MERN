import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  CheckCircle2,
  FolderKanban,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";


export default function Login() {
  const { login } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const registered = Boolean(
    location.state?.registered
  );


  /* ======================================================
     FORM CHANGE
     ====================================================== */

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    // Remove login error while user is typing
    if (error) {
      setError("");
    }
  };


  /* ======================================================
     LOGIN
     ====================================================== */

  const submit = async (event) => {
    event.preventDefault();

    setError("");

    const email = form.email.trim();
    const password = form.password;

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      await login({
        email,
        password,
      });

      /*
       * Login successful
       * Redirect to dashboard
       */
      navigate("/dashboard", {
        replace: true,
      });

    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Login failed. Check your email and password."
        )
      );
    } finally {
      setLoading(false);
    }
  };


  /* ======================================================
     RENDER
     ====================================================== */

  return (
    <div className="auth-page">

      {/* ==================================================
          BRAND SECTION
          ================================================== */}

      <section className="auth-brand">

        <div className="auth-brand-inner">

          <div className="brand-mark">
            <FolderKanban size={25} />
          </div>


          <h1>
            Customer relationships,
            organized.
          </h1>


          <p>
            A focused CRM workspace for managing
            customers, support cases, assignments,
            and interaction history.
          </p>


          <div className="auth-feature-list">

            <div className="auth-feature">
              <span>
                <Users size={15} />
              </span>

              Customer records in one workspace
            </div>


            <div className="auth-feature">
              <span>
                <ShieldCheck size={15} />
              </span>

              Secure authenticated access
            </div>


            <div className="auth-feature">
              <span>
                <Zap size={15} />
              </span>

              Track cases and follow-ups faster
            </div>

          </div>

        </div>

      </section>


      {/* ==================================================
          LOGIN PANEL
          ================================================== */}

      <section className="auth-panel">

        <div className="auth-card">

          {/* Logo */}

          <div className="auth-logo-row">

            <div className="brand-mark">
              <FolderKanban size={19} />
            </div>

            <div className="auth-logo">
              CRM Workspace
            </div>

          </div>


          {/* Header */}

          <div className="auth-header">

            <div className="auth-kicker">
              Welcome back
            </div>

            <h1 className="auth-title">
              Sign in
            </h1>

            <p className="auth-subtitle">
              Use your work account to access
              your CRM workspace.
            </p>

          </div>


          {/* Registration Success */}

          {registered && !error && (
            <div
              className="banner banner-success"
              style={{ marginBottom: 16 }}
              role="status"
            >
              <CheckCircle2 size={15} />

              <span>
                Account created successfully.
                Sign in to continue.
              </span>
            </div>
          )}


          {/* Login Error */}

          {error && (
            <div
              className="banner banner-error"
              style={{ marginBottom: 16 }}
              role="alert"
            >
              {error}
            </div>
          )}


          {/* Login Form */}

          <form
            className="auth-form"
            onSubmit={submit}
          >

            {/* Email */}

            <div className="field">

              <label
                className="field-label"
                htmlFor="login-email"
              >
                Email address
              </label>

              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(event) =>
                  updateField(
                    "email",
                    event.target.value
                  )
                }
                required
                disabled={loading}
              />

            </div>


            {/* Password */}

            <div className="field">

              <label
                className="field-label"
                htmlFor="login-password"
              >
                Password
              </label>

              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(event) =>
                  updateField(
                    "password",
                    event.target.value
                  )
                }
                required
                disabled={loading}
              />

            </div>


            {/* Submit */}

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

                  Signing in…
                </>
              ) : (
                "Sign in"
              )}

            </button>

          </form>


          {/* Footer */}

          <div className="auth-footer">

            Don't have an account?{" "}

            <Link to="/register">
              Create an account
            </Link>

          </div>

        </div>

      </section>

    </div>
  );
}