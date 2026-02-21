"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Database, Info, Terminal, Copy, Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function CreateQueuePage() {
  const [domain, setDomain] = useState("");
  const [queueName, setQueueName] = useState("");
  const [copied, setCopied] = useState(false);

  const fullUri = queueName && domain ? `bmq://${domain}/${queueName}` : "";

  const cliExample = fullUri
    ? `bmqtool -uri "${fullUri}" -mode producer`
    : `bmqtool -uri "bmq://<domain>/<queue>" -mode producer`;

  const handleCopy = () => {
    navigator.clipboard.writeText(cliExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen">
      <Header title="Open Queue" description="Open a new queue by connecting a producer or consumer" />

      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <Link href="/queues">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Queues
          </Button>
        </Link>

        {/* Info Banner */}
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-300">How Queues Work in BlazingMQ</h3>
              <p className="text-xs text-slate-400 mt-1">
                Queues in BlazingMQ are created <strong className="text-slate-300">automatically</strong> when a
                producer or consumer first opens them. You don&apos;t need to pre-create queues — simply configure a
                domain and connect a client with the desired queue URI.
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-400" />
              Queue URI Builder
            </CardTitle>
            <CardDescription>
              Build a queue URI and use it with a producer or consumer client to open the queue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Domain */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Domain</label>
              <Input
                placeholder="e.g. bmq.test.mem.priority"
                value={domain}
                onChange={(e) => setDomain(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ""))}
              />
              <p className="text-xs text-slate-500">
                The domain must already exist in your broker configuration.
              </p>
            </div>

            {/* Queue Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Queue Name</label>
              <Input
                placeholder="my-queue-name"
                value={queueName}
                onChange={(e) => setQueueName(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""))}
              />
              <p className="text-xs text-slate-500">Alphanumeric characters, hyphens, and underscores only</p>
            </div>

            {/* URI Preview */}
            {fullUri && (
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                <div className="flex items-center gap-2 text-xs text-blue-400 mb-1">
                  <Info className="h-3 w-3" />
                  Queue URI
                </div>
                <code className="text-sm font-mono text-blue-300">{fullUri}</code>
              </div>
            )}

            {/* CLI Example */}
            <div className="border-t border-slate-800 pt-6">
              <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-slate-400" />
                Open with CLI
              </h4>
              <div className="relative rounded-lg bg-slate-900 border border-slate-800 p-4">
                <code className="text-sm font-mono text-emerald-400 block pr-8">{cliExample}</code>
                <button
                  onClick={handleCopy}
                  className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Or connect via any BlazingMQ SDK (C++, Java, Python, Node.js) with the queue URI above.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                {domain && <Badge variant="outline">Domain: {domain}</Badge>}
                {queueName && <Badge variant="info">Queue: {queueName}</Badge>}
              </div>
              <Link href="/queues">
                <Button variant="outline">Back to Queues</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
