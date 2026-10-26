import { SITE_CONFIG } from "@/config/site";

interface VerdictBadgeProps {
  verdict: keyof typeof SITE_CONFIG.verdicts | string;
  size?: "sm" | "md" | "lg";
}

export default function VerdictBadge({ verdict, size = "md" }: VerdictBadgeProps) {
  const config =
    (SITE_CONFIG.verdicts as Record<string, { label: string; badgeClass: string; icon: string }>)[verdict] || {
      label: verdict.toUpperCase(),
      badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
      icon: "help_outline",
    };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] gap-1",
    md: "px-3 py-1 text-xs gap-1.5",
    lg: "px-4 py-2 text-sm sm:text-base gap-2 font-extrabold",
  };

  const iconSizes = {
    sm: "text-xs",
    md: "text-base",
    lg: "text-xl",
  };

  return (
    <div
      className={`inline-flex items-center font-mono font-bold border rounded-lg ${config.badgeClass} ${sizeClasses[size]}`}
    >
      <span className={`material-symbols-outlined ${iconSizes[size]}`} aria-hidden="true">
        {config.icon}
      </span>
      <span>VERDETTO: {config.label}</span>
    </div>
  );
}
