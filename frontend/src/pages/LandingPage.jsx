import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Instagram,
  Linkedin,
  MapPin,
  ShieldCheck,
  Star,
  Twitter
} from "lucide-react";
import { Link } from "react-router-dom";
import { ease } from "../lib/motion";
import { Button } from "../components/Button";
import { Features } from "../components/landing/Features";
import { HowItWorks } from "../components/landing/HowItWorks";
import { PricingPreview } from "../components/landing/PricingPreview";
import { Testimonials } from "../components/landing/Testimonials";
import { Container } from "../components/ui/Container";
import { Counter } from "../components/ui/Counter";
import { Logo } from "../components/ui/Logo";
import { Marquee } from "../components/ui/Marquee";

const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } }
};

const STATS = [
  { value: 12, prefix: "₹", suffix: " Cr+", label: "Project demand" },
  { value: 2400, suffix: "+", label: "Verified pros" },
  { value: 4.8, decimals: 1, label: "Avg rating", star: true },
  { value: 24, suffix: " min", label: "Avg first reply" }
];

const TRADES = [
  "Interior design", "Civil construction", "Modular kitchen", "Home renovation",
  "Architecture", "Plumbing", "Electrical", "Painting", "Waterproofing",
  "False ceiling", "Landscaping", "Carpentry"
];

const HeroVisual = () => (
  <div className="relative">
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, ease, delay: 0.15 }}
      className="premium-card overflow-hidden rounded-[1.75rem] p-2 shadow-xl"
    >
      <img
        src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1100&q=80"
        alt="Premium interior project delivered through BuildOra"
        className="h-[24rem] w-full rounded-[1.25rem] object-cover md:h-[32rem]"
        loading="eager"
      />
    </motion.div>

    {/* Floating live-lead card */}
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease, delay: 0.5 }}
      className="absolute -bottom-6 -left-3 w-[16.5rem] animate-float md:-left-8"
    >
      <div className="glass rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <p className="text-eyebrow uppercase text-subtle">Live lead board</p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2 py-0.5 text-xs font-bold text-success">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> Live
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {[["Villa shell", "₹42L", "8 bids"], ["3BHK interiors", "₹18L", "12 bids"]].map(([t, b, n]) => (
            <div key={t} className="flex items-center justify-between rounded-xl bg-surface-2/70 p-2.5">
              <p className="text-sm font-bold text-content">{t}</p>
              <div className="text-right">
                <p className="text-sm font-extrabold text-content tabular">{b}</p>
                <p className="text-[0.7rem] font-bold text-brand">{n}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>

    {/* Floating rating chip */}
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease, delay: 0.7 }}
      className="absolute -right-3 top-8 animate-float-slow md:-right-6"
    >
      <div className="glass flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 shadow-lg">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-sm font-bold text-white">UN</span>
        <div>
          <p className="text-sm font-bold text-content">Bid accepted</p>
          <p className="inline-flex items-center gap-1 text-xs font-semibold text-muted">
            <Star className="h-3 w-3 fill-spark text-spark" /> 4.9 · Urban Nest
          </p>
        </div>
      </div>
    </motion.div>
  </div>
);

