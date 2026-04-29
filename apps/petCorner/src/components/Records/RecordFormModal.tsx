import type { ChangeEventHandler, FormEventHandler } from "react";

import { FormActions } from "../Form/FormActions";
import { FormFields } from "../Form/FormFields";
import { FormLayout } from "../Form/FormLayout";
import type { FileUploadHandler } from "../Form/form.types";
import { useModalDismiss } from "../../hooks/records";
import type { RecordFormData, RecordFormField } from "./record.types";

type Props = {
  open: boolean;
  content: {
    title: string;
    submitLabel: string;
    resetLabel?: string;
  };
  form: {
    fields: RecordFormField[];
    data: RecordFormData;
    isSubmitting?: boolean;
    onInputChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
    onFileUpload?: FileUploadHandler;
  };
  actions: {
    onClose: () => void;
    onReset?: () => void;
    onSubmit: FormEventHandler;
  };
};

export default function RecordFormModal({ open, content, form, actions }: Props) {
  const isSubmitting = form.isSubmitting ?? false;

  useModalDismiss({
    open,
    disabled: isSubmitting,
    onClose: actions.onClose,
  });

  if (!open) {
    return null;
  }

  const closeModal = isSubmitting ? undefined : actions.onClose;

  return (
    <div className="record-modal-overlay" onClick={closeModal} role="presentation">
      <div
        className="record-modal"
        role="dialog"
        aria-modal="true"
        aria-label={content.title}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="record-modal__close"
          onClick={actions.onClose}
          aria-label="Fechar modal"
          disabled={isSubmitting}
        >
          <i className="fa fa-times" aria-hidden="true" />
        </button>

        <FormLayout title={content.title} onSubmit={actions.onSubmit} className="form--modal">
          <FormFields
            fields={form.fields}
            data={form.data}
            disabled={isSubmitting}
            onChange={form.onInputChange}
            onFileUpload={form.onFileUpload}
          />

          <FormActions
            submitLabel={isSubmitting ? "Salvando..." : content.submitLabel}
            resetLabel={content.resetLabel}
            backLabel="Cancelar"
            disabled={isSubmitting}
            onBack={actions.onClose}
            onReset={actions.onReset}
          />
        </FormLayout>
      </div>
    </div>
  );
}
