import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderKanban, Users } from "lucide-react";
import { ErrorState, SkeletonRows } from "../components/ui/Feedback";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useAuth } from "../context/AuthContext";
import api, { getErrorMessage } from "../services/api";

function StatCard({ label, value, href }) {
  return (
    <Link
      to={href}
      className="block rounded-md border border-line bg-surface p-4 hover:border-accent"
    >
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-ink">{value}</p>
    </Link>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [customerRes, caseRes] = await Promise.all([
        api.get("/customers"),
        api.get("/cases"),
      ]);
      setCustomers(customerRes.data.data || []);
      setCases(caseRes.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load dashboard data."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCases = cases.filter((item) => item.status !== "Closed");
  const recentCases = [...cases]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted">
          {user?.name ? `Welcome back, ${user.name}.` : "A snapshot of customers and open work."}
        </p>
      </header>

      {loading ? (
        <SkeletonRows count={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          <section aria-label="Summary" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="Customers" value={customers.length} href="/customers" />
            <StatCard label="Open cases" value={openCases.length} href="/cases" />
            <StatCard label="All cases" value={cases.length} href="/cases" />
          </section>

          <section className="rounded-md border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-sm font-semibold">Recent cases</h2>
              <Link to="/cases" className="text-sm font-medium text-accent hover:underline">
                View all
              </Link>
            </div>

            {recentCases.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <FolderKanban className="mx-auto h-8 w-8 text-muted" aria-hidden="true" />
                <p className="mt-2 text-sm text-muted">No cases yet. Open one from the Cases page.</p>
              </div>
            ) : (
              <ul role="list" className="divide-y divide-line">
                {recentCases.map((item) => (
                  <li key={item._id} className="flex flex-wrap items-center gap-2 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="truncate text-xs text-muted">
                        {item.customer?.name || "Unknown customer"}
                      </p>
                    </div>
                    <StatusBadge value={item.priority} />
                    <StatusBadge value={item.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-md border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-sm font-semibold">Customers</h2>
              <Link to="/customers" className="text-sm font-medium text-accent hover:underline">
                Manage
              </Link>
            </div>

            {customers.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Users className="mx-auto h-8 w-8 text-muted" aria-hidden="true" />
                <p className="mt-2 text-sm text-muted">Add a customer to start tracking work.</p>
              </div>
            ) : (
              <ul role="list" className="divide-y divide-line">
                {customers.slice(0, 6).map((customer) => (
                  <li key={customer._id} className="px-4 py-3">
                    <p className="text-sm font-medium">{customer.name}</p>
                    <p className="text-xs text-muted">
                      {[customer.company, customer.email].filter(Boolean).join(" · ")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default Dashboard;
