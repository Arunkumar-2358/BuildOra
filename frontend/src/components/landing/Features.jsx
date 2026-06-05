import {
  BadgeCheck,
  CheckCheck,
  MapPin,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Target
} from "lucide-react";
import { cn } from "../../lib/cn";
import { Container } from "../ui/Container";
import { Reveal, Stagger, RevealItem } from "../ui/Reveal";
import { SectionHeading } from "../ui/SectionHeading";

const FeatureCard = ({ icon: Icon, title, copy, className, children }) => (
  <RevealItem
    className={cn(
      "premium-card card-hover group flex flex-col rounded-3xl p-6 md:p-7",
      className
    )}
  >
    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand transition-colors group-hover:bg-brand group-hover:text-white">
      <Icon className="h-6 w-6" />
    </span>
    <h3 className="mt-5 text-lg font-bold text-content">{title}</h3>
    <p className="mt-2 text-sm leading-6 text-muted">{copy}</p>
    {children}
  </RevealItem>
);

// Mini chat mock that lives inside the hero feature card.
const ChatMock = () => (
  <div className="mt-6 flex-1 space-y-2.5 rounded-2xl border border-line bg-surface-2/60 p-4">
    <div className="flex justify-start">
      <div className="max-w-[78%] rounded-2xl rounded-bl-md bg-surface px-3.5 py-2 text-sm text-content shadow-xs">
        Can you share the kitchen floor plan?
      </div>
    </div>
    <div className="flex justify-end">
      <div className="max-w-[78%] rounded-2xl rounded-br-md bg-brand px-3.5 py-2 text-sm text-white shadow-glow-sm">
        Sent — PDF + 3 references 📎
      </div>
    </div>
    <div className="flex items-center gap-1.5 pl-1 text-xs font-medium text-subtle">
      <CheckCheck className="h-3.5 w-3.5 text-brand" /> Seen · typing…
    </div>
  </div>
);

export const Features = () => (
  <section id="features" className="py-20 md:py-28">
    <Container>
      <SectionHeading
        align="center"
        eyebrow="Everything in one place"
        title="A marketplace built for trust and speed."
        subtitle="Every feature is designed to reduce friction for homeowners and help great contractors win more work."
        className="mx-auto"
      />

      <Stagger className="mt-14 grid gap-5 md:grid-cols-3 md:auto-rows-fr">
        <FeatureCard
          className="md:col-span-2 md:row-span-2"
          icon={Sparkles}
          title="Realtime chat that keeps every decision on record"
          copy="Message, share images, PDFs and floor plans, send voice notes, and see read receipts — all timestamped, so nothing gets lost between calls."
        >
          <ChatMock />
        </FeatureCard>

        <FeatureCard
          icon={BadgeCheck}
          title="Verified profiles & portfolios"
          copy="Ratings, completed projects, skills and certifications build a credible decision layer."
        />
        <FeatureCard
          icon={Target}
          title="Smart project matching"
          copy="Contractors see leads ranked by trade, location and capacity — a relevance score, not noise."
        />
        <FeatureCard
          icon={ShieldCheck}
          title="Transparent, competitive bids"
          copy="Scoped quotes with amount and timeline, compared side by side. No dark pricing."
        />
        <FeatureCard
          icon={MapPin}
          title="Location-based discovery"
          copy="Find nearby pros and projects with map-aware search and distance-smart results."
        />
        <FeatureCard
          icon={ReceiptText}
          title="Secure payments & GST invoices"
          copy="Pay with confidence. Subscriptions and a simple 3% commission only on completed work."
        />
      </Stagger>
    </Container>
  </section>
);
