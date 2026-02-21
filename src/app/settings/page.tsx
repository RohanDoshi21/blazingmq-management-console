import { Header } from "@/components/layout/header";
import { getConnectionConfig, listTunables, getClusters } from "@/lib/broker-client";
import { cookies } from "next/headers";
import {
  ConnectionForm,
  DashboardSettingsForm,
  TunablesCard,
  DangerZone,
} from "./settings-forms";

export default async function SettingsPage() {
  const [connConfig, tunables, clusters] = await Promise.all([
    getConnectionConfig(),
    listTunables(),
    getClusters(),
  ]);

  // Read dashboard settings from cookie
  const cookieStore = await cookies();
  const dashRaw = cookieStore.get("bmq-dashboard-settings")?.value;
  let dashSettings = { refreshInterval: 10, metricsHistory: 60, maxQueueDisplay: 50 };
  if (dashRaw) {
    try {
      dashSettings = { ...dashSettings, ...JSON.parse(dashRaw) };
    } catch {
      // ignore
    }
  }

  const clusterNames = clusters.map((c) => c.name);

  return (
    <div className="min-h-screen">
      <Header title="Settings" description="Configure broker connection, tunables, and system settings" />

      <div className="p-6 space-y-6 max-w-4xl">
        <ConnectionForm
          initialHost={connConfig.host}
          initialPort={connConfig.port}
          initialTimeout={connConfig.timeout}
        />

        <DashboardSettingsForm
          initialRefreshInterval={dashSettings.refreshInterval}
          initialMetricsHistory={dashSettings.metricsHistory}
          initialMaxQueueDisplay={dashSettings.maxQueueDisplay}
        />

        <TunablesCard tunables={tunables} />

        <DangerZone clusterNames={clusterNames} />
      </div>
    </div>
  );
}
