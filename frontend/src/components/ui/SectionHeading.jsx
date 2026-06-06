import { cn } from "../../lib/cn";
import { Reveal } from "./Reveal";

/** Eyebrow + title + optional subtitle — the standard section intro rhythm. */
export const SectionHeading = ({
  eyebrow,
  title,
  subtitle,
  align = "left",
  className,
  titleClassName
}) => (
  <Reveal
    className={cn(
      "max-w-2xl",
      align === "center" && "mx-auto text-center",
      className
    )}
  >
    {eyebrow && (
      <p className="mb-3 inline-flex items-center gap-2 text-eyebrow uppercase text-brand">
        <span className="h-px w-6 bg-brand/50" />
        {eyebrow}
      </p>
    )}
    <h2 className={cn("text-balance text-3xl font-bold tracking-tight text-content md:text-[2.6rem] md:leading-[1.05]", titleClassName)}>
      {title}
    </h2>
    {subtitle && <p className="mt-4 text-base leading-7 text-muted md:text-lg">{subtitle}</p>}
  </Reveal>
);
