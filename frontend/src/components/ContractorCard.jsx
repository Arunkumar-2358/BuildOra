import { BadgeCheck, Crown, MapPin, MessageCircle, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./Button";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";

export const ContractorCard = ({ contractor, onChat }) => {
  const profile = contractor.contractorProfile || {};
  const name = profile.businessName || contractor.name;
  const services = profile.services?.length ? profile.services : ["construction", "interior"];

  return (
    <div className="group premium-card card-hover flex flex-col rounded-2xl p-5">
      <div className="flex items-start gap-4">
        <Avatar src={contractor.profileImage?.url} name={name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link to={`/contractors/${contractor._id}`} className="truncate font-bold text-content transition group-hover:text-brand">
              {name}
            </Link>
            {profile.isPremium && <Crown className="h-4 w-4 shrink-0 text-spark" />}
            {profile.isVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-success" />}
          </div>
          <p className="inline-flex items-center gap-1 text-sm text-muted">
            <MapPin className="h-3.5 w-3.5" /> {contractor.city || "Service area not added"}
          </p>
          <div className="mt-1.5 flex items-center gap-1 text-sm font-bold text-content">
            <Star className="h-4 w-4 fill-spark text-spark" />
            {profile.rating || "New"}
            {profile.totalReviews ? <span className="font-normal text-subtle">({profile.totalReviews})</span> : null}
          </div>
        </div>
      </div>

      <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted">
        {profile.bio || "Construction and interior specialist ready for BuildOra projects."}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {services.slice(0, 3).map((service) => (
          <Badge key={service} tone="neutral" size="sm">{service}</Badge>
        ))}
      </div>

      <div className="mt-auto flex gap-2 pt-5">
        <Button as={Link} to={`/contractors/${contractor._id}`} variant="secondary" size="sm" className="flex-1">
          View profile
        </Button>
        {onChat && (
          <Button onClick={() => onChat(contractor)} size="sm" className="flex-1">
            <MessageCircle className="h-4 w-4" /> Chat
          </Button>
        )}
      </div>
    </div>
  );
};
