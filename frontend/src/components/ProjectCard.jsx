import { ArrowRight, Crown, MapPin, Timer } from "lucide-react";
import { Link } from "react-router-dom";
import { currency } from "../utils/format";

export const ProjectCard = ({ project }) => (
  <Link
    to={`/projects/${project._id}`}
    className="group premium-card block rounded-2xl p-5 transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-glow"
  >
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold capitalize text-accent">
            {project.category}
          </span>
          {project.visibility === "premium" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-gold">
              <Crown className="h-3 w-3" /> Premium
            </span>
          )}
        </div>
        <h3 className="mt-3 text-lg font-bold text-content transition group-hover:text-accent">{project.title}</h3>
      </div>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-surface-2 transition group-hover:bg-primary">
        <ArrowRight className="h-5 w-5 text-muted transition group-hover:translate-x-0.5 group-hover:text-white" />
      </span>
    </div>
    <p className="line-clamp-2 text-sm leading-6 text-muted">{project.description}</p>
    <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line/50 pt-4 text-sm text-muted">
      <span className="font-extrabold text-content">{currency(project.budget)}</span>
      <span className="inline-flex items-center gap-1">
        <MapPin className="h-4 w-4" />
        {project.location}
      </span>
      <span className="inline-flex items-center gap-1">
        <Timer className="h-4 w-4" />
        {project.timeline}
      </span>
    </div>
  </Link>
);
