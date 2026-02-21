"use client";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "danger" | "warning" | "default";
  onConfirm: () => void;
  loading?: boolean;
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "default",
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const btnClass =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700 text-white"
      : variant === "warning"
        ? "bg-amber-600 hover:bg-amber-700 text-white"
        : "bg-blue-600 hover:bg-blue-700 text-white";

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />
        <AlertDialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
          <AlertDialogPrimitive.Title className="text-lg font-semibold text-white">
            {title}
          </AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description className="mt-2 text-sm text-slate-400">
            {description}
          </AlertDialogPrimitive.Description>
          <div className="mt-6 flex items-center justify-end gap-3">
            <AlertDialogPrimitive.Cancel
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 px-4 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 focus:outline-none"
              disabled={loading}
            >
              Cancel
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action
              className={cn(
                "inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors focus:outline-none disabled:opacity-50",
                btnClass
              )}
              onClick={(e) => {
                e.preventDefault();
                onConfirm();
              }}
              disabled={loading}
            >
              {loading ? "Processing…" : confirmLabel}
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
