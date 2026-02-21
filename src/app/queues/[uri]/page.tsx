import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getQueueStats, getQueueInternals } from "@/lib/broker-client";
import { formatBytes, formatNumber } from "@/lib/utils";
import { PublishPanel, ConsumePanel } from "./queue-message-actions";
import {
  ArrowLeft,
  Database,
  BarChart3,
  Clock,
  ArrowDownToLine,
  ArrowUpFromLine,
  Server,
  Users,
  Cpu,
  HardDrive,
} from "lucide-react";
import { PurgeQueueButton } from "../queue-actions";

// ============================================================================
// Queue Detail Page
// ============================================================================

interface PageProps {
  params: Promise<{ uri: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { uri } = await params;
  const decoded = decodeURIComponent(uri);
  const queueName = decoded.split("/").pop() ?? decoded;
  return { title: `Queue: ${queueName}` };
}

export default async function QueueDetailPage({ params }: PageProps) {
  const { uri } = await params;
  const queueUri = decodeURIComponent(uri);

  // Fetch queue stats for this specific queue
  const allQueues = await getQueueStats();
  const q = allQueues.find((q) => q.uri === queueUri);

  if (!q) {
    notFound();
  }

  const queueName = q.uri.split("/").pop() ?? q.uri;
  const domainName = q.uri.replace("bmq://", "").split("/")[0];

  // Fetch internals (may return null if not available)
  const internals = await getQueueInternals(domainName, queueName);

  const msgPct = q.messagesCapacity > 0 ? (q.messagesCount / q.messagesCapacity) * 100 : 0;
  const bytesPct = q.bytesCapacity > 0 ? (q.bytesCount / q.bytesCapacity) * 100 : 0;

  return (
    <div className="min-h-screen">
      <Header title={queueName} description={`Queue detail — ${domainName}`} />

      <div className="p-6 space-y-6">
        {/* Breadcrumb + actions */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <Link href="/queues">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Queues
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant={q.role === "PRIMARY" ? "info" : "default"}>{q.role}</Badge>
            {q.nackCount > 0 && <Badge variant="danger">{q.nackCount} NACKs</Badge>}
            <PurgeQueueButton queueUri={q.uri} />
          </div>
        </div>

        {/* URI banner */}
        <div className="rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 flex items-center gap-3">
          <Database className="h-4 w-4 text-blue-400 shrink-0" />
          <code className="text-sm font-mono text-slate-300 break-all">{q.uri}</code>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          {[
            { label: "Messages", value: formatNumber(q.messagesCount), sub: `/ ${formatNumber(q.messagesCapacity)}`, color: "text-blue-400" },
            { label: "Storage", value: formatBytes(q.bytesCount), sub: `/ ${formatBytes(q.bytesCapacity)}`, color: "text-purple-400" },
            { label: "PUT/s", value: formatNumber(q.putMessagesDelta), color: "text-cyan-400", icon: BarChart3 },
            { label: "PUSH/s", value: formatNumber(q.pushMessagesDelta), color: "text-emerald-400", icon: BarChart3 },
            { label: "Consumers", value: String(q.numConsumers), color: "text-purple-400", icon: ArrowDownToLine },
            { label: "Producers", value: String(q.numProducers), color: "text-cyan-400", icon: ArrowUpFromLine },
          ].map(({ label, value, sub, color, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase tracking-wide mb-1">
                  {Icon && <Icon className="h-3 w-3" />}
                  {label}
                </div>
                <p className={`text-lg font-bold ${color}`}>{value}</p>
                {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Capacity bars */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Message Capacity</span>
                <span className="font-mono text-slate-300">{msgPct.toFixed(1)}%</span>
              </div>
              <Progress value={q.messagesCount} max={q.messagesCapacity} />
              <p className="text-xs text-slate-500 font-mono">
                {formatNumber(q.messagesCount)} / {formatNumber(q.messagesCapacity)} messages
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Storage Capacity</span>
                <span className="font-mono text-slate-300">{bytesPct.toFixed(1)}%</span>
              </div>
              <Progress value={q.bytesCount} max={q.bytesCapacity} />
              <p className="text-xs text-slate-500 font-mono">
                {formatBytes(q.bytesCount)} / {formatBytes(q.bytesCapacity)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Timing stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-slate-400" />
              Timing Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
              {[
                { label: "ACK Avg", value: `${q.ackTimeAvg}ms` },
                { label: "ACK Max", value: `${q.ackTimeMax}ms` },
                { label: "Confirm Avg", value: `${q.confirmTimeAvg}ms` },
                { label: "Confirm Max", value: `${q.confirmTimeMax}ms` },
                { label: "Queue Time Avg", value: `${q.queueTimeAvg}ms` },
                { label: "Queue Time Max", value: `${q.queueTimeMax}ms` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
                  <p className="text-sm font-semibold font-mono text-slate-200">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Queue internals */}
        {internals && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Cpu className="h-4 w-4 text-slate-400" />
                Queue Internals
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">State</p>
                  <Badge variant={internals.state === "OPEN" ? "success" : "warning"}>{internals.state}</Badge>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Partition</p>
                  <p className="text-sm font-mono text-slate-200">{internals.partitionId}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5 flex items-center gap-1">
                    <HardDrive className="h-3 w-3" /> Storage Messages
                  </p>
                  <p className="text-sm font-mono text-slate-200">{formatNumber(internals.storageInfo.numMessages)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5 flex items-center gap-1">
                    <HardDrive className="h-3 w-3" /> Storage Bytes
                  </p>
                  <p className="text-sm font-mono text-slate-200">{formatBytes(internals.storageInfo.numBytes)}</p>
                </div>
              </div>

              {/* Handles */}
              {internals.handles.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> Client Handles ({internals.handles.length})
                  </p>
                  <div className="space-y-1">
                    {internals.handles.map((h, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs"
                      >
                        <Server className="h-3 w-3 text-slate-500 shrink-0" />
                        <span className="font-mono text-slate-300 truncate">{h.clientDescription}</span>
                        {h.isClientClusterMember && (
                          <Badge variant="purple" className="text-[10px] shrink-0">cluster</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Consumers by appId */}
              {internals.consumers.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1">
                    <ArrowDownToLine className="h-3.5 w-3.5" /> App Consumers
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {internals.consumers.map((c) => (
                      <div
                        key={c.appId}
                        className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs"
                      >
                        <span className="font-mono text-slate-300">{c.appId}</span>
                        <Badge variant="info" className="text-[10px]">{c.numConsumers}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Publish / Consume tabs */}
        <Tabs defaultValue="publish">
          <TabsList>
            <TabsTrigger value="publish">Publish Message</TabsTrigger>
            <TabsTrigger value="consume">Consume Messages</TabsTrigger>
          </TabsList>
          <TabsContent value="publish">
            <PublishPanel queueUri={q.uri} />
          </TabsContent>
          <TabsContent value="consume">
            <ConsumePanel queueUri={q.uri} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
