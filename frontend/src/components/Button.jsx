import { cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "../lib/cn";

const buttonVariants = cva(
  "relative inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 ease-premium disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-white shadow-glow hover:-translate-y-0.5 hover:shadow-[0_20px_46px_-10px_rgba(214,45,20,0.55)]",
        secondary:
          "border border-line-strong bg-surface text-content hover:border-brand/40 hover:bg-surface-2",
        spark: "bg-spark text-white shadow-glow-sm hover:-translate-y-0.5 hover:brightness-105",
        outline: "border-2 border-brand/30 text-brand hover:border-brand/60 hover:bg-brand/5",
        ink: "bg-ink-900 text-white hover:bg-ink-800 dark:bg-white dark:text-ink-900 dark:hover:bg-ink-100",
        ghost: "bg-transparent text-content hover:bg-surface-2",
        // legacy alias kept for older call-sites
        accent: "bg-spark text-white shadow-glow-sm hover:-translate-y-0.5"
      },
      size: {
        sm: "px-3.5 py-2 text-xs",
        md: "px-4 py-2.5 text-sm",
        lg: "px-6 py-3.5 text-base",
        icon: "h-10 w-10 p-0"
      }
    },
    defaultVariants: { variant: "primary", size: "md" }
  }
);

export const Button = ({
  children,
  className = "",
  variant = "primary",
  size = "md",
  as: Component = "button",
  loading = false,
  disabled = false,
  ...props
}) => {
  const isButton = Component === "button";
  return (
    <Component
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={isButton ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </Component>
  );
};
