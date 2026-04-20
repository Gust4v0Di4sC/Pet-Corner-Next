import { useEffect } from "react";
import type { ChangeEventHandler, FormEventHandler } from "react";

import Form from "../Form/Form";
import type { RecordFormData, RecordFormField } from "./record.types";

type Props = {
  open: boolean;
  title: string;
  submitLabel: string;
  resetButtonLabel?: string;
  fields: RecordFormField[];
  data: RecordFormData;
  isSubmitting?: boolean;
  onClose: () => void;
  onInputChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
  onFileUpload?: (params: {
    fieldName: string;
    file: File;
    currentValue: string;
  }) => Promise<string>;
  onResetFields?: () => void;
  onSubmit: FormEventHandler;
};

export default function RecordFormModal({
  open,
  title,
  submitLabel,
  resetButtonLabel,
  fields,
  data,
  isSubmitting = false,
  onClose,
  onInputChange,
  onFileUpload,
  onResetFields,
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
    <div className="record-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="record-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="record-modal__close"
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
          handleFileUpload={onFileUpload}
          handleSubmit={onSubmit}
          handleBack={onClose}
          handleResetFields={onResetFields}
          textButton={isSubmitting ? "Salvando..." : submitLabel}
          resetButtonLabel={resetButtonLabel}
          textTitle={title}
        />
      </div>
    </div>
  );
}
