// ============================================================================
// BlazingMQ UI — Broker Client (Server-Side)
//
// Bridges between the BrokerAdmin SDK (which returns broker-native JSON) and
// the UI pages (which consume UI-friendly types).  Mapping from broker JSON
// to UI types happens exclusively here — pages get clean, consistent data.
//
// This module is ONLY imported in server components and server actions
// (uses Node.js `net` under the hood via BrokerAdmin).
//
// When the broker is unreachable, every query returns empty/zero data so the
// UI degrades gracefully with proper empty-state messaging.
// ============================================================================

import { BrokerAdmin } from "blazingmq-node";
import type {
  ClusterStatus as SDKClusterStatus,
  DomainInfo as SDKDomainInfo,
  BrokerStats as SDKBrokerStats,
  BrokerConfig as SDKBrokerConfig,
  QueueInternals as SDKQueueInternals,
} from "blazingmq-node";
import { cookies } from "next/headers";

// ============================================================================
// UI-Facing Types
//
// These types are what the UI pages import and render.  They provide a stable
// interface regardless of how the broker JSON is structured internally.
// ============================================================================

// --- Capacity ---

export interface CapacityMeter {
  name: string;
  messages: number;
  messageCapacity: number;
  bytes: number;
  byteCapacity: number;
}

// --- Cluster ---

export interface ClusterNodeStatus {
  description: string;
  isAvailable: boolean;
  status: string;
  primaryForPartitionIds: number[];
}

export interface ElectorInfo {
  electorState: string;
  leaderNode: string;
  leaderStatus: string;
  leaderMessageSequence?: { electorTerm: number; sequenceNumber: number };
}

export interface PartitionInfo {
  partitionId: number;
  numQueuesMapped: number;
  numActiveQueues: number;
  primaryNode: string;
  primaryLeaseId: number;
  primaryStatus: string;
}

export interface ClusterQueueInfo {
  queueUri: string;
  queueKey: string;
  partitionId: number;
  numMessages: number;
  numBytes: number;
}

export interface ClusterStorageSummary {
  totalMappedBytes: number;
  fileStores: Array<{
    partitionId: number;
    numMappedFiles: number;
    totalMappedBytes: number;
  }>;
}

export interface ClusterStatus {
  name: string;
  description: string;
  selfNodeDescription: string;
  isHealthy: boolean;
  nodeStatuses: ClusterNodeStatus[];
  electorInfo: ElectorInfo;
  partitionsInfo: PartitionInfo[];
  queuesInfo: ClusterQueueInfo[];
  clusterStorageSummary: ClusterStorageSummary;
}

// --- Domain ---

export interface StorageQueueInfo {
  queueUri: string;
  queueKey: string;
  partitionId: number;
  numMessages: number;
  numBytes: number;
  isPersistent: boolean;
  internalQueueId?: number;
}

export interface DomainInfo {
  name: string;
  configJson: string;
  clusterName: string;
  capacityMeter: CapacityMeter;
  queueUris: string[];
  storageContent: StorageQueueInfo[];
}

// --- Queue ---

export interface QueueStats {
  uri: string;
  role: string;
  messagesCount: number;
  messagesCapacity: number;
  bytesCount: number;
  bytesCapacity: number;
  putMessagesDelta: number;
  putBytesDelta: number;
  pushMessagesDelta: number;
  pushBytesDelta: number;
  ackMessagesDelta: number;
  confirmMessagesDelta: number;
  nackCount: number;
  numProducers: number;
  numConsumers: number;
  ackTimeAvg: number;
  ackTimeMax: number;
  confirmTimeAvg: number;
  confirmTimeMax: number;
  queueTimeAvg: number;
  queueTimeMax: number;
}

export interface QueueInternals {
  queueUri: string;
  state: string;
  partitionId: number;
  storageInfo: {
    numMessages: number;
    numBytes: number;
    virtualStorages: number;
  };
  handles: Array<{
    clientDescription: string;
    handleParametersJson: string;
    isClientClusterMember: boolean;
  }>;
  consumers: Array<{
    appId: string;
    numConsumers: number;
  }>;
}

