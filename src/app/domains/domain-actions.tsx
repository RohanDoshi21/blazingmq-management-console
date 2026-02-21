"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { reconfigureDomainAction, purgeDomainAction } from "@/app/actions";
import { RefreshCw, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

export function ReconfigureDomainButton({ domainName }: { domainName: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  async function handleConfirm() {
    setLoading(true);
    try {
      const result = await reconfigureDomainAction(domainName);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to reconfigure domain");
    } finally {
      setLoading(false);
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <RefreshCw className="h-3 w-3" /> Reconfigure
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Reconfigure Domain: ${domainName}`}
        description="This will reload the domain configuration from disk. Existing queues will be updated with the new configuration. Active connections will not be interrupted."
        confirmLabel="Reconfigure"
        variant="warning"
        onConfirm={handleConfirm}
        loading={loading}
      />
    </>
  );
}

export function PurgeDomainButton({ domainName }: { domainName: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  async function handleConfirm() {
    setLoading(true);
    try {
      const result = await purgeDomainAction(domainName);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to purge domain");
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
        title="Purge all queues in domain"
        onClick={() => setOpen(true)}
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Purge Domain: ${domainName}`}
        description="This will permanently remove ALL messages from ALL queues in this domain. This cannot be undone."
        confirmLabel="Purge All Queues"
        variant="danger"
        onConfirm={handleConfirm}
        loading={loading}
      />
    </>
  );
}

export function ReconfigureAllButton({ domainNames }: { domainNames: string[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  async function handleConfirm() {
    setLoading(true);
    try {
      const results = await Promise.all(
        domainNames.map((name) => reconfigureDomainAction(name))
      );
      const failures = results.filter((r) => !r.success);
      if (failures.length === 0) {
        toast.success(`Reconfigured ${domainNames.length} domain(s)`);
      } else {
        toast.warning(`${domainNames.length - failures.length} succeeded, ${failures.length} failed`);
      }
    } catch {
      toast.error("Failed to reconfigure domains");
    } finally {
      setLoading(false);
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <RefreshCw className="h-3 w-3" /> Reconfigure All
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Reconfigure All Domains"
        description={`This will reload configuration for all ${domainNames.length} domain(s) from disk.`}
        confirmLabel="Reconfigure All"
        variant="warning"
        onConfirm={handleConfirm}
        loading={loading}
      />
    </>
  );
}
