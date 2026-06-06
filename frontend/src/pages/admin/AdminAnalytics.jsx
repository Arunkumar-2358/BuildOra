import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { ErrorState, Skeleton } from "../../components/admin/AdminPrimitives";
import { api } from "../../services/api";
import { currency } from "../../utils/format";

const COLORS = ["#D62D14", "#FB7A1E", "#0F9D6B", "#8C1A0B", "#FFA64D", "#B3A69D"];
const axisTick = { fill: "#94A3B8", fontSize: 12 };

const monthLabel = (ym = "") => {
  const [y, m] = ym.split("-");
  if (!m) return ym;
  return new Date(Number(y), Number(m) - 1).toLocaleString("en", { month: "short" });
};

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

export const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    setData(null);
    api
      .get("/admin/analytics")
      .then(({ data }) => setData(data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load analytics"));
  };

  useEffect(load, []);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-72" />)}
      </div>
    );
  }

  const revenue = data.revenueGrowth.map((r) => ({ ...r, label: monthLabel(r.month) }));
  const users = data.userGrowth.map((u) => ({ ...u, label: monthLabel(u.month) }));
  const projects = data.projectStats;
  const contractors = data.topContractors;
  const contractorsByCity = data.contractorsByCity || [];
  const projectsByCity = data.projectsByCity || [];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Revenue growth (commissions)" empty={revenue.length === 0}>
        <AreaChart data={revenue}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D62D14" stopOpacity={0.7} />
              <stop offset="95%" stopColor="#D62D14" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
          <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} width={70} tickFormatter={(v) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`} />
          <Tooltip formatter={(v) => currency(v)} contentStyle={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--line))", borderRadius: 12, color: "rgb(var(--content))" }} />
          <Area type="monotone" dataKey="revenue" stroke="#D62D14" strokeWidth={2} fill="url(#rev)" />
        </AreaChart>
      </ChartCard>

      <ChartCard title="Monthly transactions" empty={revenue.length === 0}>
        <BarChart data={revenue}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
          <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
          <Tooltip contentStyle={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--line))", borderRadius: 12, color: "rgb(var(--content))" }} />
          <Bar dataKey="transactions" fill="#D62D14" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="User growth" empty={users.length === 0}>
        <AreaChart data={users}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
          <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
          <Tooltip contentStyle={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--line))", borderRadius: 12, color: "rgb(var(--content))" }} />
          <Legend />
          <Area type="monotone" dataKey="customers" stackId="1" stroke="#D62D14" fill="#D62D14" fillOpacity={0.4} />
          <Area type="monotone" dataKey="contractors" stackId="1" stroke="#FB7A1E" fill="#FB7A1E" fillOpacity={0.4} />
        </AreaChart>
      </ChartCard>

      <ChartCard title="Projects by status" empty={projects.length === 0}>
        <PieChart>
          <Pie data={projects} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={(e) => e.status}>
            {projects.map((entry, i) => <Cell key={entry.status} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--line))", borderRadius: 12, color: "rgb(var(--content))" }} />
        </PieChart>
      </ChartCard>

      <ChartCard title="Top contractor performance (rating)" empty={contractors.length === 0}>
        <BarChart data={contractors} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" horizontal={false} />
          <XAxis type="number" domain={[0, 5]} tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={axisTick} axisLine={false} tickLine={false} width={90} />
          <Tooltip contentStyle={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--line))", borderRadius: 12, color: "rgb(var(--content))" }} />
          <Bar dataKey="rating" fill="#FB7A1E" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Contractor density by city" empty={contractorsByCity.length === 0}>
        <BarChart data={contractorsByCity} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="city" tick={axisTick} axisLine={false} tickLine={false} width={90} />
          <Tooltip contentStyle={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--line))", borderRadius: 12, color: "rgb(var(--content))" }} />
          <Bar dataKey="count" fill="#D62D14" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Project demand by city" empty={projectsByCity.length === 0}>
        <BarChart data={projectsByCity} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="city" tick={axisTick} axisLine={false} tickLine={false} width={90} />
          <Tooltip contentStyle={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--line))", borderRadius: 12, color: "rgb(var(--content))" }} />
          <Bar dataKey="count" fill="#0F9D6B" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ChartCard>
    </div>
  );
};
