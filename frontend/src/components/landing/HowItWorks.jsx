import { motion } from "framer-motion";
import {
  ClipboardList,
  FileSignature,
  GitCompare,
  HardHat,
  MessagesSquare,
  Search,
  Trophy
} from "lucide-react";
import { useState } from "react";
import { ease } from "../../lib/motion";
import { Container } from "../ui/Container";
import { SectionHeading } from "../ui/SectionHeading";
import { SegmentedControl } from "../ui/SegmentedControl";

const JOURNEYS = {
  customer: [
    {
      icon: ClipboardList,
      title: "Post your brief",
      copy: "Capture budget, location, timeline and floor plans in a few guided steps. It takes about two minutes."
    },
    {
      icon: GitCompare,
      title: "Compare real bids",
      copy: "Verified contractors send scoped quotes with pricing and duration — side by side, no haggling in the dark."
    },
    {
      icon: MessagesSquare,
      title: "Hire & coordinate",
      copy: "Award the right pro and keep every decision, file and update in one timestamped conversation."
    }
  ],
  contractor: [
    {
      icon: Search,
      title: "Get matched leads",
      copy: "Receive projects that fit your trade, location and capacity — ranked by a smart relevance score."
    },
    {
      icon: FileSignature,
      title: "Submit a sharp bid",
      copy: "Send a clear quote with amount, timeline and scope. Stand out with your portfolio and reviews."
    },
    {
      icon: Trophy,
      title: "Win & build",
      copy: "Get awarded, chat in realtime, and grow a verified track record that wins your next project."
    }
  ]
};

const OPTIONS = [
  { value: "customer", label: "I'm a customer", icon: HardHat },
  { value: "contractor", label: "I'm a contractor", icon: Trophy }
];

export const HowItWorks = () => {
  const [role, setRole] = useState("customer");
  const steps = JOURNEYS[role];

  return (
    <section id="how" className="py-20 md:py-28">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="How it works"
            title="From requirement to awarded contractor."
            subtitle="BuildOra turns a messy offline process into one clean pipeline — structured briefs, competing bids and realtime chat in a single workspace."
          />
          <SegmentedControl options={OPTIONS} value={role} onChange={setRole} />
        </div>

        <div className="relative mt-16">
          {/* connecting rail (desktop) */}
          <div className="absolute inset-x-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-line-strong to-transparent md:block" />

          <motion.div
            key={role}
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
            className="grid gap-10 md:grid-cols-3 md:gap-8"
          >
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } }
                }}
                className="relative"
              >
                <div className="relative z-10 flex items-center gap-4 md:block">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand text-lg font-bold text-white shadow-glow">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <step.icon className="hidden h-7 w-7 text-brand md:mt-6 md:block" />
                  <h3 className="text-xl font-bold text-content md:mt-4">{step.title}</h3>
                </div>
                <p className="mt-3 text-[0.95rem] leading-7 text-muted md:pr-6">{step.copy}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Container>
    </section>
  );
};
