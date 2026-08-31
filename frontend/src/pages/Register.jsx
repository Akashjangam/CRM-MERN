import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "../components/layout/AuthShell";
import { Button } from "../components/ui/Button";
import { FormBanner } from "../components/ui/Feedback";
import { TextInput } from "../components/ui/Field";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await register(formData);
      navigate("/", { state: { registered: true } });
    } catch (err) {
      setError(getErrorMessage(err, "Registration failed. Try a different email."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create an account"
      subtitle="Register to manage customers and support cases."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormBanner>{error}</FormBanner>

        <TextInput
          id="name"
          name="name"
          type="text"
          label="Name"
          autoComplete="name"
          placeholder="Alex Rivera"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <TextInput
          id="email"
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          placeholder="you@company.com"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <TextInput
          id="password"
          name="password"
          type="password"
          label="Password"
          autoComplete="new-password"
          hint="At least 6 characters."
          placeholder="Create a password"
          minLength={6}
          value={formData.password}
          onChange={handleChange}
          required
        />

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Already registered?{" "}
        <Link to="/" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

export default Register;
