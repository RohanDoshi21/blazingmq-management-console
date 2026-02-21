import { cn, formatNumber, formatBytes } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  iconColor?: string;
  className?: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, iconColor = "text-blue-400", className }: StatCardProps) {
  return (
    <div className={cn("rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-white tabular-nums">{typeof value === "number" ? formatNumber(value) : value}</p>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800", iconColor.includes("blue") && "bg-blue-500/10", iconColor.includes("emerald") && "bg-emerald-500/10", iconColor.includes("amber") && "bg-amber-500/10", iconColor.includes("purple") && "bg-purple-500/10", iconColor.includes("red") && "bg-red-500/10", iconColor.includes("cyan") && "bg-cyan-500/10")}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span className={trend.value >= 0 ? "text-emerald-400" : "text-red-400"}>
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
          <span className="text-slate-500">{trend.label}</span>
        </div>
      )}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  maxValue: number;
  format?: "number" | "bytes";
  className?: string;
}

export function MetricCard({ label, value, maxValue, format = "number", className }: MetricCardProps) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  const displayValue = format === "bytes" ? formatBytes(value) : formatNumber(value);
  const displayMax = format === "bytes" ? formatBytes(maxValue) : formatNumber(maxValue);
  const barColor = pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-blue-500";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono text-xs text-slate-300">
          {displayValue} / {displayMax}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", barColor)} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <div className="text-right text-[10px] text-slate-500">{pct.toFixed(1)}% used</div>
    </div>
  );
}