export interface QueueMessage {
  guid: string;
  offset: number;
  size: number;
  arrivalTimestamp: string;
  properties: Record<string, unknown>;
}

// --- Stats ---

export interface DomainStats {
  name: string;
  queueCount: number;
  queueCountOpen: number;
}

export interface BrokerStats {
  clientsCount: number;
  queuesCount: number;
  domains: DomainStats[];
  queues: QueueStats[];
}

// --- Purge ---

export interface PurgeResult {
  queue: string;
  appId: string;
  numMessagesPurged: number;
  numBytesPurged: number;
}

// --- Config ---

export interface BrokerConfig {
  raw: string;
  parsed: Record<string, unknown> | null;
}

// ============================================================================
// Connection Configuration
// ============================================================================

export interface ConnectionConfig {
  host: string;
  port: number;
  timeout: number;
}

const DEFAULT_CONFIG: ConnectionConfig = {
  host: process.env.BMQ_BROKER_HOST || "localhost",
  port: Number(process.env.BMQ_BROKER_PORT) || 30114,
  timeout: Number(process.env.BMQ_BROKER_TIMEOUT) || 5000,
};

export async function getConnectionConfig(): Promise<ConnectionConfig> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get("bmq-connection")?.value;
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        host: parsed.host || DEFAULT_CONFIG.host,
        port: Number(parsed.port) || DEFAULT_CONFIG.port,
        timeout: Number(parsed.timeout) || DEFAULT_CONFIG.timeout,
      };
    }
  } catch {
    // ignore
  }
  return DEFAULT_CONFIG;
}

// ============================================================================
// Client Factory
// ============================================================================

function createAdmin(config: ConnectionConfig): BrokerAdmin {
  return new BrokerAdmin({
    host: config.host,
    port: config.port,
    timeout: config.timeout,
  });
}

async function getAdmin(): Promise<BrokerAdmin> {
  const config = await getConnectionConfig();
  return createAdmin(config);
}

// ============================================================================
// SDK → UI Mappers
// ============================================================================

const ROLE_MAP: Record<number, string> = {
  0: "UNKNOWN",
  1: "PRIMARY",
  2: "REPLICA",
  3: "PROXY",
};

function mapClusterStatus(sdk: SDKClusterStatus): ClusterStatus {
  const nodeStatuses = sdk.nodeStatuses as { nodes: Array<{ description: string; status: string; primaryForPartitionIds: number[] }> } | undefined;
  const partitionsInfo = sdk.partitionsInfo as { partitions: Array<{ numQueuesMapped: number; numActiveQueues: number; primaryNode: string; primaryLeaseId: number; primaryStatus: string }> } | undefined;
  const queuesInfo = sdk.queuesInfo as { storages: Array<{ queueUri: string; queueKey: string; partitionId: number; numMessages: number; numBytes: number }> } | undefined;
  const storageSummary = sdk.clusterStorageSummary as { fileStores: Array<{ partitionId: number; summary?: { totalMappedBytes?: number; fileSets?: unknown[] } }> } | undefined;

  return {
    name: sdk.name,
    description: sdk.description ?? "",
    selfNodeDescription: sdk.selfNodeDescription ?? "",
    isHealthy: sdk.isHealthy ?? true,
    nodeStatuses: (nodeStatuses?.nodes ?? []).map((n) => ({
      description: n.description ?? "",
      isAvailable: n.status === "E_AVAILABLE",
      status: n.status ?? "E_UNKNOWN",
      primaryForPartitionIds: n.primaryForPartitionIds ?? [],
    })),
    electorInfo: {
      electorState: sdk.electorInfo?.electorState ?? "UNKNOWN",
      leaderNode: sdk.electorInfo?.leaderNode ?? "",
      leaderStatus: sdk.electorInfo?.leaderStatus ?? "UNDEFINED",
      leaderMessageSequence: sdk.electorInfo?.leaderMessageSequence,
    },
    partitionsInfo: (partitionsInfo?.partitions ?? []).map((p, i) => ({
      partitionId: i,
      numQueuesMapped: p.numQueuesMapped ?? 0,
      numActiveQueues: p.numActiveQueues ?? 0,
      primaryNode: p.primaryNode ?? "",
      primaryLeaseId: p.primaryLeaseId ?? 0,
      primaryStatus: p.primaryStatus ?? "",
    })),
    queuesInfo: (queuesInfo?.storages ?? []).map((s) => ({
      queueUri: s.queueUri ?? "",
      queueKey: s.queueKey ?? "",
      partitionId: s.partitionId ?? 0,
      numMessages: s.numMessages ?? 0,
      numBytes: s.numBytes ?? 0,
    })),
    clusterStorageSummary: {
      totalMappedBytes: (storageSummary?.fileStores ?? []).reduce(
        (sum, f) => sum + (f.summary?.totalMappedBytes ?? 0),
        0,
      ),
      fileStores: (storageSummary?.fileStores ?? []).map((f) => ({
        partitionId: f.partitionId,
        numMappedFiles: Array.isArray(f.summary?.fileSets)
          ? f.summary.fileSets.length
          : 0,
        totalMappedBytes: f.summary?.totalMappedBytes ?? 0,
      })),
    },
  };
}

