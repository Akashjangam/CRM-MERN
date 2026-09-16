import { useEffect, useMemo, useState } from "react";
import {
  Activity as ActivityIcon,
  CalendarDays,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  StickyNote,
} from "lucide-react";

import api, { getErrorMessage } from "../services/api";
import { Button } from "../components/ui/Button";
import {
  EmptyState,
  ErrorState,
  SkeletonRows,
} from "../components/ui/Feedback";
import { Select, TextArea } from "../components/ui/Field";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useAuth } from "../context/AuthContext";

const types = [
  ["call", Phone],
  ["email", Mail],
  ["meeting", CalendarDays],
  ["note", StickyNote],
  ["follow-up", MessageSquare],
];

function customerName(value) {
  if (typeof value === "object" && value !== null) {
    return value.name || "Unknown customer";
  }

  return "Unknown customer";
}

function getId(value) {
  if (!value) return "";
  if (typeof value === "object") {
    return value._id || value.id || "";
  }
  return value;
}

export default function Activities() {
  const { user } = useAuth();

  const role = String(user?.role || "")
    .trim()
    .toLowerCase();

  const isCustomer = role === "customer";
  const canCreate = ["admin", "agent", "customer"].includes(role);

  const [activities, setActivities] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cases, setCases] = useState([]);

  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");

  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    type: "note",
    customer: "",
    case: "",
    description: "",
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  /* =========================================================
     LOAD ACTIVITIES / CUSTOMERS / CASES
     ========================================================= */

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      /*
       * Customer accounts only need their own activities.
       * Staff users can access the customer and case lists.
       */
      const requests = [api.get("/activities")];

      if (!isCustomer) {
        requests.push(api.get("/customers"));
        requests.push(api.get("/cases"));
      } else {
        /*
         * Customer still gets their own customer record/cases
         * if the backend exposes them through the authenticated user.
         */
        requests.push(api.get("/customers"));
        requests.push(api.get("/cases"));
      }

      const [activityResponse, customerResponse, caseResponse] =
        await Promise.all(requests);

      /* =======================================================
         IMPORTANT:
         Backend returns:
           activities -> activityResponse.data.activities
           customers  -> customerResponse.data.customers
           cases      -> caseResponse.data.cases

         Keep data as a fallback for compatibility.
         ======================================================= */

      setActivities(
        activityResponse.data?.activities || activityResponse.data?.data || [],
      );

      setCustomers(
        customerResponse.data?.customers || customerResponse.data?.data || [],
      );

      setCases(caseResponse.data?.cases || caseResponse.data?.data || []);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load activities."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [role]);

  /* =========================================================
     FILTER ACTIVITIES
     ========================================================= */

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    return activities.filter((item) => {
      const searchableText = [
        item.description,
        item.type,
        customerName(item.customer),
        typeof item.case === "object" ? item.case?.title : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !term || searchableText.includes(term);

      const matchesType =
        type === "all" || String(item.type || "").toLowerCase() === type;

      return matchesSearch && matchesType;
    });
  }, [activities, query, type]);

  /* =========================================================
     OPEN CREATE FORM
     ========================================================= */

  const openCreateForm = () => {
    setFormError("");

    /*
     * Customer:
     * Automatically use the authenticated customer's profile.
     *
     * Staff:
     * Select the first customer by default when available.
     */
    const defaultCustomer = isCustomer
      ? customers[0]?._id || customers[0]?.id || ""
      : customers[0]?._id || customers[0]?.id || "";

    setForm({
      type: "note",
      customer: defaultCustomer,
      case: "",
      description: "",
    });

    setOpen(true);
  };

  /* =========================================================
     CLOSE FORM
     ========================================================= */

  const closeForm = () => {
    if (saving) return;

    setOpen(false);

    setForm({
      type: "note",
      customer: "",
      case: "",
      description: "",
    });

    setFormError("");
  };

  /* =========================================================
     FORM CHANGE
     ========================================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /* =========================================================
     SAVE ACTIVITY
     ========================================================= */

  const save = async (event) => {
    event.preventDefault();

    setSaving(true);
    setFormError("");

    try {
      if (!form.description.trim()) {
        setFormError("Activity description is required.");
        return;
      }

      if (!form.customer) {
        setFormError("Customer is required.");
        return;
      }

      const payload = {
        type: form.type,
        customer: form.customer,
        description: form.description.trim(),
      };

      /*
       * Only send case when one is selected.
       */
      if (form.case) {
        payload.case = form.case;
      }

      await api.post("/activities", payload);

      closeForm();

      await load();
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not create activity."));
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="page">
      {/* =====================================================
          HEADER
         ===================================================== */}

      <div className="page-header">
        <div>
          <div className="eyebrow">Customer touchpoints</div>

          <h1 className="page-title">Activities</h1>

          <p className="page-description">
            Record calls, emails, meetings, notes and follow-ups in one
            timeline.
          </p>
        </div>

        <div className="page-actions">
          <span className="record-count">
            {filtered.length}{" "}
            {filtered.length === 1 ? "activity" : "activities"}
          </span>

          {canCreate && (
            <Button onClick={openCreateForm} disabled={!customers.length}>
              <Plus size={16} />
              Log activity
            </Button>
          )}
        </div>
      </div>

      {/* =====================================================
          ERROR
         ===================================================== */}

      {error && <div className="page-alert">{error}</div>}

      {/* =====================================================
          DATA PANEL
         ===================================================== */}

      <section className="panel data-panel">
        <div className="toolbar">
          {/* SEARCH */}

          <label className="search-control">
            <Search size={16} />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search activities..."
              aria-label="Search activities"
            />
          </label>

          {/* TYPE FILTER */}

          <div className="toolbar-filters">
            <Select
              id="activity-type"
              label="Type"
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option value="all">All types</option>

              {types.map(([activityType]) => (
                <option key={activityType} value={activityType}>
                  {activityType}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* ===================================================
            LOADING
           =================================================== */}

        {loading ? (
          <SkeletonRows count={7} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ActivityIcon}
            title="No activities found"
            description="Logged customer interactions will appear here."
          />
        ) : (
          /* =================================================
             TIMELINE
             ================================================= */

          <div className="timeline">
            {filtered.map((item) => {
              const activityType = String(item.type || "").toLowerCase();

              const TypeIcon =
                types.find(
                  ([activityName]) => activityName === activityType,
                )?.[1] || ActivityIcon;

              const activityId =
                item._id ||
                item.id ||
                `${item.type}-${item.createdAt}-${item.description}`;

              return (
                <article className="timeline-item" key={activityId}>
                  <div className="timeline-icon">
                    <TypeIcon size={15} />
                  </div>

                  <div className="timeline-content">
                    <div className="timeline-top">
                      <StatusBadge value={item.type} />

                      <time>
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleString()
                          : "—"}
                      </time>
                    </div>

                    <h2>{item.description || "Activity"}</h2>

                    <p>
                      {customerName(item.customer)}

                      {item.case
                        ? ` · ${
                            typeof item.case === "object"
                              ? item.case.title || "Case"
                              : "Case"
                          }`
                        : ""}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* =====================================================
          CREATE ACTIVITY DRAWER
         ===================================================== */}

      {open && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              closeForm();
            }
          }}
        >
          <div
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="activity-dialog-title"
          >
            {/* DRAWER HEADER */}

            <div className="drawer-header">
              <div>
                <div className="eyebrow">Interaction log</div>

                <h2 id="activity-dialog-title">Log activity</h2>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* FORM */}

            <form className="drawer-body" onSubmit={save}>
              {formError && <div className="form-error">{formError}</div>}

              {/* CUSTOMER */}

              {isCustomer ? (
                <div className="field">
                  <label htmlFor="activity-customer">Customer</label>

                  <input
                    id="activity-customer"
                    value={
                      customers[0]?.name ||
                      user?.name ||
                      "Your customer profile"
                    }
                    disabled
                    readOnly
                  />

                  <input type="hidden" name="customer" value={form.customer} />
                </div>
              ) : (
                <Select
                  id="activity-customer"
                  label="Customer"
                  value={form.customer}
                  onChange={handleChange}
                  name="customer"
                  required
                >
                  <option value="">Select customer</option>

                  {customers.map((customer) => {
                    const customerId = customer._id || customer.id;

                    return (
                      <option key={customerId} value={customerId}>
                        {customer.name}
                      </option>
                    );
                  })}
                </Select>
              )}

              {/* ACTIVITY TYPE */}

              <Select
                id="activity-type-form"
                label="Activity type"
                value={form.type}
                onChange={handleChange}
                name="type"
                required
              >
                {types.map(([activityType]) => (
                  <option key={activityType} value={activityType}>
                    {activityType}
                  </option>
                ))}
              </Select>

              {/* RELATED CASE */}

              <Select
                id="activity-case"
                label="Related case"
                value={form.case}
                onChange={handleChange}
                name="case"
              >
                <option value="">No case</option>

                {cases.map((caseItem) => {
                  const caseId = caseItem._id || caseItem.id;

                  return (
                    <option key={caseId} value={caseId}>
                      {caseItem.title}
                    </option>
                  );
                })}
              </Select>

              {/* DESCRIPTION */}

              <TextArea
                id="activity-description"
                label="Description"
                value={form.description}
                onChange={handleChange}
                name="description"
                placeholder="What happened? Include the useful context for the next person."
                required
              />

              {/* ACTIONS */}

              <div className="drawer-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="button button-primary"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Log activity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
