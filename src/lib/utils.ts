import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

export function formatDuration(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function getStatusColor(status: string): string {
  const s = status.toUpperCase();
  if (s.includes("AVAILABLE") || s.includes("ACTIVE") || s.includes("LEADER") || s.includes("SUCCESS") || s.includes("HEALTHY")) {
    return "text-emerald-400";
  }
  if (s.includes("STARTING") || s.includes("FOLLOWER") || s.includes("PASSIVE") || s.includes("CANDIDATE")) {
    return "text-amber-400";
  }
  if (s.includes("UNAVAILABLE") || s.includes("STOPPING") || s.includes("ERROR") || s.includes("DORMANT")) {
    return "text-red-400";
  }
  return "text-slate-400";
}

export function getStatusBgColor(status: string): string {
  const s = status.toUpperCase();
  if (s.includes("AVAILABLE") || s.includes("ACTIVE") || s.includes("LEADER") || s.includes("SUCCESS") || s.includes("HEALTHY")) {
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  }
  if (s.includes("STARTING") || s.includes("FOLLOWER") || s.includes("PASSIVE") || s.includes("CANDIDATE")) {
    return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  }
  if (s.includes("UNAVAILABLE") || s.includes("STOPPING") || s.includes("ERROR") || s.includes("DORMANT")) {
    return "bg-red-500/10 text-red-400 border-red-500/20";
  }
  return "bg-slate-500/10 text-slate-400 border-slate-500/20";
}
