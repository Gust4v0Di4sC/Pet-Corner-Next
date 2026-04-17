import type { DashboardRecordGroup } from "./dashboard.types";
import AppLoader from "../Templates/AppLoader";

type Props = DashboardRecordGroup & {
  isLoading: boolean;
  className?: string;
  busyRecordId?: string | null;
  onEditRecord?: (recordId: string) => void;
  onDeleteRecord?: (recordId: string) => void;
};

export default function DashboardRecordList({
  title,
  subtitle,
  emptyMessage,
  items,
  isLoading,
  className = "",
  busyRecordId = null,
  onEditRecord,
  onDeleteRecord,
}: Props) {
  const shouldShowLoadingState = isLoading && !items.length;

  return (
    <section className={`dashboard-panel dashboard-panel--records ${className}`.trim()}>
      <header className="dashboard-panel__header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </header>

      {shouldShowLoadingState ? (
        <div className="dashboard-empty-state dashboard-empty-state--loading">
          <AppLoader compact message="Carregando registros..." />
        </div>
      ) : items.length ? (
        <div className="dashboard-record-list">
          {items.map((item) => (
            <article className="dashboard-record-card" key={item.id}>
              <div className="dashboard-record-card__content">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.subtitle}</p>
                </div>

                <span className="dashboard-record-card__badge">{item.badge}</span>
              </div>

              <div className="dashboard-record-card__footer">
                <small>{item.detail}</small>

                {(onEditRecord || onDeleteRecord) && (
                  <div className="dashboard-record-card__actions">
                    {onEditRecord && (
                      <button
                        type="button"
                        className="dashboard-record-card__action"
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
                        className="dashboard-record-card__action dashboard-record-card__action--danger"
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
          ))}
        </div>
      ) : (
        <div className="dashboard-empty-state">{emptyMessage}</div>
      )}
    </section>
  );
}
