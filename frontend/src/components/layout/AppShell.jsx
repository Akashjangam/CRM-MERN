import "./AppShell.css";

import { useEffect, useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Activity,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";


/* =========================================================
   NAVIGATION LINKS
   ========================================================= */

const links = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/customers",
    label: "Customers",
    icon: Users,
  },
  {
    to: "/cases",
    label: "Cases",
    icon: FolderKanban,
  },
  {
    to: "/activities",
    label: "Activities",
    icon: Activity,
  },
];


/* =========================================================
   APP SHELL
   ========================================================= */

export function AppShell() {
  const { user, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);


  /* =======================================================
     CLOSE MOBILE MENU WHEN ROUTE CHANGES
     ======================================================= */

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);


  /* =======================================================
     LOGOUT
     ======================================================= */

  const doLogout = () => {
    setOpen(false);

    logout();

    navigate("/", {
      replace: true,
    });
  };


  /* =======================================================
     NAVIGATION
     ======================================================= */

  const renderNavigation = () => (
    <nav aria-label="Primary navigation">

      <div className="nav-section-title">
        Workspace
      </div>


      <div className="nav-list">

        {/* -----------------------------------------------
            NORMAL NAVIGATION
            ----------------------------------------------- */}

        {links.map(
          ({
            to,
            label,
            icon: Icon,
          }) => (

            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-link ${
                  isActive ? "active" : ""
                }`
              }
            >

              <Icon
                size={18}
                aria-hidden="true"
              />

              <span>
                {label}
              </span>

            </NavLink>

          )
        )}


        {/* -----------------------------------------------
            ADMIN ONLY - USERS
            ----------------------------------------------- */}

        {user?.role === "admin" && (

          <NavLink
            to="/users"
            className={({ isActive }) =>
              `nav-link ${
                isActive ? "active" : ""
              }`
            }
          >

            <ShieldCheck
              size={18}
              aria-hidden="true"
            />

            <span>
              Users
            </span>

          </NavLink>

        )}

      </div>

    </nav>
  );


  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="app-shell">

      {/* ==================================================
          SKIP TO CONTENT
          ================================================== */}

      <a
        className="skip-link"
        href="#main-content"
      >
        Skip to content
      </a>


      {/* ==================================================
          DESKTOP SIDEBAR
          ================================================== */}

      <aside className="sidebar desktop-only">

        {/* -----------------------------------------------
            BRAND
            ----------------------------------------------- */}

        <div className="sidebar-brand">

          <div className="brand-mark">
            <FolderKanban size={22} />
          </div>


          <div>

            <div className="brand-name">
              CRM
            </div>

            <div className="brand-caption">
              Customer management
            </div>

          </div>

        </div>


        {/* -----------------------------------------------
            NAVIGATION
            ----------------------------------------------- */}

        <div className="sidebar-nav">
          {renderNavigation()}
        </div>


        {/* -----------------------------------------------
            USER / LOGOUT
            ----------------------------------------------- */}

        <div className="sidebar-footer">

          <UserSummary user={user} />


          <button
            type="button"
            className="btn btn-ghost logout-btn"
            onClick={doLogout}
          >

            <LogOut
              size={17}
              aria-hidden="true"
            />

            Log out

          </button>

        </div>

      </aside>


      {/* ==================================================
          MAIN CONTENT AREA
          ================================================== */}

      <div className="main">

        {/* =================================================
            MOBILE HEADER
            ================================================= */}

        <header className="mobile-header mobile-only">

          <div className="mobile-brand">

            <div className="brand-mark">
              <FolderKanban size={18} />
            </div>

            <strong>
              CRM
            </strong>

          </div>


          <button
            type="button"
            className="icon-btn"
            aria-label={
              open
                ? "Close navigation"
                : "Open navigation"
            }
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() =>
              setOpen(
                (value) => !value
              )
            }
          >

            {open ? (
              <X size={20} />
            ) : (
              <Menu size={20} />
            )}

          </button>

        </header>


        {/* =================================================
            MOBILE NAVIGATION
            ================================================= */}

        {open && (

          <div
            id="mobile-navigation"
            className="mobile-nav mobile-only"
          >

            {renderNavigation()}


            {/* Mobile User */}

            <div className="mobile-user">

              <UserSummary
                user={user}
              />

            </div>


            {/* Mobile Logout */}

            <button
              type="button"
              className="btn btn-ghost logout-btn"
              onClick={doLogout}
            >

              <LogOut
                size={17}
                aria-hidden="true"
              />

              Log out

            </button>

          </div>

        )}


        {/* =================================================
            PAGE CONTENT
            ================================================= */}

        <main
          id="main-content"
          tabIndex="-1"
        >
          <Outlet />
        </main>

      </div>

    </div>
  );
}


/* =========================================================
   USER SUMMARY
   ========================================================= */

function UserSummary({ user }) {
  const initial =
    (user?.name || "U")
      .charAt(0)
      .toUpperCase();


  return (
    <div className="user-summary">

      {/* Avatar */}

      <div className="avatar">
        {initial}
      </div>


      {/* User Details */}

      <div className="item-main">

        <div className="item-title">
          {user?.name || "Signed in"}
        </div>


        <div className="item-meta">
          {user?.email || ""}
        </div>


        {/* Role */}

        {user?.role && (

          <span className="role-pill">
            {user.role}
          </span>

        )}

      </div>

    </div>
  );
}