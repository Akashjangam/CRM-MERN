import { useState } from "react";
import { ArrowRight, BriefcaseBusiness, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";

export default function Login() {
  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  const submit = async (e) => {
    e.preventDefault(); setLocalError(""); clearError();
    if (!email.trim() || !password) return setLocalError("Enter your email and password.");
    try { await login({ email: email.trim(), password }); navigate(location.state?.from?.pathname || "/dashboard", { replace: true }); }
    catch (err) { setLocalError(getErrorMessage(err, "Unable to sign in.")); }
  };

  return <div className="auth-layout">
    <section className="auth-visual">
      <div className="auth-visual-inner">
        <div className="auth-logo"><BriefcaseBusiness size={19}/><span>NexaCRM</span></div>
        <div className="auth-visual-copy"><div className="eyebrow auth-eyebrow">Customer operations</div><h1>Keep every customer conversation moving.</h1><p>One workspace for customers, cases, activities and the work your team needs to get done.</p></div>
        <div className="auth-proof"><div><strong>Customer records</strong><span>Organized and accessible</span></div><div><strong>Case management</strong><span>From issue to resolution</span></div><div><strong>Activity history</strong><span>A complete customer timeline</span></div></div>
      </div>
    </section>
    <main className="auth-panel"><div className="auth-card">
      <div className="auth-mobile-logo"><div className="logo-symbol"><BriefcaseBusiness size={18}/></div><strong>NexaCRM</strong></div>
      <div className="auth-heading"><h2>Welcome back</h2><p>Sign in to your CRM workspace.</p></div>
      {(localError || error) && <div className="form-error">{localError || error}</div>}
      <form className="auth-form" onSubmit={submit}>
        <label className="field"><span className="field-label">Email address</span><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required/></label>
        <label className="field"><span className="field-label">Password</span><div className="password-field"><input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required/><button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>
        <button className="button button-primary auth-submit" disabled={loading}>{loading ? "Signing in..." : <>Sign in <ArrowRight size={16}/></>}</button>
      </form>
      <div className="auth-divider"><span>New to NexaCRM?</span></div>
      <Link className="button button-secondary auth-register" to="/register">Create an account</Link>
      <div className="auth-security"><LockKeyhole size={14}/> Secure authentication</div>
    </div></main>
  </div>;
}

