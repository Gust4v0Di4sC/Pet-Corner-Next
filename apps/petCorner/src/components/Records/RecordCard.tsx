import type { RecordListItem } from "./record.types";

type Props = {
  item: RecordListItem;
  busyRecordId?: string | null;
  onEditRecord?: (recordId: string) => void;
  onDeleteRecord?: (recordId: string) => void;
};

export function RecordCard({
  item,
  busyRecordId = null,
  onEditRecord,
  onDeleteRecord,
}: Props) {
  return (
    <article className="record-card">
      <div className="record-card__content">
        <div>
          <strong>{item.title}</strong>
          <p>{item.subtitle}</p>
        </div>

        <span className="record-card__badge">{item.badge}</span>
      </div>

      <div className="record-card__footer">
        <small>{item.detail}</small>

        {(onEditRecord || onDeleteRecord) && (
          <div className="record-card__actions">
            {onEditRecord && (
              <button
                type="button"
                className="record-card__action"
                onClick={() => onEditRecord(item.id)}
                disabled={busyRecordId === item.id}
                aria-label={`Editar ${item.title}`}
              >
                <i className="fa fa-pencil" aria-hidden="true" />
              </button>
            )}

            {onDeleteRecord && (
              <button
                type="button"
                className="record-card__action record-card__action--danger"
                onClick={() => onDeleteRecord(item.id)}
                disabled={busyRecordId === item.id}
                aria-label={`Excluir ${item.title}`}
              >
                <i className="fa fa-trash" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
