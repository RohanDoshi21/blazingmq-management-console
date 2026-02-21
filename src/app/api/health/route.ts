import { NextResponse } from "next/server";
import { testConnection, getConnectionConfig } from "@/lib/broker-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await getConnectionConfig();
    const result = await testConnection();
    return NextResponse.json({
      connected: result.ok,
      latencyMs: result.latencyMs,
      host: config.host,
      port: config.port,
      error: result.error,
    });
  } catch {
    return NextResponse.json({
      connected: false,
      latencyMs: 0,
      host: "localhost",
      port: 30114,
      error: "Failed to check connection",
    });
  }
}
