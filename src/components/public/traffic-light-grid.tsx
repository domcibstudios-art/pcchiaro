interface TrafficLightGridProps {
  gamingRating: string;
  gamingReason?: string | null;
  workRating: string;
  workReason?: string | null;
  officeRating: string;
  officeReason?: string | null;
  compact?: boolean;
}

export default function TrafficLightGrid({
  gamingRating,
  gamingReason,
  workRating,
  workReason,
  officeRating,
  officeReason,
  compact = false,
}: TrafficLightGridProps) {
  const getBadgeStyle = (rating: string) => {
    switch (rating) {
      case "idoneo":
        return {
          label: "IDONEO",
          dot: "bg-emerald-600",
          bg: "bg-emerald-50 border-emerald-200 text-emerald-950",
          badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
        };
      case "limitato":
        return {
          label: "LIMITATO",
          dot: "bg-amber-500",
          bg: "bg-amber-50 border-amber-200 text-amber-950",
          badge: "bg-amber-100 text-amber-800 border-amber-300",
        };
      case "non_adatto":
      default:
        return {
          label: "NON ADATTO",
          dot: "bg-red-600",
          bg: "bg-red-50 border-red-200 text-red-950",
          badge: "bg-red-100 text-red-800 border-red-300",
        };
    }
  };

  const scenarios = [
    {
      title: "Gaming 1080p",
      sub: "Risoluzione reale & VRAM",
      icon: "🎮",
      rating: gamingRating,
      reason: gamingReason,
    },
    {
      title: "Lavoro & CAD",
      sub: "CUDA Core & RAM Dual Channel",
      icon: "💼",
      rating: workRating,
      reason: workReason,
    },
    {
      title: "Studio & Ufficio",
      sub: "Codec AV1, Office & Win 11",
      icon: "🎓",
      rating: officeRating,
      reason: officeReason,
    },
  ];

  if (compact) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {scenarios.map((sc, i) => {
          const style = getBadgeStyle(sc.rating);
          return (
            <div
              key={i}
              className={`p-2.5 rounded-xl border flex flex-col justify-between gap-1.5 ${style.bg}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span aria-hidden="true">{sc.icon}</span> {sc.title}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border inline-flex items-center gap-1 ${style.badge}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
                  {style.label}
                </span>
              </div>
              {sc.reason && (
                <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                  {sc.reason}
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {scenarios.map((sc, i) => {
        const style = getBadgeStyle(sc.rating);
        return (
          <div
            key={i}
            className={`p-4 rounded-xl border flex flex-col justify-between gap-3 shadow-sm ${style.bg}`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="text-lg" aria-hidden="true">{sc.icon}</span> {sc.title}
                </span>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1.5 ${style.badge}`}
                >
                  <span className={`w-2 h-2 rounded-full ${style.dot}`} aria-hidden="true" />
                  {style.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">{sc.sub}</p>
            </div>
            {sc.reason ? (
              <p className="text-xs text-slate-700 leading-relaxed bg-white/70 p-2.5 rounded-lg border border-slate-200/50">
                {sc.reason}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">Nessun dettaglio specificato</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
