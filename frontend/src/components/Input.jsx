const fieldClass =
  "w-full rounded-xl border border-line-strong bg-surface/80 px-3.5 py-3 text-sm text-content outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20 placeholder:text-subtle";

export const Input = ({ label, className = "", ...props }) => (
  <label className="block">
    {label && <span className="mb-1.5 block text-sm font-semibold text-muted">{label}</span>}
    <input
      className={`${fieldClass} ${className}`}
      {...props}
    />
  </label>
);

export const Textarea = ({ label, className = "", ...props }) => (
  <label className="block">
    {label && <span className="mb-1.5 block text-sm font-semibold text-muted">{label}</span>}
    <textarea
      className={`min-h-32 w-full resize-y ${fieldClass} ${className}`}
      {...props}
    />
  </label>
);

export const Select = ({ label, children, className = "", ...props }) => (
  <label className="block">
    {label && <span className="mb-1.5 block text-sm font-semibold text-muted">{label}</span>}
    <select
      className={`${fieldClass} ${className}`}
      {...props}
    >
      {children}
    </select>
  </label>
);
