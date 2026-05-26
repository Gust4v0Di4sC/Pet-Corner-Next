import type { RefObject } from "react";
import { useDialogFocusManagement } from "../accessibility/useDialogFocusManagement";

type Params = {
  open: boolean;
  disabled?: boolean;
  onClose: () => void;
  containerRef?: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
};

export function useModalDismiss({
  open,
  disabled = false,
  onClose,
  containerRef,
  initialFocusRef,
}: Params) {
  useDialogFocusManagement({
    open,
    closeDisabled: disabled,
    containerRef: containerRef ?? { current: null },
    initialFocusRef,
    onClose,
  });
}
