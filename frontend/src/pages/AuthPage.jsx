import { BadgeCheck, Building2, ShieldCheck, Sparkles } from "lucide-react";
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
      <section className="rounded-lg bg-ink p-6 text-white shadow-soft md:p-8">
        <div className="mb-6 inline-grid h-14 w-14 place-items-center rounded-lg bg-white text-ink">
          <Building2 />
        </div>
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-bold text-white/70">
          <Sparkles className="h-4 w-4 text-gold" />
          Founder-demo ready marketplace
        </p>
        <h1 className="text-4xl font-extrabold">{isRegister ? "Create your Buildora account" : "Welcome back to Buildora"}</h1>
        <p className="mt-4 text-lg leading-8 text-white/65">
          Customers post requirements. Contractors find qualified construction and interior leads with clean bidding and realtime chat.
        </p>
        <div className="mt-8 grid gap-3">
          {[
            [ShieldCheck, "JWT protected role-based flows"],
            [BadgeCheck, "Project, bid, profile, and chat modules"],
            [Sparkles, "Premium UI for investor walkthroughs"]
          ].map(([Icon, text]) => (
            <div key={text} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-sm font-bold text-white/75">
              <Icon className="h-5 w-5 text-gold" />
              {text}
            </div>
          ))}
        </div>
      </section>
      <form onSubmit={submit} className="premium-card rounded-lg p-6 shadow-soft">
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
          {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
          <Button disabled={loading} className="w-full py-3">
            {loading ? "Please wait..." : isRegister ? "Create account" : "Login"}
          </Button>
          <p className="text-center text-sm text-ink/65">
            {isRegister ? "Already have an account?" : "New to Buildora?"}{" "}
            <Link className="font-bold text-moss" to={isRegister ? "/login" : "/register"}>
              {isRegister ? "Login" : "Register"}
            </Link>
          </p>
        </div>
      </form>
    </main>
  );
};
