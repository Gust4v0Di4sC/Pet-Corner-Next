import { useRef, type ChangeEventHandler, type FormEventHandler } from "react";

import { FormActions } from "../Form/FormActions";
import { FormFields } from "../Form/FormFields";
import { FormLayout } from "../Form/FormLayout";
import { AppIcon } from "../icons/AppIcon";
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
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const titleId = "record-form-modal-title";

  useModalDismiss({
    open,
    disabled: isSubmitting,
    onClose: actions.onClose,
    containerRef: modalRef,
    initialFocusRef: closeButtonRef,
  });

  if (!open) {
    return null;
  }

  const closeModal = isSubmitting ? undefined : actions.onClose;

  return (
    <div className="record-modal-overlay" onClick={closeModal} role="presentation">
      <div
        ref={modalRef}
        className="record-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="record-modal__close"
          onClick={actions.onClose}
          aria-label="Fechar modal"
          disabled={isSubmitting}
        >
          <AppIcon name="times" />
        </button>

        <FormLayout
          title={content.title}
          titleId={titleId}
          onSubmit={actions.onSubmit}
          className="form--modal"
        >
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
