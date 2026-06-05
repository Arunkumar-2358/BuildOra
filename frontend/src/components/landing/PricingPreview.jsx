import { ArrowRight, Check, Crown, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/cn";
import { Button } from "../Button";
import { Container } from "../ui/Container";
import { Reveal } from "../ui/Reveal";
import { SectionHeading } from "../ui/SectionHeading";
import { SegmentedControl } from "../ui/SegmentedControl";

// Representative marketing pricing. Live, server-driven plans render on /plans.
const PLANS = [
  {
    name: "Starter",
    icon: Sparkles,
    monthly: 0,
    annual: 0,
    tagline: "For trying BuildOra",
    features: ["5 bids / month", "Verified basic profile", "Realtime chat", "Standard support"],
    cta: "Start free"
  },
  {
    name: "Pro",
    icon: Zap,
    monthly: 999,
    annual: 799,
    tagline: "For growing contractors",
    features: ["Unlimited bids", "Verified badge + portfolio", "Priority in search", "Smart lead matching", "Performance analytics"],
    cta: "Go Pro",
    featured: true
  },
  {
    name: "Elite",
    icon: Crown,
    monthly: 2499,
    annual: 1999,
    tagline: "For established firms",
    features: ["Everything in Pro", "Premium & exclusive leads", "Featured placement", "Advanced analytics", "Dedicated success manager"],
    cta: "Go Elite"
  }
];

const inr = (n) => (n === 0 ? "Free" : `₹${n.toLocaleString("en-IN")}`);

export const PricingPreview = () => {
  const [cycle, setCycle] = useState("annual");
  const annual = cycle === "annual";

  return (
    <section id="pricing" className="py-20 md:py-28">
      <Container>
        <div className="flex flex-col items-center gap-7 text-center">
          <SectionHeading
            align="center"
            eyebrow="Pricing"
            title="Customers post for free. Contractors choose a plan."
            subtitle="Simple, transparent pricing with a 3% commission only on completed projects. Cancel anytime."
            className="mx-auto"
          />
          <SegmentedControl
            value={cycle}
            onChange={setCycle}
            options={[
              { value: "monthly", label: "Monthly" },
              { value: "annual", label: "Annual · save 20%" }
            ]}
          />
        </div>

        <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-3">
          {PLANS.map((plan, i) => (
            <Reveal
              key={plan.name}
              delay={i * 0.08}
              className={cn(
                "premium-card relative flex flex-col rounded-3xl p-7",
                plan.featured && "ring-2 ring-brand lg:-my-3 lg:py-10 shadow-glow"
              )}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white shadow-glow-sm">
                  Most popular
                </span>
              )}
              <div className="flex items-center gap-3">
                <span className={cn("grid h-11 w-11 place-items-center rounded-xl", plan.featured ? "bg-brand text-white" : "bg-brand/10 text-brand")}>
                  <plan.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-lg font-bold text-content">{plan.name}</p>
                  <p className="text-xs font-medium text-subtle">{plan.tagline}</p>
                </div>
              </div>

              <div className="mt-6 flex items-end gap-1.5">
                <span className="font-display text-4xl font-bold tracking-tight text-content tabular">
                  {inr(annual ? plan.annual : plan.monthly)}
                </span>
                {plan.monthly > 0 && <span className="pb-1 text-sm font-medium text-muted">/mo</span>}
              </div>
              {annual && plan.monthly > 0 && (
                <p className="mt-1 text-xs text-subtle">billed annually</p>
              )}

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-muted">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                as={Link}
                to="/register"
                variant={plan.featured ? "primary" : "secondary"}
                size="lg"
                className="mt-7 w-full"
              >
                {plan.cta} <ArrowRight className="h-4 w-4" />
              </Button>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
};
