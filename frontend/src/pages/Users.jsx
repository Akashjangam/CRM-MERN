import { useEffect, useState } from "react";
import { Pencil, Plus, ShieldCheck, Trash2, Users as UsersIcon } from "lucide-react";
import api, { getErrorMessage } from "../services/api";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState, ErrorState, SkeletonRows } from "../components/ui/Feedback";
import { Select, TextInput } from "../components/ui/Field";
import { StatusBadge } from "../components/ui/StatusBadge";

const blank = { name: "", email: "", password: "", role: "agent" };

function initials(name = "User") { return name.split(" ").filter(Boolean).slice(0, 2).map((x) => x[0]?.toUpperCase()).join("") || "U"; }

export default function Users() {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try { const response = await api.get("/users"); setUsers(response.data?.data || []); }
    catch (err) { setError(getErrorMessage(err, "Could not load users.")); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setFormError("");
    try {
      if (!form.name.trim() || !form.email.trim()) throw new Error("Name and email are required.");
      if (!editing && form.password.length < 6) throw new Error("Password must be at least 6 characters.");
      const payload = { ...form }; if (editing && !payload.password) delete payload.password;
      if (editing) await api.patch(`/users/${editing}`, payload); else await api.post("/users", payload);
      setOpen(false); setEditing(null); setForm(blank); await load();
    } catch (err) { setFormError(getErrorMessage(err, "Could not save user.")); }
    finally { setSaving(false); }
  };

  const edit = (u) => { setEditing(u._id); setForm({ name: u.name || "", email: u.email || "", password: "", role: u.role || "agent" }); setFormError(""); setOpen(true); };
  const remove = async () => {
    if (!pendingDelete) return;
    try { await api.delete(`/users/${pendingDelete._id}`); setPendingDelete(null); await load(); }
    catch (err) { setPendingDelete(null); setError(getErrorMessage(err, "Could not delete user.")); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div><div className="eyebrow">Access control</div><h1 className="page-title">Users</h1><p className="page-description">Manage CRM users and their roles. Admin access should be granted deliberately.</p></div>
        <Button onClick={() => { setEditing(null); setForm(blank); setOpen(true); }}><Plus size={16} /> Add user</Button>
      </div>
      {error && <div className="page-alert">{error}</div>}
      <section className="panel data-panel">
        {loading ? <SkeletonRows count={7} /> : users.length === 0 ? <EmptyState icon={UsersIcon} title="No users found" description="Create a user to give your team access." /> : (
          <div className="desktop-table-wrap">
            <table className="crm-table">
              <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Created</th><th className="align-right">Actions</th></tr></thead>
              <tbody>{users.map((u) => <tr key={u._id}><td><div className="person-cell"><div className="avatar">{initials(u.name)}</div><div><div className="cell-primary">{u.name}</div><div className="cell-secondary">{u.role === "admin" ? "Administrator" : "CRM member"}</div></div></div></td><td>{u.email}</td><td><span className="role-badge"><ShieldCheck size={12} /> {u.role}</span></td><td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "â€”"}</td><td><div className="row-actions"><button className="icon-button" onClick={() => edit(u)} aria-label={`Edit ${u.name}`}><Pencil size={15} /></button><button className="icon-button danger-icon" onClick={() => setPendingDelete(u)} aria-label={`Delete ${u.name}`}><Trash2 size={15} /></button></div></td></tr>)}</tbody>
            </table>
          </div>
        )}
      </section>
      {open && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
        <div className="drawer" role="dialog" aria-modal="true"><div className="drawer-header"><div><div className="eyebrow">Team member</div><h2>{editing ? "Edit user" : "Add user"}</h2></div><button className="icon-button" onClick={() => setOpen(false)} aria-label="Close">Ã—</button></div>
          <form className="drawer-body" onSubmit={save}>{formError && <div className="form-error">{formError}</div>}<TextInput id="user-name" label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /><TextInput id="user-email" label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /><TextInput id="user-password" label={editing ? "New password" : "Password"} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} hint={editing ? "Leave blank to keep the current password." : "At least 6 characters."} required={!editing} /><Select id="user-role" label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="agent">Agent</option><option value="admin">Admin</option><option value="customer">Customer</option></Select><div className="drawer-actions"><button type="button" className="button button-secondary" onClick={() => setOpen(false)}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? "Saving..." : editing ? "Save changes" : "Create user"}</button></div></form>
        </div>
      </div>}
      <ConfirmDialog open={Boolean(pendingDelete)} title="Delete user?" message={pendingDelete ? `Remove ${pendingDelete.name} from the CRM?` : ""} confirmLabel="Delete user" danger onCancel={() => setPendingDelete(null)} onConfirm={remove} />
    </div>
  );
}

