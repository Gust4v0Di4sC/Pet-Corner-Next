// src/pages/Login/components/LoginAlert.tsx
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";

type AlertType =
  | { severity: "error" | "success"; message: string }
  | null;

type Props = {
  alert: AlertType;
  onClose: () => void;
};

export default function LoginAlert({ alert, onClose }: Props) {
  if (!alert) return null;

  return (
    <Box sx={{ width: "fit-content", mx: "auto", my: -5 }}>
      <Alert variant="filled" severity={alert.severity} onClose={onClose}>
        <AlertTitle>
          {alert.severity === "error" ? "Error" : "Success"}
        </AlertTitle>
        {alert.message}
      </Alert>
    </Box>
  );
}