function mapDomainInfo(sdk: SDKDomainInfo): DomainInfo {
  const capacityMeter = sdk.capacityMeter as { name: string; numMessages: number; messageCapacity: number; numBytes: number; byteCapacity: number } | undefined;
  return {
    name: sdk.name ?? "",
    configJson: sdk.configJson ?? "{}",
    clusterName: sdk.clusterName ?? "",
    capacityMeter: {
      name: capacityMeter?.name ?? "",
      messages: capacityMeter?.numMessages ?? 0,
      messageCapacity: capacityMeter?.messageCapacity ?? 0,
      bytes: capacityMeter?.numBytes ?? 0,
      byteCapacity: capacityMeter?.byteCapacity ?? 0,
    },
    queueUris: sdk.queueUris ?? [],
    storageContent: [], // broker returns {} for in-memory domains
  };
}

function mapBrokerStats(sdk: SDKBrokerStats): BrokerStats {
  const domains: DomainStats[] = [];
  const queues: QueueStats[] = [];
  let totalConsumers = 0;
  let totalProducers = 0;

  const sdkDomains = (sdk as { domainQueues?: { domains?: Record<string, Record<string, { values?: Record<string, number> }>> } }).domainQueues?.domains ?? {};

  for (const [domainName, domainQueues] of Object.entries(sdkDomains)) {
    let queueCount = 0;
    let queueCountOpen = 0;

    for (const [queueUri, queueData] of Object.entries(domainQueues)) {
      const v = queueData.values ?? {};
      queueCount++;

      const consumers = v.queue_consumers_count ?? 0;
      const producers = v.queue_producers_count ?? 0;
      totalConsumers += consumers;
      totalProducers += producers;

      if (consumers > 0 || producers > 0) queueCountOpen++;

      queues.push({
        uri: queueUri,
        role: ROLE_MAP[v.queue_role] ?? "UNKNOWN",
        messagesCount: v.queue_content_msgs ?? 0,
        messagesCapacity: v.queue_cfg_msgs ?? 0,
        bytesCount: v.queue_content_bytes ?? 0,
        bytesCapacity: v.queue_cfg_bytes ?? 0,
        putMessagesDelta: v.queue_put_msgs ?? 0,
        putBytesDelta: v.queue_put_bytes ?? 0,
        pushMessagesDelta: v.queue_push_msgs ?? 0,
        pushBytesDelta: v.queue_push_bytes ?? 0,
        ackMessagesDelta: v.queue_ack_msgs ?? 0,
        confirmMessagesDelta: v.queue_confirm_msgs ?? 0,
        nackCount: v.queue_nack_msgs ?? 0,
        numProducers: producers,
        numConsumers: consumers,
        ackTimeAvg: v.queue_ack_time_avg ?? 0,
        ackTimeMax: v.queue_ack_time_max ?? 0,
        confirmTimeAvg: v.queue_confirm_time_avg ?? 0,
        confirmTimeMax: v.queue_confirm_time_max ?? 0,
        queueTimeAvg: v.queue_queue_time_avg ?? 0,
        queueTimeMax: v.queue_queue_time_max ?? 0,
      });
    }

    domains.push({ name: domainName, queueCount, queueCountOpen });
  }

  return {
    clientsCount: totalConsumers + totalProducers,
    queuesCount: queues.length,
    domains,
    queues,
  };
}

