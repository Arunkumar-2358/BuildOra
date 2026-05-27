import { Building2, LogOut, Menu, Moon, Sparkles, Sun, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./Button";

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? "bg-ink text-white shadow-sm" : "text-ink/70 hover:bg-ink/5 hover:text-ink"}`;

export const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);

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

  return (
    <div className={dark ? "dark-shell min-h-screen" : "min-h-screen"}>
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-white/90 backdrop-blur-2xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-ink">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-white shadow-lg shadow-ink/20">
              <Building2 className="h-5 w-5" />
            </span>
            <span>Buildora</span>
          </Link>
          <div className="hidden items-center gap-2 md:flex">
            {links.map(([label, href]) =>
              href.includes("#") ? (
                <a key={href} className="rounded-lg px-3 py-2 text-sm font-semibold text-ink/70 hover:bg-ink/5" href={href}>
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
          <button className="rounded-lg p-2 md:hidden" onClick={() => setOpen((value) => !value)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </nav>
        {open && (
          <div className="border-t border-ink/10 bg-white px-4 py-3 md:hidden">
            <div className="flex flex-col gap-2">
              {links.map(([label, href]) => (
                <NavLink key={href} className={linkClass} to={href} onClick={() => setOpen(false)}>
                  {label}
                </NavLink>
              ))}
              {user ? <Button onClick={handleLogout}>Logout</Button> : <Button onClick={() => navigate("/login")}>Login</Button>}
            </div>
          </div>
        )}
      </header>
      <Outlet />
    </div>
  );
};
