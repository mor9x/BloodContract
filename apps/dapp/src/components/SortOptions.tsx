import { getTranslation } from "../lib/language";

type SortOptionsProps = {
  currentSort: "totalReward" | "perKillReward" | "timeRemaining";
  onSortChange: (value: "totalReward" | "perKillReward" | "timeRemaining") => void;
  currentLang: "en" | "zh";
};

export function SortOptions({ currentSort, onSortChange, currentLang }: SortOptionsProps) {
  const t = (key: string) => getTranslation(currentLang, key);
  const sortOptions = [
    { value: "totalReward", label: t("sort.totalReward") },
    { value: "perKillReward", label: t("sort.perKillReward") },
    { value: "timeRemaining", label: t("sort.timeRemaining") }
  ] as const;

  return (
    <div className="flex flex-col gap-6 border border-white/20 bg-[#1A1A1A] p-6 sm:flex-row sm:items-center">
      <div className="flex items-center gap-6 border-b border-white/10 px-2 pb-6 sm:border-b-0 sm:pb-0 sm:pr-8">
        <svg className="h-5 w-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.35}
          />
        </svg>
        <span className="text-xs font-semibold uppercase tracking-widest text-white/60">{t("sort.title")}</span>
      </div>

      <div className="flex flex-1 flex-col sm:flex-row">
        {sortOptions.map((option, index) => (
          <button
            key={option.value}
            onClick={() => onSortChange(option.value)}
            type="button"
            className={`flex-1 border-y border-l px-6 py-4.5 text-base font-bold tracking-widest transition-all duration-300 first:rounded-l-sm last:rounded-r-sm last:border-r ${
              currentSort === option.value
                ? "z-10 border-[#FF0000] bg-[#FF0000] text-black shadow-[0_0_20px_rgba(255,0,0,0.4)]"
                : "border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white"
            } ${index > 0 ? "-ml-px" : ""}`}
          >
            <span className="whitespace-nowrap">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