function mapQueueInternals(sdk: SDKQueueInternals): QueueInternals {
  const state = (sdk as { state?: {
    uri?: string;
    partitionId?: number;
    storage?: { numMessages?: number; numBytes?: number; virtualStorages?: unknown[] };
    handles?: Array<{ clientDescription?: string; parametersJson?: string; isClientClusterMember?: boolean }>;
  } }).state ?? {};

  // Extract consumer info from the queue engine metadata
  const consumers: QueueInternals["consumers"] = [];
  try {
    const queueData = (sdk as { queue?: Record<string, unknown> }).queue;
    const localQueue = queueData?.localQueue as { queueEngine?: { fanout?: { consumerStates?: Array<{ appId?: string; appState?: { numConsumers?: number }; numConsumers?: number }> }; consumerStates?: Array<{ appId?: string; appState?: { numConsumers?: number }; numConsumers?: number }> } } | undefined;
    const engine = localQueue?.queueEngine?.fanout ?? localQueue?.queueEngine;
    const states = engine?.consumerStates ?? [];
    for (const cs of states) {
      consumers.push({
        appId: cs.appId ?? "",
        numConsumers: cs.appState?.numConsumers ?? cs.numConsumers ?? 0,
      });
    }
  } catch {
    // ignore — queue engine format may vary
  }

  return {
    queueUri: state.uri ?? "",
    state: "OPEN",
    partitionId: state.partitionId ?? 0,
    storageInfo: {
      numMessages: state.storage?.numMessages ?? 0,
      numBytes: state.storage?.numBytes ?? 0,
      virtualStorages: state.storage?.virtualStorages?.length ?? 0,
    },
    handles: (state.handles ?? []).map((h) => ({
      clientDescription: h.clientDescription ?? "",
      handleParametersJson: h.parametersJson ?? "",
      isClientClusterMember: h.isClientClusterMember ?? false,
    })),
    consumers,
  };
}

// ============================================================================
// Connectivity
// ============================================================================

export async function testConnection(
  config?: Partial<ConnectionConfig>,
): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const admin = createAdmin(cfg);
  const start = Date.now();
  try {
    const ok = await admin.ping();
    return { ok, latencyMs: Date.now() - start };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, latencyMs: Date.now() - start, error: message };
  }
}

// ============================================================================
// Dashboard / Overview
// ============================================================================

export interface BrokerOverview {
  isConnected: boolean;
  brokerUri: string;
  uptime: string;
  version: string;
  stats: BrokerStats;
  clusters: ClusterStatus[];
  domains: DomainInfo[];
}

export async function getBrokerOverview(): Promise<BrokerOverview> {
  const config = await getConnectionConfig();
  const admin = createAdmin(config);

  try {
    const [statsResult, clustersResult, configResult] =
      await Promise.allSettled([
        admin.getStats(),
        fetchAllClusters(admin),
        admin.getBrokerConfig(),
      ]);

    const sdkStats: SDKBrokerStats =
      statsResult.status === "fulfilled"
        ? statsResult.value
        : ({ domainQueues: { domains: {} } } as unknown as SDKBrokerStats);

    const stats = mapBrokerStats(sdkStats);

    const clusters: ClusterStatus[] =
      clustersResult.status === "fulfilled" ? clustersResult.value : [];

    const brokerConfig: SDKBrokerConfig =
      configResult.status === "fulfilled"
        ? configResult.value
        : { raw: "", parsed: null };

    // Fetch domain info for each unique domain
    const domainNames = [...new Set(stats.domains.map((d) => d.name))];
    const domainResults = await Promise.allSettled(
      domainNames.map((name) => admin.getDomainInfo(name)),
    );
    const domains: DomainInfo[] = domainResults
      .filter(
        (r): r is PromiseFulfilledResult<SDKDomainInfo> =>
          r.status === "fulfilled",
      )
      .map((r) => mapDomainInfo(r.value));

    let version = "unknown";
    if (brokerConfig.parsed && typeof brokerConfig.parsed === "object") {
      version =
        ((brokerConfig.parsed as Record<string, unknown>).version as string) ||
        "unknown";
    }

    return {
      isConnected: true,
      brokerUri: `tcp://${config.host}:${config.port}`,
      uptime: "—",
      version,
      stats,
      clusters,
      domains,
    };
  } catch {
    return {
      isConnected: false,
      brokerUri: `tcp://${config.host}:${config.port}`,
      uptime: "—",
      version: "unknown",
      stats: { clientsCount: 0, queuesCount: 0, domains: [], queues: [] },
      clusters: [],
      domains: [],
    };
  }
}

