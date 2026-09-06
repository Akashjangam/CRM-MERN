import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  FolderKanban,
  Users,
  AlertCircle,
  ArrowRight,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";

import api, { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

import { StatusBadge } from "../components/ui/StatusBadge";
import {
  ErrorState,
  SkeletonRows,
} from "../components/ui/Feedback";
import { Button } from "../components/ui/Button";


export default function Dashboard() {
  const { user } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [cases, setCases] = useState([]);
  const [activities, setActivities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  /* ======================================================
     ROLE
     ====================================================== */

  const role = user?.role || "";

  const canCreateCase =
    ["admin", "agent", "customer"].includes(role);

  const canCreateCustomer =
    ["admin", "agent"].includes(role);


  /* ======================================================
     LOAD DASHBOARD
     ====================================================== */

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [customersResponse, casesResponse, activitiesResponse] =
        await Promise.all([
          api.get("/customers"),
          api.get("/cases"),

          // Activities are optional for dashboard
          api
            .get("/activities")
            .catch(() => ({
              data: {
                data: [],
              },
            })),
        ]);

      setCustomers(
        customersResponse.data?.data || []
      );

      setCases(
        casesResponse.data?.data || []
      );

      setActivities(
        activitiesResponse.data?.data || []
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Could not load dashboard data."
        )
      );
    } finally {
      setLoading(false);
    }
  };


  /* ======================================================
     INITIAL LOAD
     ====================================================== */

  useEffect(() => {
    load();
  }, []);


  /* ======================================================
     OPEN CASES
     ====================================================== */

  const openCases = useMemo(() => {
    return cases.filter(
      (item) =>
        !["Closed", "Resolved"].includes(
          item.status
        )
    );
  }, [cases]);


  /* ======================================================
     PRIORITY CASES
     ====================================================== */

  const priorityCases = useMemo(() => {
    return cases.filter(
      (item) =>
        ["Urgent", "High"].includes(
          item.priority
        )
    );
  }, [cases]);


  /* ======================================================
     RECENT CASES
     ====================================================== */

  const recentCases = useMemo(() => {
    return [...cases]
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
      )
      .slice(0, 6);
  }, [cases]);


  /* ======================================================
     RECENT CUSTOMERS
     ====================================================== */

  const recentCustomers = useMemo(() => {
    return [...customers]
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
      )
      .slice(0, 6);
  }, [customers]);


  /* ======================================================
     FIRST NAME
     ====================================================== */

  const firstName = user?.name
    ? user.name.split(" ")[0]
    : "";


  /* ======================================================
     RENDER
     ====================================================== */

  return (
    <div className="page">

      {/* ==================================================
          HEADER
          ================================================== */}

      <header className="page-header">

        <div>
          <h1 className="page-title">
            Good to see you
            {firstName
              ? `, ${firstName}`
              : ""}
            .
          </h1>

          <p className="page-subtitle">
            Here’s a clear view of your customer
            relationships and support workload.
          </p>
        </div>


        <div className="actions">

          <Link
            className="btn btn-primary"
            to="/cases"
          >
            Manage cases
            <ArrowRight size={16} />
          </Link>

        </div>

      </header>


      {/* ==================================================
          LOADING
          ================================================== */}

      {loading && (
        <SkeletonRows count={5} />
      )}


      {/* ==================================================
          ERROR
          ================================================== */}

      {!loading && error && (
        <ErrorState
          message={error}
          onRetry={load}
        />
      )}


      {/* ==================================================
          DASHBOARD
          ================================================== */}

      {!loading && !error && (
        <>

          {/* ==============================================
              STATISTICS
              ============================================== */}

          <section
            className="stats"
            aria-label="CRM summary"
          >

            <Stat
              label="Customers"
              value={customers.length}
              icon={Users}
              href="/customers"
            />

            <Stat
              label="Open cases"
              value={openCases.length}
              icon={FolderKanban}
              href="/cases"
            />

            <Stat
              label="Priority cases"
              value={priorityCases.length}
              icon={AlertCircle}
              href="/cases"
            />

            <Stat
              label="Activities"
              value={activities.length}
              icon={Activity}
              href="/activities"
            />

          </section>


          {/* ==============================================
              DASHBOARD GRID
              ============================================== */}

          <div className="dashboard-grid">

            {/* ============================================
                RECENT CASES
                ============================================ */}

            <section className="card">

              <div
                className="card-header"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >

                <div>
                  <strong>
                    Recent cases
                  </strong>

                  <div className="item-meta">
                    Latest support work
                  </div>
                </div>


                <Link to="/cases">
                  View all
                </Link>

              </div>


              {recentCases.length === 0 ? (

                <div className="empty">

                  <FolderKanban
                    size={30}
                  />

                  <p>
                    No cases yet.
                  </p>

                  {canCreateCase && (
                    <Link
                      className="btn btn-secondary btn-small"
                      to="/cases"
                    >
                      <Plus size={15} />
                      Create a case
                    </Link>
                  )}

                </div>

              ) : (

                <ul className="list">

                  {recentCases.map(
                    (item) => (

                      <li
                        className="list-item"
                        key={item._id}
                      >

                        <div className="avatar">
                          <FolderKanban
                            size={17}
                          />
                        </div>


                        <div className="item-main">

                          <div className="item-title">
                            {item.title}
                          </div>

                          <div className="item-meta">
                            {item.customer?.name ||
                              "Unknown customer"}
                          </div>

                        </div>


                        <StatusBadge
                          value={
                            item.priority
                          }
                        />

                        <StatusBadge
                          value={
                            item.status
                          }
                        />

                      </li>

                    )
                  )}

                </ul>

              )}

            </section>


            {/* ============================================
                CUSTOMERS
                ============================================ */}

            <section className="card">

              <div
                className="card-header"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >

                <div>

                  <strong>
                    Customers
                  </strong>

                  <div className="item-meta">
                    Recent records
                  </div>

                </div>


                <Link to="/customers">
                  View all
                </Link>

              </div>


              {recentCustomers.length === 0 ? (

                <div className="empty">

                  <Users size={30} />

                  <p>
                    Add a customer to get started.
                  </p>

                  {canCreateCustomer && (
                    <Link
                      className="btn btn-secondary btn-small"
                      to="/customers"
                    >
                      <Plus size={15} />
                      Add customer
                    </Link>
                  )}

                </div>

              ) : (

                <ul className="list">

                  {recentCustomers.map(
                    (customer) => (

                      <li
                        className="list-item"
                        key={customer._id}
                      >

                        <div className="avatar">
                          {customer.name
                            ?.charAt(0)
                            .toUpperCase() || "?"}
                        </div>


                        <div className="item-main">

                          <div className="item-title">
                            {customer.name}
                          </div>

                          <div className="item-meta">

                            {[
                              customer.company,
                              customer.email,
                            ]
                              .filter(Boolean)
                              .join(" · ")}

                          </div>

                        </div>

                      </li>

                    )
                  )}

                </ul>

              )}

            </section>

          </div>

        </>
      )}

    </div>
  );
}


/* ========================================================
   STAT CARD
   ======================================================== */

function Stat({
  label,
  value,
  icon: Icon,
  href,
}) {
  return (
    <Link
      to={href}
      className="card stat"
      aria-label={`${label}: ${value}`}
    >

      <div>

        <div className="stat-label">
          {label}
        </div>

        <div className="stat-value">
          {value}
        </div>

      </div>


      <div className="stat-icon">
        <Icon size={20} />
      </div>

    </Link>
  );
}