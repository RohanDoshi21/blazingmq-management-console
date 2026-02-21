"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { purgeQueueAction } from "@/app/actions";
import { RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function PurgeQueueButton({ queueUri }: { queueUri: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();
  const queueName = queueUri.split("/").pop() ?? queueUri;

  async function handleConfirm() {
    setLoading(true);
    try {
      const result = await purgeQueueAction(queueUri);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to purge queue");
    } finally {
      setLoading(false);
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-slate-400 hover:text-amber-400"
        title="Purge queue"
        onClick={() => setOpen(true)}
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Purge Queue: ${queueName}`}
        description="This will permanently remove all messages from this queue. Active consumers will receive no more messages until new ones are produced. This cannot be undone."
        confirmLabel="Purge Messages"
        variant="warning"
        onConfirm={handleConfirm}
        loading={loading}
      />
    </>
  );
}

export function DeleteQueueButton({ queueUri }: { queueUri: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();
  const queueName = queueUri.split("/").pop() ?? queueUri;

  async function handleConfirm() {
    setLoading(true);
    try {
      // Purge the queue first (BlazingMQ doesn't have explicit queue deletion —
      // queues are cleaned up by GC when all clients disconnect)
      const result = await purgeQueueAction(queueUri);
      if (result.success) {
        toast.success(`Purged ${queueName}. Queue will be garbage-collected when all clients disconnect.`);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to delete queue");
    } finally {
      setLoading(false);
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-slate-400 hover:text-red-400"
        title="Delete queue"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Delete Queue: ${queueName}`}
        description="This will purge all messages and mark the queue for garbage collection. The queue will be removed once all producers and consumers disconnect."
        confirmLabel="Delete Queue"
        variant="danger"
        onConfirm={handleConfirm}
        loading={loading}
      />
    </>
  );
}
