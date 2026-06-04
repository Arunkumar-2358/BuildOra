import { CreditCard, IndianRupee, TrendingUp, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ErrorState, Skeleton, StatCard, StatusBadge } from "../components/admin/AdminPrimitives";
import { api } from "../services/api";
import { currency, shortDate } from "../utils/format";

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

export const ContractorRevenue = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    setData(null);
    api
      .get("/revenue/me")
      .then(({ data }) => setData(data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load earnings"));
  };

  useEffect(load, []);

  if (error) return <main className="mx-auto max-w-5xl px-4 py-10"><ErrorState message={error} onRetry={load} /></main>;
  if (!data)
    return (
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-10">
        {[0, 1].map((i) => <Skeleton key={i} className="h-40" />)}
      </main>
    );

  const monthly = data.monthly.map((m) => ({ ...m, label: monthLabel(m.month) }));

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-content">Earnings</h1>
          <p className="text-muted">Your payouts from completed BuildOra projects.</p>
        </div>
        <Link to="/membership" className="text-sm font-bold text-accent hover:underline">
          Manage membership →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Wallet} label="Total earned" value={currency(data.totalEarned)} tone="success" sub={`${data.completedProjects} projects`} />
        <StatCard icon={CreditCard} label="Pending" value={currency(data.pendingEarned)} tone="warn" sub="Awaiting completion" />
        <StatCard icon={IndianRupee} label="Commission paid" value={currency(data.commissionPaid)} sub="3% platform fee" />
        <StatCard icon={TrendingUp} label="Subscription spend" value={currency(data.subscriptionSpend)} sub="Lifetime" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Earnings (monthly)" empty={!monthly.length}>
          <AreaChart data={monthly}>
            <defs>
              <linearGradient id="earn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} width={70} tickFormatter={inr} />
            <Tooltip formatter={(v) => currency(v)} contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="earning" stroke="#10B981" strokeWidth={2} fill="url(#earn)" />
          </AreaChart>
        </ChartCard>
        <ChartCard title="Earnings by category" empty={!data.byCategory.length}>
          <BarChart data={data.byCategory} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" horizontal={false} />
            <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} tickFormatter={inr} />
            <YAxis type="category" dataKey="category" tick={axisTick} axisLine={false} tickLine={false} width={90} className="capitalize" />
            <Tooltip formatter={(v) => currency(v)} contentStyle={tooltipStyle} />
            <Bar dataKey="earning" fill="#2563EB" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ChartCard>
      </div>

      <section className="premium-card overflow-hidden rounded-2xl">
        <div className="border-b border-line/60 px-5 py-4">
          <h2 className="font-extrabold text-content">Recent projects</h2>
        </div>
        {data.recent.length ? (
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line/60 text-xs uppercase text-muted">
                <tr>
                  <th className="px-5 py-3 font-bold">Project</th>
                  <th className="px-5 py-3 font-bold">Value</th>
                  <th className="px-5 py-3 text-right font-bold">Your earning</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 font-bold">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((r) => (
                  <tr key={r.id} className="border-b border-line/40 last:border-0 hover:bg-surface-2/40">
                    <td className="px-5 py-3 font-semibold text-content">{r.project}</td>
                    <td className="px-5 py-3 text-muted">{currency(r.amount)}</td>
                    <td className="px-5 py-3 text-right font-bold text-success">{currency(r.earning)}</td>
                    <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-5 py-3 text-xs text-muted">{shortDate(r.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-muted">No completed projects yet. Win a bid to start earning.</p>
        )}
      </section>
    </main>
  );
};
