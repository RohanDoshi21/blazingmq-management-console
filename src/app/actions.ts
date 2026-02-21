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
import { Producer, Consumer, AckResult } from "blazingmq-node";

// Map AckResult enum value to a human-readable label
function ackResultLabel(status: AckResult): string {
  const labels: Record<number, string> = {
    [AckResult.SUCCESS]: "SUCCESS",
    [AckResult.UNKNOWN]: "UNKNOWN",
    [AckResult.TIMEOUT]: "TIMEOUT",
    [AckResult.NOT_CONNECTED]: "NOT_CONNECTED",
    [AckResult.CANCELED]: "CANCELED",
    [AckResult.NOT_SUPPORTED]: "NOT_SUPPORTED",
    [AckResult.REFUSED]: "REFUSED",
    [AckResult.INVALID_ARGUMENT]: "INVALID_ARGUMENT",
    [AckResult.NOT_READY]: "NOT_READY",
    [AckResult.LIMIT_MESSAGES]: "LIMIT_MESSAGES",
    [AckResult.LIMIT_BYTES]: "LIMIT_BYTES",
    [AckResult.STORAGE_FAILURE]: "STORAGE_FAILURE",
  };
  return labels[status as number] ?? `STATUS(${status})`;
}

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

// ============================================================================
// Message Actions — Publish & Consume
// ============================================================================

export type AckMode = "ack" | "nack_requeue";

export interface ConsumedMessage {
  guid: string;
  payload: string;
  payloadSize: number;
  properties: Record<string, string>;
  timestamp: string;
  ackMode: AckMode;
  /** Index in the batch (1-based) for display */
  index: number;
}

export async function publishMessageAction(
  queueUri: string,
  payload: string,
  propertiesJson: string,
): Promise<ActionResult> {
  const config = await broker.getConnectionConfig();
  const brokerUri = `tcp://${config.host}:${config.port}`;
  const producer = new Producer({ broker: brokerUri });
  try {
    await producer.start();
    await producer.openQueue(queueUri);
    let properties: Record<string, string> = {};
    if (propertiesJson.trim()) {
      try {
        properties = JSON.parse(propertiesJson);
      } catch {
        return { success: false, message: "Invalid properties JSON" };
      }
    }
    const ack = await producer.publishAndWait(
      { queueUri, payload, properties },
      config.timeout,
    );
    revalidatePath(`/queues/${encodeURIComponent(queueUri)}`);
    revalidatePath("/queues");
    // Serialize only plain values — ack.guid is a Buffer (Uint8Array), not serializable
    const statusLabel = ackResultLabel(ack.status);
    return {
      success: ack.isSuccess,
      message: `Message published successfully. GUID: ${ack.guidHex}, Status: ${statusLabel}`,
      data: { guidHex: ack.guidHex, status: statusLabel, queueUri: ack.queueUri },
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to publish message",
    };
  } finally {
    try { await producer.stop(); } catch { /* ignore cleanup errors */ }
  }
}

export async function consumeMessagesAction(
  queueUri: string,
  maxMessages: number,
  waitMs: number,
  ackMode: AckMode = "ack",
): Promise<ActionResult & { messages?: ConsumedMessage[] }> {
  const config = await broker.getConnectionConfig();
  const brokerUri = `tcp://${config.host}:${config.port}`;

  const collected: ConsumedMessage[] = [];
  let index = 1;

  const consumer = new Consumer({
    broker: brokerUri,
    autoConfirm: false,
    onMessage: (msg, handle) => {
      // msg.data and msg.guid are Buffers — convert to plain serializable values
      const payload = msg.data.toString("utf8");
      const properties: Record<string, string> = {};
      if (msg.properties) {
        for (const [k, entry] of msg.properties.entries()) {
          const v = entry.value;
          properties[k] = Buffer.isBuffer(v) ? v.toString("hex") : String(v);
        }
      }
      collected.push({
        guid: msg.guidHex,
        payload,
        payloadSize: msg.data.length,
        properties,
        timestamp: new Date().toISOString(),
        ackMode,
        index: index++,
      });
      // ack = confirm (removes from queue); nack_requeue = skip confirm (broker redelivers)
      if (ackMode === "ack") {
        handle.confirm();
      }
      // nack_requeue: intentionally NOT calling handle.confirm() — message stays in queue
    },
  });

  try {
    await consumer.start();
    await consumer.subscribe({ queueUri });

    // Wait for messages to arrive (up to waitMs), stop early when we hit maxMessages
    const elapsed = await new Promise<number>((resolve) => {
      const start = Date.now();
      const interval = setInterval(() => {
        if (collected.length >= maxMessages || Date.now() - start >= waitMs) {
          clearInterval(interval);
          resolve(Date.now() - start);
        }
      }, 50);
    });

    return {
      success: true,
      message: `Consumed ${collected.length} message${collected.length !== 1 ? "s" : ""} in ${elapsed}ms`,
      messages: collected,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to consume messages",
      messages: [],
    };
  } finally {
    try { await consumer.stop(); } catch { /* ignore cleanup errors */ }
  }
}
