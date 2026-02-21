// ============================================================================
// BlazingMQ UI — Server-Side Time-Series Store
//
// Accumulates real broker stat snapshots into an in-memory ring buffer.
// Each page load that fetches queue stats also records a data point.
// The broker provides point-in-time stats — this module turns them into
// time-series for charts. No fake / generated / random data.
//
// Data is held in module-scope memory and survives across requests in the
// same Next.js server process.  It resets on server restart which is fine
// because the charts are labelled "since server start".
// ============================================================================

export interface ThroughputPoint {
  time: string;          // HH:MM label
  timestamp: number;     // epoch ms (for ordering)
  put: number;
  push: number;
  confirm: number;
}

export interface LatencyPoint {
  time: string;
  timestamp: number;
  ackAvg: number;
  ackMax: number;
  confirmAvg: number;
  confirmMax: number;
}

export interface LagPoint {
  time: string;
  timestamp: number;
  lag: number;
}

// ---------------------------------------------------------------------------
// Ring-buffer storage (module-scope singleton)
// ---------------------------------------------------------------------------
const MAX_POINTS = 60; // keep last 60 data points (~15 min at 15 s intervals)

const throughputHistory: ThroughputPoint[] = [];
const latencyHistory: LatencyPoint[] = [];
const lagHistory: LagPoint[] = [];

function timeLabel(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function push<T>(buffer: T[], point: T): void {
  buffer.push(point);
  if (buffer.length > MAX_POINTS) buffer.shift();
}

// ---------------------------------------------------------------------------
// Record a snapshot (called from broker-client after each stats fetch)
// ---------------------------------------------------------------------------
export interface QueueStatSnapshot {
  putMessagesDelta: number;
  pushMessagesDelta: number;
  confirmMessagesDelta: number;
  ackTimeAvg: number;
  ackTimeMax: number;
  confirmTimeAvg: number;
  confirmTimeMax: number;
  messagesCount: number;
}

export function recordSnapshot(queues: QueueStatSnapshot[]): void {
  const now = Date.now();
  const label = timeLabel();

  const totalPut = queues.reduce((s, q) => s + q.putMessagesDelta, 0);
  const totalPush = queues.reduce((s, q) => s + q.pushMessagesDelta, 0);
  const totalConfirm = queues.reduce((s, q) => s + q.confirmMessagesDelta, 0);

  push(throughputHistory, { time: label, timestamp: now, put: totalPut, push: totalPush, confirm: totalConfirm });

  if (queues.length > 0) {
    const avgAckAvg = queues.reduce((s, q) => s + q.ackTimeAvg, 0) / queues.length;
    const maxAckMax = Math.max(...queues.map((q) => q.ackTimeMax));
    const avgConfirmAvg = queues.reduce((s, q) => s + q.confirmTimeAvg, 0) / queues.length;
    const maxConfirmMax = Math.max(...queues.map((q) => q.confirmTimeMax));

    push(latencyHistory, {
      time: label, timestamp: now,
      ackAvg: +avgAckAvg.toFixed(2),
      ackMax: +maxAckMax.toFixed(2),
      confirmAvg: +avgConfirmAvg.toFixed(2),
      confirmMax: +maxConfirmMax.toFixed(2),
    });
  } else {
    push(latencyHistory, { time: label, timestamp: now, ackAvg: 0, ackMax: 0, confirmAvg: 0, confirmMax: 0 });
  }

  const totalLag = queues.reduce((s, q) => s + Math.max(0, q.messagesCount), 0);
  push(lagHistory, { time: label, timestamp: now, lag: totalLag });
}

// ---------------------------------------------------------------------------
// Read accumulated history (called by pages / API)
// ---------------------------------------------------------------------------
export function getThroughputHistory(): ThroughputPoint[] {
  return [...throughputHistory];
}

export function getLatencyHistory(): LatencyPoint[] {
  return [...latencyHistory];
}

export function getLagHistory(): LagPoint[] {
  return [...lagHistory];
}
