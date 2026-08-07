"use client";

import type { ReactNode } from "react";
import { useAppActions, type ActionKind } from "@/context/AppActionsContext";

export function ActionButton({
  action,
  className = "button",
  children,
}: {
  action: ActionKind;
  className?: string;
  children: ReactNode;
}) {
  const { openAction } = useAppActions();
  return (
    <button className={className} type="button" onClick={() => openAction(action)}>
      {children}
    </button>
  );
}
