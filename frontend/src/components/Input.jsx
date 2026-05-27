export const Input = ({ label, className = "", ...props }) => (
  <label className="block">
    {label && <span className="mb-1.5 block text-sm font-semibold text-ink/75">{label}</span>}
    <input
      className={`w-full rounded-lg border border-ink/10 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-moss focus:ring-4 focus:ring-moss/10 ${className}`}
      {...props}
    />
  </label>
);

export const Textarea = ({ label, className = "", ...props }) => (
  <label className="block">
    {label && <span className="mb-1.5 block text-sm font-semibold text-ink/75">{label}</span>}
    <textarea
      className={`min-h-32 w-full resize-y rounded-lg border border-ink/10 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-moss focus:ring-4 focus:ring-moss/10 ${className}`}
      {...props}
    />
  </label>
);

export const Select = ({ label, children, className = "", ...props }) => (
  <label className="block">
    {label && <span className="mb-1.5 block text-sm font-semibold text-ink/75">{label}</span>}
    <select
      className={`w-full rounded-lg border border-ink/10 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-moss focus:ring-4 focus:ring-moss/10 ${className}`}
      {...props}
    >
      {children}
    </select>
  </label>
);
