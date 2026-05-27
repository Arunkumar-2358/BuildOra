import { ArrowRight, MapPin, Timer } from "lucide-react";
import { Link } from "react-router-dom";
import { currency } from "../utils/format";

export const ProjectCard = ({ project }) => (
  <Link
    to={`/projects/${project._id}`}
    className="group premium-card block rounded-lg p-5 transition hover:-translate-y-1 hover:shadow-glow"
  >
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <span className="rounded-full bg-mist px-3 py-1 text-xs font-bold capitalize text-moss">
          {project.category}
        </span>
        <h3 className="mt-3 text-lg font-bold text-ink transition group-hover:text-moss">{project.title}</h3>
      </div>
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-mist transition group-hover:bg-ink">
        <ArrowRight className="h-5 w-5 text-ink/40 transition group-hover:translate-x-0.5 group-hover:text-white" />
      </span>
    </div>
    <p className="line-clamp-2 text-sm leading-6 text-ink/65">{project.description}</p>
    <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-4 text-sm text-ink/65">
      <span className="font-extrabold text-ink">{currency(project.budget)}</span>
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
