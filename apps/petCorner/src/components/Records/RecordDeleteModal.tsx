import { useRef } from "react";

import { useModalDismiss } from "../../hooks/records";
import { AppIcon } from "../icons/AppIcon";

type Props = {
  open: boolean;
  content: {
    entityLabel: string;
    recordLabel: string;
  };
  state?: {
    isSubmitting?: boolean;
  };
  actions: {
    onClose: () => void;
    onConfirm: () => void;
  };
};

export default function RecordDeleteModal({
  open,
  content,
  state,
  actions,
}: Props) {
  const isSubmitting = state?.isSubmitting ?? false;
  const modalRef = useRef<HTMLDivElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  useModalDismiss({
    open,
    disabled: isSubmitting,
    onClose: actions.onClose,
    containerRef: modalRef,
    initialFocusRef: cancelButtonRef,
  });

  if (!open) {
    return null;
  }

  return (
    <div
      className="record-modal-overlay"
      onClick={isSubmitting ? undefined : actions.onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="record-modal record-modal--confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="record-delete-modal-title"
        aria-describedby="record-delete-modal-description"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="record-modal__close"
          onClick={actions.onClose}
          aria-label="Fechar modal"
          disabled={isSubmitting}
        >
          <AppIcon name="times" />
        </button>

        <div className="record-confirm-modal">
          <span className="record-confirm-modal__icon" aria-hidden="true">
            <AppIcon name="trash" />
          </span>

          <div className="record-confirm-modal__content">
            <p className="record-confirm-modal__eyebrow">Confirmar exclusão</p>
            <h2 id="record-delete-modal-title">Excluir {content.entityLabel}?</h2>
            <p id="record-delete-modal-description">
              Você está prestes a remover <strong>{content.recordLabel}</strong> permanentemente.
            </p>
            <p className="record-confirm-modal__warning">
              Essa ação não pode ser desfeita.
            </p>
          </div>

          <div className="record-confirm-modal__actions">
            <button
              ref={cancelButtonRef}
              type="button"
              className="record-confirm-modal__button record-confirm-modal__button--secondary"
              onClick={actions.onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="record-confirm-modal__button record-confirm-modal__button--danger"
              onClick={actions.onConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Excluindo..." : "Excluir registro"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
