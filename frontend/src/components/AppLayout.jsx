import { motion } from "framer-motion";
import {
  BadgeCheck,
  ChevronLeft,
  Compass,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  PlusCircle,
  User,
  Wallet
} from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/cn";
import { layoutSpring } from "../lib/motion";
import { NotificationBell } from "./NotificationBell";
import { PageTransition } from "./PageTransition";
import { Avatar } from "./ui/Avatar";
import { Logo, LogoMark } from "./ui/Logo";
import { ThemeToggle } from "./ui/ThemeToggle";
import { Tooltip } from "./ui/Tooltip";

const NAV = {
  customer: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/post-project", label: "Post Project", icon: PlusCircle },
    { to: "/find-contractors", label: "Find Pros", icon: Compass },
    { to: "/chat", label: "Messages", icon: MessageSquare },
    { to: "/profile", label: "Profile", icon: User }
  ],
  contractor: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/browse-projects", label: "Browse Leads", icon: Compass },
    { to: "/earnings", label: "Earnings", icon: Wallet },
    { to: "/membership", label: "Membership", icon: BadgeCheck },
    { to: "/chat", label: "Messages", icon: MessageSquare },
    { to: "/profile", label: "Profile", icon: User }
  ]
};

const SidebarLink = ({ item, collapsed }) => {
  const body = (
    <NavLink to={item.to} end={item.end} className="block">
      {({ isActive }) => (
        <span
          className={cn(
            "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
            collapsed && "justify-center px-0",
            isActive ? "text-brand" : "text-muted hover:bg-surface-2 hover:text-content"
          )}
        >
          {isActive && (
            <motion.span
              layoutId="sb-active"
              className="absolute inset-0 rounded-xl bg-brand/10 ring-1 ring-inset ring-brand/15"
              transition={layoutSpring}
            />
          )}
          <item.icon className="relative z-10 h-5 w-5 shrink-0" />
          {!collapsed && <span className="relative z-10">{item.label}</span>}
        </span>
      )}
    </NavLink>
  );
  return collapsed ? (
    <Tooltip label={item.label} side="right">
      {body}
    </Tooltip>
  ) : (
    body
  );
};

const BottomTab = ({ item }) => (
  <NavLink to={item.to} end={item.end} className="relative flex flex-1 flex-col items-center justify-center gap-1 py-2">
    {({ isActive }) => (
      <>
        {isActive && (
          <motion.span
            layoutId="bottom-active"
            className="absolute top-0 h-0.5 w-10 rounded-full bg-brand"
            transition={layoutSpring}
          />
        )}
        <item.icon className={cn("h-[22px] w-[22px] transition-colors", isActive ? "text-brand" : "text-muted")} />
        <span className={cn("text-[0.65rem] font-semibold transition-colors", isActive ? "text-brand" : "text-subtle")}>
          {item.label}
        </span>
      </>
    )}
  </NavLink>
);

/** Authenticated app shell: desktop sidebar ↔ mobile bottom tab bar. */
export const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("buildora_sidebar") === "1");

  const items = NAV[user?.role] || NAV.customer;
  const bottomItems = items.slice(0, 5);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("buildora_sidebar", next ? "1" : "0");
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="app-shell min-h-screen">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-surface/80 backdrop-blur-xl transition-[width] duration-300 lg:flex",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <div className={cn("flex h-16 items-center border-b border-line px-4", collapsed && "justify-center px-0")}>
          <Link to="/dashboard">{collapsed ? <LogoMark size={36} /> : <Logo />}</Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
          {items.map((item) => (
            <SidebarLink key={item.to} item={item} collapsed={collapsed} />
          ))}
        </nav>

        <div className="space-y-3 border-t border-line p-3">
          <div className={cn("flex items-center gap-3 rounded-xl p-2", collapsed && "justify-center")}>
            <Avatar name={user?.name} src={user?.avatar} size="sm" />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-content">{user?.name}</p>
                <p className="truncate text-xs capitalize text-subtle">{user?.role}</p>
              </div>
            )}
          </div>
          <div className={cn("flex items-center gap-2", collapsed && "flex-col")}>
            <ThemeToggle />
            <NotificationBell align="left" placement="top" />
            <Tooltip label="Log out" side="top">
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Log out"
                className="grid h-10 w-10 place-items-center rounded-xl border border-line-strong bg-surface text-muted transition hover:border-brand/40 hover:text-brand"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </Tooltip>
            {!collapsed && <span className="flex-1" />}
            <Tooltip label={collapsed ? "Expand" : "Collapse"} side="top">
              <button
                type="button"
                onClick={toggleCollapse}
                aria-label="Toggle sidebar"
                className="grid h-10 w-10 place-items-center rounded-xl border border-line-strong bg-surface text-muted transition hover:text-content"
              >
                <ChevronLeft className={cn("h-5 w-5 transition-transform", collapsed && "rotate-180")} />
              </button>
            </Tooltip>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/85 px-4 py-2.5 backdrop-blur-xl lg:hidden">
        <Link to="/dashboard">
          <Logo markSize={34} />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NotificationBell />
          <Link to="/profile" aria-label="Profile">
            <Avatar name={user?.name} src={user?.avatar} size="sm" />
          </Link>
        </div>
      </header>

      {/* Main content */}
      <div className={cn("transition-[padding] duration-300", collapsed ? "lg:pl-20" : "lg:pl-64")}>
        <main className="min-h-[calc(100vh-3.5rem)] pb-24 lg:pb-12">
          <PageTransition />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/92 pb-safe backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-around px-1">
          {bottomItems.map((item) => (
            <BottomTab key={item.to} item={item} />
          ))}
        </div>
      </nav>
    </div>
  );
};
