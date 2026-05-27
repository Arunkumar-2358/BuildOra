import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardList,
  HardHat,
  MessageCircle,
  MoveRight,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/Button";
import { ContractorCard } from "../components/ContractorCard";

const sampleContractors = [
  {
    _id: "1",
    name: "Urban Nest Studio",
    city: "Hyderabad",
    contractorProfile: {
      rating: 4.8,
      services: ["interior", "modular kitchen", "renovation"],
      bio: "Turnkey interiors with transparent budgets, site updates, and premium finishes."
    }
  },
  {
    _id: "2",
    name: "StoneLine Builds",
    city: "Bengaluru",
    contractorProfile: {
      rating: 4.7,
      services: ["construction", "architecture", "civil"],
      bio: "Residential construction team for villas, duplexes, extensions, and structural work."
    }
  },
  {
    _id: "3",
    name: "Craft Axis",
    city: "Chennai",
    contractorProfile: {
      rating: 4.9,
      services: ["woodwork", "interior", "lighting"],
      bio: "Detail-led execution for premium homes with curated material and lighting packages."
    }
  }
];

const activeLeads = [
  ["Villa shell construction", "Hyderabad", "₹42L", "8 bids"],
  ["3BHK premium interiors", "Bengaluru", "₹18L", "12 bids"],
  ["Cafe renovation", "Chennai", "₹9L", "6 bids"]
];

