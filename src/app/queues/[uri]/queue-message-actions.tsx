"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { publishMessageAction, consumeMessagesAction, type ConsumedMessage, type AckMode } from "@/app/actions";
import {
  Send,
  Download,
  Loader2,
  CheckCircle,
  XCircle,
  Hash,
  Clock,
  FileText,
  Copy,
  Check,
  AlertTriangle,
  RotateCcw,
  Inbox,
  ChevronDown,
} from "lucide-react";

// ============================================================================
// Shared helpers
// ============================================================================

function prettyPayload(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors"
      title="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

// ============================================================================
// Publish Panel
// ============================================================================

export function PublishPanel({ queueUri }: { queueUri: string }) {
  const [payload, setPayload] = useState('{\n  "message": "Hello from BlazingMQ Console"\n}');
  const [propertiesJson, setPropertiesJson] = useState("{}");
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
    data?: { guidHex: string; status: string };
  } | null>(null);
  const toast = useToast();

  async function handlePublish() {
    if (!payload.trim()) {
      toast.error("Payload cannot be empty");
      return;
    }
    if (propertiesJson.trim() && propertiesJson.trim() !== "{}") {
      try { JSON.parse(propertiesJson); } catch {
        toast.error("Properties is not valid JSON");
        return;
      }
    }
    setLoading(true);
    setLastResult(null);
    try {
      const result = await publishMessageAction(queueUri, payload, propertiesJson);
      setLastResult(result as typeof lastResult);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to publish message");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Send className="h-4 w-4 text-blue-400" />
          Publish Message
        </CardTitle>
        <CardDescription>
          Send a message to{" "}
          <code className="font-mono text-xs bg-slate-800 px-1 py-0.5 rounded text-blue-300">
            {queueUri}
          </code>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Payload */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300">
              Payload
              <span className="ml-2 text-xs text-slate-500 font-normal">string or JSON</span>
            </label>
            <span className="text-xs text-slate-500 font-mono">{payload.length} B</span>
          </div>
          <textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            rows={8}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            placeholder='{"key": "value"}'
            spellCheck={false}
          />
        </div>

        {/* Properties */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            Message Properties
            <span className="ml-2 text-xs text-slate-500 font-normal">JSON key-value object (optional)</span>
          </label>
          <textarea
            value={propertiesJson}
            onChange={(e) => setPropertiesJson(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            placeholder='{"priority": "1", "source": "console"}'
            spellCheck={false}
          />
          <p className="text-xs text-slate-500">
            Attached as message envelope metadata — visible to consumers without decoding the payload.
          </p>
        </div>

        {/* Result banner */}
        {lastResult && (
          <div
            className={`rounded-lg border p-3 space-y-1.5 ${
              lastResult.success
                ? "border-emerald-500/20 bg-emerald-500/5"
                : "border-red-500/20 bg-red-500/5"
            }`}
          >
            <div className={`flex items-center gap-2 text-sm font-medium ${lastResult.success ? "text-emerald-400" : "text-red-400"}`}>
              {lastResult.success ? (
                <CheckCircle className="h-4 w-4 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0" />
              )}
              {lastResult.success ? "Published successfully" : "Failed to publish"}
            </div>
            {lastResult.data && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-6">
                <span className="text-[11px] text-slate-500">GUID</span>
                <code className="text-[11px] font-mono text-slate-300 truncate">{lastResult.data.guidHex}</code>
                <span className="text-[11px] text-slate-500">Status</span>
                <span className="text-[11px] font-mono text-emerald-400">{lastResult.data.status}</span>
              </div>
            )}
            {!lastResult.success && (
              <p className="pl-6 text-xs font-mono text-red-300">{lastResult.message}</p>
            )}
          </div>
        )}

        <Button onClick={handlePublish} disabled={loading}>
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Publishing…</>
          ) : (
            <><Send className="h-4 w-4" /> Publish Message</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Message Row — always-visible payload, collapsible, shows ack mode
// ============================================================================

function MessageRow({
  msg,
  visible,
}: {
  msg: ConsumedMessage;
  visible: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const hasProps = Object.keys(msg.properties).length > 0;
  const pretty = prettyPayload(msg.payload);

  return (
    <div
      style={{ transitionDelay: `${Math.min(msg.index * 40, 400)}ms` }}
      className={`rounded-lg border overflow-hidden transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
      } ${
        msg.ackMode === "ack"
          ? "border-emerald-500/20 bg-emerald-500/5"
          : "border-amber-500/20 bg-amber-500/5"
      }`}
    >
      {/* ── Header row ── */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-800/20 transition-colors"
      >
        {/* Index pill */}
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
            msg.ackMode === "ack"
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-amber-500/20 text-amber-400"
          }`}
        >
          {msg.index}
        </span>

        {/* GUID + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <code className="text-xs font-mono text-slate-300 truncate">{msg.guid}</code>
            <CopyButton text={msg.guid} />
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <Clock className="h-2.5 w-2.5" />
              {new Date(msg.timestamp).toLocaleTimeString([], {
                hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3
              } as Intl.DateTimeFormatOptions)}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">{msg.payloadSize} B</span>
            {hasProps && (
              <span className="text-[10px] text-slate-500">
                {Object.keys(msg.properties).length} propert{Object.keys(msg.properties).length !== 1 ? "ies" : "y"}
              </span>
            )}
          </div>
        </div>

        {/* Ack mode badge */}
        {msg.ackMode === "ack" ? (
          <Badge variant="success" className="text-[10px] shrink-0">CONFIRMED</Badge>
        ) : (
          <Badge variant="warning" className="text-[10px] shrink-0">REQUEUED</Badge>
        )}

        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform ${collapsed ? "-rotate-90" : ""}`}
        />
      </button>

      {/* ── Body ── */}
      {!collapsed && (
        <div className="border-t border-slate-700/50 px-4 pt-3 pb-4 space-y-4">
          {/* Payload */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <FileText className="h-3 w-3" /> Payload
              </span>
              <CopyButton text={pretty} />
            </div>
            <pre className="rounded-md bg-slate-950 border border-slate-800 px-4 py-3 text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap break-words max-h-80 overflow-y-auto leading-relaxed">
              {pretty}
            </pre>
          </div>

          {/* Properties table */}
          {hasProps && (
            <div>
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                <Hash className="h-3 w-3" /> Properties
              </div>
              <div className="rounded-md border border-slate-800 bg-slate-950 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="px-3 py-1.5 text-left font-medium text-slate-500 w-1/3">Key</th>
                      <th className="px-3 py-1.5 text-left font-medium text-slate-500">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(msg.properties).map(([k, v], i) => (
                      <tr key={k} className={i % 2 === 0 ? "" : "bg-slate-900/40"}>
                        <td className="px-3 py-1.5 font-mono text-slate-400 align-top">{k}</td>
                        <td className="px-3 py-1.5 font-mono text-slate-200">
                          <div className="flex items-center gap-1">
                            <span className="truncate">{v}</span>
                            <CopyButton text={v} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Ack mode config
// ============================================================================

const ACK_MODE_INFO: Record<AckMode, { label: string; pill: string; description: string; color: string; icon: React.ReactNode }> = {
  ack: {
    label: "Ack — remove from queue",
    pill: "Removes messages",
    description: "Messages are confirmed and permanently removed from the queue.",
    color: "text-emerald-400",
    icon: <CheckCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />,
  },
  nack_requeue: {
    label: "Nack — requeue for redelivery",
    pill: "Keeps messages",
    description: "Messages are NOT confirmed. They will be redelivered to the next consumer.",
    color: "text-amber-400",
    icon: <RotateCcw className="h-3.5 w-3.5 shrink-0 mt-0.5" />,
  },
};

// ============================================================================
// Consume Panel
// ============================================================================

export function ConsumePanel({ queueUri }: { queueUri: string }) {
  const [maxMessages, setMaxMessages] = useState(10);
  const [waitMs, setWaitMs] = useState(3000);
  const [ackMode, setAckMode] = useState<AckMode>("ack");
  const [loading, setLoading] = useState(false);
  const [allMessages, setAllMessages] = useState<ConsumedMessage[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [summary, setSummary] = useState<{ text: string; success: boolean } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // Stagger-reveal: show one message every 80ms after results arrive
  useEffect(() => {
    if (visibleCount >= allMessages.length) return;
    const timer = setTimeout(() => {
      setVisibleCount((v) => v + 1);
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
    return () => clearTimeout(timer);
  }, [allMessages.length, visibleCount]);

  async function handleConsume() {
    setLoading(true);
    setAllMessages([]);
    setVisibleCount(0);
    setSummary(null);
    try {
      const res = await consumeMessagesAction(queueUri, maxMessages, waitMs, ackMode);
      const msgs = res.messages ?? [];
      setAllMessages(msgs);
      setSummary({ text: res.message, success: res.success });
      if (!res.success) toast.error(res.message);
    } catch {
      toast.error("Failed to consume messages");
      setSummary({ text: "Connection error", success: false });
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setAllMessages([]);
    setVisibleCount(0);
    setSummary(null);
  }

  const modeInfo = ACK_MODE_INFO[ackMode];
  const totalMessages = allMessages.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Download className="h-4 w-4 text-cyan-400" />
          Get Messages
        </CardTitle>
        <CardDescription>
          Pull messages from{" "}
          <code className="font-mono text-xs bg-slate-800 px-1 py-0.5 rounded text-blue-300">
            {queueUri}
          </code>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* ── Configuration ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Messages</label>
            <input
              type="number"
              min={1}
              max={100}
              value={maxMessages}
              onChange={(e) => setMaxMessages(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-500">Max to fetch (1–100)</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Timeout (ms)</label>
            <input
              type="number"
              min={500}
              max={30000}
              step={500}
              value={waitMs}
              onChange={(e) => setWaitMs(Math.max(500, Math.min(30000, parseInt(e.target.value) || 3000)))}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-500">Wait window (500–30 000 ms)</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Ack Mode</label>
            <select
              value={ackMode}
              onChange={(e) => setAckMode(e.target.value as AckMode)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {(Object.entries(ACK_MODE_INFO) as [AckMode, (typeof ACK_MODE_INFO)[AckMode]][]).map(([key, info]) => (
                <option key={key} value={key}>{info.label}</option>
              ))}
            </select>
            <p className={`text-[11px] ${modeInfo.color}`}>{modeInfo.pill}</p>
          </div>
        </div>

        {/* Ack mode callout */}
        <div
          className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-xs ${
            ackMode === "ack"
              ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
              : "border-amber-500/20 bg-amber-500/5 text-amber-300"
          }`}
        >
          {modeInfo.icon}
          {modeInfo.description}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <Button onClick={handleConsume} disabled={loading}>
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Connecting…</>
            ) : (
              <><Download className="h-4 w-4" /> Get Messages</>
            )}
          </Button>
          {totalMessages > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClear} className="text-slate-400">
              <XCircle className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </div>

        {/* ── Results area ── */}
        {(loading || totalMessages > 0 || summary) && (
          <div className="space-y-3 pt-1">

            {/* Summary bar */}
            {(summary || loading) && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                      <span className="text-slate-400">Waiting for messages…</span>
                    </>
                  ) : summary?.success ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-slate-300">{summary.text}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5 text-red-400" />
                      <span className="text-red-400">{summary?.text}</span>
                    </>
                  )}
                </div>
                {totalMessages > 0 && (
                  <span className="text-xs text-slate-500 tabular-nums">
                    {visibleCount} / {totalMessages}
                  </span>
                )}
              </div>
            )}

            {/* Message list - staggered reveal */}
            {totalMessages > 0 && (
              <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
                {allMessages.map((msg, i) => (
                  <MessageRow key={msg.guid + i} msg={msg} visible={i < visibleCount} />
                ))}
                <div ref={bottomRef} />
              </div>
            )}

            {/* Empty state */}
            {!loading && summary?.success && totalMessages === 0 && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-slate-800 bg-slate-900/30 py-12 text-center">
                <Inbox className="h-10 w-10 text-slate-600 mb-3" />
                <p className="text-sm font-medium text-slate-400">Queue is empty</p>
                <p className="text-xs text-slate-500 mt-1">
                  No messages arrived within the {waitMs.toLocaleString()} ms window.
                </p>
              </div>
            )}

            {/* Error state */}
            {!loading && summary && !summary.success && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400">Connection failed</p>
                  <p className="text-xs text-red-300/80 mt-0.5">{summary.text}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
