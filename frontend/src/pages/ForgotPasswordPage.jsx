import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Mail, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Logo } from "../components/ui/Logo";
import { api } from "../services/api";

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
          <h2 className="max-w-md text-balance font-display text-4xl font-bold leading-tight">
            Forgot your password? No worries — we've got you covered.
          </h2>
          <p className="mt-4 max-w-sm text-white/80">
            We'll send a secure reset link to your email. The link expires in 15 minutes for your security.
          </p>
        </div>

        <div className="relative flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/20">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-white">Secure email delivery</p>
            <p className="text-sm text-white/70">Reset links are one-time use and expire in 15 minutes</p>
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
            {!sent ? (
              <>
                <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-brand/10">
                  <Mail className="h-7 w-7 text-brand" />
                </div>

                <h1 className="font-display text-3xl font-bold tracking-tight text-content">
                  Reset your password
                </h1>
                <p className="mt-2 text-muted">
                  Enter your email address and we'll send you a secure link to reset your password.
                </p>

                <form onSubmit={submit} className="mt-8 grid gap-4">
                  <Input
                    label="Email address"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                  />

                  {error && (
                    <p className="rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm font-semibold text-brand">
                      {error}
                    </p>
                  )}

                  <Button type="submit" loading={loading} size="lg" className="w-full">
                    {loading ? "Sending…" : "Send reset link"}
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-muted">
                  Remember your password?{" "}
                  <Link to="/login" className="font-bold text-brand hover:underline">
                    Log in
                  </Link>
                </p>
              </>
            ) : (
              /* Success state */
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-success/10">
                  <CheckCircle2 className="h-10 w-10 text-success" />
                </div>

                <h1 className="font-display text-3xl font-bold text-content">Check your inbox</h1>
                <p className="mt-3 text-muted">
                  If an account with <strong>{email}</strong> exists, we've sent password reset instructions.
                </p>

                <div className="mt-6 rounded-2xl border border-line bg-surface-2/60 p-5 text-left">
                  <p className="text-sm font-semibold text-content">What to do next:</p>
                  <ol className="mt-3 space-y-2 text-sm text-muted">
                    <li className="flex gap-2.5">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand text-[0.65rem] font-bold text-white">1</span>
                      Check your email inbox (and spam folder)
                    </li>
                    <li className="flex gap-2.5">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand text-[0.65rem] font-bold text-white">2</span>
                      Click the reset link — it expires in <strong>15 minutes</strong>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand text-[0.65rem] font-bold text-white">3</span>
                      Set your new password and log in
                    </li>
                  </ol>
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    type="button"
                    onClick={() => { setSent(false); setEmail(""); }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface py-3 text-sm font-semibold text-muted transition hover:border-brand/40 hover:text-brand"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Try a different email
                  </button>
                  <Link
                    to="/login"
                    className="flex w-full items-center justify-center rounded-xl bg-brand py-3 text-sm font-bold text-white transition hover:bg-brand-600"
                  >
                    Back to login
                  </Link>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>
    </main>
  );
};
