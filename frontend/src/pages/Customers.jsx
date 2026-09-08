import { useEffect, useMemo, useState } from "react";
import {
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";

import api, { getErrorMessage } from "../services/api";

import { Button } from "../components/ui/Button";
import { TextInput } from "../components/ui/Field";

import {
  Banner,
  EmptyState,
  ErrorState,
  SkeletonRows,
} from "../components/ui/Feedback";

import { ConfirmDialog } from "../components/ui/ConfirmDialog";

import { useAuth } from "../context/AuthContext";


/* =========================================================
   INITIAL FORM
   ========================================================= */

const initialForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
};


/* =========================================================
   CUSTOMERS PAGE
   ========================================================= */

export default function Customers() {
  const { user } = useAuth();

  /* =======================================================
     STATE
     ======================================================= */

  const [items, setItems] = useState([]);

  const [form, setForm] = useState(initialForm);

  const [edit, setEdit] = useState(null);

  const [query, setQuery] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [formError, setFormError] = useState("");

  const [saving, setSaving] = useState(false);

  const [remove, setRemove] = useState(null);

  const [open, setOpen] = useState(false);


  /* =======================================================
     ROLE PERMISSIONS
     ======================================================= */

  const role = user?.role || "";

  const canCreate =
    ["admin", "agent"].includes(role);

  const canEdit =
    ["admin", "agent"].includes(role);

  const canDelete =
    role === "admin";

  const summaryStats = useMemo(() => [
    {
      label: "Customers",
      value: items.length,
      trend: `${filtered.length} matching`,
    },
    {
      label: "Companies",
      value: new Set(items.map((item) => item.company).filter(Boolean)).size,
      trend: "Tracked records",
    },
    {
      label: "Contact coverage",
      value: `${Math.round((items.filter((item) => item.email || item.phone).length / Math.max(items.length, 1)) * 100)}%`,
      trend: "with email or phone",
    },
  ], [filtered.length, items]);


  /* =======================================================
     LOAD CUSTOMERS
     ======================================================= */

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const response =
        await api.get("/customers");

      setItems(
        response.data?.data || []
      );
    } catch (error) {
      setError(
        getErrorMessage(
          error,
          "Could not load customers."
        )
      );
    } finally {
      setLoading(false);
    }
  };


  /* =======================================================
     INITIAL LOAD
     ======================================================= */

  useEffect(() => {
    load();
  }, []);


  /* =======================================================
     FILTER CUSTOMERS
     ======================================================= */

  const filtered = useMemo(() => {
    const search =
      query.trim().toLowerCase();

    if (!search) {
      return items;
    }

    return items.filter((customer) => {
      const searchableText = [
        customer.name,
        customer.email,
        customer.phone,
        customer.company,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });
  }, [items, query]);


  /* =======================================================
     OPEN NEW CUSTOMER FORM
     ======================================================= */

  const openNewCustomer = () => {
    setEdit(null);

    setForm({
      ...initialForm,
    });

    setFormError("");
    setOpen(true);
  };


  /* =======================================================
     OPEN EDIT FORM
     ======================================================= */

  const editCustomer = (customer) => {
    setEdit(customer._id);

    setForm({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      company: customer.company || "",
    });

    setFormError("");
    setOpen(true);
  };


  /* =======================================================
     CLOSE FORM
     ======================================================= */

  const closeForm = () => {
    if (saving) {
      return;
    }

    setOpen(false);
    setEdit(null);
    setForm(initialForm);
    setFormError("");
  };


  /* =======================================================
     UPDATE FORM
     ======================================================= */

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };


  /* =======================================================
     SUBMIT
     ======================================================= */

  const submit = async (event) => {
    event.preventDefault();

    setFormError("");

    const name =
      form.name.trim();

    const email =
      form.email.trim();

    const phone =
      form.phone.trim();

    const company =
      form.company.trim();

    if (!name) {
      setFormError(
        "Full name is required."
      );
      return;
    }

    if (!email) {
      setFormError(
        "Email address is required."
      );
      return;
    }

    if (!phone) {
      setFormError(
        "Phone number is required."
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name,
        email,
        phone,
        company,
      };

      if (edit) {
        await api.patch(
          `/customers/${edit}`,
          payload
        );
      } else {
        await api.post(
          "/customers",
          payload
        );
      }

      setOpen(false);
      setEdit(null);
      setForm(initialForm);

      await load();
    } catch (error) {
      setFormError(
        getErrorMessage(
          error,
          "Could not save customer."
        )
      );
    } finally {
      setSaving(false);
    }
  };


  /* =======================================================
     DELETE
     ======================================================= */

  const confirmDelete = async () => {
    if (!remove?._id) {
      return;
    }

    try {
      await api.delete(
        `/customers/${remove._id}`
      );

      setRemove(null);

      await load();
    } catch (error) {
      setError(
        getErrorMessage(
          error,
          "Could not delete customer."
        )
      );

      setRemove(null);
    }
  };


  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="page">

      {/* ===================================================
          HEADER
          =================================================== */}

      <header className="page-header">

        <div>
          <h1 className="page-title">
            Customers
          </h1>

          <p className="page-subtitle">
            Manage people and companies, contact
            details, and customer records.
          </p>
        </div>


        {canCreate && (
          <div className="actions">
            <Button onClick={openNewCustomer}>
              <Plus size={17} />
              Add customer
            </Button>
          </div>
        )}

      </header>

      <div className="page-summary">
        {summaryStats.map((stat) => (
          <div key={stat.label} className="summary-card">
            <div>
              <div className="summary-label">{stat.label}</div>
              <div className="summary-value">{stat.value}</div>
              <div className="summary-trend">{stat.trend}</div>
            </div>
            <div className="brand-mark">
              <Users size={18} />
            </div>
          </div>
        ))}
      </div>


      {/* ===================================================
          FORM
          =================================================== */}

      {open && (
        <div
          className="card"
          style={{ marginBottom: 18 }}
        >

          <div className="card-header">

            <strong>
              {edit
                ? "Update customer"
                : "New customer"}
            </strong>

          </div>


          <div className="card-body">

            {formError && (
              <Banner>
                {formError}
              </Banner>
            )}


            <form
              className="form-grid"
              onSubmit={submit}
            >

              {/* Name */}

              <TextInput
                id="customer-name"
                label="Full name"
                value={form.name}
                onChange={(event) =>
                  updateField(
                    "name",
                    event.target.value
                  )
                }
                placeholder="Enter full name"
                required
              />


              {/* Email */}

              <TextInput
                id="customer-email"
                label="Email address"
                type="email"
                value={form.email}
                onChange={(event) =>
                  updateField(
                    "email",
                    event.target.value
                  )
                }
                placeholder="customer@example.com"
                required
              />


              {/* Phone */}

              <TextInput
                id="customer-phone"
                label="Phone"
                type="tel"
                value={form.phone}
                onChange={(event) =>
                  updateField(
                    "phone",
                    event.target.value
                  )
                }
                placeholder="+91 XXXXX XXXXX"
                required
              />


              {/* Company */}

              <TextInput
                id="customer-company"
                label="Company"
                value={form.company}
                onChange={(event) =>
                  updateField(
                    "company",
                    event.target.value
                  )
                }
                placeholder="Company name"
              />


              {/* Actions */}

              <div className="form-actions form-full">

                <Button
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : edit
                      ? "Save changes"
                      : "Add customer"}
                </Button>


                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </Button>

              </div>

            </form>

          </div>

        </div>
      )}


      {/* ===================================================
          CUSTOMER LIST
          =================================================== */}

      <section className="card">

        {/* Toolbar */}

        <div className="toolbar">

          <div className="search-wrap">

            <Search size={17} />

            <input
              className="search-input"
              aria-label="Search customers"
              placeholder="Search name, email, phone, or company"
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
            />

          </div>

          <div className="toolbar-meta">
            <span>{filtered.length} shown</span>
          </div>

        </div>


        {/* Loading */}

        {loading && (
          <SkeletonRows />
        )}


        {/* Error */}

        {!loading && error && (
          <ErrorState
            message={error}
            onRetry={load}
          />
        )}


        {/* Empty */}

        {!loading &&
          !error &&
          filtered.length === 0 && (
            <EmptyState
              icon={Users}
              title={
                query
                  ? "No matching customers"
                  : "No customers yet"
              }
              description={
                query
                  ? "Try a different search term."
                  : "Add a customer to keep contact details in one place."
              }
              action={
                !query &&
                canCreate ? (
                  <Button
                    onClick={
                      openNewCustomer
                    }
                  >
                    <Plus size={15} />
                    Add customer
                  </Button>
                ) : null
              }
            />
          )}


        {/* Table */}

        {!loading &&
          !error &&
          filtered.length > 0 && (

            <div className="table-wrap">

              <table>

                <thead>

                  <tr>
                    <th>Customer</th>
                    <th>Contact</th>
                    <th>Company</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>

                </thead>


                <tbody>

                  {filtered.map(
                    (customer) => (

                      <tr
                        key={customer._id}
                      >

                        {/* Customer */}

                        <td>
                          <div className="table-leading">
                            <span className="text-strong">
                              {customer.name}
                            </span>
                            <span className="item-meta">
                              {customer.company || "No company listed"}
                            </span>
                          </div>
                        </td>


                        {/* Contact */}

                        <td>

                          <div className="table-leading">
                            <span>{customer.email || "No email"}</span>
                            <span className="item-meta">{customer.phone || "No phone"}</span>
                          </div>

                        </td>


                        {/* Company */}

                        <td>
                          <span className={customer.company ? "table-tag" : "table-tag table-tag-muted"}>
                            {customer.company || "No company"}
                          </span>
                        </td>


                        {/* Created */}

                        <td>
                          {customer.createdAt
                            ? new Date(
                                customer.createdAt
                              ).toLocaleDateString()
                            : "—"}
                        </td>


                        {/* Actions */}

                        <td>

                          <div className="table-actions">

                            {/* Edit */}

                            {canEdit && (
                              <button
                                type="button"
                                className="icon-btn"
                                aria-label={`Edit ${customer.name}`}
                                onClick={() =>
                                  editCustomer(
                                    customer
                                  )
                                }
                              >
                                <Pencil
                                  size={16}
                                />
                              </button>
                            )}


                            {/* Delete */}

                            {canDelete && (
                              <button
                                type="button"
                                className="icon-btn"
                                aria-label={`Delete ${customer.name}`}
                                onClick={() =>
                                  setRemove(
                                    customer
                                  )
                                }
                              >
                                <Trash2
                                  size={16}
                                />
                              </button>
                            )}

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

      </section>


      {/* ===================================================
          DELETE CONFIRMATION
          =================================================== */}

      <ConfirmDialog
        open={Boolean(remove)}
        title="Delete customer"
        message={
          remove
            ? `Delete “${remove.name}”? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        danger
        onCancel={() =>
          setRemove(null)
        }
        onConfirm={confirmDelete}
      />

    </div>
  );
}