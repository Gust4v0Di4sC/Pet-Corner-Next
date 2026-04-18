import { useEffect } from "react";

type Props = {
  open: boolean;
  entityLabel: string;
  recordLabel: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function RecordDeleteModal({
  open,
  entityLabel,
  recordLabel,
  isSubmitting = false,
  onClose,
  onConfirm,
}: Props) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSubmitting, onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="record-modal-overlay"
      onClick={isSubmitting ? undefined : onClose}
      role="presentation"
    >
      <div
        className="record-modal record-modal--confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="record-delete-modal-title"
        aria-describedby="record-delete-modal-description"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="record-modal__close"
          onClick={onClose}
          aria-label="Fechar modal"
          disabled={isSubmitting}
        >
          <i className="fa fa-times" aria-hidden="true" />
        </button>

        <div className="record-confirm-modal">
          <span className="record-confirm-modal__icon" aria-hidden="true">
            <i className="fa fa-trash" />
          </span>

          <div className="record-confirm-modal__content">
            <p className="record-confirm-modal__eyebrow">Confirmar exclusao</p>
            <h2 id="record-delete-modal-title">Excluir {entityLabel}?</h2>
            <p id="record-delete-modal-description">
              Voce esta prestes a remover <strong>{recordLabel}</strong> permanentemente.
            </p>
            <p className="record-confirm-modal__warning">
              Essa acao nao pode ser desfeita.
            </p>
          </div>

          <div className="record-confirm-modal__actions">
            <button
              type="button"
              className="record-confirm-modal__button record-confirm-modal__button--secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="record-confirm-modal__button record-confirm-modal__button--danger"
              onClick={onConfirm}
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
