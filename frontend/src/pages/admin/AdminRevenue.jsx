import { Activity, CalendarClock, CreditCard, Crown, IndianRupee, TrendingUp, Users, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ErrorState, Skeleton, StatCard } from "../../components/admin/AdminPrimitives";
import { api } from "../../services/api";
import { currency } from "../../utils/format";

const axisTick = { fill: "#94A3B8", fontSize: 12 };
const tooltipStyle = { background: "rgb(var(--surface))", border: "1px solid rgb(var(--line))", borderRadius: 12, color: "rgb(var(--content))" };
const monthLabel = (ym = "") => {
  const [y, m] = ym.split("-");
  if (!m) return ym;
  return new Date(Number(y), Number(m) - 1).toLocaleString("en", { month: "short" });
};
const inr = (v) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`;

const ChartCard = ({ title, children, empty }) => (
  <div className="premium-card rounded-2xl p-5">
    <h3 className="mb-4 font-extrabold text-content">{title}</h3>
    {empty ? (
      <div className="grid h-56 place-items-center text-sm text-muted">Not enough data yet.</div>
    ) : (
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
    )}
  </div>
);

const Section = ({ title, children }) => (
  <section className="space-y-4">
    <h2 className="text-sm font-bold uppercase tracking-wide text-muted">{title}</h2>
    {children}
  </section>
);

export const AdminRevenue = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    setData(null);
    api
      .get("/revenue/admin")
      .then(({ data }) => setData(data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load revenue"));
  };

  useEffect(load, []);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <div className="space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40" />)}</div>;

  const { subscriptions: s, commissions: c, premium: p } = data;
  const subMonthly = s.monthly.map((m) => ({ ...m, label: monthLabel(m.month) }));
  const comMonthly = c.monthly.map((m) => ({ ...m, label: monthLabel(m.month) }));

  return (
    <div className="space-y-8">
      <Section title="Subscriptions">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Activity} label="Active subscriptions" value={s.active} tone="success" />
          <StatCard icon={CalendarClock} label="Expired" value={s.expired} tone="warn" />
          <StatCard icon={TrendingUp} label="MRR" value={currency(s.mrr)} tone="accent" sub="Monthly recurring revenue" />
          <StatCard icon={Wallet} label="ARR" value={currency(s.arr)} tone="accent" sub="Annualized" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Subscription revenue (monthly)" empty={!subMonthly.length}>
            <AreaChart data={subMonthly}>
              <defs>
                <linearGradient id="subrev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} width={70} tickFormatter={inr} />
              <Tooltip formatter={(v) => currency(v)} contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} fill="url(#subrev)" />
            </AreaChart>
          </ChartCard>
          <ChartCard title="New subscriptions (monthly)" empty={!subMonthly.length}>
            <BarChart data={subMonthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartCard>
        </div>
      </Section>

      <Section title="Commissions">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={IndianRupee} label="Total commission" value={currency(c.total)} tone="success" sub={`${c.count} completed`} />
          <StatCard icon={Wallet} label="Project volume" value={currency(c.volume)} sub="Completed value" />
          <StatCard icon={CreditCard} label="Pending commission" value={currency(c.pending)} tone="warn" />
          <StatCard icon={TrendingUp} label="Avg / project" value={currency(c.count ? Math.round(c.total / c.count) : 0)} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Commission revenue (monthly)" empty={!comMonthly.length}>
            <AreaChart data={comMonthly}>
              <defs>
                <linearGradient id="comrev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} width={70} tickFormatter={inr} />
              <Tooltip formatter={(v) => currency(v)} contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="commission" stroke="#10B981" strokeWidth={2} fill="url(#comrev)" />
            </AreaChart>
          </ChartCard>
          <ChartCard title="Revenue by category" empty={!c.byCategory.length}>
            <BarChart data={c.byCategory} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" horizontal={false} />
              <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} tickFormatter={inr} />
              <YAxis type="category" dataKey="category" tick={axisTick} axisLine={false} tickLine={false} width={90} className="capitalize" />
              <Tooltip formatter={(v) => currency(v)} contentStyle={tooltipStyle} />
              <Bar dataKey="commission" fill="#6366F1" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ChartCard>
        </div>
        <ChartCard title="Revenue by city" empty={!c.byCity.length}>
          <BarChart data={c.byCity} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" horizontal={false} />
            <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} tickFormatter={inr} />
            <YAxis type="category" dataKey="city" tick={axisTick} axisLine={false} tickLine={false} width={90} />
            <Tooltip formatter={(v) => currency(v)} contentStyle={tooltipStyle} />
            <Bar dataKey="commission" fill="#F59E0B" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ChartCard>
      </Section>

      <Section title="Premium">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Crown} label="Premium contractors" value={p.premiumContractors} tone="accent" sub={`of ${p.totalContractors} total`} />
          <StatCard icon={TrendingUp} label="Premium conversion" value={`${p.premiumConversion}%`} tone="accent" />
          <StatCard icon={Users} label="Paid conversion" value={`${p.paidConversion}%`} sub={`${p.paidContractors} paying`} />
          <StatCard icon={Wallet} label="Premium revenue" value={currency(p.premiumRevenue)} tone="success" />
        </div>
      </Section>
    </div>
  );
};
