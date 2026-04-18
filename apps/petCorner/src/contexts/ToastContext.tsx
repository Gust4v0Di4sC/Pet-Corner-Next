import Alert, { type AlertColor } from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import {
  useCallback,
  useMemo,
  useState,
  type PropsWithChildren,
  type SyntheticEvent,
} from "react";
import { ToastContext, type ToastPayload } from "../hooks/useToast";

type ToastState = ToastPayload & {
  open: boolean;
  key: number;
};

const TOAST_BACKGROUND_BY_SEVERITY: Record<AlertColor, string> = {
  success: "rgba(34, 74, 56, 0.96)",
  info: "rgba(34, 63, 92, 0.96)",
  warning: "rgba(104, 67, 28, 0.96)",
  error: "rgba(110, 40, 40, 0.96)",
};

export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    severity: "info",
    message: "",
    duration: 4000,
    key: 0,
  });

  const hideToast = useCallback(() => {
    setToast((currentToast) => ({ ...currentToast, open: false }));
  }, []);

  const showToast = useCallback((payload: ToastPayload) => {
    setToast({
      open: true,
      severity: payload.severity,
      message: payload.message,
      duration: payload.duration ?? 4000,
      key: Date.now(),
    });
  }, []);

  const handleClose = useCallback(
    (_event?: Event | SyntheticEvent, reason?: string) => {
      if (reason === "clickaway") {
        return;
      }

      hideToast();
    },
    [hideToast]
  );

  const value = useMemo(
    () => ({
      showToast,
      hideToast,
    }),
    [hideToast, showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <Snackbar
        key={toast.key}
        open={toast.open}
        autoHideDuration={toast.duration}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleClose}
          severity={toast.severity}
          variant="filled"
          sx={{
            minWidth: "min(92vw, 420px)",
            borderRadius: "18px",
            alignItems: "center",
            backgroundColor: TOAST_BACKGROUND_BY_SEVERITY[toast.severity],
            color: "#f5f0ee",
            boxShadow: "0 20px 40px rgba(26, 24, 23, 0.18)",
            "& .MuiAlert-icon": {
              color: "#f5f0ee",
              opacity: 0.92,
            },
            "& .MuiAlert-action": {
              paddingTop: "2px",
            },
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}
