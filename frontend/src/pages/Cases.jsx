import { useEffect, useMemo, useState } from "react";
import {
  FolderKanban,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import api, { getErrorMessage } from "../services/api";

import { Button } from "../components/ui/Button";
import {
  Select,
  TextArea,
  TextInput,
} from "../components/ui/Field";

import {
  Banner,
  EmptyState,
  ErrorState,
  SkeletonRows,
} from "../components/ui/Feedback";

import { StatusBadge } from "../components/ui/StatusBadge";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";

import { useAuth } from "../context/AuthContext";


/* =========================================================
   INITIAL FORM
   ========================================================= */

const blank = {
  customer: "",
  title: "",
  description: "",
  priority: "Medium",
  status: "Open",
};


/* =========================================================
   CASES PAGE
   ========================================================= */

export default function Cases() {
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [form, setForm] = useState(blank);

  const [edit, setEdit] = useState(null);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [open, setOpen] = useState(false);

  const [remove, setRemove] = useState(null);

  /* =======================================================
     USER ROLE
     ======================================================= */

  const role = user?.role || "";

  const canCreate =
    ["admin", "agent", "customer"].includes(role);

  const canEdit =
    ["admin", "agent", "customer"].includes(role);

  const canDelete =
    ["admin", "agent"].includes(role);


  /* =======================================================
     LOAD CASES
     ======================================================= */

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [casesResponse, customersResponse] =
        await Promise.all([
          api.get("/cases"),
          api.get("/customers"),
        ]);

      setItems(
        casesResponse.data?.data || []
      );

      setCustomers(
        customersResponse.data?.data || []
      );
    } catch (error) {
      setError(
        getErrorMessage(
          error,
          "Could not load cases."
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
     FILTER CASES
     ======================================================= */

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesStatus =
        status === "All" ||
        item.status === status;

      const searchableText = [
        item.title,
        item.description,
        item.customer?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !search ||
        searchableText.includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [items, query, status]);


  /* =======================================================
     OPEN NEW CASE
     ======================================================= */

  const openNewCase = () => {
    setEdit(null);

    setForm({
      ...blank,
      customer: customers[0]?._id || "",
    });

    setFormError("");
    setOpen(true);
  };


  /* =======================================================
     EDIT CASE
     ======================================================= */

  const editCase = (item) => {
    setEdit(item._id);

    setForm({
      customer:
        item.customer?._id ||
        item.customer ||
        "",

      title: item.title || "",

      description:
        item.description || "",

      priority:
        item.priority || "Medium",

      status:
        item.status || "Open",
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
    setForm(blank);
    setFormError("");
  };


  /* =======================================================
     SAVE CASE
     ======================================================= */

  const submit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setFormError("");

    try {
      if (!form.title.trim()) {
        setFormError("Case title is required.");
        return;
      }

      if (!form.description.trim()) {
        setFormError(
          "Case description is required."
        );
        return;
      }

      if (!form.customer) {
        setFormError(
          "Please select a customer."
        );
        return;
      }

      const payload = {
        customer: form.customer,
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        status: form.status,
      };

      if (edit) {
        await api.patch(
          `/cases/${edit}`,
          payload
        );
      } else {
        await api.post(
          "/cases",
          payload
        );
      }

      setOpen(false);
      setEdit(null);
      setForm(blank);

      await load();
    } catch (error) {
      setFormError(
        getErrorMessage(
          error,
          "Could not save case."
        )
      );
    } finally {
      setSaving(false);
    }
  };


  /* =======================================================
     DELETE CASE
     ======================================================= */

  const confirmDelete = async () => {
    if (!remove?._id) {
      return;
    }

    try {
      await api.delete(
        `/cases/${remove._id}`
      );

      setRemove(null);

      await load();
    } catch (error) {
      setError(
        getErrorMessage(
          error,
          "Could not delete case."
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
            Cases
          </h1>

          <p className="page-subtitle">
            Create, prioritize, update, and track
            customer support cases.
          </p>
        </div>


        {canCreate && (
          <Button
            onClick={openNewCase}
            disabled={!customers.length}
          >
            <Plus size={17} />
            New case
          </Button>
        )}

      </header>


      {/* ===================================================
          NO CUSTOMER
          =================================================== */}

      {!customers.length &&
        !loading && (
          <div
            className="banner banner-warning"
            style={{ marginBottom: 18 }}
          >
            Add a customer before opening a case.
          </div>
        )}


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
                ? "Update case"
                : "New case"}
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

              {/* Customer */}

              <Select
                id="case-customer"
                label="Customer"
                value={form.customer}
                onChange={(event) =>
                  setForm({
                    ...form,
                    customer:
                      event.target.value,
                  })
                }
                required
              >
                <option value="">
                  Select a customer
                </option>

                {customers.map((customer) => (
                  <option
                    key={customer._id}
                    value={customer._id}
                  >
                    {customer.name}
                  </option>
                ))}
              </Select>


              {/* Title */}

              <TextInput
                id="case-title"
                label="Title"
                value={form.title}
                onChange={(event) =>
                  setForm({
                    ...form,
                    title:
                      event.target.value,
                  })
                }
                placeholder="Enter case title"
                required
              />


              {/* Priority */}

              <Select
                id="case-priority"
                label="Priority"
                value={form.priority}
                onChange={(event) =>
                  setForm({
                    ...form,
                    priority:
                      event.target.value,
                  })
                }
              >
                <option value="Low">
                  Low
                </option>

                <option value="Medium">
                  Medium
                </option>

                <option value="High">
                  High
                </option>

                <option value="Urgent">
                  Urgent
                </option>
              </Select>


              {/* Status */}

              <Select
                id="case-status"
                label="Status"
                value={form.status}
                onChange={(event) =>
                  setForm({
                    ...form,
                    status:
                      event.target.value,
                  })
                }
              >
                <option value="Open">
                  Open
                </option>

                <option value="In Progress">
                  In Progress
                </option>

                <option value="Resolved">
                  Resolved
                </option>

                <option value="Closed">
                  Closed
                </option>
              </Select>


              {/* Description */}

              <div className="form-full">

                <TextArea
                  id="case-description"
                  label="Description"
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description:
                        event.target.value,
                    })
                  }
                  placeholder="Describe the customer issue..."
                  required
                />

              </div>


              {/* Buttons */}

              <div className="form-actions form-full">

                <Button
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : edit
                      ? "Save changes"
                      : "Create case"}
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
          CASE LIST
          =================================================== */}

      <section className="card">

        {/* Toolbar */}

        <div className="toolbar">

          <div className="search-wrap">

            <Search size={17} />

            <input
              className="search-input"
              aria-label="Search cases"
              placeholder="Search title, description, or customer"
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
            />

          </div>


          <Select
            id="status-filter"
            label="Filter by status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
          >
            <option value="All">
              All
            </option>

            <option value="Open">
              Open
            </option>

            <option value="In Progress">
              In Progress
            </option>

            <option value="Resolved">
              Resolved
            </option>

            <option value="Closed">
              Closed
            </option>
          </Select>

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
              icon={FolderKanban}
              title={
                query ||
                status !== "All"
                  ? "No matching cases"
                  : "No cases yet"
              }
              description={
                query ||
                status !== "All"
                  ? "Try changing your search or status filter."
                  : "Create a case to track customer support work."
              }
              action={
                customers.length > 0 &&
                canCreate ? (
                  <Button
                    onClick={openNewCase}
                  >
                    <Plus size={15} />
                    New case
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
                    <th>Case</th>
                    <th>Customer</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>

                </thead>


                <tbody>

                  {filtered.map((item) => (

                    <tr key={item._id}>

                      {/* Case */}

                      <td>

                        <strong>
                          {item.title}
                        </strong>

                        <div className="item-meta">
                          {item.description}
                        </div>

                      </td>


                      {/* Customer */}

                      <td>
                        {item.customer?.name ||
                          "Unknown"}
                      </td>


                      {/* Priority */}

                      <td>
                        <StatusBadge
                          value={item.priority}
                        />
                      </td>


                      {/* Status */}

                      <td>
                        <StatusBadge
                          value={item.status}
                        />
                      </td>


                      {/* Created */}

                      <td>
                        {item.createdAt
                          ? new Date(
                              item.createdAt
                            ).toLocaleDateString()
                          : "—"}
                      </td>


                      {/* Actions */}

                      <td>

                        <div
                          style={{
                            display: "flex",
                            gap: 4,
                          }}
                        >

                          {/* Edit */}

                          {canEdit && (
                            <button
                              type="button"
                              className="icon-btn"
                              aria-label={`Edit ${item.title}`}
                              onClick={() =>
                                editCase(item)
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
                              aria-label={`Delete ${item.title}`}
                              onClick={() =>
                                setRemove(item)
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

                  ))}

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
        title="Delete case"
        message={
          remove
            ? `Delete “${remove.title}”? This action cannot be undone.`
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