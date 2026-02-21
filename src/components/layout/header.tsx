"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6">
        <div>
          <h1 className="text-xl font-bold text-white">{title}</h1>
          {description && <p className="text-sm text-slate-400">{description}</p>}
        </div>
        <div className="flex items-center gap-3">
          {actions}
          <Button
            variant="ghost"
            size="icon"
            title="Refresh"
            onClick={() => router.refresh()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