export const LandingPage = () => (
  <main className="overflow-hidden text-content">
    {/* ============================== HERO ============================== */}
    <section className="relative">
      <div className="absolute inset-0 -z-10 bg-mesh-radial" />
      <div className="absolute inset-0 -z-10 blueprint-grid [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)] opacity-70" />

      <Container className="grid items-center gap-14 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}>
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-4 py-1.5 text-sm font-semibold text-brand"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
            India&rsquo;s modern construction marketplace
          </motion.span>

          <motion.h1
            variants={item}
            className="mt-6 text-balance font-display text-display font-bold leading-[1.03] tracking-tight"
          >
            Build it right — with pros you can{" "}
            <span className="brand-text-gradient">trust</span>.
          </motion.h1>

          <motion.p variants={item} className="mt-6 max-w-xl text-lg leading-8 text-muted">
            Post your construction or interior project, compare verified contractor bids side by side, and manage
            everything — chat, floor plans and payments — in one beautiful workspace.
          </motion.p>

          <motion.div variants={item} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button as={Link} to="/register" size="lg">
              Post your project <ArrowRight className="h-4 w-4" />
            </Button>
            <Button as={Link} to="/register" variant="secondary" size="lg">
              Join as a contractor
            </Button>
          </motion.div>

          <motion.div variants={item} className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-muted">
            {["Free to post", "2,400+ verified pros", "No spam, ever"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-success" /> {t}
              </span>
            ))}
          </motion.div>

          <motion.div variants={item} className="mt-10 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-2xl border border-line bg-surface/70 p-3.5 backdrop-blur">
                <p className="font-display text-2xl font-bold tracking-tight text-content tabular">
                  <Counter value={s.value} prefix={s.prefix} suffix={s.suffix} decimals={s.decimals} />
                  {s.star && <Star className="ml-0.5 inline h-4 w-4 -translate-y-0.5 fill-spark text-spark" />}
                </p>
                <p className="mt-1 text-xs font-semibold text-subtle">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <HeroVisual />
      </Container>
    </section>

    {/* ============================ TRUST STRIP ============================ */}
    <section className="border-y border-line bg-surface/50 py-7">
      <Container>
        <p className="mb-5 text-center text-eyebrow uppercase text-subtle">
          Every trade, across India&rsquo;s major cities
        </p>
        <Marquee>
          {TRADES.map((t) => (
            <span key={t} className="inline-flex items-center gap-2 whitespace-nowrap text-base font-semibold text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-brand/50" />
              {t}
            </span>
          ))}
        </Marquee>
      </Container>
    </section>

    <HowItWorks />
    <Features />

    {/* ============================ VALUE BAND ============================ */}
    <section className="py-8">
      <Container>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            [ShieldCheck, "Verified & role-gated", "Every action is protected and built for clean marketplace operations you can trust."],
            [MapPin, "Location-smart matching", "Discover nearby pros and projects with map-aware, distance-smart search."],
            [Clock, "Fast, traceable decisions", "Quotes, awards and chat are timestamped — so every decision stays accountable."]
          ].map(([Icon, title, copy]) => (
            <div key={title} className="rounded-2xl border border-line bg-surface/60 p-6">
              <Icon className="h-7 w-7 text-brand" />
              <h3 className="mt-4 text-lg font-bold text-content">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{copy}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>

    <Testimonials />
    <PricingPreview />

    {/* ============================= FINAL CTA ============================= */}
    <section className="py-12 md:py-20">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] bg-brand-gradient px-6 py-16 text-center text-white shadow-glow md:px-16 md:py-20">
          <div className="absolute inset-0 blueprint-grid opacity-20" />
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-spark/30 blur-3xl" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-balance font-display text-3xl font-bold tracking-tight md:text-5xl">
              Ready to build something great?
            </h2>
            <p className="mt-4 text-lg text-white/85">
              Join homeowners and contractors building better, together — on India&rsquo;s most trusted construction marketplace.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button as={Link} to="/register" variant="ghost" size="lg" className="bg-white text-brand shadow-lg hover:bg-white/90">
                Post your project <ArrowRight className="h-4 w-4" />
              </Button>
              <Button as={Link} to="/register" variant="ghost" size="lg" className="border-2 border-white/50 text-white hover:bg-white/10">
                Join as a contractor
              </Button>
            </div>
            <p className="mt-6 text-sm text-white/70">Free to post · No commission to post · Cancel anytime</p>
          </div>
        </div>
      </Container>
    </section>

    {/* ============================== FOOTER ============================== */}
    <footer className="border-t border-line">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-6 text-muted">
              The modern marketplace where great construction and interior projects begin — and get built.
            </p>
            <div className="mt-5 flex gap-2">
              {[Twitter, Linkedin, Instagram].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Social link"
                  className="grid h-9 w-9 place-items-center rounded-xl border border-line-strong text-muted transition hover:border-brand/40 hover:text-brand"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {[
            ["Product", [["How it works", "/#how"], ["Features", "/#features"], ["Pricing", "/#pricing"], ["Get started", "/register"]]],
            ["Company", [["About", "#"], ["Careers", "#"], ["Blog", "#"], ["Contact", "#"]]],
            ["Legal", [["Privacy", "#"], ["Terms", "#"], ["Security", "#"], ["Cookies", "#"]]]
          ].map(([title, links]) => (
            <div key={title}>
              <p className="text-sm font-bold text-content">{title}</p>
              <ul className="mt-4 space-y-2.5">
                {links.map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className="text-sm text-muted transition hover:text-brand">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-sm text-subtle sm:flex-row">
          <p>© {new Date().getFullYear()} BuildOra. Construction & interiors, organised beautifully.</p>
          <p className="inline-flex items-center gap-1.5">
            <BadgeCheck className="h-4 w-4 text-brand" /> Made in India
          </p>
        </div>
      </Container>
    </footer>
  </main>
);
