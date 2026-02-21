import { Header } from "@/components/layout/header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { AutoRefresh } from "@/components/auto-refresh";
import {
  getBrokerOverview,
  getQueueStats,
  getClusters,
} from "@/lib/broker-client";
import {
  getThroughputHistory,
  getLatencyHistory,
} from "@/lib/data";
import { formatBytes, formatNumber } from "@/lib/utils";
import {
  Users,
  Database,
  Layers,
  Server,
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  Zap,
  AlertTriangle,
  CheckCircle2,
  WifiOff,
} from "lucide-react";
import { DashboardCharts } from "./dashboard-charts";

async function getDashboardData() {
  const [overview, queues, clusters] = await Promise.all([
    getBrokerOverview(),
    getQueueStats(),
    getClusters(),
  ]);

  return {
    overview,
    queues,
    clusters,
    throughputData: getThroughputHistory(),
    latencyData: getLatencyHistory(),
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const { overview, queues, clusters } = data;

  const totalMessages = queues.reduce((sum, q) => sum + q.messagesCount, 0);
  const totalPut = queues.reduce((sum, q) => sum + q.putMessagesDelta, 0);
  const totalConsumers = queues.reduce((sum, q) => sum + q.numConsumers, 0);
  const totalProducers = queues.reduce((sum, q) => sum + q.numProducers, 0);
  const totalNacks = queues.reduce((sum, q) => sum + q.nackCount, 0);

  const healthyNodes = clusters[0]?.nodeStatuses.filter(n => n.isAvailable).length ?? 0;
  const totalNodes = clusters[0]?.nodeStatuses.length ?? 0;

  const isEmpty = queues.length === 0 && clusters.length === 0;

  return (
    <div className="min-h-screen">
      <Header title="Dashboard" description="BlazingMQ cluster overview and real-time metrics" />

      <div className="p-6 space-y-6">
        {/* Connection Warning */}
        {!overview.isConnected && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
            <WifiOff className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-300">Broker Unreachable</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Could not connect to {overview.brokerUri}. Check your connection settings or ensure the broker is running.
              </p>
            </div>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard title="Connected Clients" value={overview.stats.clientsCount} icon={Users} iconColor="text-blue-400" />
          <StatCard title="Active Queues" value={overview.stats.queuesCount} icon={Database} iconColor="text-cyan-400" />
          <StatCard title="Messages In-Flight" value={totalMessages} icon={Zap} iconColor="text-amber-400" />
          <StatCard title="Throughput / min" value={`${formatNumber(totalPut)}`} subtitle="PUT messages" icon={Activity} iconColor="text-emerald-400" />
          <StatCard title="Consumers" value={totalConsumers} icon={ArrowDownToLine} iconColor="text-purple-400" />
          <StatCard title="Producers" value={totalProducers} icon={ArrowUpFromLine} iconColor="text-cyan-400" />
        </div>

        {/* Charts */}
        <DashboardCharts throughputData={data.throughputData} latencyData={data.latencyData} />

        {/* Cluster Health + Queue Table */}
        {!isEmpty && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Cluster Health */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-blue-400" />
                    Cluster Health
                  </CardTitle>
                  {clusters[0]?.isHealthy ? (
                    <Badge variant="success"><CheckCircle2 className="mr-1 h-3 w-3" />Healthy</Badge>
                  ) : (
                    <Badge variant="danger"><AlertTriangle className="mr-1 h-3 w-3" />Degraded</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {clusters[0] && (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Cluster</span>
                        <span className="font-mono text-xs text-slate-300">{clusters[0].name}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Leader</span>
                        <Badge variant={clusters[0].electorInfo.leaderStatus === "ACTIVE" ? "success" : "warning"}>
                          {clusters[0].electorInfo.leaderStatus}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Nodes</span>
                        <span className="text-slate-300">
                          <span className="text-emerald-400 font-semibold">{healthyNodes}</span>
                          <span className="text-slate-500"> / {totalNodes}</span>
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-slate-800">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Nodes</p>
                      {clusters[0].nodeStatuses.map((node, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${node.isAvailable ? "bg-emerald-400" : "bg-red-400"}`} />
                            <span className="text-xs font-mono text-slate-300 truncate max-w-[160px]">{node.description}</span>
                          </div>
                          <Badge variant={node.isAvailable ? "success" : "danger"} className="text-[10px]">
                            {node.status.replace("E_", "")}
                          </Badge>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2 pt-3 border-t border-slate-800">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Partitions</p>
                      <div className="grid grid-cols-2 gap-2">
                        {clusters[0].partitionsInfo.map((p) => (
                          <div key={p.partitionId} className="rounded-lg border border-slate-800 bg-slate-800/30 p-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-medium text-slate-400">P{p.partitionId}</span>
                              <Badge variant={p.primaryStatus === "ACTIVE" ? "success" : "warning"} className="text-[9px] px-1.5 py-0">
                                {p.primaryStatus}
                              </Badge>
                            </div>
                            <div className="mt-1 text-xs text-slate-300">{p.numActiveQueues} queues</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Queue Table */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-cyan-400" />
                    Queue Overview
                  </CardTitle>
                  {totalNacks > 0 && (
                    <Badge variant="warning"><AlertTriangle className="mr-1 h-3 w-3" />{totalNacks} NACKs</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Queue</TableHead>
                      <TableHead className="text-right">Messages</TableHead>
                      <TableHead className="text-right">Depth</TableHead>
                      <TableHead className="text-right">PUT/min</TableHead>
                      <TableHead className="text-right">Consumers</TableHead>
                      <TableHead className="text-right">Producers</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queues.map((q) => {
                      const queueName = q.uri.split("/").pop() ?? q.uri;
                      const domainName = q.uri.replace("bmq://", "").split("/")[0];
                      const depthPct = q.messagesCapacity > 0 ? (q.messagesCount / q.messagesCapacity) * 100 : 0;
                      return (
                        <TableRow key={q.uri}>
                          <TableCell>
                            <div>
                              <span className="font-medium text-slate-200">{queueName}</span>
                              <span className="block text-[10px] text-slate-500 font-mono">{domainName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">{formatNumber(q.messagesCount)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Progress value={q.messagesCount} max={q.messagesCapacity} className="w-16 h-1.5" />
                              <span className="text-[10px] text-slate-500 w-10 text-right">{depthPct.toFixed(0)}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-blue-400">{formatNumber(q.putMessagesDelta)}</TableCell>
                          <TableCell className="text-right">
                            <span className="inline-flex items-center gap-1 text-xs">
                              <ArrowDownToLine className="h-3 w-3 text-purple-400" />{q.numConsumers}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="inline-flex items-center gap-1 text-xs">
                              <ArrowUpFromLine className="h-3 w-3 text-cyan-400" />{q.numProducers}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={q.role === "PRIMARY" ? "info" : "default"} className="text-[10px]">{q.role}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Domain Capacity */}
        {overview.domains.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-400" />
                Domain Capacity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {overview.domains.map((domain) => {
                  let mode = "unknown";
                  try {
                    const config = JSON.parse(domain.configJson);
                    mode = config.mode ? Object.keys(config.mode)[0] : "unknown";
                  } catch { /* ignore */ }
                  return (
                    <div key={domain.name} className="space-y-3 rounded-lg border border-slate-800 bg-slate-800/20 p-4">
                      <div>
                        <p className="text-sm font-medium text-slate-200">{domain.name}</p>
                        <p className="text-[10px] text-slate-500">{domain.clusterName}</p>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>Messages</span>
                            <span>{formatNumber(domain.capacityMeter.messages)} / {formatNumber(domain.capacityMeter.messageCapacity)}</span>
                          </div>
                          <Progress value={domain.capacityMeter.messages} max={domain.capacityMeter.messageCapacity} className="h-1" />
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>Storage</span>
                            <span>{formatBytes(domain.capacityMeter.bytes)} / {formatBytes(domain.capacityMeter.byteCapacity)}</span>
                          </div>
                          <Progress value={domain.capacityMeter.bytes} max={domain.capacityMeter.byteCapacity} className="h-1" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/50">
                        <span className="text-slate-400">{domain.queueUris.length} queues</span>
                        <Badge variant="outline" className="text-[10px]">{mode}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {isEmpty && overview.isConnected && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Database className="h-12 w-12 text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-slate-300">No Data Available</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md">
                The broker is connected but no queues or clusters are reporting data yet.
                Create a domain and open a queue to get started.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      <AutoRefresh intervalMs={15000} />
    </div>
  );
}
