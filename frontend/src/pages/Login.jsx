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

    /* ----------------------------------------------------
       VALIDATION
       ---------------------------------------------------- */

    if (!email) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    if (!password) {
      setError(
        "Please enter your password."
      );
      return;
    }

    setLoading(true);

    try {
      /* --------------------------------------------------
         CALL LOGIN API
         -------------------------------------------------- */

      const data = await login({
        email,
        password,
      });


      /* --------------------------------------------------
         DEBUG / VERIFICATION
         -------------------------------------------------- */

      console.log(
        "LOGIN SUCCESS:",
        data
      );

      console.log(
        "TOKEN STORED:",
        localStorage.getItem("token")
          ? "YES"
          : "NO"
      );

      console.log(
        "USER STORED:",
        localStorage.getItem("user")
      );


      /* --------------------------------------------------
         VERIFY TOKEN WAS STORED
         -------------------------------------------------- */

      const storedToken =
        localStorage.getItem("token");

      if (!storedToken) {
        setError(
          "Login succeeded, but authentication token was not stored. Please try again."
        );

        return;
      }


      /* --------------------------------------------------
         REDIRECT
         -------------------------------------------------- */

      const redirectPath =
        location.state?.from?.pathname ||
        "/dashboard";

      navigate(
        redirectPath,
        {
          replace: true,
        }
      );

    } catch (err) {

      console.error(
        "LOGIN ERROR:",
        err
      );

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
            A focused CRM workspace for
            managing customers, support cases,
            assignments, and interaction history.
          </p>


          <div className="auth-feature-list">

            {/* Customer records */}

            <div className="auth-feature">

              <span>
                <Users size={15} />
              </span>

              Customer records in one workspace

            </div>


            {/* Secure access */}

            <div className="auth-feature">

              <span>
                <ShieldCheck size={15} />
              </span>

              Secure authenticated access

            </div>


            {/* Case tracking */}

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

          {/* =================================================
              LOGO
              ================================================= */}

          <div className="auth-logo-row">

            <div className="brand-mark">
              <FolderKanban size={19} />
            </div>

            <div className="auth-logo">
              CRM Workspace
            </div>

          </div>


          {/* =================================================
              HEADER
              ================================================= */}

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


          {/* =================================================
              REGISTRATION SUCCESS
              ================================================= */}

          {registered && !error && (

            <div
              className="banner banner-success"
              style={{
                marginBottom: 16,
              }}
              role="status"
            >

              <CheckCircle2
                size={15}
                aria-hidden="true"
              />

              <span>
                Account created successfully.
                Sign in to continue.
              </span>

            </div>

          )}


          {/* =================================================
              LOGIN ERROR
              ================================================= */}

          {error && (

            <div
              className="banner banner-error"
              style={{
                marginBottom: 16,
              }}
              role="alert"
            >
              {error}
            </div>

          )}


          {/* =================================================
              LOGIN FORM
              ================================================= */}

          <form
            className="auth-form"
            onSubmit={submit}
            noValidate
          >

            {/* =================================================
                EMAIL
                ================================================= */}

            <div className="field">

              <label
                className="field-label"
                htmlFor="login-email"
              >
                Email address
              </label>

              <input
                id="login-email"
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


            {/* =================================================
                PASSWORD
                ================================================= */}

            <div className="field">

              <label
                className="field-label"
                htmlFor="login-password"
              >
                Password
              </label>

              <input
                id="login-password"
                name="password"
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


            {/* =================================================
                SUBMIT BUTTON
                ================================================= */}

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


          {/* =================================================
              FOOTER
              ================================================= */}

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