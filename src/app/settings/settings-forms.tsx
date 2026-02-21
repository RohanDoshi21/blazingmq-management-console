"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  saveConnectionAction,
  testConnectionAction,
  setTunableAction,
  shutdownAction,
  terminateAction,
  forceGcAction,
  saveDashboardSettingsAction,
} from "@/app/actions";
import {
  Save,
  RefreshCw,
  Plug,
  Activity,
  Settings2,
  Sliders,
  Shield,
  AlertTriangle,
  Server,
  Power,
  Trash2,
} from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// ============================================================================
// Connection Settings
// ============================================================================

interface ConnectionFormProps {
  initialHost: string;
  initialPort: number;
  initialTimeout: number;
}

export function ConnectionForm({ initialHost, initialPort, initialTimeout }: ConnectionFormProps) {
  const { success, error } = useToast();
  const [isPending, startTransition] = useTransition();
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const router = useRouter();

  const handleSave = (formData: FormData) => {
    startTransition(async () => {
      const result = await saveConnectionAction(formData);
      if (result.success) {
        success(result.message);
        router.refresh();
      } else {
        error(result.message);
      }
    });
  };

  const handleTest = () => {
    startTransition(async () => {
      const host = (document.getElementById("conn-host") as HTMLInputElement)?.value;
      const port = Number((document.getElementById("conn-port") as HTMLInputElement)?.value);
      const result = await testConnectionAction(host, port);
      setTestResult({ ok: result.success, message: result.message });
      if (result.success) {
        success(result.message);
      } else {
        error(result.message);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Plug className="h-4 w-4 text-blue-400" />
          Broker Connection
        </CardTitle>
        <CardDescription>Configure the connection to your BlazingMQ broker instance</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Broker Host</label>
              <Input id="conn-host" name="host" defaultValue={initialHost} placeholder="localhost" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Broker Port</label>
              <Input id="conn-port" name="port" defaultValue={initialPort} placeholder="30114" type="number" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Timeout (ms)</label>
              <Input name="timeout" defaultValue={initialTimeout} placeholder="5000" type="number" />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" size="sm" disabled={isPending}>
              <Save className="h-3 w-3" /> Save Connection
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={handleTest}>
              <RefreshCw className="h-3 w-3" /> Test Connection
            </Button>
            {testResult && (
              <Badge variant={testResult.ok ? "success" : "danger"} className="text-xs">
                <Activity className="mr-1 h-3 w-3" />
                {testResult.message}
              </Badge>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Dashboard Settings
// ============================================================================

interface DashboardSettingsFormProps {
  initialRefreshInterval: number;
  initialMetricsHistory: number;
  initialMaxQueueDisplay: number;
}

export function DashboardSettingsForm({
  initialRefreshInterval,
  initialMetricsHistory,
  initialMaxQueueDisplay,
}: DashboardSettingsFormProps) {
  const { success, error } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleSave = (formData: FormData) => {
    startTransition(async () => {
      const result = await saveDashboardSettingsAction(formData);
      if (result.success) {
        success(result.message);
      } else {
        error(result.message);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings2 className="h-4 w-4 text-cyan-400" />
          Dashboard Settings
        </CardTitle>
        <CardDescription>Configure how the dashboard polls and refreshes data</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Auto-refresh Interval</label>
              <Input name="refreshInterval" defaultValue={initialRefreshInterval} placeholder="10" type="number" />
              <p className="text-xs text-slate-500">Seconds between dashboard refreshes</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Metrics History (min)</label>
              <Input name="metricsHistory" defaultValue={initialMetricsHistory} placeholder="60" type="number" />
              <p className="text-xs text-slate-500">How long to keep chart history</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Max Queue Display</label>
              <Input name="maxQueueDisplay" defaultValue={initialMaxQueueDisplay} placeholder="50" type="number" />
              <p className="text-xs text-slate-500">Maximum queues shown per page</p>
            </div>
          </div>
          <Button type="submit" size="sm" disabled={isPending}>
            <Save className="h-3 w-3" /> Save Settings
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Tunables
// ============================================================================

interface TunableEntry {
  name: string;
  value: string;
}

interface TunablesCardProps {
  tunables: TunableEntry[];
}

export function TunablesCard({ tunables }: TunablesCardProps) {
  const { success, error } = useToast();
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(tunables.map((t) => [t.name, t.value]))
  );
  const router = useRouter();

  const handleSetTunable = (param: string) => {
    const newVal = values[param];
    if (newVal === undefined) return;

    startTransition(async () => {
      const result = await setTunableAction(param, newVal);
      if (result.success) {
        success(result.message);
        router.refresh();
      } else {
        error(result.message);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sliders className="h-4 w-4 text-purple-400" />
          Broker Tunables
        </CardTitle>
        <CardDescription>View and modify runtime tunable parameters on the broker</CardDescription>
      </CardHeader>
      <CardContent>
        {tunables.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-slate-500">
            <Sliders className="h-5 w-5 mr-2 text-slate-600" />
            No tunables available — broker may be unreachable
          </div>
        ) : (
          <div className="space-y-3">
            {tunables.map((tunable) => (
              <div
                key={tunable.name}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/20 p-4 gap-4"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-mono font-semibold text-slate-200">{tunable.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Current: {tunable.value}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Input
                    value={values[tunable.name] ?? tunable.value}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [tunable.name]: e.target.value }))
                    }
                    className="w-32 text-right font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending || values[tunable.name] === tunable.value}
                    onClick={() => handleSetTunable(tunable.name)}
                  >
                    <Save className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Danger Zone
// ============================================================================

interface DangerZoneProps {
  clusterNames: string[];
}

export function DangerZone({ clusterNames }: DangerZoneProps) {
  const { success, error } = useToast();
  const [isPending, startTransition] = useTransition();
  const [gcOpen, setGcOpen] = useState(false);
  const [shutdownOpen, setShutdownOpen] = useState(false);
  const [terminateOpen, setTerminateOpen] = useState(false);

  const handleForceGcAll = () => {
    startTransition(async () => {
      const results = await Promise.allSettled(
        clusterNames.map((name) => forceGcAction(name))
      );
      const ok = results.filter((r) => r.status === "fulfilled").length;
      success(`Force GC triggered on ${ok}/${clusterNames.length} cluster(s)`);
      setGcOpen(false);
    });
  };

  const handleShutdown = () => {
    startTransition(async () => {
      const result = await shutdownAction();
      if (result.success) {
        success(result.message);
      } else {
        error(result.message);
      }
      setShutdownOpen(false);
    });
  };

  const handleTerminate = () => {
    startTransition(async () => {
      const result = await terminateAction();
      if (result.success) {
        success(result.message);
      } else {
        error(result.message);
      }
      setTerminateOpen(false);
    });
  };

  return (
    <Card className="border-red-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-red-400">
          <Shield className="h-4 w-4" />
          Danger Zone
        </CardTitle>
        <CardDescription>These actions can cause data loss or service disruption</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Force GC All */}
        <div className="flex items-center justify-between rounded-lg border border-red-500/10 bg-red-500/5 p-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Force Garbage Collect All Queues
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Triggers GC on all queues across {clusterNames.length} cluster(s). May briefly impact performance.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            disabled={isPending || clusterNames.length === 0}
            onClick={() => setGcOpen(true)}
          >
            <Trash2 className="h-3 w-3" /> Force GC
          </Button>
        </div>
        <ConfirmDialog
          open={gcOpen}
          onOpenChange={setGcOpen}
          title="Force GC All Clusters"
          description={`This will trigger garbage collection on ${clusterNames.length} cluster(s): ${clusterNames.join(", ")}. This may temporarily affect performance.`}
          confirmLabel="Force GC"
          variant="warning"
          onConfirm={handleForceGcAll}
          loading={isPending}
        />

        {/* Graceful Shutdown */}
        <div className="flex items-center justify-between rounded-lg border border-red-500/10 bg-red-500/5 p-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Server className="h-4 w-4 text-amber-400" />
              Graceful Shutdown
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Gracefully shuts down the broker, draining active connections and flushing storage.
            </p>
          </div>
          <Button variant="destructive" size="sm" className="shrink-0" disabled={isPending} onClick={() => setShutdownOpen(true)}>
            <Power className="h-3 w-3" /> Shutdown
          </Button>
        </div>
        <ConfirmDialog
          open={shutdownOpen}
          onOpenChange={setShutdownOpen}
          title="Graceful Shutdown"
          description="This will gracefully shut down the broker. All active connections will be drained and storage flushed. The broker will stop accepting new connections immediately."
          confirmLabel="Shutdown Broker"
          variant="danger"
          onConfirm={handleShutdown}
          loading={isPending}
        />

        {/* Force Terminate */}
        <div className="flex items-center justify-between rounded-lg border border-red-500/10 bg-red-500/5 p-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              Force Terminate
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Immediately terminates the broker process. <strong className="text-red-400">May cause data loss.</strong> Use only as last resort.
            </p>
          </div>
          <Button variant="destructive" size="sm" className="shrink-0" disabled={isPending} onClick={() => setTerminateOpen(true)}>
            <Power className="h-3 w-3" /> Terminate
          </Button>
        </div>
        <ConfirmDialog
          open={terminateOpen}
          onOpenChange={setTerminateOpen}
          title="Force Terminate"
          description="This will IMMEDIATELY terminate the broker process. Active messages in flight may be lost. This action cannot be undone. Only use this as a last resort."
          confirmLabel="Terminate Now"
          variant="danger"
          onConfirm={handleTerminate}
          loading={isPending}
        />
      </CardContent>
    </Card>
  );
}
