import { MapPin, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Button } from "./Button";
import { MatchRing } from "./MatchScore";
import { StarDisplay } from "./StarRating";

/**
 * "Recommended contractors" for a project — driven by the smart matching engine.
 * Shows the top matches with their score, distance, and quick actions.
 */
export const RecommendedContractors = ({ projectId }) => {
  const navigate = useNavigate();
  const [list, setList] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .get(`/projects/${projectId}/recommended`)
      .then(({ data }) => active && setList(data))
      .catch(() => active && setList([]));
    return () => {
      active = false;
    };
  }, [projectId]);

  const startChat = async (participantId) => {
    const { data } = await api.post("/chats/start", { participantId, projectId });
    navigate(`/chat/${data._id}`);
  };

  if (list === null) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => <div key={i} className="premium-card h-32 animate-pulse rounded-2xl" />)}
      </div>
    );
  }

  if (!list.length) {
    return (
      <div className="premium-card rounded-2xl p-6 text-center">
        <Sparkles className="mx-auto h-7 w-7 text-muted" />
        <p className="mt-2 font-bold text-content">No matches yet</p>
        <p className="mt-1 text-sm text-muted">Recommendations appear once contractors with matching profiles join near this location.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {list.map((c) => {
        const profile = c.contractorProfile || {};
        return (
          <div key={c._id} className="premium-card flex gap-4 rounded-2xl p-5">
            <MatchRing score={c.matchScore} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <Link to={`/contractors/${c._id}`} className="truncate font-bold text-content hover:text-accent">
                  {profile.businessName || c.name}
                </Link>
                {profile.isVerified && <ShieldCheck className="h-4 w-4 flex-shrink-0 text-success" />}
              </div>
              <p className="text-xs font-bold text-accent">{c.matchLabel}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">
                {profile.rating > 0 && <StarDisplay value={profile.rating} size="sm" showValue />}
                {c.distanceKm != null && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.distanceKm} km</span>}
                {profile.experience ? <span>{profile.experience} yrs</span> : null}
              </div>
              <div className="mt-3 flex gap-2">
                <Button as={Link} to={`/contractors/${c._id}`} variant="secondary" className="px-3 py-1.5 text-xs">View profile</Button>
                <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => startChat(c._id)}>
                  <MessageCircle className="h-3.5 w-3.5" /> Chat
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
