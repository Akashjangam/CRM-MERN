import { useEffect, useMemo, useState } from "react";
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";

import api, { getErrorMessage } from "../services/api";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";

import { EmptyState, SkeletonRows } from "../components/ui/Feedback";

import { Select, TextInput } from "../components/ui/Field";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useAuth } from "../context/AuthContext";

const blank = {
  name: "",
  email: "",
  phone: "",
  company: "",
  status: "active",
};

function initials(name = "Customer") {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "C"
  );
}

export default function Customers() {
  const { user } = useAuth();

  /*
   * Normalize authenticated user's role.
   */
  const role = String(user?.role || "")
    .trim()
    .toLowerCase();

  /*
   * Permissions
   *
   * admin:
   *   create + edit + delete
   *
   * agent:
   *   create + edit
   *
   * customer:
   *   view only
   */
  const canCreate = role === "admin" || role === "agent";
  const canEdit = role === "admin" || role === "agent";
  const canDelete = role === "admin";

  const [customers, setCustomers] = useState([]);

  const [form, setForm] = useState(blank);

  const [query, setQuery] = useState("");

  const [status, setStatus] = useState("all");

  const [open, setOpen] = useState(false);

  const [editing, setEditing] = useState(null);

  const [pendingDelete, setPendingDelete] = useState(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [formError, setFormError] = useState("");

  /*
   * Load customers.
   */
  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/customers");

      /*
       * Backend response:
       *
       * {
       *   success: true,
       *   count: number,
       *   customers: []
       * }
       *
       * The fallback supports an older response shape.
       */
      const customerData =
        response.data?.customers || response.data?.data || [];

      setCustomers(Array.isArray(customerData) ? customerData : []);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load customers."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /*
   * Search + status filtering.
   */
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    return customers.filter((item) => {
      const matchesStatus =
        status === "all" ||
        String(item.status || "active").toLowerCase() === status;

      const haystack = [item.name, item.email, item.phone, item.company]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!term || haystack.includes(term));
    });
  }, [customers, query, status]);

  /*
   * Open create drawer.
   */
  const startCreate = () => {
    if (!canCreate) {
      return;
    }

    setEditing(null);
    setForm({ ...blank });
    setFormError("");
    setOpen(true);
  };

  /*
   * Open edit drawer.
   */
  const startEdit = (item) => {
    if (!canEdit) {
      return;
    }

    setEditing(item.id || item._id);

    setForm({
      name: item.name || "",
      email: item.email || "",
      phone: item.phone || "",
      company: item.company || "",
      status: item.status || "active",
    });

    setFormError("");
    setOpen(true);
  };

  /*
   * Create or update customer.
   */
  const save = async (event) => {
    event.preventDefault();

    /*
     * Frontend permission check.
     */
    if (!editing && !canCreate) {
      setFormError("You do not have permission to create customers.");
      return;
    }

    if (editing && !canEdit) {
      setFormError("You do not have permission to edit customers.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      /*
       * Required fields.
       */
      if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
        throw new Error("Name, email, and phone are required.");
      }

      /*
       * Basic email validation.
       */
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(form.email.trim())) {
        throw new Error("Please enter a valid email address.");
      }

      /*
       * Clean payload before sending.
       */
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        status: form.status,
      };

      if (editing) {
        await api.patch(`/customers/${editing}`, payload);
      } else {
        await api.post("/customers", payload);
      }

      /*
       * Close drawer.
       */
      setOpen(false);
      setEditing(null);
      setForm({ ...blank });
      setFormError("");

      /*
       * Reload customers.
       */
      await load();
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not save customer."));
    } finally {
      setSaving(false);
    }
  };

  /*
   * Delete customer.
   */
  const remove = async () => {
    if (!pendingDelete) {
      return;
    }

    if (!canDelete) {
      setPendingDelete(null);

      setError("You do not have permission to delete customers.");

      return;
    }

    const customerId = pendingDelete.id || pendingDelete._id;

    if (!customerId) {
      setPendingDelete(null);

      setError("Customer ID is missing.");

      return;
    }

    try {
      await api.delete(`/customers/${customerId}`);

      setPendingDelete(null);

      await load();
    } catch (err) {
      setPendingDelete(null);

      setError(getErrorMessage(err, "Could not delete customer."));
    }
  };

  /*
   * Close drawer.
   */
  const closeDrawer = () => {
    if (saving) {
      return;
    }

    setOpen(false);
    setEditing(null);
    setForm({ ...blank });
    setFormError("");
  };

  return (
    <div className="page">
      {/* ================================
          PAGE HEADER
      ================================= */}
      <div className="page-header">
        <div>
          <div className="eyebrow">Customer directory</div>

          <h1 className="page-title">Customers</h1>

          <p className="page-description">
            Keep customer records, contact details and status organized.
          </p>
        </div>

        <div className="page-actions">
          <span className="record-count">{filtered.length} records</span>

          {canCreate && (
            <Button onClick={startCreate}>
              <Plus size={16} />
              Add customer
            </Button>
          )}
        </div>
      </div>

      {/* ================================
          CUSTOMER ROLE NOTICE
      ================================= */}
      {role === "customer" && (
        <div className="page-alert">
          You are viewing your customer profile. Customer records can only be
          created or managed by authorized CRM staff.
        </div>
      )}

      {/* ================================
          ERROR
      ================================= */}
      {error && <div className="page-alert">{error}</div>}

      {/* ================================
          CUSTOMER PANEL
      ================================= */}
      <section className="panel data-panel">
        {/* TOOLBAR */}
        <div className="toolbar">
          <label className="search-control">
            <Search size={16} />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search customers..."
              aria-label="Search customers"
            />
          </label>

          <div className="toolbar-filters">
            <Select
              id="customer-status"
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">All statuses</option>

              <option value="active">Active</option>

              <option value="inactive">Inactive</option>
            </Select>
          </div>
        </div>

        {/* ================================
            LOADING
        ================================= */}
        {loading ? (
          <SkeletonRows count={7} />
        ) : filtered.length === 0 ? (
          /* ================================
             EMPTY
          ================================= */
          <EmptyState
            icon={Users}
            title={
              query || status !== "all"
                ? "No customers found"
                : "No customers yet"
            }
            description={
              query || status !== "all"
                ? "Try changing your search or filter."
                : canCreate
                  ? "Add a customer to build your directory."
                  : "Your customer profile will appear here."
            }
            action={
              canCreate && !query && status === "all" ? (
                <Button onClick={startCreate}>
                  <Plus size={15} />
                  Add customer
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            {/* ================================
                DESKTOP TABLE
            ================================= */}
            <div className="desktop-table-wrap">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Customer</th>

                    <th>Company</th>

                    <th>Contact</th>

                    <th>Status</th>

                    {(canEdit || canDelete) && (
                      <th className="align-right">Actions</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((item) => {
                    const customerId = item.id || item._id;

                    return (
                      <tr key={customerId}>
                        {/* CUSTOMER */}
                        <td>
                          <div className="person-cell">
                            <div className="avatar">{initials(item.name)}</div>

                            <div>
                              <div className="cell-primary">{item.name}</div>

                              <div className="cell-secondary">{item.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* COMPANY */}
                        <td>
                          <span className="cell-primary">
                            {item.company || "—"}
                          </span>
                        </td>

                        {/* CONTACT */}
                        <td>
                          <div className="cell-secondary">
                            {item.phone || "—"}
                          </div>
                        </td>

                        {/* STATUS */}
                        <td>
                          <StatusBadge value={item.status || "active"} />
                        </td>

                        {/* ACTIONS */}
                        {(canEdit || canDelete) && (
                          <td>
                            <div className="row-actions">
                              {canEdit && (
                                <button
                                  type="button"
                                  className="icon-button"
                                  onClick={() => startEdit(item)}
                                  aria-label={`Edit ${item.name}`}
                                  title="Edit customer"
                                >
                                  <Pencil size={15} />
                                </button>
                              )}

                              {canDelete && (
                                <button
                                  type="button"
                                  className="icon-button danger-icon"
                                  onClick={() => setPendingDelete(item)}
                                  aria-label={`Delete ${item.name}`}
                                  title="Delete customer"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}

                              <button
                                type="button"
                                className="icon-button"
                                aria-label={`More actions for ${item.name}`}
                                title="More actions"
                              >
                                <MoreHorizontal size={15} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ================================
                MOBILE CARDS
            ================================= */}
            <div className="mobile-record-list">
              {filtered.map((item) => {
                const customerId = item.id || item._id;

                return (
                  <article className="record-card" key={customerId}>
                    <div className="person-cell">
                      <div className="avatar">{initials(item.name)}</div>

                      <div>
                        <div className="cell-primary">{item.name}</div>

                        <div className="cell-secondary">{item.email}</div>
                      </div>
                    </div>

                    <div className="record-details">
                      <span>{item.company || "No company"}</span>

                      <span>{item.phone || "No phone"}</span>
                    </div>

                    <div className="record-footer">
                      <StatusBadge value={item.status || "active"} />

                      {(canEdit || canDelete) && (
                        <div className="row-actions">
                          {canEdit && (
                            <button
                              type="button"
                              className="icon-button"
                              onClick={() => startEdit(item)}
                              aria-label={`Edit ${item.name}`}
                              title="Edit customer"
                            >
                              <Pencil size={15} />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              className="icon-button danger-icon"
                              onClick={() => setPendingDelete(item)}
                              aria-label={`Delete ${item.name}`}
                              title="Delete customer"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* ================================
          CREATE / EDIT DRAWER
      ================================= */}
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
            aria-labelledby="customer-drawer-title"
          >
            {/* DRAWER HEADER */}
            <div className="drawer-header">
              <div>
                <div className="eyebrow">
                  {editing ? "Edit record" : "New record"}
                </div>

                <h2 id="customer-drawer-title">
                  {editing ? "Edit customer" : "Add customer"}
                </h2>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={closeDrawer}
                aria-label="Close"
                title="Close"
              >
                ×
              </button>
            </div>

            {/* FORM */}
            <form className="drawer-body" onSubmit={save}>
              {formError && <div className="form-error">{formError}</div>}

              {/* NAME */}
              <TextInput
                id="customer-name"
                label="Full name"
                name="name"
                value={form.name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    name: event.target.value,
                  })
                }
                placeholder="Jane Cooper"
                required
                disabled={saving}
              />

              {/* EMAIL */}
              <TextInput
                id="customer-email"
                label="Email"
                type="email"
                name="email"
                value={form.email}
                onChange={(event) =>
                  setForm({
                    ...form,
                    email: event.target.value,
                  })
                }
                placeholder="jane@company.com"
                required
                disabled={saving}
              />

              {/* PHONE */}
              <TextInput
                id="customer-phone"
                label="Phone"
                type="tel"
                name="phone"
                value={form.phone}
                onChange={(event) =>
                  setForm({
                    ...form,
                    phone: event.target.value,
                  })
                }
                placeholder="+91 98765 43210"
                required
                disabled={saving}
              />

              {/* COMPANY */}
              <TextInput
                id="customer-company"
                label="Company"
                name="company"
                value={form.company}
                onChange={(event) =>
                  setForm({
                    ...form,
                    company: event.target.value,
                  })
                }
                placeholder="Acme Inc."
                disabled={saving}
              />

              {/* STATUS */}
              <Select
                id="customer-status-form"
                label="Status"
                value={form.status}
                onChange={(event) =>
                  setForm({
                    ...form,
                    status: event.target.value,
                  })
                }
                disabled={saving}
              >
                <option value="active">Active</option>

                <option value="inactive">Inactive</option>
              </Select>

              {/* ACTIONS */}
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
                      : "Add customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================
          DELETE CONFIRMATION
      ================================= */}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete customer?"
        message={
          pendingDelete
            ? `This will permanently remove ${pendingDelete.name}.`
            : ""
        }
        confirmLabel="Delete customer"
        danger
        onCancel={() => setPendingDelete(null)}
        onConfirm={remove}
      />
    </div>
  );
}
