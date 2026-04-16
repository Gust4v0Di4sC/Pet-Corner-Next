import { useEffect } from "react";

import Form from "../Form/Form";
import type { DashboardRecordFormData, DashboardRecordFormField } from "./dashboard.forms";

type Props = {
  open: boolean;
  title: string;
  submitLabel: string;
  fields: DashboardRecordFormField[];
  data: DashboardRecordFormData;
  isSubmitting?: boolean;
  onClose: () => void;
  onInputChange: React.ChangeEventHandler<HTMLInputElement>;
  onSubmit: React.FormEventHandler;
};

export default function DashboardCreateRecordModal({
  open,
  title,
  submitLabel,
  fields,
  data,
  isSubmitting = false,
  onClose,
  onInputChange,
  onSubmit,
}: Props) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="dashboard-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="dashboard-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="dashboard-modal__close"
          onClick={onClose}
          aria-label="Fechar modal"
        >
          <i className="fa fa-times" aria-hidden="true" />
        </button>

        <Form
          className="form--modal"
          backButtonLabel="Cancelar"
          disableActions={isSubmitting}
          data={data}
          fields={fields}
          mode="create"
          handleInput={onInputChange}
          handleSubmit={onSubmit}
          handleBack={onClose}
          textButton={isSubmitting ? "Salvando..." : submitLabel}
          textTitle={title}
        />
      </div>
    </div>
  );
}
