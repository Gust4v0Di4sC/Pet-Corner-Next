import { useModalDismiss } from "../../hooks/records";

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

  useModalDismiss({
    open,
    disabled: isSubmitting,
    onClose: actions.onClose,
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
          onClick={actions.onClose}
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
            <h2 id="record-delete-modal-title">Excluir {content.entityLabel}?</h2>
            <p id="record-delete-modal-description">
              Você esta prestes a remover <strong>{content.recordLabel}</strong> permanentemente.
            </p>
            <p className="record-confirm-modal__warning">
              Essa ação não pode ser desfeita.
            </p>
          </div>

          <div className="record-confirm-modal__actions">
            <button
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
