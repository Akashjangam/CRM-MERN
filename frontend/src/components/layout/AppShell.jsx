import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./AppShell.css";

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
    icon: BriefcaseBusiness,
  },
  {
    to: "/activities",
    label: "Activities",
    icon: Activity,
  },
];

const adminLinks = [
  {
    to: "/users",
    label: "Users",
    icon: Users,
  },
];

function initials(name = "User") {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}

function NavItems({ onNavigate }) {
  return (
    <nav aria-label="Primary navigation">
      <div className="nav-group">
        <div className="nav-group-label">Workspace</div>

        <div className="nav-items">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `nav-item ${isActive ? "is-active" : ""}`
              }
            >
              <Icon size={18} strokeWidth={2} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      <div className="nav-group nav-group-admin">
        <div className="nav-group-label">Administration</div>

        <div className="nav-items">
          {adminLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `nav-item ${isActive ? "is-active" : ""}`
              }
            >
              <Icon size={18} strokeWidth={2} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}

function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => {
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      {/* =========================
          DESKTOP SIDEBAR
      ========================== */}
      <aside className="desktop-sidebar">
        <div className="sidebar-logo">
          <div className="logo-symbol">
            <BriefcaseBusiness size={19} />
          </div>

          <div>
            <div className="logo-name">NexaCRM</div>
            <div className="logo-caption">Customer operations</div>
          </div>
        </div>

        <div className="sidebar-content">
          <NavItems />
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="avatar">{initials(user?.name)}</div>

            <div className="sidebar-user-copy">
              <div className="sidebar-user-name">
                {user?.name || "User"}
              </div>

              <div className="sidebar-user-role">
                {user?.role || "member"}
              </div>
            </div>

            <ChevronDown size={15} />
          </div>

          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* =========================
          MOBILE TOPBAR
      ========================== */}
      <div className="mobile-topbar">
        <button
          type="button"
          className="mobile-menu-button"
          onClick={() => setMobileOpen((value) => !value)}
          aria-label={
            mobileOpen ? "Close navigation" : "Open navigation"
          }
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="mobile-brand">
          <div className="logo-symbol">
            <BriefcaseBusiness size={17} />
          </div>

          <span>NexaCRM</span>
        </div>

        <button
          type="button"
          className="mobile-notification"
          aria-label="Notifications"
        >
          <Bell size={19} />
        </button>
      </div>

      {/* =========================
          MOBILE DRAWER
      ========================== */}
      {mobileOpen && (
        <div className="mobile-drawer">
          <div className="mobile-drawer-user">
            <div className="avatar">{initials(user?.name)}</div>

            <div>
              <div className="sidebar-user-name">
                {user?.name || "User"}
              </div>

              <div className="sidebar-user-role">
                {user?.role || "member"}
              </div>
            </div>
          </div>

          <NavItems onNavigate={closeMobile} />

          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      )}

      {/* =========================
          MAIN APPLICATION
      ========================== */}
      <div className="app-main">
        <header className="topbar">
          <div className="topbar-search">
            <Search size={17} />

            <input
              type="search"
              aria-label="Global search"
              placeholder="Search customers, cases..."
            />

            <kbd>⌘ K</kbd>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="topbar-icon"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className="notification-dot" />
            </button>

            <div className="topbar-divider" />

            <div className="topbar-profile">
              <div className="avatar avatar-small">
                {initials(user?.name)}
              </div>

              <div>
                <div className="profile-name">
                  {user?.name || "User"}
                </div>

                <div className="profile-role">
                  {user?.role || "member"}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main id="main-content" className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/*
 * Both exports are intentional.
 *
 * Named import:
 * import { AppShell } from "./components/layout/AppShell";
 *
 * Default import:
 * import AppShell from "./components/layout/AppShell";
 */
export { AppShell };
export default AppShell;