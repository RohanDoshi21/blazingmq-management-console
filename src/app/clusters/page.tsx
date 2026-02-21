import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getClusters } from "@/lib/broker-client";
import { formatBytes } from "@/lib/utils";
import {
  Server,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Crown,
  Cpu,
  Network,
} from "lucide-react";
import { ForceGcButton } from "./cluster-actions";

export default async function ClustersPage() {
  const clusters = await getClusters();

  return (
    <div className="min-h-screen">
      <Header title="Clusters" description="Monitor cluster health, nodes, partitions, and elector state" />

      <div className="p-6 space-y-6">
        {clusters.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Server className="h-12 w-12 text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-slate-300">No Clusters Found</h3>
              <p className="text-sm text-slate-500 mt-1">
                Could not retrieve cluster information from the broker.
              </p>
            </CardContent>
          </Card>
        ) : (
          clusters.map((cluster) => {
            const healthyNodes = cluster.nodeStatuses.filter(n => n.isAvailable).length;
            const totalPartitions = cluster.partitionsInfo.length;
            const activePartitions = cluster.partitionsInfo.filter(p => p.primaryStatus === "ACTIVE").length;
            const totalQueues = cluster.queuesInfo.length;

            return (
              <div key={cluster.name} className="space-y-6">
                {/* Cluster Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20">
                      <Server className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{cluster.name}</h2>
                      <p className="text-sm text-slate-400">{cluster.description}</p>
                    </div>
                    {cluster.isHealthy ? (
                      <Badge variant="success" className="text-xs"><CheckCircle2 className="mr-1 h-3 w-3" />Healthy</Badge>
                    ) : (
                      <Badge variant="danger" className="text-xs"><AlertTriangle className="mr-1 h-3 w-3" />Degraded</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <ForceGcButton clusterName={cluster.name} />
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                          <Cpu className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Nodes</p>
                          <p className="text-lg font-bold text-white">
                            <span className="text-emerald-400">{healthyNodes}</span>
                            <span className="text-slate-500 text-sm"> / {cluster.nodeStatuses.length}</span>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                          <HardDrive className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Partitions</p>
                          <p className="text-lg font-bold text-white">
                            <span className="text-blue-400">{activePartitions}</span>
                            <span className="text-slate-500 text-sm"> / {totalPartitions}</span>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
                          <Network className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Queues</p>
                          <p className="text-lg font-bold text-white">{totalQueues}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                          <HardDrive className="h-5 w-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Storage</p>
                          <p className="text-lg font-bold text-white">{formatBytes(cluster.clusterStorageSummary.totalMappedBytes)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Elector Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Crown className="h-4 w-4 text-amber-400" />
                        Elector State
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-slate-800">
                        <span className="text-sm text-slate-400">State</span>
                        <Badge variant={cluster.electorInfo.electorState === "LEADER" ? "success" : "warning"}>
                          {cluster.electorInfo.electorState}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-slate-800">
                        <span className="text-sm text-slate-400">Leader Node</span>
                        <span className="text-sm font-mono text-slate-300">{cluster.electorInfo.leaderNode}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-slate-400">Leader Status</span>
                        <Badge variant={cluster.electorInfo.leaderStatus === "ACTIVE" ? "success" : "warning"}>
                          {cluster.electorInfo.leaderStatus}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Nodes */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Cpu className="h-4 w-4 text-emerald-400" />
                        Nodes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {cluster.nodeStatuses.map((node, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/20 p-3">
                          <div className="flex items-center gap-3">
                            <div className={`h-3 w-3 rounded-full ${node.isAvailable ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-red-400 shadow-sm shadow-red-400/50"}`} />
                            <div>
                              <span className="text-sm font-mono text-slate-200">{node.description}</span>
                              {node.primaryForPartitionIds.length > 0 && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="text-[10px] text-slate-500">Primary for:</span>
                                  {node.primaryForPartitionIds.map((p) => (
                                    <Badge key={p} variant="outline" className="text-[9px] px-1 py-0">P{p}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <Badge variant={node.isAvailable ? "success" : "danger"}>
                            {node.status.replace("E_", "")}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Partitions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <HardDrive className="h-4 w-4 text-blue-400" />
                      Partitions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {cluster.partitionsInfo.map((p) => {
                        const store = cluster.clusterStorageSummary.fileStores.find(f => f.partitionId === p.partitionId);
                        return (
                          <div key={p.partitionId} className="rounded-xl border border-slate-800 bg-slate-800/20 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-white">Partition {p.partitionId}</h4>
                              <Badge variant={p.primaryStatus === "ACTIVE" ? "success" : "warning"} className="text-[10px]">
                                {p.primaryStatus}
                              </Badge>
                            </div>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between text-slate-400">
                                <span>Primary</span>
                                <span className="font-mono text-slate-300">{p.primaryNode.split(".")[0]}</span>
                              </div>
                              <div className="flex justify-between text-slate-400">
                                <span>Queues Mapped</span>
                                <span className="text-slate-300">{p.numQueuesMapped}</span>
                              </div>
                              <div className="flex justify-between text-slate-400">
                                <span>Active Queues</span>
                                <span className="text-slate-300">{p.numActiveQueues}</span>
                              </div>
                              <div className="flex justify-between text-slate-400">
                                <span>Lease ID</span>
                                <span className="font-mono text-slate-300">{p.primaryLeaseId}</span>
                              </div>
                              {store && (
                                <>
                                  <div className="flex justify-between text-slate-400">
                                    <span>Mapped Files</span>
                                    <span className="text-slate-300">{store.numMappedFiles}</span>
                                  </div>
                                  <div className="flex justify-between text-slate-400">
                                    <span>Storage</span>
                                    <span className="text-slate-300">{formatBytes(store.totalMappedBytes)}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
