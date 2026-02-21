"use client";

import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Line, LineChart, Bar, BarChart } from "recharts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ChartData = Array<Record<string, any>>;

interface ChartProps {
  data: ChartData;
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 shadow-xl">
      <p className="mb-2 text-xs font-medium text-slate-400">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-400">{entry.name}:</span>
          <span className="font-mono font-medium text-white">{typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export function ThroughputChart({ data, className }: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="putGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="pushGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="confirmGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="time" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={{ stroke: "#334155" }} tickLine={false} />
          <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={{ stroke: "#334155" }} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Area type="monotone" dataKey="put" stroke="#3b82f6" fill="url(#putGradient)" strokeWidth={2} name="PUT" dot={false} />
          <Area type="monotone" dataKey="push" stroke="#06b6d4" fill="url(#pushGradient)" strokeWidth={2} name="PUSH" dot={false} />
          <Area type="monotone" dataKey="confirm" stroke="#10b981" fill="url(#confirmGradient)" strokeWidth={2} name="CONFIRM" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LatencyChart({ data, className }: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="time" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={{ stroke: "#334155" }} tickLine={false} />
          <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={{ stroke: "#334155" }} tickLine={false} unit="ms" />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Line type="monotone" dataKey="ackAvg" stroke="#3b82f6" strokeWidth={2} name="ACK avg" dot={false} />
          <Line type="monotone" dataKey="ackMax" stroke="#3b82f6" strokeWidth={1} strokeDasharray="4 4" name="ACK max" dot={false} opacity={0.5} />
          <Line type="monotone" dataKey="confirmAvg" stroke="#10b981" strokeWidth={2} name="Confirm avg" dot={false} />
          <Line type="monotone" dataKey="confirmMax" stroke="#10b981" strokeWidth={1} strokeDasharray="4 4" name="Confirm max" dot={false} opacity={0.5} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function QueueDepthChart({ data, className }: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={{ stroke: "#334155" }} tickLine={false} />
          <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={{ stroke: "#334155" }} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="messages" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Messages" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ConsumerLagChart({ data, className }: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="lagGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="time" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={{ stroke: "#334155" }} tickLine={false} />
          <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={{ stroke: "#334155" }} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="lag" stroke="#f59e0b" fill="url(#lagGradient)" strokeWidth={2} name="Consumer Lag" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
