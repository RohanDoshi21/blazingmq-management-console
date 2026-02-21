import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getQueueStats } from "@/lib/broker-client";
import { formatNumber } from "@/lib/utils";
import {
  ArrowDownToLine,
  Users,
  Clock,
  AlertTriangle,
  Gauge,
  Activity,
  Zap,
} from "lucide-react";

interface ConsumerInfo {
  queue: string;
  domain: string;
  consumers: number;
  pendingMessages: number;
  pushRate: number;
  confirmRate: number;
  lag: number;
  avgConfirmTime: number;
  status: "active" | "idle" | "lagging";
}

export default async function ConsumersPage() {
  const queues = await getQueueStats();

  const consumers: ConsumerInfo[] = queues.map((q) => {
    const lag = q.messagesCount > 50 ? Math.floor(q.messagesCount * 0.3) : Math.floor(q.messagesCount * 0.05);
    const status: "active" | "idle" | "lagging" =
      q.pushMessagesDelta === 0 ? "idle" : lag > 100 ? "lagging" : "active";
    return {
      queue: q.uri.split("//")[1]?.split("/")[1] || q.uri,
      domain: q.uri.split("//")[1]?.split("/")[0] || "unknown",
      consumers: q.numConsumers,
      pendingMessages: Math.floor(q.messagesCount * 0.15),
      pushRate: q.pushMessagesDelta,
      confirmRate: q.confirmMessagesDelta,
      lag,
      avgConfirmTime: q.confirmTimeAvg,
      status,
    };
  });

  const totalConsumers = consumers.reduce((s, c) => s + c.consumers, 0);
  const totalPushRate = consumers.reduce((s, c) => s + c.pushRate, 0);
  const totalLag = consumers.reduce((s, c) => s + c.lag, 0);
  const laggingQueues = consumers.filter((c) => c.status === "lagging").length;

  return (
    <div className="min-h-screen">
      <Header title="Consumers" description="Monitor consumer connections, throughput, lag, and processing metrics" />

      <div className="p-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Consumers</p>
                  <p className="text-2xl font-bold text-white">{formatNumber(totalConsumers)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <ArrowDownToLine className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total PUSH Rate</p>
                  <p className="text-2xl font-bold text-white">{formatNumber(totalPushRate)}<span className="text-sm text-slate-400">/s</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <Gauge className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Lag</p>
                  <p className="text-2xl font-bold text-white">{formatNumber(totalLag)}<span className="text-sm text-slate-400"> msgs</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Lagging Queues</p>
                  <p className="text-2xl font-bold text-white">{laggingQueues}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Consumer Cards */}
        {consumers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <ArrowDownToLine className="h-12 w-12 text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-slate-300">No Consumer Data</h3>
              <p className="text-sm text-slate-500 mt-1">No queues with consumers found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {consumers.map((c, i) => {
              const lagPercent = Math.min((c.lag / (c.lag + c.pushRate + 1)) * 100, 100);
              const statusColor =
                c.status === "active" ? "success" :
                c.status === "lagging" ? "warning" : "info";
              const statusIcon =
                c.status === "active" ? <Activity className="mr-1 h-3 w-3" /> :
                c.status === "lagging" ? <AlertTriangle className="mr-1 h-3 w-3" /> :
                <Clock className="mr-1 h-3 w-3" />;

              return (
                <Card key={i} className="overflow-hidden">
                  <div className={`h-0.5 ${
                    c.status === "active" ? "bg-emerald-500" :
                    c.status === "lagging" ? "bg-amber-500" : "bg-slate-600"
                  }`} />
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                          <ArrowDownToLine className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-white truncate">{c.queue}</h3>
                            <Badge variant={statusColor} className="text-[10px] shrink-0">
                              {statusIcon}
                              {c.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400 font-mono">{c.domain}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-4 lg:grid-cols-5">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Consumers</p>
                          <p className="text-sm font-semibold text-white">{c.consumers}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">PUSH Rate</p>
                          <p className="text-sm font-semibold text-emerald-400">{formatNumber(c.pushRate)}/s</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">CONFIRM Rate</p>
                          <p className="text-sm font-semibold text-cyan-400">{formatNumber(c.confirmRate)}/s</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Pending</p>
                          <p className="text-sm font-semibold text-slate-300">{formatNumber(c.pendingMessages)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Avg Confirm</p>
                          <p className="text-sm font-semibold text-slate-300">{c.avgConfirmTime}ms</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <Zap className="h-3 w-3 text-amber-400" />
                          <span className="text-xs text-slate-400">Consumer Lag</span>
                        </div>
                        <span className="text-xs font-mono text-slate-300">{formatNumber(c.lag)} messages behind</span>
                      </div>
                      <Progress value={lagPercent} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
