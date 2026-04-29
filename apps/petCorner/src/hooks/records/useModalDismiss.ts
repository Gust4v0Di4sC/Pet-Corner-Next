import { useEffect } from "react";

type Params = {
  open: boolean;
  disabled?: boolean;
  onClose: () => void;
};

export function useModalDismiss({ open, disabled = false, onClose }: Params) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !disabled) {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [disabled, onClose, open]);
}
