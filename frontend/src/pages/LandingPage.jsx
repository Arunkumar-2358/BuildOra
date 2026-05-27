import { ArrowRight, CheckCircle2, ClipboardList, HardHat, MessageCircle, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/Button";
import { ContractorCard } from "../components/ContractorCard";

const sampleContractors = [
  { _id: "1", name: "Urban Nest Studio", city: "Hyderabad", contractorProfile: { rating: 4.8, services: ["interior", "modular kitchen", "renovation"], bio: "Turnkey interiors with transparent budgets and fast site coordination." } },
  { _id: "2", name: "StoneLine Builds", city: "Bengaluru", contractorProfile: { rating: 4.7, services: ["construction", "architecture", "civil"], bio: "Residential construction team for villas, duplexes, and extensions." } },
  { _id: "3", name: "Craft Axis", city: "Chennai", contractorProfile: { rating: 4.9, services: ["woodwork", "interior", "lighting"], bio: "Detail-led interior execution for premium homes and apartments." } }
];

export const LandingPage = () => (
  <main>
    <section className="mx-auto grid min-h-[calc(100vh-76px)] max-w-7xl items-center gap-10 px-4 py-12 lg:grid-cols-[1.05fr_0.95fr]">
      <div>
        <p className="mb-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-moss shadow-sm">
          Connecting Dreams with Builders
        </p>
        <h1 className="max-w-4xl text-5xl font-extrabold tracking-normal text-ink md:text-7xl">
          Buildora
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/70">
          Post your construction or interior requirement, compare verified contractor quotations, and manage every conversation in one polished workspace.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button as={Link} to="/register" className="px-6 py-3">
            Post a project <ArrowRight className="h-4 w-4" />
          </Button>
          <Button as={Link} to="/register" variant="secondary" className="px-6 py-3">
            Join as contractor
          </Button>
        </div>
      </div>
      <div className="glass overflow-hidden rounded-lg p-4 shadow-soft">
        <img
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80"
          alt="Modern home interior"
          className="h-[32rem] w-full rounded-lg object-cover"
        />
      </div>
    </section>

    <section id="how" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="font-bold text-clay">How it works</p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink md:text-4xl">From idea to awarded contract</h2>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            [ClipboardList, "Post your requirement", "Add budget, category, timeline, city, and reference images or floor plans."],
            [HardHat, "Receive quotations", "Contractors browse open leads and submit detailed proposals with price and duration."],
            [MessageCircle, "Chat and finalize", "Compare bids, accept the right contractor, and continue in real-time chat."]
          ].map(([Icon, title, copy]) => (
            <div key={title} className="rounded-lg border border-ink/10 p-6">
              <Icon className="h-9 w-9 text-moss" />
              <h3 className="mt-5 text-xl font-bold text-ink">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-ink/65">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section id="contractors" className="py-20">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="text-3xl font-extrabold text-ink md:text-4xl">Top contractors</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {sampleContractors.map((contractor) => (
            <ContractorCard key={contractor._id} contractor={contractor} />
          ))}
        </div>
      </div>
    </section>

    <section className="bg-ink py-20 text-white">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 md:grid-cols-3">
        {["Clear quotations", "Verified workflow", "Realtime coordination"].map((title) => (
          <div key={title} className="rounded-lg border border-white/10 p-6">
            <ShieldCheck className="h-7 w-7 text-clay" />
            <h3 className="mt-4 text-lg font-bold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-white/65">
              Buildora keeps the messy parts organized so customers and contractors can move with confidence.
            </p>
          </div>
        ))}
      </div>
    </section>

    <section className="bg-white py-20">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 md:grid-cols-3">
        {["We found three serious bids in two days.", "The chat history kept our renovation decisions tidy.", "Lead quality is much better than generic listing apps."].map((quote) => (
          <blockquote key={quote} className="rounded-lg border border-ink/10 p-6 text-lg font-semibold leading-8 text-ink">
            <CheckCircle2 className="mb-4 h-6 w-6 text-moss" />
            “{quote}”
          </blockquote>
        ))}
      </div>
    </section>

    <footer className="border-t border-ink/10 bg-white px-4 py-8 text-center text-sm text-ink/60">
      Buildora © 2026. Built for construction and interior marketplaces.
    </footer>
  </main>
);
