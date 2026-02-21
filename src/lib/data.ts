// ============================================================================
// BlazingMQ UI — Data Layer
//
// Re-exports types from the broker client and time-series modules.
// No mock, fake, or randomly-generated data.
// ============================================================================

// Re-export all types from the broker client (single source of truth)
export type {
  ClusterStatus,
  ClusterNodeStatus,
  ElectorInfo,
  PartitionInfo,
  ClusterQueueInfo,
  ClusterStorageSummary,
  DomainInfo,
  CapacityMeter,
  StorageQueueInfo,
  QueueInternals,
  PurgeResult,
  QueueMessage,
  QueueStats,
  DomainStats,
  BrokerStats,
  BrokerConfig,
  BrokerOverview,
  ConnectionConfig,
  TunableEntry,
} from "./broker-client";

// Re-export time-series data accessors
export {
  getThroughputHistory,
  getLatencyHistory,
  getLagHistory,
} from "./time-series";

export type {
  ThroughputPoint,
  LatencyPoint,
  LagPoint,
} from "./time-series";
