import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AutoRefresh } from "@/components/auto-refresh";
import { getQueueStats } from "@/lib/broker-client";
import { formatBytes, formatNumber } from "@/lib/utils";
import {
  Database,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  Clock,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { PurgeQueueButton, DeleteQueueButton } from "./queue-actions";

export default async function QueuesPage() {
  const queues = await getQueueStats();
  const totalMessages = queues.reduce((s, q) => s + q.messagesCount, 0);
  const totalQueues = queues.length;

  return (
    <div className="min-h-screen">
      <Header title="Queues" description="Manage and monitor all BlazingMQ queues" />

      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              {totalQueues} queue{totalQueues !== 1 ? "s" : ""}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {formatNumber(totalMessages)} total messages
            </Badge>
          </div>
          <Link href="/queues/create">
            <Button size="sm">
              <Plus className="h-3 w-3" /> Create Queue
            </Button>
          </Link>
        </div>

        {/* Queue Cards */}
        {queues.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Database className="h-12 w-12 text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-slate-300">No Queues Found</h3>
              <p className="text-sm text-slate-500 mt-1">
                No queues are currently active on the broker. Create one to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {queues.map((q) => {
              const queueName = q.uri.split("/").pop() ?? q.uri;
              const domainName = q.uri.replace("bmq://", "").split("/")[0];
              const msgPct = q.messagesCapacity > 0 ? (q.messagesCount / q.messagesCapacity) * 100 : 0;
              const bytesPct = q.bytesCapacity > 0 ? (q.bytesCount / q.bytesCapacity) * 100 : 0;

              return (
                <Card key={q.uri} className="overflow-hidden">
                  <div className={`h-0.5 ${q.nackCount > 0 ? "bg-red-500" : q.role === "PRIMARY" ? "bg-blue-500" : "bg-slate-600"}`} />
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      {/* Queue Info */}
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                          <Database className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-white truncate">{queueName}</h3>
                            <Badge variant={q.role === "PRIMARY" ? "info" : "default"} className="text-[10px] shrink-0">{q.role}</Badge>
                            {q.nackCount > 0 && (
                              <Badge variant="danger" className="text-[10px] shrink-0">{q.nackCount} NACKs</Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 font-mono">{domainName}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{q.uri}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Link href={`/queues/${encodeURIComponent(q.uri)}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-400" title="View details">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <PurgeQueueButton queueUri={q.uri} />
                        <DeleteQueueButton queueUri={q.uri} />
                      </div>
                    </div>

                    {/* Capacity Bars */}
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-400">Messages</span>
                          <span className="font-mono text-slate-300">
                            {formatNumber(q.messagesCount)} / {formatNumber(q.messagesCapacity)}
                            <span className="text-slate-500 ml-1">({msgPct.toFixed(1)}%)</span>
                          </span>
                        </div>
                        <Progress value={q.messagesCount} max={q.messagesCapacity} />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-400">Storage</span>
                          <span className="font-mono text-slate-300">
                            {formatBytes(q.bytesCount)} / {formatBytes(q.bytesCapacity)}
                            <span className="text-slate-500 ml-1">({bytesPct.toFixed(1)}%)</span>
                          </span>
                        </div>
                        <Progress value={q.bytesCount} max={q.bytesCapacity} />
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-6">
                      <div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase tracking-wide">
                          <BarChart3 className="h-3 w-3" /> PUT/s
                        </div>
                        <p className="text-sm font-semibold text-blue-400">{formatNumber(q.putMessagesDelta)}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase tracking-wide">
                          <BarChart3 className="h-3 w-3" /> PUSH/s
                        </div>
                        <p className="text-sm font-semibold text-cyan-400">{formatNumber(q.pushMessagesDelta)}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase tracking-wide">
                          <Clock className="h-3 w-3" /> ACK Avg
                        </div>
                        <p className="text-sm font-semibold text-slate-300">{q.ackTimeAvg}ms</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase tracking-wide">
                          <Clock className="h-3 w-3" /> Queue Time
                        </div>
                        <p className="text-sm font-semibold text-slate-300">{q.queueTimeAvg}ms</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase tracking-wide">
                          <ArrowDownToLine className="h-3 w-3" /> Consumers
                        </div>
                        <p className="text-sm font-semibold text-purple-400">{q.numConsumers}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase tracking-wide">
                          <ArrowUpFromLine className="h-3 w-3" /> Producers
                        </div>
                        <p className="text-sm font-semibold text-cyan-400">{q.numProducers}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <AutoRefresh intervalMs={15000} />
    </div>
  );
}
