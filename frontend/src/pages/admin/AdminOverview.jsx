import { Briefcase, CheckCircle2, Clock, CreditCard, ShieldAlert, UserCog, Users, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorState, Skeleton, StatCard } from "../../components/admin/AdminPrimitives";
import { api } from "../../services/api";
import { currency } from "../../utils/format";

export const AdminOverview = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    setData(null);
    api
      .get("/admin/overview")
      .then(({ data }) => setData(data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load overview"));
  };

  useEffect(load, []);

  if (error) return <ErrorState message={error} onRetry={load} />;

  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total users" value={data.totalUsers} sub={`${data.totalCustomers} customers · ${data.totalContractors} contractors`} />
        <StatCard icon={Briefcase} label="Active projects" value={data.activeProjects} tone="accent" />
        <StatCard icon={CheckCircle2} label="Completed projects" value={data.completedProjects} tone="success" />
        <StatCard icon={ShieldAlert} label="Pending approvals" value={data.pendingApprovals} tone="warn" sub="Contractors awaiting review" />
        <StatCard icon={Wallet} label="Platform revenue" value={currency(data.totalRevenue)} tone="success" sub="Commissions (completed)" />
        <StatCard icon={CreditCard} label="Transaction volume" value={currency(data.transactionVolume)} sub="Total awarded value" />
        <StatCard icon={UserCog} label="Contractor payouts" value={currency(data.contractorPayouts)} sub="Earnings paid out" />
        <StatCard icon={Clock} label="Pending payments" value={currency(data.pendingPayments)} tone="warn" sub={`${data.pendingPaymentsCount} awaiting completion`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link to="/admin/approvals" className="premium-card rounded-2xl p-5 transition hover:border-primary/50 hover:shadow-glow">
          <ShieldAlert className="h-6 w-6 text-spark" />
          <p className="mt-3 font-extrabold text-content">Review contractors</p>
          <p className="mt-1 text-sm text-muted">{data.pendingApprovals} pending in the verification queue.</p>
        </Link>
        <Link to="/admin/payments" className="premium-card rounded-2xl p-5 transition hover:border-primary/50 hover:shadow-glow">
          <CreditCard className="h-6 w-6 text-accent" />
          <p className="mt-3 font-extrabold text-content">Track payments</p>
          <p className="mt-1 text-sm text-muted">{data.pendingPaymentsCount} payments awaiting settlement.</p>
        </Link>
        <Link to="/admin/analytics" className="premium-card rounded-2xl p-5 transition hover:border-primary/50 hover:shadow-glow">
          <Users className="h-6 w-6 text-success" />
          <p className="mt-3 font-extrabold text-content">View analytics</p>
          <p className="mt-1 text-sm text-muted">Revenue, user growth, and contractor performance.</p>
        </Link>
      </div>
    </div>
  );
};
