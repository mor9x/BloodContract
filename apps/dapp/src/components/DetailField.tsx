import { DetailFieldProps } from "./TaskCard";

export function DetailField({ label, value, valueClassName }: DetailFieldProps) {
  return (
    <div className="flex flex-col gap-4 py-2 first:pt-0">
      <div className="flex items-center gap-4">
        <div className="h-px w-5 bg-[#ff5a1f]/60" />
        <span className="text-[12px] font-black uppercase tracking-[0.4em] text-white/30">{label}</span>
      </div>
      <div className={`pl-9 font-mono text-white/95 ${valueClassName ?? "text-lg leading-relaxed"}`}>
        {value}
      </div>
    </div>
  );
}
