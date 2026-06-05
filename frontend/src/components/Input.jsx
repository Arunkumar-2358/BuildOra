import { cn } from "../lib/cn";

const base =
  "w-full rounded-xl border bg-surface px-3.5 py-3 text-sm text-content outline-none transition placeholder:text-subtle disabled:opacity-60";

const stateClass = (error) =>
  error
    ? "border-brand/60 focus:border-brand focus:ring-4 focus:ring-brand/15"
    : "border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/15";

/** Form field wrapper: label (+ optional hint) and an inline error message. */
export const Field = ({ label, hint, error, htmlFor, className, children }) => (
  <label htmlFor={htmlFor} className={cn("block", className)}>
    {label && (
      <span className="mb-1.5 flex items-center justify-between gap-2 text-sm font-semibold text-content">
        {label}
        {hint && <span className="text-xs font-normal text-subtle">{hint}</span>}
      </span>
    )}
    {children}
    {error && <span className="mt-1.5 block text-xs font-semibold text-brand">{error}</span>}
  </label>
);

export const Input = ({ label, hint, error, icon: Icon, className = "", ...props }) => (
  <Field label={label} hint={hint} error={error}>
    <span className="relative block">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
      )}
      <input className={cn(base, stateClass(error), Icon && "pl-10", className)} {...props} />
    </span>
  </Field>
);

export const Textarea = ({ label, hint, error, className = "", ...props }) => (
  <Field label={label} hint={hint} error={error}>
    <textarea className={cn(base, stateClass(error), "min-h-32 resize-y", className)} {...props} />
  </Field>
);

export const Select = ({ label, hint, error, children, className = "", ...props }) => (
  <Field label={label} hint={hint} error={error}>
    <select className={cn(base, stateClass(error), "appearance-none pr-10", className)} {...props}>
      {children}
    </select>
  </Field>
);
