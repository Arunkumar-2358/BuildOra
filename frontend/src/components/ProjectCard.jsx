import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Clock,
  Crown,
  HardHat,
  Hammer,
  Layers,
  MapPin,
  Ruler,
  Sofa,
  Sparkles,
  Trees
} from "lucide-react";
import { Link } from "react-router-dom";
import { ease } from "../lib/motion";
import { currency } from "../utils/format";
import { isPdf } from "../utils/upload";
import { Badge, StatusPill } from "./ui/Badge";

const CATEGORY_ICON = {
  construction: HardHat,
  interior: Sofa,
  renovation: Hammer,
  architecture: Ruler,
  landscaping: Trees,
  other: Layers
};

const MotionLink = motion(Link);

export const ProjectCard = ({ project, index = 0 }) => {
  const image = project.images?.find((i) => i?.url && !isPdf(i.mimeType || i.url));
  const Icon = CATEGORY_ICON[project.category] || Layers;
  const isNew = project.createdAt && Date.now() - new Date(project.createdAt).getTime() < 48 * 60 * 60 * 1000;
  const bidCount = project.bidCount ?? project.bidsCount;

  return (
    <MotionLink
      to={`/projects/${project._id}`}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.5, ease, delay: Math.min(index * 0.06, 0.36) }}
      className="group premium-card card-hover flex flex-col overflow-hidden rounded-2xl"
    >
      {/* Media */}
      <div className="relative h-40 shrink-0 overflow-hidden">
        {image ? (
          <img
            src={image.url}
            alt={project.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-premium group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center bg-gradient-to-br from-brand/10 via-surface-2 to-spark/10">
            <Icon className="h-12 w-12 text-brand/35" />
          </div>
        )}
        <div className="absolute right-3 top-3">
          <StatusPill status={project.status} className="bg-surface/90 backdrop-blur" />
        </div>
        {project.visibility === "premium" && (
          <div className="absolute left-3 top-3">
            <Badge tone="spark" icon={Crown}>Premium</Badge>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand" size="sm">{project.category}</Badge>
          {isNew && <Badge tone="success" size="sm" icon={Sparkles}>New</Badge>}
        </div>

        <div className="mt-3 flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-lg font-bold text-content transition-colors group-hover:text-brand">
            {project.title}
          </h3>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted transition-all group-hover:bg-brand group-hover:text-white">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>

        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{project.description}</p>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line/60 pt-4 text-sm text-muted">
          <span className="font-display text-base font-bold text-content tabular">{currency(project.budget)}</span>
          {project.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {project.location}
            </span>
          )}
          {project.timeline && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" /> {project.timeline}
            </span>
          )}
          {bidCount != null && (
            <span className="ml-auto font-semibold text-brand">{bidCount} bids</span>
          )}
        </div>
      </div>
    </MotionLink>
  );
};
