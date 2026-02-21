import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AutoRefresh } from "@/components/auto-refresh";
import { getQueueStats } from "@/lib/broker-client";
import {
  getThroughputHistory,
  getLatencyHistory,
  getLagHistory,
} from "@/lib/data";
import { formatNumber, formatBytes } from "@/lib/utils";
import {
  Clock,
  Database,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { MetricsCharts } from "./metrics-charts";

export default async function MetricsPage() {
  const queues = await getQueueStats();

  // Aggregate statistics
  const totalMessages = queues.reduce((s, q) => s + q.messagesCount, 0);
  const totalBytes = queues.reduce((s, q) => s + q.bytesCount, 0);
  const totalPutRate = queues.reduce((s, q) => s + q.putMessagesDelta, 0);
  const totalPushRate = queues.reduce((s, q) => s + q.pushMessagesDelta, 0);
  const totalConfirmRate = queues.reduce((s, q) => s + q.confirmMessagesDelta, 0);
  const avgAckTime =
    queues.length > 0
      ? queues.reduce((s, q) => s + q.ackTimeAvg, 0) / queues.length
      : 0;
  const avgConfirmTime =
    queues.length > 0
      ? queues.reduce((s, q) => s + q.confirmTimeAvg, 0) / queues.length
      : 0;

  // Real time-series history (accumulated from live broker snapshots)
  const throughputData = getThroughputHistory();
  const latencyData = getLatencyHistory();
  const consumerLagData = getLagHistory();

  // Top queues by message count (for bar chart)
  const topQueues = [...queues]
    .sort((a, b) => b.messagesCount - a.messagesCount)
    .slice(0, 10)
    .map((q) => ({
      name: q.uri.split("//")[1]?.split("/").pop() || q.uri,
      messages: q.messagesCount,
    }));

  return (
    <div className="min-h-screen">
      <Header
        title="Metrics"
        description="Real-time throughput, latency, and queue depth analytics"
      />

      <div className="p-6 space-y-6">
        {/* Aggregate Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Database className="h-4 w-4 text-blue-400" />
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Queued</p>
              </div>
              <p className="text-xl font-bold text-white">{formatNumber(totalMessages)}</p>
              <p className="text-[10px] text-slate-500">{formatBytes(totalBytes)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <ArrowUpFromLine className="h-4 w-4 text-purple-400" />
                <p className="text-[10px] uppercase tracking-wide text-slate-500">PUT/s</p>
              </div>
              <p className="text-xl font-bold text-white">{formatNumber(totalPutRate)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <ArrowDownToLine className="h-4 w-4 text-cyan-400" />
                <p className="text-[10px] uppercase tracking-wide text-slate-500">PUSH/s</p>
              </div>
              <p className="text-xl font-bold text-white">{formatNumber(totalPushRate)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <p className="text-[10px] uppercase tracking-wide text-slate-500">CONFIRM/s</p>
              </div>
              <p className="text-xl font-bold text-white">{formatNumber(totalConfirmRate)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-amber-400" />
                <p className="text-[10px] uppercase tracking-wide text-slate-500">ACK Avg</p>
              </div>
              <p className="text-xl font-bold text-white">{avgAckTime.toFixed(1)}<span className="text-xs text-slate-400">ms</span></p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-rose-400" />
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Confirm Avg</p>
              </div>
              <p className="text-xl font-bold text-white">{avgConfirmTime.toFixed(1)}<span className="text-xs text-slate-400">ms</span></p>
            </CardContent>
          </Card>
        </div>

        {/* Charts — delegated to client component */}
        <MetricsCharts
          throughputData={throughputData}
          latencyData={latencyData}
          consumerLagData={consumerLagData}
          topQueues={topQueues}
        />

        {/* Per-Queue Breakdown Table */}
        {queues.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-slate-400" />
                Per-Queue Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-left">
                      <th className="pb-3 text-xs font-medium text-slate-500">Queue</th>
                      <th className="pb-3 text-xs font-medium text-slate-500 text-right">Messages</th>
                      <th className="pb-3 text-xs font-medium text-slate-500 text-right">Bytes</th>
                      <th className="pb-3 text-xs font-medium text-slate-500 text-right">PUT/s</th>
                      <th className="pb-3 text-xs font-medium text-slate-500 text-right">PUSH/s</th>
                      <th className="pb-3 text-xs font-medium text-slate-500 text-right">CONFIRM/s</th>
                      <th className="pb-3 text-xs font-medium text-slate-500 text-right">ACK avg</th>
                      <th className="pb-3 text-xs font-medium text-slate-500 text-right">Producers</th>
                      <th className="pb-3 text-xs font-medium text-slate-500 text-right">Consumers</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {queues.map((q, i) => {
                      const qName = q.uri.split("//")[1]?.split("/").pop() || q.uri;
                      return (
                        <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 font-mono text-xs text-slate-300 max-w-[200px] truncate">{qName}</td>
                          <td className="py-2.5 text-right font-mono text-xs text-white">{formatNumber(q.messagesCount)}</td>
                          <td className="py-2.5 text-right font-mono text-xs text-slate-400">{formatBytes(q.bytesCount)}</td>
                          <td className="py-2.5 text-right font-mono text-xs text-blue-400">{formatNumber(q.putMessagesDelta)}</td>
                          <td className="py-2.5 text-right font-mono text-xs text-cyan-400">{formatNumber(q.pushMessagesDelta)}</td>
                          <td className="py-2.5 text-right font-mono text-xs text-emerald-400">{formatNumber(q.confirmMessagesDelta)}</td>
                          <td className="py-2.5 text-right font-mono text-xs text-amber-400">{q.ackTimeAvg.toFixed(1)}ms</td>
                          <td className="py-2.5 text-right text-xs text-slate-400">{q.numProducers}</td>
                          <td className="py-2.5 text-right text-xs text-slate-400">{q.numConsumers}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <AutoRefresh intervalMs={15000} />
    </div>
  );
}
