import { useEffect, useMemo, useState } from "react";
import { FolderKanban, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import {
  EmptyState,
  ErrorState,
  FormBanner,
  SkeletonRows,
} from "../components/ui/Feedback";
import { Select, TextArea, TextInput } from "../components/ui/Field";
import { StatusBadge } from "../components/ui/StatusBadge";
import api, { getErrorMessage } from "../services/api";

const emptyForm = {
  customer: "",
  title: "",
  description: "",
  priority: "Medium",
  status: "Open",
};

function customerName(item) {
  if (!item) return "Unknown customer";
  if (typeof item === "object") return item.name || "Unknown customer";
  return "Unknown customer";
}

function Cases() {
  const [cases, setCases] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [caseRes, customerRes] = await Promise.all([
        api.get("/cases"),
        api.get("/customers"),
      ]);
      setCases(caseRes.data.data || []);
      setCustomers(customerRes.data.data || []);
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
      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;
      const haystack = [
        item.title,
        item.description,
        customerName(item.customer),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesQuery = !term || haystack.includes(term);
      return matchesStatus && matchesQuery;
    });
  }, [cases, query, statusFilter]);

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setFormError("");
    setFormOpen(false);
  };

  const startCreate = () => {
    setFormData({
      ...emptyForm,
      customer: customers[0]?._id || "",
    });
    setEditingId(null);
    setFormError("");
    setFormOpen(true);
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      customer: item.customer?._id || item.customer || "",
      title: item.title || "",
      description: item.description || "",
      priority: item.priority || "Medium",
      status: item.status || "Open",
    });
    setFormError("");
    setFormOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      if (editingId) {
        await api.patch(`/cases/${editingId}`, formData);
      } else {
        await api.post("/cases", formData);
      }
      resetForm();
      await load();
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not save the case."));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    try {
      await api.delete(`/cases/${pendingDelete._id}`);
      setPendingDelete(null);
      await load();
    } catch (err) {
      setPendingDelete(null);
      setError(getErrorMessage(err, "Could not delete the case."));
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cases</h1>
          <p className="mt-1 text-sm text-muted">
            Track support work against a customer record.
          </p>
        </div>
        <Button onClick={startCreate} disabled={customers.length === 0 && !loading}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New case
        </Button>
      </header>

      {formOpen ? (
        <section className="rounded-md border border-line bg-surface p-4 sm:p-5">
          <h2 className="text-sm font-semibold">
            {editingId ? "Update case" : "New case"}
          </h2>
          {customers.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              Add a customer before opening a case.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <FormBanner>{formError}</FormBanner>
              </div>
              <Select
                id="case-customer"
                name="customer"
                label="Customer"
                value={formData.customer}
                onChange={handleChange}
                required
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer._id} value={customer._id}>
                    {customer.name}
                  </option>
                ))}
              </Select>
              <TextInput
                id="case-title"
                name="title"
                label="Title"
                value={formData.title}
                onChange={handleChange}
                required
              />
              <Select
                id="case-priority"
                name="priority"
                label="Priority"
                value={formData.priority}
                onChange={handleChange}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </Select>
              <Select
                id="case-status"
                name="status"
                label="Status"
                value={formData.status}
                onChange={handleChange}
              >
                <option>Open</option>
                <option>In Progress</option>
                <option>Closed</option>
              </Select>
              <div className="md:col-span-2">
                <TextArea
                  id="case-description"
                  name="description"
                  label="Description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="flex gap-2 md:col-span-2">
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? "Saving…"
                    : editingId
                      ? "Save changes"
                      : "Create case"}
                </Button>
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </section>
      ) : null}

      <section className="rounded-md border border-line bg-surface">
        <div className="flex flex-col gap-3 border-b border-line p-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, description, or customer"
              aria-label="Search cases"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </div>
          <Select
            id="status-filter"
            label="Status filter"
            hideLabel
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="sm:w-44"
          >
            <option>All</option>
            <option>Open</option>
            <option>In Progress</option>
            <option>Closed</option>
          </Select>
        </div>

        {loading ? (
          <div className="p-4">
            <SkeletonRows />
          </div>
        ) : error ? (
          <div className="p-4">
            <ErrorState message={error} onRetry={load} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title={query || statusFilter !== "All" ? "No matching cases" : "No cases yet"}
            description={
              customers.length === 0
                ? "Add a customer first, then open a case against their record."
                : "Create a case to track follow-up work."
            }
            action={
              customers.length === 0
                ? undefined
                : { label: "New case", onClick: startCreate }
            }
          />
        ) : (
          <ul role="list" className="divide-y divide-line">
            {filtered.map((item) => (
              <li
                key={item._id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    {customerName(item.customer)}
                  </p>
                  <p className="mt-2 max-w-2xl text-sm text-ink/80">
                    {item.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge value={item.priority} />
                    <StatusBadge value={item.status} />
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Edit ${item.title}`}
                    onClick={() => startEdit(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Delete ${item.title}`}
                    onClick={() => setPendingDelete(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete case"
        message={
          pendingDelete
            ? `Delete “${pendingDelete.title}”? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        danger
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default Cases;
