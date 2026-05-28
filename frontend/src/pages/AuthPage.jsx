import { BadgeCheck, Building2, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Input, Select } from "../components/Input";
import { useAuth } from "../context/AuthContext";

export const AuthPage = ({ mode = "login" }) => {
  const isRegister = mode === "register";
  const navigate = useNavigate();
  const { login, register, loading } = useAuth();
  const [error, setError] = useState("");
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
      await (isRegister ? register(form) : login({ email: form.email, password: form.password }));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <main className="mx-auto grid min-h-[calc(100vh-76px)] max-w-6xl items-center gap-10 px-4 py-10 md:grid-cols-2">
      <motion.section initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="premium-card rounded-2xl p-6 shadow-soft md:p-8">
        <div className="mb-6 inline-grid h-14 w-14 place-items-center rounded-lg bg-white text-ink">
          <Building2 />
        </div>
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-bold text-blue-100">
          <Sparkles className="h-4 w-4 text-emerald-300" />
          Founder-demo ready marketplace
        </p>
        <h1 className="text-4xl font-extrabold text-slate-100">{isRegister ? "Create your Buildora account" : "Welcome back to Buildora"}</h1>
        <p className="mt-4 text-lg leading-8 text-slate-300">
          Customers post requirements. Contractors find qualified construction and interior leads with clean bidding and realtime chat.
        </p>
        <div className="mt-8 grid gap-3">
          {[
            [ShieldCheck, "JWT protected role-based flows"],
            [BadgeCheck, "Project, bid, profile, and chat modules"],
            [Sparkles, "Premium UI for investor walkthroughs"]
          ].map(([Icon, text]) => (
            <div key={text} className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-sm font-bold text-slate-300">
              <Icon className="h-5 w-5 text-blue-300" />
              {text}
            </div>
          ))}
        </div>
      </motion.section>
      <motion.form initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} onSubmit={submit} className="premium-card rounded-2xl p-6 shadow-soft">
        <div className="grid gap-4">
          {isRegister && <Input label="Name" name="name" value={form.name} onChange={update} required />}
          <Input label="Email" name="email" type="email" value={form.email} onChange={update} required />
          <Input label="Password" name="password" type="password" value={form.password} onChange={update} required />
          {isRegister && (
            <>
              <Select label="Role" name="role" value={form.role} onChange={update}>
                <option value="customer">Customer</option>
                <option value="contractor">Contractor</option>
              </Select>
              <Input label="Phone" name="phone" value={form.phone} onChange={update} />
              <Input label="City" name="city" value={form.city} onChange={update} />
              <Input label="Profile image" name="profileImage" type="file" accept="image/*" onChange={update} />
            </>
          )}
          {error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">{error}</p>}
          <Button disabled={loading} className="w-full py-3">
            {loading ? "Please wait..." : isRegister ? "Create account" : "Login"}
          </Button>
          <p className="text-center text-sm text-slate-400">
            {isRegister ? "Already have an account?" : "New to Buildora?"}{" "}
            <Link className="font-bold text-blue-300" to={isRegister ? "/login" : "/register"}>
              {isRegister ? "Login" : "Register"}
            </Link>
          </p>
        </div>
      </motion.form>
    </main>
  );
};
