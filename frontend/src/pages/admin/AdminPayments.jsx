import { CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState, ErrorState, Skeleton, StatCard, StatusBadge } from "../../components/admin/AdminPrimitives";
import { api } from "../../services/api";
import { currency, shortDate } from "../../utils/format";

const FILTERS = ["", "pending", "completed", "refunded"];
const LABELS = { "": "All", pending: "Pending", completed: "Completed", refunded: "Refunded" };

export const AdminPayments = () => {
  const [status, setStatus] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    setData(null);
    api
      .get(`/admin/payments${status ? `?status=${status}` : ""}`)
      .then(({ data }) => setData(data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load payments"));
  };

  useEffect(load, [status]);

  const totals = data?.totals || {};

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={CreditCard} label="Completed" value={currency(totals.completed?.amount || 0)} tone="success" sub={`${totals.completed?.count || 0} payments · ${currency(totals.completed?.commission || 0)} commission`} />
        <StatCard icon={CreditCard} label="Pending" value={currency(totals.pending?.amount || 0)} tone="warn" sub={`${totals.pending?.count || 0} payments`} />
        <StatCard icon={CreditCard} label="Refunded" value={currency(totals.refunded?.amount || 0)} tone="danger" sub={`${totals.refunded?.count || 0} payments`} />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f || "all"}
            onClick={() => setStatus(f)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
              status === f ? "bg-brand-gradient text-white" : "border border-line-strong text-muted hover:text-content"
            }`}
          >
            {LABELS[f]}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !data ? (
        <Skeleton className="h-72" />
      ) : data.payments.length === 0 ? (
        <EmptyState icon={CreditCard} title="No payments yet" message="Payments appear here when a customer awards a contractor's bid." />
      ) : (
        <div className="premium-card overflow-hidden rounded-2xl">
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-line/60 text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-bold">Payment</th>
                  <th className="px-4 py-3 font-bold">Project</th>
                  <th className="px-4 py-3 font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold">Contractor</th>
                  <th className="px-4 py-3 text-right font-bold">Amount</th>
                  <th className="px-4 py-3 text-right font-bold">Commission</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((p) => (
                  <tr key={p._id} className="border-b border-line/40 last:border-0 hover:bg-surface-2/40">
                    <td className="px-4 py-3 font-mono text-xs text-muted">#{p._id.slice(-6)}</td>
                    <td className="px-4 py-3 font-semibold text-content">{p.project?.title || "—"}</td>
                    <td className="px-4 py-3 text-muted">{p.customer?.name || "—"}</td>
                    <td className="px-4 py-3 text-muted">{p.contractor?.name || "—"}</td>
                    <td className="px-4 py-3 text-right font-bold text-content">{currency(p.amount)}</td>
                    <td className="px-4 py-3 text-right text-success">{currency(p.commission)}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted">{shortDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
