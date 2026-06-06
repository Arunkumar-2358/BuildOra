import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, ShieldCheck, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { Field } from "../components/Input";
import { Logo } from "../components/ui/Logo";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { cn } from "../lib/cn";

// Password strength rules — each returns true when the criterion is met
const RULES = [
  { id: "length", label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { id: "upper", label: "At least one uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { id: "number", label: "At least one number", test: (pw) => /[0-9]/.test(pw) },
  { id: "match", label: "Passwords match", test: (pw, confirm) => pw.length > 0 && pw === confirm }
];

const StrengthRow = ({ label, met }) => (
  <li className={cn("flex items-center gap-2 text-xs transition-colors", met ? "text-success" : "text-muted")}>
    {met ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <XCircle className="h-3.5 w-3.5 shrink-0 opacity-40" />}
    {label}
  </li>
);

const PasswordInput = ({ label, name, value, onChange }) => {
  const [show, setShow] = useState(false);
  return (
    <Field label={label}>
      <div className="relative">
        <input
          name={name}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder="••••••••"
          required
          className="w-full rounded-xl border border-line-strong bg-surface px-3.5 py-3 pr-11 text-sm text-content outline-none transition placeholder:text-subtle focus:border-brand focus:ring-4 focus:ring-brand/15"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-subtle transition hover:bg-surface-2 hover:text-content"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </Field>
  );
};

export const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login: setSession } = useAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Check if the link looks obviously invalid before even submitting
  const isInvalidLink = !token || token.length < 32;

  const allRulesMet = RULES.every((r) => r.test(password, confirm));

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!allRulesMet) {
      setError("Please meet all the password requirements below.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password });
      // Auto-login: persist session, then show success briefly before redirecting
      localStorage.setItem("buildora_token", data.token);
      localStorage.setItem("buildora_user", JSON.stringify(data.user));
      setSuccess(true);
      setTimeout(() => navigate(data.user?.role === "admin" ? "/admin" : "/dashboard"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (isInvalidLink) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-base px-5">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-brand/10">
            <XCircle className="h-10 w-10 text-brand" />
          </div>
          <h1 className="font-display text-2xl font-bold text-content">Invalid reset link</h1>
          <p className="mt-3 text-muted">
            This password reset link is invalid or has already been used. Please request a new one.
          </p>
          <Link
            to="/forgot-password"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-600"
          >
            Request new link
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-base lg:grid lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-brand-gradient p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 blueprint-grid opacity-20" />
        <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-spark/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

        <div className="relative">
          <Link to="/">
            <Logo gradient={false} wordClassName="text-white" />
          </Link>
        </div>

        <div className="relative">
          <h2 className="max-w-md font-display text-4xl font-bold leading-tight">
            Create a strong, secure password for your account.
          </h2>
          <p className="mt-4 max-w-sm text-white/80">
            Use at least 8 characters, mix uppercase letters and numbers to keep your account safe.
          </p>
        </div>

        <div className="relative flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/20">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-white">One-time secure link</p>
            <p className="text-sm text-white/70">This link expires 15 minutes after it was sent</p>
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <section className="flex min-h-screen flex-col px-5 py-7 sm:px-8 lg:px-14">
        <div className="flex items-center justify-between">
          <Link to="/" className="lg:hidden">
            <Logo />
          </Link>
          <Link
            to="/login"
            className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-content"
          >
            <ArrowLeft className="h-4 w-4" /> Back to login
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
          >
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-success/10">
                  <CheckCircle2 className="h-10 w-10 text-success" />
                </div>
                <h1 className="font-display text-3xl font-bold text-content">Password updated!</h1>
                <p className="mt-3 text-muted">
                  Your password has been reset. Redirecting you to your dashboard…
                </p>
                <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <motion.div
                    className="h-full rounded-full bg-brand"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, ease: "linear" }}
                  />
                </div>
              </motion.div>
            ) : (
              <>
                <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-brand/10">
                  <Lock className="h-7 w-7 text-brand" />
                </div>

                <h1 className="font-display text-3xl font-bold tracking-tight text-content">
                  Set new password
                </h1>
                <p className="mt-2 text-muted">
                  Choose a strong password for your BuildOra account.
                </p>

                <form onSubmit={submit} className="mt-8 grid gap-4">
                  <PasswordInput
                    label="New password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  <PasswordInput
                    label="Confirm password"
                    name="confirm"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />

                  {/* Strength checklist */}
                  {password && (
                    <motion.ul
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-1.5 rounded-xl border border-line bg-surface-2/60 px-4 py-3"
                    >
                      {RULES.map((r) => (
                        <StrengthRow
                          key={r.id}
                          label={r.label}
                          met={r.test(password, confirm)}
                        />
                      ))}
                    </motion.ul>
                  )}

                  {error && (
                    <p className="rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm font-semibold text-brand">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    loading={loading}
                    disabled={!allRulesMet}
                    size="lg"
                    className="w-full"
                  >
                    {loading ? "Updating…" : "Update password"}
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-muted">
                  Link expired?{" "}
                  <Link to="/forgot-password" className="font-bold text-brand hover:underline">
                    Request a new one
                  </Link>
                </p>
              </>
            )}
          </motion.div>
        </div>
      </section>
    </main>
  );
};
