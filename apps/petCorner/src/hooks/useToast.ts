import type { AlertColor } from "@mui/material/Alert";
import { createContext, useContext } from "react";

export type ToastPayload = {
  severity: AlertColor;
  message: string;
  duration?: number;
};

export type ToastContextValue = {
  showToast: (payload: ToastPayload) => void;
  hideToast: () => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const toastContext = useContext(ToastContext);

  if (!toastContext) {
    throw new Error("useToast must be used within a ToastProvider.");
  }

  return {
    ...toastContext,
    success: (message: string, duration?: number) =>
      toastContext.showToast({ severity: "success", message, duration }),
    info: (message: string, duration?: number) =>
      toastContext.showToast({ severity: "info", message, duration }),
    warning: (message: string, duration?: number) =>
      toastContext.showToast({ severity: "warning", message, duration }),
    error: (message: string, duration?: number) =>
      toastContext.showToast({ severity: "error", message, duration }),
  };
};