// ============================================================================
// Clusters
// ============================================================================

async function fetchAllClusters(
  admin: BrokerAdmin,
): Promise<ClusterStatus[]> {
  const infos = await admin.listClusters();
  const names = infos.map((c) => (typeof c === "string" ? c : (c as { name: string }).name));
  const results = await Promise.allSettled(
    names.map((name) => admin.getClusterStatus(name)),
  );
  return results
    .filter(
      (r): r is PromiseFulfilledResult<SDKClusterStatus> =>
        r.status === "fulfilled",
    )
    .map((r) => mapClusterStatus(r.value));
}

export async function getClusters(): Promise<ClusterStatus[]> {
  const admin = await getAdmin();
  try {
    return await fetchAllClusters(admin);
  } catch {
    return [];
  }
}

export async function getClusterStorageSummary(
  clusterName: string,
): Promise<ClusterStorageSummary | null> {
  const admin = await getAdmin();
  try {
    const status = await admin.getClusterStatus(clusterName);
    const mapped = mapClusterStatus(status);
    return mapped.clusterStorageSummary;
  } catch {
    return null;
  }
}

// ============================================================================
// Domains
// ============================================================================

export async function getDomains(): Promise<{
  domains: DomainInfo[];
  domainStats: DomainStats[];
}> {
  const admin = await getAdmin();
  try {
    const sdkStats = await admin.getStats();
    const stats = mapBrokerStats(sdkStats);

    const domainNames = [...new Set(stats.domains.map((d) => d.name))];
    const results = await Promise.allSettled(
      domainNames.map((name) => admin.getDomainInfo(name)),
    );
    const domains: DomainInfo[] = results
      .filter(
        (r): r is PromiseFulfilledResult<SDKDomainInfo> =>
          r.status === "fulfilled",
      )
      .map((r) => mapDomainInfo(r.value));

    return { domains, domainStats: stats.domains };
  } catch {
    return { domains: [], domainStats: [] };
  }
}

export async function getDomainInfo(
  domainName: string,
): Promise<DomainInfo | null> {
  const admin = await getAdmin();
  try {
    const sdk = await admin.getDomainInfo(domainName);
    return mapDomainInfo(sdk);
  } catch {
    return null;
  }
}

// ============================================================================
// Queues
// ============================================================================

export async function getQueueStats(): Promise<QueueStats[]> {
  const admin = await getAdmin();
  try {
    const sdkStats = await admin.getStats();
    const stats = mapBrokerStats(sdkStats);

    // Record a time-series data point from this live snapshot
    const { recordSnapshot } = await import("./time-series");
    recordSnapshot(stats.queues);

    return stats.queues;
  } catch {
    return [];
  }
}

export async function getQueueInternals(
  domainName: string,
  queueName: string,
): Promise<QueueInternals | null> {
  const admin = await getAdmin();
  try {
    const sdk = await admin.getQueueInternals(domainName, queueName);
    return mapQueueInternals(sdk);
  } catch {
    return null;
  }
}

export async function listQueueMessages(
  domainName: string,
  queueName: string,
  offset?: number,
  count?: number,
): Promise<QueueMessage[]> {
  const admin = await getAdmin();
  try {
    return await admin.listQueueMessages(domainName, queueName, offset, count);
  } catch {
    return [];
  }
}

// ============================================================================
// Stats
// ============================================================================

