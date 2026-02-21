"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { forceGcAction } from "@/app/actions";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export function ForceGcButton({ clusterName }: { clusterName: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  async function handleConfirm() {
    setLoading(true);
    try {
      const result = await forceGcAction(clusterName);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to force GC");
    } finally {
      setLoading(false);
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <RefreshCw className="h-3 w-3" /> Force GC
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Force GC: ${clusterName}`}
        description="This will trigger garbage collection on all queues in this cluster. Idle queues with no producers or consumers will be cleaned up. This may briefly impact performance."
        confirmLabel="Force GC"
        variant="warning"
        onConfirm={handleConfirm}
        loading={loading}
      />
    </>
  );
}
