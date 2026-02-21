import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getDomains } from "@/lib/broker-client";
import { formatBytes, formatNumber } from "@/lib/utils";
import {
  Layers,
  Database,
  HardDrive,
  Clock,
  RotateCcw as Retry,
  Shield,
  Eye,
} from "lucide-react";
import { ReconfigureDomainButton, PurgeDomainButton, ReconfigureAllButton } from "./domain-actions";

export default async function DomainsPage() {
  const { domains, domainStats } = await getDomains();

  return (
    <div className="min-h-screen">
      <Header title="Domains" description="Manage BlazingMQ domains, configuration, and capacity" />

      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              {domains.length} domain{domains.length !== 1 ? "s" : ""}
            </Badge>
          </div>
          {domains.length > 0 && (
            <ReconfigureAllButton domainNames={domains.map((d) => d.name)} />
          )}
        </div>

        {/* Domain Cards */}
        {domains.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Layers className="h-12 w-12 text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-slate-300">No Domains Found</h3>
              <p className="text-sm text-slate-500 mt-1">
                No domains are configured on the broker.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {domains.map((domain) => {
              const stats = domainStats.find((s) => s.name === domain.name);
              let config: Record<string, unknown> = {};
              try {
                config = JSON.parse(domain.configJson);
              } catch { /* ignore */ }
              const mode = config.mode ? Object.keys(config.mode as object)[0] : "unknown";
              const storage = (config.storage as Record<string, unknown>)?.config
                ? Object.keys((config.storage as Record<string, unknown>).config as object)[0]
                : "unknown";

              const msgPct = domain.capacityMeter.messageCapacity > 0
                ? (domain.capacityMeter.messages / domain.capacityMeter.messageCapacity) * 100
                : 0;
              const bytePct = domain.capacityMeter.byteCapacity > 0
                ? (domain.capacityMeter.bytes / domain.capacityMeter.byteCapacity) * 100
                : 0;

              return (
                <Card key={domain.name} className="overflow-hidden">
                  <div className={`h-0.5 ${storage === "fileBacked" ? "bg-purple-500" : "bg-cyan-500"}`} />
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                          <Layers className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                          <CardTitle className="text-sm">{domain.name}</CardTitle>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{domain.clusterName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{mode}</Badge>
                        <Badge variant={storage === "fileBacked" ? "info" : "default"} className="text-[10px]">
                          {storage === "fileBacked" ? "persistent" : storage === "inMemory" ? "in-memory" : storage}
                        </Badge>
                        <PurgeDomainButton domainName={domain.name} />
                        <ReconfigureDomainButton domainName={domain.name} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Capacity Bars */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-400 flex items-center gap-1"><Database className="h-3 w-3" /> Messages</span>
                          <span className="font-mono text-slate-300">
                            {formatNumber(domain.capacityMeter.messages)} / {formatNumber(domain.capacityMeter.messageCapacity)}
                            <span className="text-slate-500 ml-1">({msgPct.toFixed(1)}%)</span>
                          </span>
                        </div>
                        <Progress value={domain.capacityMeter.messages} max={domain.capacityMeter.messageCapacity} />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-400 flex items-center gap-1"><HardDrive className="h-3 w-3" /> Storage</span>
                          <span className="font-mono text-slate-300">
                            {formatBytes(domain.capacityMeter.bytes)} / {formatBytes(domain.capacityMeter.byteCapacity)}
                            <span className="text-slate-500 ml-1">({bytePct.toFixed(1)}%)</span>
                          </span>
                        </div>
                        <Progress value={domain.capacityMeter.bytes} max={domain.capacityMeter.byteCapacity} />
                      </div>
                    </div>

                    {/* Config Summary */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-3 border-t border-slate-800">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-slate-500 flex items-center gap-1"><Clock className="h-3 w-3" /> TTL</p>
                        <p className="text-sm font-semibold text-slate-300">{(config.messageTtl as number) || 0}s</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-slate-500 flex items-center gap-1"><Retry className="h-3 w-3" /> Max Retries</p>
                        <p className="text-sm font-semibold text-slate-300">{(config.maxDeliveryAttempts as number) || 0}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-slate-500 flex items-center gap-1"><Shield className="h-3 w-3" /> Dedup</p>
                        <p className="text-sm font-semibold text-slate-300">{((config.deduplicationTimeMs as number) || 0) / 1000}s</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-slate-500 flex items-center gap-1"><Eye className="h-3 w-3" /> Queues</p>
                        <p className="text-sm font-semibold text-slate-300">
                          {stats ? `${stats.queueCountOpen} / ${stats.queueCount}` : domain.queueUris.length}
                        </p>
                      </div>
                    </div>

                    {/* Queue List */}
                    {domain.queueUris.length > 0 && (
                      <div className="pt-3 border-t border-slate-800">
                        <p className="text-xs font-medium text-slate-400 mb-2">Queues</p>
                        <div className="flex flex-wrap gap-2">
                          {domain.queueUris.map((uri) => (
                            <Badge key={uri} variant="outline" className="text-[10px] font-mono">
                              {uri.split("/").pop()}
                            </Badge>
                          ))}
                        </div>
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