export async function getBrokerStats(): Promise<BrokerStats> {
  const admin = await getAdmin();
  try {
    const sdkStats = await admin.getStats();
    return mapBrokerStats(sdkStats);
  } catch {
    return { clientsCount: 0, queuesCount: 0, domains: [], queues: [] };
  }
}

// ============================================================================
// Tunables
// ============================================================================

export interface TunableEntry {
  name: string;
  value: string;
}

export async function listTunables(): Promise<TunableEntry[]> {
  const admin = await getAdmin();
  try {
    const raw = await admin.listTunables();
    const entries: TunableEntry[] = [];
    const lines = raw.split("\n").filter((l) => l.trim().length > 0);
    for (const line of lines) {
      const match = line.match(/^\s*(\S+)\s*[:=]\s*(.+)$/);
      if (match) {
        entries.push({ name: match[1], value: match[2].trim() });
      }
    }
    return entries;
  } catch {
    return [];
  }
}

export async function getTunable(param: string): Promise<string | null> {
  const admin = await getAdmin();
  try {
    return await admin.getTunable(param);
  } catch {
    return null;
  }
}

// ============================================================================
// Mutations (used by server actions)
// ============================================================================

export async function purgeQueue(
  domainName: string,
  queueName: string,
  appId?: string,
): Promise<PurgeResult> {
  const admin = await getAdmin();
  const response: string = await admin.purgeQueue(domainName, queueName, appId);
  // SDK returns raw text for purge — try to parse as JSON for result fields
  try {
    const parsed = JSON.parse(response) as { queue?: string; appId?: string; numMessagesPurged?: number; numBytesPurged?: number };
    return {
      queue: parsed.queue ?? queueName,
      appId: parsed.appId ?? appId ?? "*",
      numMessagesPurged: parsed.numMessagesPurged ?? 0,
      numBytesPurged: parsed.numBytesPurged ?? 0,
    };
  } catch {
    // Text response — extract counts if possible
    const msgMatch = response.match(/(\d+)\s*message/i);
    const byteMatch = response.match(/(\d+)\s*byte/i);
    return {
      queue: queueName,
      appId: appId ?? "*",
      numMessagesPurged: msgMatch ? parseInt(msgMatch[1], 10) : 0,
      numBytesPurged: byteMatch ? parseInt(byteMatch[1], 10) : 0,
    };
  }
}

export async function purgeDomain(
  domainName: string,
): Promise<PurgeResult[]> {
  const admin = await getAdmin();
  const response: string = await admin.purgeDomain(domainName);
  try {
    const parsed = JSON.parse(response) as { purgedQueues?: PurgeResult[] } | PurgeResult[] | PurgeResult;
    if (typeof parsed === "object" && parsed !== null) {
      if (Array.isArray(parsed)) return parsed;
      if ("purgedQueues" in parsed && Array.isArray(parsed.purgedQueues)) return parsed.purgedQueues;
      return [parsed as PurgeResult];
    }
    return [];
  } catch {
    return [
      {
        queue: domainName,
        appId: "*",
        numMessagesPurged: 0,
        numBytesPurged: 0,
      },
    ];
  }
}

export async function reconfigureDomain(
  domainName: string,
): Promise<string> {
  const admin = await getAdmin();
  return admin.reconfigureDomain(domainName);
}

export async function clearDomainCache(
  domainName?: string,
): Promise<string> {
  const admin = await getAdmin();
  return admin.clearDomainCache(domainName);
}

export async function forceGcQueues(
  clusterName: string,
): Promise<string> {
  const admin = await getAdmin();
  return admin.forceGcQueues(clusterName);
}

export async function setTunable(
  param: string,
  value: string | number,
): Promise<string> {
  const admin = await getAdmin();
  return admin.setTunable(param, value);
}

export async function shutdownBroker(): Promise<string> {
  const admin = await getAdmin();
  return admin.shutdown();
}

export async function terminateBroker(): Promise<string> {
  const admin = await getAdmin();
  return admin.terminate();
}

export async function pingBroker(): Promise<boolean> {
  const admin = await getAdmin();
  return admin.ping();
}
