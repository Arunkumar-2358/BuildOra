export const Button = ({ children, className = "", variant = "primary", as: Component = "button", ...props }) => {
  const variants = {
    primary: "bg-ink text-white hover:bg-moss",
    secondary: "bg-white text-ink border border-ink/10 hover:border-moss/40",
    accent: "bg-clay text-white hover:bg-clay/90",
    ghost: "bg-transparent text-ink hover:bg-ink/5"
  };

  return (
    <Component
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};
