import { Crown, MessageCircle, Star } from "lucide-react";
import { Button } from "./Button";

export const ContractorCard = ({ contractor, onChat }) => (
  <div className="group premium-card rounded-2xl p-5 transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-glow">
    <div className="flex items-start gap-4">
      <img
        src={contractor.profileImage?.url || `https://ui-avatars.com/api/?name=${contractor.name}&background=3f6f5a&color=fff`}
        alt={contractor.name}
        className="h-14 w-14 rounded-xl object-cover shadow-md"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate text-base font-bold text-content">{contractor.contractorProfile?.businessName || contractor.name}</h3>
          {contractor.contractorProfile?.isPremium && <Crown className="h-4 w-4 flex-shrink-0 text-gold" />}
        </div>
        <p className="text-sm text-muted">{contractor.city || "Service area not added"}</p>
        <div className="mt-2 flex items-center gap-1 text-sm font-semibold text-success">
          <Star className="h-4 w-4 fill-current" />
          {contractor.contractorProfile?.rating || "New"}
        </div>
      </div>
    </div>
    <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted">
      {contractor.contractorProfile?.bio || "Construction and interior specialist ready for Buildora projects."}
    </p>
    <div className="mt-4 flex flex-wrap gap-2">
      {(contractor.contractorProfile?.services || ["construction", "interior"]).slice(0, 3).map((service) => (
        <span key={service} className="rounded-full border border-line-strong bg-surface-2 px-3 py-1 text-xs font-bold capitalize text-muted">
          {service}
        </span>
      ))}
    </div>
    <div className="mt-5 grid grid-cols-2 gap-2 border-t border-line/40 pt-4 text-xs font-bold text-muted">
      <span>12 active leads</span>
      <span className="text-right text-success">Verified profile</span>
    </div>
    {onChat && (
      <Button onClick={() => onChat(contractor)} className="mt-5 w-full" variant="secondary">
        <MessageCircle className="h-4 w-4" />
        Chat
      </Button>
    )}
  </div>
);
