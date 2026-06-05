import { cn } from "../../lib/cn";

/** Shimmering placeholder for loading states (see `.skeleton` in index.css). */
export const Skeleton = ({ className }) => (
  <div className={cn("skeleton rounded-lg", className)} />
);

/** Ready-made card skeleton matching the ProjectCard footprint. */
export const CardSkeleton = ({ className }) => (
  <div className={cn("premium-card rounded-2xl p-5", className)}>
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-24 rounded-full" />
      <Skeleton className="h-9 w-9 rounded-xl" />
    </div>
    <Skeleton className="mt-4 h-5 w-3/4" />
    <Skeleton className="mt-2 h-4 w-full" />
    <Skeleton className="mt-2 h-4 w-2/3" />
    <div className="mt-5 flex gap-3 border-t border-line/60 pt-4">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-14" />
    </div>
  </div>
);
