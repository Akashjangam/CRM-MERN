import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";

const links = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/cases", label: "Cases", icon: FolderKanban },
];

function NavItems({ onNavigate }) {
  return (
    <ul className="space-y-1">
      {links.map(({ to, label, icon: Icon }) => (
        <li key={to}>
          <NavLink
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                isActive
                  ? "bg-accent text-white"
                  : "text-ink hover:bg-canvas"
              }`
            }
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_1fr]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <aside className="hidden border-r border-line bg-surface lg:flex lg:flex-col lg:p-4">
        <div className="flex items-center gap-2 px-2 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-white">
            <FolderKanban className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold">CRM</p>
            <p className="text-xs text-muted">Customer records</p>
          </div>
        </div>
        <nav aria-label="Main" className="mt-4 flex-1">
          <NavItems />
        </nav>
        <div className="border-t border-line pt-4">
          <p className="truncate px-2 text-sm font-medium">{user?.name || "Signed in"}</p>
          <p className="truncate px-2 text-xs text-muted">{user?.email}</p>
          <Button
            variant="ghost"
            className="mt-3 w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Log out
          </Button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden">
          <p className="text-sm font-semibold">CRM</p>
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </header>

        {menuOpen ? (
          <div
            id="mobile-nav"
            className="border-b border-line bg-surface p-4 lg:hidden"
          >
            <nav aria-label="Main">
              <NavItems onNavigate={() => setMenuOpen(false)} />
            </nav>
            <Button
              variant="ghost"
              className="mt-3 w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Log out
            </Button>
          </div>
        ) : null}

        <main id="main-content" className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
