import { SITE_CONFIG } from "@/config/site";

interface EvidenceBadgeProps {
  level: keyof typeof SITE_CONFIG.evidenceLevels | string;
}

export default function EvidenceBadge({ level }: EvidenceBadgeProps) {
  const config =
    (SITE_CONFIG.evidenceLevels as Record<string, { label: string; description: string }>)[level] || {
      label: level,
      description: "",
    };

  const isTest = level === "test_diretto";
  const isVerifica = level === "verifica_indipendente";

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
        isTest
          ? "bg-purple-50 text-purple-800 border-purple-200"
          : isVerifica
          ? "bg-blue-50 text-blue-800 border-blue-200"
          : "bg-slate-100 text-slate-700 border-slate-200"
      }`}
      title={config.description}
    >
      <span className="material-symbols-outlined text-sm" aria-hidden="true">
        {isTest ? "science" : isVerifica ? "fact_check" : "description"}
      </span>
      <span>Base informativa: {config.label}</span>
    </div>
  );
}
