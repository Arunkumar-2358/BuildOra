import { cva } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99]",
  {
    variants: {
      variant: {
        primary: "bg-brand-gradient text-white shadow-glow hover:brightness-110",
        secondary: "border border-line-strong bg-surface/90 text-content hover:border-line-strong hover:bg-surface-2",
        accent: "bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-900/25",
        ghost: "bg-transparent text-content hover:bg-surface-2/80"
      }
    },
    defaultVariants: {
      variant: "primary"
    }
  }
);

export const Button = ({ children, className = "", variant = "primary", as: Component = "button", ...props }) => {
  return (
    <Component
      className={twMerge(buttonVariants({ variant }), className)}
      {...props}
    >
      {children}
    </Component>
  );
};
