import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import {
  EmptyState,
  ErrorState,
  FormBanner,
  SkeletonRows,
} from "../components/ui/Feedback";
import { TextInput } from "../components/ui/Field";
import api, { getErrorMessage } from "../services/api";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
};

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState("");
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
      const response = await api.get("/customers");
      setCustomers(response.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load customers."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((customer) =>
      [customer.name, customer.email, customer.phone, customer.company]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [customers, query]);

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
    setFormData(emptyForm);
    setEditingId(null);
    setFormError("");
    setFormOpen(true);
  };

  const startEdit = (customer) => {
    setEditingId(customer._id);
    setFormData({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      company: customer.company || "",
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
        await api.patch(`/customers/${editingId}`, formData);
      } else {
        await api.post("/customers", formData);
      }
      resetForm();
      await load();
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not save the customer."));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    try {
      await api.delete(`/customers/${pendingDelete._id}`);
      setPendingDelete(null);
      await load();
    } catch (err) {
      setPendingDelete(null);
      setError(getErrorMessage(err, "Could not delete the customer."));
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="mt-1 text-sm text-muted">
            Directory of people and companies you work with.
          </p>
        </div>
        <Button onClick={startCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add customer
        </Button>
      </header>

      {formOpen ? (
        <section className="rounded-md border border-line bg-surface p-4 sm:p-5">
          <h2 className="text-sm font-semibold">
            {editingId ? "Update customer" : "New customer"}
          </h2>
          <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <FormBanner>{formError}</FormBanner>
            </div>
            <TextInput
              id="customer-name"
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              id="customer-email"
              name="email"
              type="email"
              label="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <TextInput
              id="customer-phone"
              name="phone"
              type="tel"
              label="Phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
            <TextInput
              id="customer-company"
              name="company"
              label="Company"
              value={formData.company}
              onChange={handleChange}
            />
            <div className="flex gap-2 md:col-span-2">
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Saving…"
                  : editingId
                    ? "Save changes"
                    : "Add customer"}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="rounded-md border border-line bg-surface">
        <div className="flex items-center gap-2 border-b border-line p-3">
          <Search className="h-4 w-4 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email, phone, or company"
            aria-label="Search customers"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
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
            icon={Users}
            title={query ? "No matching customers" : "No customers yet"}
            description={
              query
                ? "Try a different search term."
                : "Add a customer to keep contact details in one place."
            }
            action={query ? undefined : { label: "Add customer", onClick: startCreate }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="border-b border-line bg-canvas text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Email</th>
                  <th className="px-4 py-2 font-medium">Phone</th>
                  <th className="px-4 py-2 font-medium">Company</th>
                  <th className="px-4 py-2 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((customer) => (
                  <tr key={customer._id} className="bg-surface">
                    <td className="px-4 py-3 font-medium">{customer.name}</td>
                    <td className="px-4 py-3 text-muted">{customer.email}</td>
                    <td className="px-4 py-3 text-muted">{customer.phone}</td>
                    <td className="px-4 py-3 text-muted">
                      {customer.company || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Edit ${customer.name}`}
                          onClick={() => startEdit(customer)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Delete ${customer.name}`}
                          onClick={() => setPendingDelete(customer)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete customer"
        message={
          pendingDelete
            ? `Remove ${pendingDelete.name} from the directory? This cannot be undone.`
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

export default Customers;
