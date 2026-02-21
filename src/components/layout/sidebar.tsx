"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Database,
  Layers,
  Server,
  ArrowDownToLine,
  ArrowUpFromLine,
  Activity,
  Settings,
  Zap,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Queues", href: "/queues", icon: Database },
  { name: "Domains", href: "/domains", icon: Layers },
  { name: "Clusters", href: "/clusters", icon: Server },
  { name: "Consumers", href: "/consumers", icon: ArrowDownToLine },
  { name: "Producers", href: "/producers", icon: ArrowUpFromLine },
  { name: "Metrics", href: "/metrics", icon: Activity },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface HealthStatus {
  connected: boolean;
  latencyMs: number;
  host: string;
  port: number;
  error?: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      if (res.ok) {
        setHealth(await res.json());
      }
    } catch {
      setHealth((prev) => prev ? { ...prev, connected: false } : null);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [checkHealth]);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-slate-800 bg-slate-950 transition-all duration-300 flex flex-col",
        collapsed ? "w-[68px]" : "w-64",
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20">
          <Zap className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-tight">BlazingMQ</span>
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Management Console</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent",
                collapsed && "justify-center px-2",
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300")} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Connection Status */}
      <div className={cn("border-t border-slate-800 p-4", collapsed && "px-2")}>
        {!collapsed && (
          <div className="flex items-center gap-2 rounded-lg bg-slate-800/50 px-3 py-2">
            {health === null ? (
              <>
                <div className="h-2 w-2 rounded-full bg-slate-500 animate-pulse" />
                <span className="text-xs text-slate-500">Checking...</span>
              </>
            ) : health.connected ? (
              <>
                <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                <Wifi className="h-3 w-3 text-emerald-400" />
                <span className="text-xs text-slate-400">Connected</span>
                <span className="ml-auto text-[10px] font-mono text-slate-500">:{health.port}</span>
              </>
            ) : (
              <>
                <div className="h-2 w-2 rounded-full bg-red-400 shadow-sm shadow-red-400/50" />
                <WifiOff className="h-3 w-3 text-red-400" />
                <span className="text-xs text-red-400">Disconnected</span>
              </>
            )}
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center" title={health?.connected ? `Connected :${health.port}` : "Disconnected"}>
            <div className={cn(
              "h-2 w-2 rounded-full shadow-sm",
              health === null
                ? "bg-slate-500 animate-pulse"
                : health.connected
                  ? "bg-emerald-400 shadow-emerald-400/50"
                  : "bg-red-400 shadow-red-400/50"
            )} />
          </div>
        )}
      </div>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  );
}
