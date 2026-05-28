import { AnimatePresence, motion } from "framer-motion";
import { Building2, LogOut, Menu, Moon, Sparkles, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./Button";

const linkClass = ({ isActive }) =>
  `rounded-xl px-4 py-2 text-sm font-semibold transition ${isActive ? "bg-brand-gradient text-white shadow-glow" : "text-slate-300 hover:bg-slate-800/60 hover:text-white"}`;

export const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("buildora_theme") !== "light");

  const links = user
    ? [
        ["Dashboard", "/dashboard"],
        user.role === "customer" ? ["Post Project", "/post-project"] : ["Browse Projects", "/browse-projects"],
        ["Chats", "/chat"],
        ["Profile", "/profile"]
      ]
    : [
        ["How it works", "/#how"],
        ["Contractors", "/#contractors"]
      ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    localStorage.setItem("buildora_theme", dark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", dark);
    document.body.classList.toggle("app-shell", dark);
  }, [dark]);

  return (
    <div className={`${dark ? "app-shell" : "min-h-screen bg-slate-50"} min-h-screen`}>
      <header className="sticky top-0 z-40 border-b border-slate-700/40 bg-slate-950/70 backdrop-blur-2xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-white">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow">
              <Building2 className="h-5 w-5" />
            </span>
            <span className="brand-text-gradient">BuildOra</span>
          </Link>
          <div className="hidden items-center gap-2 md:flex">
            {links.map(([label, href]) =>
              href.includes("#") ? (
                <a key={href} className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800/70" href={href}>
                  {label}
                </a>
              ) : (
                <NavLink key={href} className={linkClass} to={href}>
                  {label}
                </NavLink>
              )
            )}
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" onClick={() => setDark((value) => !value)} aria-label="Toggle theme">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {user ? (
              <Button onClick={handleLogout} variant="secondary">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            ) : (
              <>
                <Button as={Link} to="/login" variant="secondary">Login</Button>
                <Button as={Link} to="/register">
                  <Sparkles className="h-4 w-4" />
                  Get started
                </Button>
              </>
            )}
          </div>
          <button className="rounded-xl border border-slate-700 p-2 text-white md:hidden" onClick={() => setOpen((value) => !value)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </nav>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="border-t border-slate-700/50 bg-slate-950/95 px-4 py-3 md:hidden"
            >
              <div className="flex flex-col gap-2">
                {links.map(([label, href]) => (
                  <NavLink key={href} className={linkClass} to={href} onClick={() => setOpen(false)}>
                    {label}
                  </NavLink>
                ))}
                {user ? <Button onClick={handleLogout}>Logout</Button> : <Button onClick={() => navigate("/login")}>Login</Button>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <Outlet />
      </motion.div>
    </div>
  );
};
