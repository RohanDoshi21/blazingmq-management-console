import { cn } from "@/lib/utils";

function Progress({ value, max = 100, className, barClassName }: { value: number; max?: number; className?: string; barClassName?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const color = pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-blue-500";

  return (
    <div className={cn("h-2 w-full rounded-full bg-slate-800 overflow-hidden", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-500 ease-out", color, barClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export { Progress };
