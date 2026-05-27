import { MessageCircle, Star } from "lucide-react";
import { Button } from "./Button";

export const ContractorCard = ({ contractor, onChat }) => (
  <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
    <div className="flex items-start gap-4">
      <img
        src={contractor.profileImage?.url || `https://ui-avatars.com/api/?name=${contractor.name}&background=3f6f5a&color=fff`}
        alt={contractor.name}
        className="h-14 w-14 rounded-lg object-cover"
      />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-bold text-ink">{contractor.contractorProfile?.businessName || contractor.name}</h3>
        <p className="text-sm text-ink/60">{contractor.city || "Service area not added"}</p>
        <div className="mt-2 flex items-center gap-1 text-sm font-semibold text-clay">
          <Star className="h-4 w-4 fill-current" />
          {contractor.contractorProfile?.rating || "New"}
        </div>
      </div>
    </div>
    <p className="mt-4 line-clamp-2 text-sm leading-6 text-ink/65">
      {contractor.contractorProfile?.bio || "Construction and interior specialist ready for Buildora projects."}
    </p>
    <div className="mt-4 flex flex-wrap gap-2">
      {(contractor.contractorProfile?.services || ["construction", "interior"]).slice(0, 3).map((service) => (
        <span key={service} className="rounded-full bg-mist px-3 py-1 text-xs font-bold text-moss">
          {service}
        </span>
      ))}
    </div>
    {onChat && (
      <Button onClick={() => onChat(contractor)} className="mt-5 w-full" variant="secondary">
        <MessageCircle className="h-4 w-4" />
        Chat
      </Button>
    )}
  </div>
);
