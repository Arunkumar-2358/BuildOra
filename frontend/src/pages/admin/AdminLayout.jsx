import { BarChart3, CreditCard, LayoutDashboard, ShieldCheck, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const tabs = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/approvals", label: "Approvals", icon: ShieldCheck },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 }
];

export const AdminLayout = () => (
  <main className="mx-auto max-w-7xl px-4 py-8">
    <div className="flex items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow">
        <ShieldCheck className="h-6 w-6" />
      </span>
      <div>
        <h1 className="text-2xl font-extrabold text-content">Admin Dashboard</h1>
        <p className="text-sm text-muted">Manage users, contractors, payments, and platform health.</p>
      </div>
    </div>

    <nav className="scrollbar-thin mt-6 flex gap-2 overflow-x-auto border-b border-line/60 pb-px">
      {tabs.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-shrink-0 items-center gap-2 rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-bold transition ${
              isActive
                ? "border-primary text-accent"
                : "border-transparent text-muted hover:text-content"
            }`
          }
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </nav>

    <div className="mt-6">
      <Outlet />
    </div>
  </main>
);
