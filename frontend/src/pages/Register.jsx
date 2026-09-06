import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, FolderKanban } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";


export default function Register() {
  const { register, isAuthenticated } = useAuth();

  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  /* ======================================================
     UPDATE FIELD
     ====================================================== */

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (error) {
      setError("");
    }
  };


  /* ======================================================
     SUBMIT
     ====================================================== */

  const submit = async (event) => {
    event.preventDefault();

    setError("");

    const name = form.name.trim();
    const email = form.email.trim();
    const password = form.password;


    /* ----------------------------------------------------
       Basic validation
       ---------------------------------------------------- */

    if (!name) {
      setError("Please enter your full name.");
      return;
    }

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }


    setLoading(true);


    try {
      await register({
        name,
        email,
        password,
      });


      /*
       * Registration completed successfully.
       *
       * Do NOT automatically redirect to dashboard here.
       * Send the user to Login and show confirmation.
       */

      navigate("/login", {
        replace: true,
        state: {
          registered: true,
        },
      });

    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Registration failed. Try a different email."
        )
      );
    } finally {
      setLoading(false);
    }
  };


  /* ======================================================
     AUTHENTICATED USER
     ====================================================== */

  if (isAuthenticated) {
    return null;
  }


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
            Build better customer relationships.
          </h1>

          <p>
            Keep customer details, support cases,
            assignments, and activities connected
            in one clean workspace.
          </p>

        </div>

      </section>


      {/* ==================================================
          REGISTER PANEL
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
              Get started
            </div>

            <h1 className="auth-title">
              Create account
            </h1>

            <p className="auth-subtitle">
              Create your CRM workspace account
              in a few seconds.
            </p>

          </div>


          {/* Error */}

          {error && (
            <div
              className="banner banner-error"
              style={{ marginBottom: 16 }}
              role="alert"
            >
              {error}
            </div>
          )}


          {/* Form */}

          <form
            className="auth-form"
            onSubmit={submit}
          >

            {/* Full Name */}

            <div className="field">

              <label
                className="field-label"
                htmlFor="register-name"
              >
                Full name
              </label>

              <input
                id="register-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Your full name"
                value={form.name}
                onChange={(event) =>
                  updateField(
                    "name",
                    event.target.value
                  )
                }
                required
                disabled={loading}
              />

            </div>


            {/* Email */}

            <div className="field">

              <label
                className="field-label"
                htmlFor="register-email"
              >
                Email address
              </label>

              <input
                id="register-email"
                name="email"
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
                htmlFor="register-password"
              >
                Password
              </label>

              <input
                id="register-password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                placeholder="At least 6 characters"
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

                  Creating account…
                </>
              ) : (
                "Create account"
              )}

            </button>

          </form>


          {/* Footer */}

          <div className="auth-footer">

            <CheckCircle2
              size={14}
              style={{
                verticalAlign: "-2px",
              }}
            />

            Secure authentication ·{" "}

            <Link to="/login">
              Sign in
            </Link>

          </div>

        </div>

      </section>

    </div>
  );
}