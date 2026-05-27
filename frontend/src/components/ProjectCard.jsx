import { ArrowRight, MapPin, Timer } from "lucide-react";
import { Link } from "react-router-dom";
import { currency } from "../utils/format";

export const ProjectCard = ({ project }) => (
  <Link
    to={`/projects/${project._id}`}
    className="group block rounded-lg border border-ink/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-soft"
  >
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <span className="rounded-full bg-mist px-3 py-1 text-xs font-bold capitalize text-moss">
          {project.category}
        </span>
        <h3 className="mt-3 text-lg font-bold text-ink">{project.title}</h3>
      </div>
      <ArrowRight className="h-5 w-5 text-ink/30 transition group-hover:translate-x-1 group-hover:text-clay" />
    </div>
    <p className="line-clamp-2 text-sm leading-6 text-ink/65">{project.description}</p>
    <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-ink/65">
      <span className="font-bold text-ink">{currency(project.budget)}</span>
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
