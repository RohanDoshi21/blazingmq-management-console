"use server";

// ============================================================================
// BlazingMQ UI — Server Actions
//
// All mutations (purge, reconfigure, shutdown, etc.) are implemented as
// Next.js Server Actions so they can be called directly from Client Components.
// ============================================================================

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import * as broker from "@/lib/broker-client";

// ============================================================================
// Action Result Type
// ============================================================================

export interface ActionResult {
  success: boolean;
  message: string;
  data?: unknown;
}

// ============================================================================
// Connection
// ============================================================================

export async function saveConnectionAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const host = formData.get("host") as string;
    const port = Number(formData.get("port"));
    const timeout = Number(formData.get("timeout"));

    const config = {
      host: host || "localhost",
      port: port || 30114,
      timeout: timeout || 5000,
    };

    const cookieStore = await cookies();
    cookieStore.set("bmq-connection", JSON.stringify(config), {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    revalidatePath("/", "layout");
    return { success: true, message: "Connection settings saved" };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to save settings",
    };
  }
}

export async function testConnectionAction(
  host?: string,
  port?: number
): Promise<ActionResult> {
  try {
    const config: Partial<broker.ConnectionConfig> = {};
    if (host) config.host = host;
    if (port) config.port = port;

    const result = await broker.testConnection(config);
    if (result.ok) {
      return {
        success: true,
        message: `Connected in ${result.latencyMs}ms`,
        data: result,
      };
    }
    return {
      success: false,
      message: result.error || "Connection failed",
      data: result,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Connection test failed",
    };
  }
}

// ============================================================================
// Queue Actions
// ============================================================================

export async function purgeQueueAction(
  queueUri: string
): Promise<ActionResult> {
  try {
    // Extract domain and queue name from URI: bmq://domain/queue
    const parts = queueUri.replace("bmq://", "").split("/");
    const domainName = parts[0];
    const queueName = parts.slice(1).join("/");

    const result = await broker.purgeQueue(domainName, queueName);
    revalidatePath("/queues");
    revalidatePath("/");
    return {
      success: true,
      message: `Purged ${result.numMessagesPurged} messages (${result.numBytesPurged} bytes) from ${queueName}`,
      data: result,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to purge queue",
    };
  }
}

// ============================================================================
// Domain Actions
// ============================================================================

export async function purgeDomainAction(
  domainName: string
): Promise<ActionResult> {
  try {
    const results = await broker.purgeDomain(domainName);
    const totalMessages = results.reduce(
      (s, r) => s + r.numMessagesPurged,
      0
    );
    revalidatePath("/domains");
    revalidatePath("/queues");
    revalidatePath("/");
    return {
      success: true,
      message: `Purged ${totalMessages} messages from domain ${domainName}`,
      data: results,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "Failed to purge domain",
    };
  }
}

export async function reconfigureDomainAction(
  domainName: string
): Promise<ActionResult> {
  try {
    const result = await broker.reconfigureDomain(domainName);
    revalidatePath("/domains");
    return {
      success: true,
      message: `Reconfigured domain ${domainName}`,
      data: result,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message:
        err instanceof Error
          ? err.message
          : "Failed to reconfigure domain",
    };
  }
}

// ============================================================================
// Cluster Actions
// ============================================================================

export async function forceGcAction(
  clusterName: string
): Promise<ActionResult> {
  try {
    const result = await broker.forceGcQueues(clusterName);
    revalidatePath("/clusters");
    revalidatePath("/queues");
    revalidatePath("/");
    return {
      success: true,
      message: `Force GC triggered for cluster ${clusterName}`,
      data: result,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to force GC",
    };
  }
}

// ============================================================================
// Tunable Actions
// ============================================================================

export async function setTunableAction(
  param: string,
  value: string
): Promise<ActionResult> {
  try {
    const result = await broker.setTunable(param, value);
    revalidatePath("/settings");
    return {
      success: true,
      message: `Set ${param} = ${value}`,
      data: result,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "Failed to set tunable",
    };
  }
}

// ============================================================================
// Danger Zone Actions
// ============================================================================

export async function shutdownAction(): Promise<ActionResult> {
  try {
    const result = await broker.shutdownBroker();
    return {
      success: true,
      message: "Broker shutdown initiated",
      data: result,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Shutdown failed",
    };
  }
}

export async function terminateAction(): Promise<ActionResult> {
  try {
    const result = await broker.terminateBroker();
    return {
      success: true,
      message: "Broker terminated",
      data: result,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Terminate failed",
    };
  }
}

// ============================================================================
// Settings Actions
// ============================================================================

export async function saveDashboardSettingsAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const settings = {
      refreshInterval: Number(formData.get("refreshInterval")) || 10,
      metricsHistory: Number(formData.get("metricsHistory")) || 60,
      maxQueueDisplay: Number(formData.get("maxQueueDisplay")) || 50,
    };

    const cookieStore = await cookies();
    cookieStore.set("bmq-dashboard-settings", JSON.stringify(settings), {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });

    revalidatePath("/", "layout");
    return { success: true, message: "Dashboard settings saved" };
  } catch (err: unknown) {
    return {
      success: false,
      message:
        err instanceof Error
          ? err.message
          : "Failed to save dashboard settings",
    };
  }
}
