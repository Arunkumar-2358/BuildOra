export const Button = ({ children, className = "", variant = "primary", as: Component = "button", ...props }) => {
  const variants = {
    primary: "bg-ink text-white shadow-lg shadow-ink/15 hover:bg-moss hover:shadow-moss/20",
    secondary: "bg-white text-ink border border-ink/10 shadow-sm hover:border-moss/40 hover:shadow-md",
    accent: "bg-clay text-white shadow-lg shadow-clay/20 hover:bg-clay/90",
    ghost: "bg-transparent text-ink hover:bg-ink/5"
  };

  return (
    <Component
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};
