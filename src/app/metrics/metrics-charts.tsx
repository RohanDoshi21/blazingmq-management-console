"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ThroughputChart,
  LatencyChart,
  QueueDepthChart,
  ConsumerLagChart,
} from "@/components/dashboard/charts";
import { Activity, Clock, Database, TrendingDown } from "lucide-react";

interface MetricsChartsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  throughputData: Array<Record<string, any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  latencyData: Array<Record<string, any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  consumerLagData: Array<Record<string, any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topQueues: Array<Record<string, any>>;
}

export function MetricsCharts({
  throughputData,
  latencyData,
  consumerLagData,
  topQueues,
}: MetricsChartsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-blue-400" />
              Message Throughput
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ThroughputChart data={throughputData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-emerald-400" />
              Latency Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LatencyChart data={latencyData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Database className="h-4 w-4 text-blue-400" />
              Top Queues by Depth
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topQueues.length > 0 ? (
              <QueueDepthChart data={topQueues} />
            ) : (
              <div className="flex items-center justify-center h-[280px] text-sm text-slate-500">
                No queue data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingDown className="h-4 w-4 text-amber-400" />
              Consumer Lag (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ConsumerLagChart data={consumerLagData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
