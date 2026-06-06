import { cn } from "../../lib/cn";

/** Friendly empty/zero-data state with an optional primary action. */
export const EmptyState = ({ icon: Icon, title, description, action, className }) => (
  <div
    className={cn(
      "premium-card flex flex-col items-center rounded-2xl px-6 py-14 text-center",
      className
    )}
  >
    {Icon && (
      <span className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-brand/10 text-brand">
        <Icon className="h-8 w-8" />
      </span>
    )}
    <h3 className="text-lg font-bold text-content">{title}</h3>
    {description && <p className="mt-2 max-w-sm text-sm leading-6 text-muted">{description}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);
