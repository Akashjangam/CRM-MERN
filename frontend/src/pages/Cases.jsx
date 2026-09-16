import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, Pencil, Plus, Search, Trash2 } from "lucide-react";

import api, { getErrorMessage } from "../services/api";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import {
  EmptyState,
  ErrorState,
  SkeletonRows,
} from "../components/ui/Feedback";
import { Select, TextArea, TextInput } from "../components/ui/Field";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useAuth } from "../context/AuthContext";

const blank = {
  customer: "",
  title: "",
  description: "",
  priority: "Medium",
  status: "Open",
};

const CASE_STATUSES = ["Open", "In Progress", "Resolved", "Closed"];

const CASE_PRIORITIES = ["Low", "Medium", "High", "Urgent"];

function customerName(value) {
  if (!value) return "Unknown customer";

  if (typeof value === "object") {
    return value?.name || "Unknown customer";
  }

  return "Unknown customer";
}

function customerId(value) {
  if (!value) return "";

  if (typeof value === "object") {
    return value?._id || value?.id || "";
  }

  return String(value);
}

function getCaseId(item) {
  return item?._id || item?.id || "";
}

export default function Cases() {
  const { user } = useAuth();

  const role = String(user?.role || "")
    .trim()
    .toLowerCase();

  const isCustomer = role === "customer";
  const isAdmin = role === "admin";
  const isAgent = role === "agent";

  const canCreate = isCustomer || isAdmin || isAgent;
  const canEdit = isCustomer || isAdmin || isAgent;
  const canDelete = isAdmin || isAgent;

  const [cases, setCases] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");

  const [form, setForm] = useState(blank);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      /*
       * Customers are loaded because:
       * - admin/agent need the customer list
       * - customer receives their own linked profile
       */
      const [casesRes, customerRes] = await Promise.all([
        api.get("/cases"),
        api.get("/customers"),
      ]);

      /*
       * Backend response:
       *
       * /cases
       * {
       *   success: true,
       *   count: 0,
       *   cases: []
       * }
       *
       * /customers
       * {
       *   success: true,
       *   count: 1,
       *   customers: []
       * }
       */
      const caseList = casesRes.data?.cases || casesRes.data?.data || [];

      const customerList =
        customerRes.data?.customers || customerRes.data?.data || [];

      setCases(Array.isArray(caseList) ? caseList : []);
      setCustomers(Array.isArray(customerList) ? customerList : []);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load cases."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    return cases.filter((item) => {
      const haystack = [
        item.title,
        item.description,
        customerName(item.customer),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !term || haystack.includes(term);

      const matchesStatus =
        status === "all" ||
        String(item.status || "").toLowerCase() === status.toLowerCase();

      const matchesPriority =
        priority === "all" ||
        String(item.priority || "").toLowerCase() === priority.toLowerCase();

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [cases, query, status, priority]);

  const create = () => {
    setEditing(null);

    /*
     * Admin/Agent:
     * Select the first available customer.
     *
     * Customer:
     * Backend automatically uses their own profile,
     * so customer field does not need to be submitted.
     */
    setForm({
      ...blank,
      customer: isCustomer
        ? customerId(customers[0])
        : customerId(customers[0]),
    });

    setFormError("");
    setOpen(true);
  };

  const edit = (item) => {
    setEditing(getCaseId(item));

    setForm({
      customer: customerId(item.customer),
      title: item.title || "",
      description: item.description || "",
      priority:
        CASE_PRIORITIES.find(
          (value) =>
            value.toLowerCase() === String(item.priority || "").toLowerCase(),
        ) || "Medium",
      status:
        CASE_STATUSES.find(
          (value) =>
            value.toLowerCase() === String(item.status || "").toLowerCase(),
        ) || "Open",
    });

    setFormError("");
    setOpen(true);
  };

  const closeDrawer = () => {
    if (saving) return;

    setOpen(false);
    setEditing(null);
    setFormError("");
  };

  const save = async (event) => {
    event.preventDefault();

    setSaving(true);
    setFormError("");

    try {
      const title = form.title.trim();
      const description = form.description.trim();

      if (!title) {
        throw new Error("Case title is required.");
      }

      if (!description) {
        throw new Error("Case description is required.");
      }

      /*
       * Customer:
       * Do NOT send customer ownership changes.
       *
       * Backend automatically attaches the case to the
       * authenticated customer's profile.
       */
      if (isCustomer) {
        const customerForm = {
          title,
          description,
          priority: form.priority,
          status: form.status,
        };

        if (editing) {
          await api.patch(`/cases/${editing}`, customerForm);
        } else {
          await api.post("/cases", customerForm);
        }
      } else {
        /*
         * Admin / Agent:
         * Customer must be explicitly selected.
         */
        if (!form.customer) {
          throw new Error("Please select a customer.");
        }

        const staffForm = {
          customer: form.customer,
          title,
          description,
          priority: form.priority,
          status: form.status,
        };

        if (editing) {
          await api.patch(`/cases/${editing}`, staffForm);
        } else {
          await api.post("/cases", staffForm);
        }
      }

      setOpen(false);
      setEditing(null);
      setForm(blank);

      await load();
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not save case."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!pendingDelete) return;

    try {
      const id = getCaseId(pendingDelete);

      await api.delete(`/cases/${id}`);

      setPendingDelete(null);

      await load();
    } catch (err) {
      setPendingDelete(null);

      setError(getErrorMessage(err, "Could not delete case."));
    }
  };

  return (
    <div className="page">
      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <div className="eyebrow">Customer support</div>

          <h1 className="page-title">Cases</h1>

          <p className="page-description">
            Prioritize, assign and track customer issues from open to
            resolution.
          </p>
        </div>

        <div className="page-actions">
          <span className="record-count">
            {filtered.length} {filtered.length === 1 ? "case" : "cases"}
          </span>

          {canCreate && (
            <Button
              onClick={create}
              disabled={!isCustomer && customers.length === 0}
            >
              <Plus size={16} />
              New case
            </Button>
          )}
        </div>
      </div>

      {/* ERROR */}
      {error && <div className="page-alert">{error}</div>}

      {/* MAIN PANEL */}
      <section className="panel data-panel">
        {/* TOOLBAR */}
        <div className="toolbar toolbar-wrap">
          <label className="search-control">
            <Search size={16} />

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cases..."
              aria-label="Search cases"
            />
          </label>

          <div className="toolbar-filters">
            <Select
              id="case-status"
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All statuses</option>

              {CASE_STATUSES.map((item) => (
                <option key={item} value={item.toLowerCase()}>
                  {item}
                </option>
              ))}
            </Select>

            <Select
              id="case-priority"
              label="Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="all">All priorities</option>

              {CASE_PRIORITIES.map((item) => (
                <option key={item} value={item.toLowerCase()}>
                  {item}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* CUSTOMER ONLY INFORMATION */}
        {isCustomer && !loading && (
          <div className="inline-info">
            Your cases are linked automatically to your customer profile.
          </div>
        )}

        {/* STAFF WARNING */}
        {!isCustomer && !customers.length && !loading && (
          <div className="inline-warning">
            Add a customer before creating a case.
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <SkeletonRows count={7} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={BriefcaseBusiness}
            title={
              query || status !== "all" || priority !== "all"
                ? "No matching cases"
                : "No cases yet"
            }
            description={
              isCustomer
                ? "Create a case to report an issue or request support."
                : "Cases give your team a clear record of customer issues and follow-up work."
            }
            action={
              !query &&
              status === "all" &&
              priority === "all" &&
              canCreate &&
              (isCustomer || customers.length > 0) ? (
                <Button onClick={create}>
                  <Plus size={15} />
                  New case
                </Button>
              ) : null
            }
          />
        ) : (
          /* CASE LIST */
          <div className="case-table-list">
            {filtered.map((item) => {
              const id = getCaseId(item);

              return (
                <article className="case-card" key={id}>
                  <div className="case-card-main">
                    <div className="case-card-heading">
                      <span className="case-id">
                        CASE-
                        {String(id).slice(-6).toUpperCase()}
                      </span>

                      <StatusBadge value={item.status} />
                    </div>

                    <h2>{item.title}</h2>

                    <p>{item.description || "No description provided."}</p>

                    <div className="case-card-meta">
                      <span>{customerName(item.customer)}</span>

                      <span>·</span>

                      <span>
                        Created{" "}
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="case-card-side">
                    <StatusBadge value={item.priority} />

                    <div className="row-actions">
                      {canEdit && (
                        <button
                          className="icon-button"
                          onClick={() => edit(item)}
                          aria-label={`Edit ${item.title}`}
                        >
                          <Pencil size={15} />
                        </button>
                      )}

                      {canDelete && (
                        <button
                          className="icon-button danger-icon"
                          onClick={() => setPendingDelete(item)}
                          aria-label={`Delete ${item.title}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* CREATE / EDIT DRAWER */}
      {open && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDrawer();
            }
          }}
        >
          <div
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="case-drawer-title"
          >
            <div className="drawer-header">
              <div>
                <div className="eyebrow">
                  {editing ? "Update case" : "New case"}
                </div>

                <h2 id="case-drawer-title">
                  {editing ? "Edit case" : "Create a case"}
                </h2>
              </div>

              <button
                className="icon-button"
                onClick={closeDrawer}
                aria-label="Close"
                type="button"
              >
                ×
              </button>
            </div>

            <form className="drawer-body" onSubmit={save}>
              {formError && <div className="form-error">{formError}</div>}

              {/* CUSTOMER SELECT ONLY FOR STAFF */}
              {!isCustomer && (
                <Select
                  id="case-customer"
                  label="Customer"
                  value={form.customer}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      customer: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Select customer</option>

                  {customers.map((customer) => (
                    <option
                      key={customer._id || customer.id}
                      value={customer._id || customer.id}
                    >
                      {customer.name}
                    </option>
                  ))}
                </Select>
              )}

              {/* CUSTOMER CONTEXT */}
              {isCustomer && (
                <div className="inline-info">
                  This case will automatically be linked to your customer
                  account.
                </div>
              )}

              <TextInput
                id="case-title"
                label="Case title"
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value,
                  })
                }
                placeholder="Unable to access account"
                required
              />

              <TextArea
                id="case-description"
                label="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                placeholder="Describe the issue and relevant context..."
                required
              />

              <div className="form-two">
                <Select
                  id="case-priority-form"
                  label="Priority"
                  value={form.priority}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      priority: e.target.value,
                    })
                  }
                >
                  {CASE_PRIORITIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>

                <Select
                  id="case-status-form"
                  label="Status"
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value,
                    })
                  }
                >
                  {CASE_STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="drawer-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={closeDrawer}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="button button-primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editing
                      ? "Save changes"
                      : "Create case"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete case?"
        message={
          pendingDelete
            ? `This will permanently remove "${pendingDelete.title}".`
            : ""
        }
        confirmLabel="Delete case"
        danger
        onCancel={() => setPendingDelete(null)}
        onConfirm={remove}
      />
    </div>
  );
}
