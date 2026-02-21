import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getQueueStats } from "@/lib/broker-client";
import { formatNumber, formatBytes } from "@/lib/utils";
import {
  ArrowUpFromLine,
  Users,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Activity,
  Send,
} from "lucide-react";

interface ProducerInfo {
  queue: string;
  domain: string;
  producers: number;
  putRate: number;
  putBytesRate: number;
  ackRate: number;
  nackCount: number;
  ackTimeAvg: number;
  ackTimeMax: number;
  status: "active" | "idle" | "degraded";
}

export default async function ProducersPage() {
  const queues = await getQueueStats();

  const producers: ProducerInfo[] = queues.map((q) => {
    const status: "active" | "idle" | "degraded" =
      q.putMessagesDelta === 0 ? "idle" : q.nackCount > 3 ? "degraded" : "active";
    return {
      queue: q.uri.split("//")[1]?.split("/")[1] || q.uri,
      domain: q.uri.split("//")[1]?.split("/")[0] || "unknown",
      producers: q.numProducers,
      putRate: q.putMessagesDelta,
      putBytesRate: q.putBytesDelta,
      ackRate: q.ackMessagesDelta,
      nackCount: q.nackCount,
      ackTimeAvg: q.ackTimeAvg,
      ackTimeMax: q.ackTimeMax,
      status,
    };
  });

  const totalProducers = producers.reduce((s, p) => s + p.producers, 0);
  const totalPutRate = producers.reduce((s, p) => s + p.putRate, 0);
  const totalNacks = producers.reduce((s, p) => s + p.nackCount, 0);
  const degradedQueues = producers.filter((p) => p.status === "degraded").length;

  return (
    <div className="min-h-screen">
      <Header title="Producers" description="Monitor producer connections, PUT throughput, ACK rates, and NACKs" />

      <div className="p-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                  <Users className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Producers</p>
                  <p className="text-2xl font-bold text-white">{formatNumber(totalProducers)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <ArrowUpFromLine className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total PUT Rate</p>
                  <p className="text-2xl font-bold text-white">{formatNumber(totalPutRate)}<span className="text-sm text-slate-400">/s</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">ACK Success</p>
                  <p className="text-2xl font-bold text-white">{totalPutRate > 0 ? ((1 - totalNacks / totalPutRate) * 100).toFixed(1) : "100"}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                  <XCircle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total NACKs</p>
                  <p className="text-2xl font-bold text-white">{formatNumber(totalNacks)}</p>
                  {degradedQueues > 0 && (
                    <p className="text-[10px] text-red-400">{degradedQueues} degraded queue(s)</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Producer Cards */}
        {producers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <ArrowUpFromLine className="h-12 w-12 text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-slate-300">No Producer Data</h3>
              <p className="text-sm text-slate-500 mt-1">No queues with producers found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {producers.map((p, i) => {
              const statusColor =
                p.status === "active" ? "success" :
                p.status === "degraded" ? "danger" : "info";
              const statusIcon =
                p.status === "active" ? <Activity className="mr-1 h-3 w-3" /> :
                p.status === "degraded" ? <AlertTriangle className="mr-1 h-3 w-3" /> :
                <Send className="mr-1 h-3 w-3" />;

              return (
                <Card key={i} className="overflow-hidden">
                  <div className={`h-0.5 ${
                    p.status === "active" ? "bg-purple-500" :
                    p.status === "degraded" ? "bg-red-500" : "bg-slate-600"
                  }`} />
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                          <ArrowUpFromLine className="h-5 w-5 text-purple-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-white truncate">{p.queue}</h3>
                            <Badge variant={statusColor} className="text-[10px] shrink-0">
                              {statusIcon}
                              {p.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400 font-mono">{p.domain}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-4 lg:grid-cols-7">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Producers</p>
                          <p className="text-sm font-semibold text-white">{p.producers}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">PUT Rate</p>
                          <p className="text-sm font-semibold text-blue-400">{formatNumber(p.putRate)}/s</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Throughput</p>
                          <p className="text-sm font-semibold text-cyan-400">{formatBytes(p.putBytesRate)}/s</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">ACK Rate</p>
                          <p className="text-sm font-semibold text-emerald-400">{formatNumber(p.ackRate)}/s</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">NACKs</p>
                          <p className={`text-sm font-semibold ${p.nackCount > 0 ? "text-red-400" : "text-slate-500"}`}>
                            {p.nackCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Avg ACK</p>
                          <p className="text-sm font-semibold text-slate-300">{p.ackTimeAvg}ms</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Max ACK</p>
                          <p className="text-sm font-semibold text-slate-300">{p.ackTimeMax}ms</p>
                        </div>
                      </div>
                    </div>

                    {p.putRate > 0 && (
                      <div className="mt-4 flex items-center gap-3">
                        <TrendingUp className="h-3 w-3 text-emerald-400 shrink-0" />
                        <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                            style={{ width: `${((p.ackRate / p.putRate) * 100).toFixed(1)}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-slate-400">
                          {((p.ackRate / p.putRate) * 100).toFixed(1)}% ACK
                        </span>
                      </div>
                    )}
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