export const LandingPage = () => (
  <main>
    <section className="mesh-dark relative overflow-hidden">
      <div className="mx-auto grid min-h-[calc(100vh-76px)] max-w-7xl items-center gap-10 px-4 py-12 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="relative z-10 text-white">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur-xl">
            <Sparkles className="h-4 w-4 text-gold" />
            Connecting Dreams with Builders
          </p>
          <h1 className="max-w-4xl text-5xl font-extrabold tracking-normal md:text-7xl">
            Buildora
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">
            A premium marketplace where homeowners post construction and interior requirements, compare contractor quotations, and close projects with realtime coordination.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button as={Link} to="/register" variant="accent" className="px-6 py-3">
              Post a project <ArrowRight className="h-4 w-4" />
            </Button>
            <Button as={Link} to="/register" variant="secondary" className="border-white/20 bg-white/10 px-6 py-3 text-white hover:bg-white/20">
              Join as contractor
            </Button>
          </div>
          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
            {[
              ["₹12Cr+", "project demand"],
              ["4.8/5", "contractor rating"],
              ["24 min", "avg first reply"]
            ].map(([value, label]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
                <p className="text-2xl font-extrabold">{value}</p>
                <p className="mt-1 text-xs font-semibold uppercase text-white/55">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="premium-card overflow-hidden rounded-lg p-3 shadow-glow">
            <img
              src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=90"
              alt="Premium home construction and interior"
              className="h-[24rem] w-full rounded-lg object-cover md:h-[34rem]"
            />
          </div>
          <div className="absolute -bottom-6 left-4 right-4 rounded-lg border border-white/70 bg-white/90 p-4 shadow-crisp backdrop-blur-xl md:left-8 md:right-auto md:w-[25rem]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-ink/45">Live lead board</p>
                <h3 className="mt-1 text-lg font-extrabold text-ink">High-intent requirements</h3>
              </div>
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">Live</span>
            </div>
            <div className="mt-4 space-y-3">
              {activeLeads.map(([title, city, budget, bids]) => (
                <div key={title} className="flex items-center justify-between gap-3 rounded-lg bg-mist/70 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">{title}</p>
                    <p className="text-xs font-semibold text-ink/50">{city}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-ink">{budget}</p>
                    <p className="text-xs font-semibold text-clay">{bids}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="how" className="bg-linen py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-end">
          <div>
            <p className="font-bold text-clay">How it works</p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink md:text-5xl">From requirement to awarded contractor.</h2>
          </div>
          <p className="text-base leading-7 text-ink/65">
            Buildora turns a messy offline process into a clean quote pipeline: structured requirements, competing bids, and one-to-one chat in the same workspace.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            [ClipboardList, "Post a sharp brief", "Capture budget, location, timeline, category, and reference plans in minutes."],
            [HardHat, "Compare serious bids", "Contractors submit quotation amount, duration, and a scoped proposal."],
            [MessageCircle, "Close with confidence", "Accept, reject, and chat with timestamps so every decision stays traceable."]
          ].map(([Icon, title, copy], index) => (
            <div key={title} className="premium-card rounded-lg p-6 transition hover:-translate-y-1 hover:shadow-glow">
              <div className="flex items-center justify-between">
                <Icon className="h-9 w-9 text-moss" />
                <span className="text-sm font-extrabold text-ink/20">0{index + 1}</span>
              </div>
              <h3 className="mt-6 text-xl font-bold text-ink">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-ink/65">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="subtle-grid bg-white py-20">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <p className="font-bold text-clay">Demo-ready workflow</p>
          <h2 className="mt-2 text-3xl font-extrabold text-ink md:text-5xl">A marketplace cockpit founders can understand in 30 seconds.</h2>
          <p className="mt-5 text-base leading-7 text-ink/65">
            The UI is designed to show liquidity, quote quality, contractor trust, and customer progress immediately.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {["Role-based dashboards", "Bid status controls", "Realtime chat", "Contractor portfolio profiles"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg bg-linen p-3 text-sm font-bold text-ink">
                <CheckCircle2 className="h-5 w-5 text-moss" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg bg-ink p-4 shadow-soft">
          <div className="rounded-lg bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-4">
              <div>
                <p className="text-xs font-bold uppercase text-ink/45">Project pipeline</p>
                <h3 className="text-xl font-extrabold text-ink">Premium interiors, Jubilee Hills</h3>
              </div>
              <span className="rounded-full bg-clay px-3 py-1 text-xs font-bold text-white">Award pending</span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                ["Budget", "₹22L"],
                ["Timeline", "12 weeks"],
                ["Quotes", "9"]
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-mist p-4">
                  <p className="text-xs font-bold uppercase text-ink/45">{label}</p>
                  <p className="mt-1 text-2xl font-extrabold text-ink">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-3">
              {["Urban Nest Studio", "Craft Axis", "StoneLine Builds"].map((name, index) => (
                <div key={name} className="flex items-center justify-between rounded-lg border border-ink/10 p-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-sm font-extrabold text-white">{index + 1}</span>
                    <div>
                      <p className="font-bold text-ink">{name}</p>
                      <p className="text-sm text-ink/55">Detailed quote submitted</p>
                    </div>
                  </div>
                  <MoveRight className="h-5 w-5 text-clay" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="contractors" className="bg-linen py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="font-bold text-clay">Top contractors</p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink md:text-5xl">Trust signals, not just listings.</h2>
          </div>
          <Button as={Link} to="/register" variant="secondary">
            Explore contractors <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {sampleContractors.map((contractor) => (
            <ContractorCard key={contractor._id} contractor={contractor} />
          ))}
        </div>
      </div>
    </section>

    <section className="bg-ink py-20 text-white">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 md:grid-cols-3">
        {[
          [ShieldCheck, "Verified workflow", "Every core action is role-gated, protected, and designed for clean marketplace operations."],
          [TrendingUp, "Founder narrative", "Show project demand, contractor supply, quote velocity, and monetizable transaction behavior."],
          [BadgeCheck, "Premium trust", "Profiles, portfolios, ratings, bids, and chat create a credible decision layer."]
        ].map(([Icon, title, copy]) => (
          <div key={title} className="rounded-lg border border-white/10 bg-white/5 p-6">
            <Icon className="h-7 w-7 text-gold" />
            <h3 className="mt-4 text-lg font-bold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-white/65">{copy}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="bg-white py-20">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 md:grid-cols-3">
        {[
          ["We found three serious bids in two days.", "Priya M., Homeowner"],
          ["The chat history kept our renovation decisions tidy.", "Rohan S., Customer"],
          ["Lead quality is much better than generic listing apps.", "Urban Nest Studio"]
        ].map(([quote, author]) => (
          <blockquote key={quote} className="premium-card rounded-lg p-6 text-lg font-semibold leading-8 text-ink">
            <div className="mb-4 flex gap-1 text-gold">
              {[1, 2, 3, 4, 5].map((star) => <Star key={star} className="h-4 w-4 fill-current" />)}
            </div>
            “{quote}”
            <footer className="mt-4 text-sm font-bold text-ink/50">{author}</footer>
          </blockquote>
        ))}
      </div>
    </section>

    <footer className="border-t border-ink/10 bg-linen px-4 py-8 text-center text-sm text-ink/60">
      Buildora © 2026. Construction and interiors, organized beautifully.
    </footer>
  </main>
);
