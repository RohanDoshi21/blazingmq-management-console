"use client";

import { ThroughputChart, LatencyChart } from "@/components/dashboard/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Clock } from "lucide-react";

interface DashboardChartsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  throughputData: Array<Record<string, any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  latencyData: Array<Record<string, any>>;
}

export function DashboardCharts({ throughputData, latencyData }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-400" />
            Latency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LatencyChart data={latencyData} />
        </CardContent>
      </Card>
    </div>
  );
}
