import type { ReactNode } from "react";
import { alertError, alertInfo, alertSuccess, alertWarning } from "@/lib/ui";

const variants = {
  success: alertSuccess,
  info: alertInfo,
  warning: alertWarning,
  error: alertError,
} as const;

export function StatusMessage({
  variant = "info",
  children,
}: {
  variant?: keyof typeof variants;
  children: ReactNode;
}) {
  return (
    <div role="status" className={variants[variant]}>
      {children}
    </div>
  );
}
