import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  HardHat,
  Home,
  Quote,
  Star
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Field, Input, Select } from "../components/Input";
import { Logo } from "../components/ui/Logo";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/cn";

const ROLES = [
  { value: "customer", label: "I'm a customer", desc: "Post projects & get bids", icon: Home },
  { value: "contractor", label: "I'm a contractor", desc: "Find leads & win work", icon: HardHat }
];

const PERKS = ["Free to post a project", "Verified, reviewed contractors", "Realtime chat & secure payments"];

export const AuthPage = ({ mode = "login" }) => {
  const isRegister = mode === "register";
  const navigate = useNavigate();
  const { login, register, loading } = useAuth();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
    phone: "",
    city: "",
    profileImage: null
  });

  const update = (event) => {
    const { name, value, files } = event.target;
    setForm((current) => ({ ...current, [name]: files ? files[0] : value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const loggedUser = await (isRegister ? register(form) : login({ email: form.email, password: form.password }));
      navigate(loggedUser?.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-base lg:grid lg:grid-cols-2">
      {/* ----------------------- Brand panel (desktop) ----------------------- */}
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
            Build better, together — on India&rsquo;s most trusted construction marketplace.
          </h2>
          <ul className="mt-8 space-y-3">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-center gap-3 text-white/90">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-white" />
                <span className="font-medium">{perk}</span>
              </li>
            ))}
          </ul>
        </div>

        <figure className="relative rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md">
          <Quote className="h-6 w-6 text-white/50" />
          <blockquote className="mt-2 text-[0.95rem] leading-6 text-white/95">
            We found three serious bids in two days. BuildOra made the whole renovation feel effortless.
          </blockquote>
          <figcaption className="mt-4 flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/20 text-sm font-bold">PM</span>
            <div>
              <p className="text-sm font-bold">Priya Menon</p>
              <p className="inline-flex items-center gap-1 text-xs text-white/70">
                <Star className="h-3 w-3 fill-current" /> 5.0 · Homeowner
              </p>
            </div>
          </figcaption>
        </figure>
      </aside>

      {/* ------------------------------ Form ------------------------------ */}
      <section className="flex min-h-screen flex-col px-5 py-7 sm:px-8 lg:px-14">
        <div className="flex items-center justify-between">
          <Link to="/" className="lg:hidden">
            <Logo />
          </Link>
          <Link
            to="/"
            className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-content"
          >
            <ArrowLeft className="h-4 w-4" /> Back to site
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
          >
            <h1 className="font-display text-3xl font-bold tracking-tight text-content">
              {isRegister ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-2 text-muted">
              {isRegister ? "Join BuildOra in under a minute." : "Log in to manage your projects and bids."}
            </p>

            {/* Login / Register toggle */}
            <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl border border-line bg-surface-2/60 p-1">
              <Link
                to="/login"
                className={cn(
                  "rounded-lg py-2 text-center text-sm font-semibold transition",
                  !isRegister ? "bg-surface text-content shadow-sm" : "text-muted hover:text-content"
                )}
              >
                Log in
              </Link>
              <Link
                to="/register"
                className={cn(
                  "rounded-lg py-2 text-center text-sm font-semibold transition",
                  isRegister ? "bg-surface text-content shadow-sm" : "text-muted hover:text-content"
                )}
              >
                Sign up
              </Link>
            </div>

            <form onSubmit={submit} className="mt-6 grid gap-4">
              {isRegister && (
                <div>
                  <p className="mb-1.5 text-sm font-semibold text-content">I am a…</p>
                  <div className="grid grid-cols-2 gap-3">
                    {ROLES.map((r) => {
                      const active = form.role === r.value;
                      return (
                        <button
                          type="button"
                          key={r.value}
                          onClick={() => setForm((f) => ({ ...f, role: r.value }))}
                          className={cn(
                            "rounded-xl border p-3.5 text-left transition",
                            active
                              ? "border-brand bg-brand/5 ring-2 ring-brand/20"
                              : "border-line-strong hover:border-brand/40 hover:bg-surface-2/60"
                          )}
                        >
                          <r.icon className={cn("h-5 w-5", active ? "text-brand" : "text-muted")} />
                          <p className="mt-2 text-sm font-bold text-content">{r.label}</p>
                          <p className="text-xs text-subtle">{r.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {isRegister && <Input label="Full name" name="name" value={form.name} onChange={update} placeholder="Jane Doe" required />}

              <Input
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={update}
                placeholder="you@example.com"
                required
              />

              <Field label="Password">
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={update}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl border border-line-strong bg-surface px-3.5 py-3 pr-11 text-sm text-content outline-none transition placeholder:text-subtle focus:border-brand focus:ring-4 focus:ring-brand/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-subtle transition hover:bg-surface-2 hover:text-content"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              {isRegister && (
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Phone" hint="optional" name="phone" value={form.phone} onChange={update} placeholder="+91…" />
                  <Input label="City" hint="optional" name="city" value={form.city} onChange={update} placeholder="Hyderabad" />
                </div>
              )}

              {isRegister && (
                <Field label="Profile photo" hint="optional">
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line-strong bg-surface-2/40 px-3.5 py-3 text-sm text-muted transition hover:border-brand/40">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface text-brand">
                      <ArrowRight className="h-4 w-4 -rotate-90" />
                    </span>
                    <span className="truncate">{form.profileImage ? form.profileImage.name : "Upload an image"}</span>
                    <input type="file" name="profileImage" accept="image/*" onChange={update} className="hidden" />
                  </label>
                </Field>
              )}

              {error && (
                <p className="rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm font-semibold text-brand">
                  {error}
                </p>
              )}

              <Button type="submit" loading={loading} size="lg" className="w-full">
                {loading ? "Please wait…" : isRegister ? "Create account" : "Log in"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>

              {!isRegister && (
                <p className="text-center text-sm text-muted">
                  <Link className="font-semibold text-brand hover:underline" to="/forgot-password">
                    Forgot your password?
                  </Link>
                </p>
              )}

              <p className="text-center text-sm text-muted">
                {isRegister ? "Already have an account? " : "New to BuildOra? "}
                <Link className="font-bold text-brand hover:underline" to={isRegister ? "/login" : "/register"}>
                  {isRegister ? "Log in" : "Create one free"}
                </Link>
              </p>
            </form>
          </motion.div>
        </div>
      </section>
    </main>
  );
};
