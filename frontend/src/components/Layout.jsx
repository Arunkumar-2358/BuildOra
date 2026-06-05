import { ArrowRight, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/cn";
import { Button } from "./Button";
import { PageTransition } from "./PageTransition";
import { Logo } from "./ui/Logo";
import { Sheet } from "./ui/Sheet";
import { ThemeToggle } from "./ui/ThemeToggle";

const NAV = [
  ["How it works", "/#how"],
  ["Features", "/#features"],
  ["Contractors", "/#contractors"],
  ["Pricing", "/#pricing"]
];

/** Public/marketing chrome — transparent nav that condenses on scroll. */
export const Layout = () => {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="app-shell min-h-screen">
      <header
        className={cn(
          "sticky top-0 z-40 transition-all duration-300",
          scrolled ? "border-b border-line/70 bg-surface/85 backdrop-blur-xl" : "border-b border-transparent"
        )}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <Link to="/" className="transition hover:opacity-90">
            <Logo />
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {NAV.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="rounded-lg px-3.5 py-2 text-sm font-semibold text-muted transition hover:text-content"
              >
                {label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            {user ? (
              <Button as={Link} to="/dashboard" size="sm">
                Go to dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button as={Link} to="/login" variant="ghost" size="sm">
                  Log in
                </Button>
                <Button as={Link} to="/register" size="sm">
                  Get started <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="grid h-10 w-10 place-items-center rounded-xl border border-line-strong bg-surface text-content"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </nav>
      </header>

      <PageTransition />

      <Sheet open={open} onClose={() => setOpen(false)} side="right">
        <div className="flex h-full flex-col p-5">
          <Logo />
          <div className="mt-8 flex flex-col gap-1">
            {NAV.map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-base font-semibold text-content transition hover:bg-surface-2"
              >
                {label}
              </a>
            ))}
          </div>
          <div className="mt-auto flex flex-col gap-2">
            {user ? (
              <Button as={Link} to="/dashboard" onClick={() => setOpen(false)} size="lg">
                Go to dashboard
              </Button>
            ) : (
              <>
                <Button as={Link} to="/login" variant="secondary" size="lg" onClick={() => setOpen(false)}>
                  Log in
                </Button>
                <Button as={Link} to="/register" size="lg" onClick={() => setOpen(false)}>
                  Get started
                </Button>
              </>
            )}
          </div>
        </div>
      </Sheet>
    </div>
  );
};
