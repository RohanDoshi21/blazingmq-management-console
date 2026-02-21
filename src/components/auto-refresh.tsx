"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Auto-refresh hook for server-component pages.
 * Calls router.refresh() on a fixed interval to re-fetch server data.
 */
export function AutoRefresh({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
