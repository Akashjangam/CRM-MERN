import { useState } from "react";
import { ArrowRight, BriefcaseBusiness, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";

export default function Register() {
  const { register, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [show, setShow] = useState(false);
  const [localError, setLocalError] = useState("");

  const submit = async (e) => {
    e.preventDefault(); setLocalError(""); clearError();
    if (form.name.trim().length < 2) return setLocalError("Enter your full name.");
    if (form.password.length < 6) return setLocalError("Password must be at least 6 characters.");
    try { await register({ ...form, name: form.name.trim(), email: form.email.trim().toLowerCase() }); navigate("/dashboard", { replace: true }); }
    catch (err) { setLocalError(getErrorMessage(err, "Unable to create your account.")); }
  };

  return <div className="auth-layout auth-register-layout">
    <section className="auth-visual"><div className="auth-visual-inner"><div className="auth-logo"><BriefcaseBusiness size={19}/><span>NexaCRM</span></div><div className="auth-visual-copy"><div className="eyebrow auth-eyebrow">Start organized</div><h1>Give your customer work a single home.</h1><p>Create your workspace and keep customer information, cases and interactions connected.</p></div><div className="auth-proof"><div><strong>Fast setup</strong><span>Start with a simple account</span></div><div><strong>Clear ownership</strong><span>Track who is responsible</span></div><div><strong>Better follow-up</strong><span>Keep important context visible</span></div></div></div></section>
    <main className="auth-panel"><div className="auth-card"><div className="auth-mobile-logo"><div className="logo-symbol"><BriefcaseBusiness size={18}/></div><strong>NexaCRM</strong></div><div className="auth-heading"><h2>Create your account</h2><p>Set up your CRM workspace in a minute.</p></div>{(localError || error) && <div className="form-error">{localError || error}</div>}<form className="auth-form" onSubmit={submit}>
      <label className="field"><span className="field-label">Full name</span><input autoComplete="name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Your name" required/></label>
      <label className="field"><span className="field-label">Email address</span><input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="you@company.com" required/></label>
      <label className="field"><span className="field-label">Password</span><div className="password-field"><input type={show ? "text" : "password"} autoComplete="new-password" minLength={6} value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} placeholder="At least 6 characters" required/><button type="button" onClick={() => setShow((v) => !v)} aria-label="Toggle password visibility">{show ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div><span className="field-hint">Use at least 6 characters.</span></label>
      <button className="button button-primary auth-submit" disabled={loading}>{loading ? "Creating account..." : <>Create account <ArrowRight size={16}/></>}</button>
    </form><div className="auth-divider"><span>Already have an account?</span></div><Link className="button button-secondary auth-register" to="/">Sign in</Link></div></main>
  </div>;
}

