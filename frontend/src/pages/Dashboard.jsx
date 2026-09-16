import { useEffect, useMemo, useState } from "react";

import {
  ArrowUpRight,
  BriefcaseBusiness,
  Clock3,
  Plus,
  Users,
  Activity,
} from "lucide-react";

import { Link } from "react-router-dom";

import api, { getErrorMessage } from "../services/api";

import { ErrorState, SkeletonRows } from "../components/ui/Feedback";

import { StatusBadge } from "../components/ui/StatusBadge";

import { useAuth } from "../context/AuthContext";

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function customerName(customer) {
  if (customer && typeof customer === "object") {
    return customer.name || "Unknown customer";
  }

  return "Unknown customer";
}

function Stat({ label, value, detail, icon: Icon, href }) {
  return (
    <Link to={href} className="metric-card">
      <div className="metric-top">
        <span className="metric-label">{label}</span>

        <span className="metric-icon">
          <Icon size={17} />
        </span>
      </div>

      <div className="metric-value">{value}</div>

      <div className="metric-detail">{detail}</div>
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  const [customers, setCustomers] = useState([]);

  const [cases, setCases] = useState([]);

  const [activities, setActivities] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [customerRes, caseRes, activityRes] = await Promise.all([
        api.get("/customers"),
        api.get("/cases"),
        api.get("/activities"),
      ]);

      /*
       * Backend response formats:
       *
       * customers -> data.customers
       * cases     -> data.cases
       * activities -> data.activities
       *
       * The fallback keeps this compatible with
       * older API responses that used data.
       */
      setCustomers(customerRes.data?.customers || customerRes.data?.data || []);

      setCases(caseRes.data?.cases || caseRes.data?.data || []);

      setActivities(
        activityRes.data?.activities || activityRes.data?.data || [],
      );
    } catch (err) {
      setError(getErrorMessage(err, "Could not load your dashboard."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCases = useMemo(
    () =>
      cases.filter(
        (item) =>
          !["resolved", "closed", "Resolved", "Closed"].includes(item.status),
      ),
    [cases],
  );

  const highPriority = useMemo(
    () =>
      cases.filter(
        (item) =>
          ["high", "High"].includes(item.priority) &&
          !["closed", "Closed", "resolved", "Resolved"].includes(item.status),
      ).length,
    [cases],
  );

  const recentCases = [...cases]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 6);

  const recentActivities = [...activities]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 6);

  if (loading) {
    return (
      <div className="page">
        <SkeletonRows count={7} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">Workspace overview</div>

          <h1 className="page-title">
            Good morning, {user?.name?.split(" ")[0] || "there"}
          </h1>

          <p className="page-description">
            Here’s what needs your attention today.
          </p>
        </div>

        <div className="page-actions">
          <Link className="button button-secondary" to="/activities">
            View activity
          </Link>

          <Link className="button button-primary" to="/cases">
            <Plus size={16} />
            New case
          </Link>
        </div>
      </div>

      <section className="metric-grid" aria-label="CRM summary">
        <Stat
          label="Customers"
          value={customers.length}
          detail="Total records"
          icon={Users}
          href="/customers"
        />

        <Stat
          label="Open cases"
          value={openCases.length}
          detail={`${highPriority} high priority`}
          icon={BriefcaseBusiness}
          href="/cases"
        />

        <Stat
          label="Activities"
          value={activities.length}
          detail="Logged interactions"
          icon={Activity}
          href="/activities"
        />

        <Stat
          label="Needs attention"
          value={highPriority}
          detail="High-priority open cases"
          icon={Clock3}
          href="/cases"
        />
      </section>

      <div className="dashboard-layout">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Recent cases</h2>

              <p className="panel-subtitle">Latest customer work</p>
            </div>

            <Link className="panel-link" to="/cases">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>

          {recentCases.length === 0 ? (
            <div className="panel-empty">
              <BriefcaseBusiness size={20} />

              <strong>No cases yet</strong>

              <span>Create your first case to start tracking work.</span>

              <Link className="button button-primary button-small" to="/cases">
                <Plus size={15} />
                New case
              </Link>
            </div>
          ) : (
            <div className="case-list">
              {recentCases.map((item) => (
                <div className="case-row" key={item.id || item._id}>
                  <div className="case-main">
                    <div className="case-title">
                      {item.title || "Untitled case"}
                    </div>

                    <div className="case-meta">
                      {customerName(item.customer)} ·{" "}
                      {formatDate(item.createdAt)}
                    </div>
                  </div>

                  <div className="case-statuses">
                    <StatusBadge value={item.priority} />

                    <StatusBadge value={item.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Recent activity</h2>

              <p className="panel-subtitle">Latest interactions</p>
            </div>

            <Link className="panel-link" to="/activities">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>

          {recentActivities.length === 0 ? (
            <div className="panel-empty">
              <Activity size={20} />

              <strong>No activity yet</strong>

              <span>Logged calls, meetings and notes will appear here.</span>
            </div>
          ) : (
            <div className="activity-list">
              {recentActivities.map((item) => (
                <div className="activity-row" key={item.id || item._id}>
                  <div className="activity-marker">
                    <Activity size={14} />
                  </div>

                  <div className="activity-main">
                    <div className="activity-title">
                      {item.description || "Activity"}
                    </div>

                    <div className="activity-meta">
                      {item.type || "note"} · {customerName(item.customer)}
                    </div>
                  </div>

                  <time className="activity-time">
                    {formatDate(item.createdAt)}
                  </time>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
