import { useEffect, useMemo, useState } from "react";

import AppLoader from "../Templates/AppLoader";
import type { RecordListGroup } from "./record.types";

type Props = RecordListGroup & {
  isLoading: boolean;
  className?: string;
  busyRecordId?: string | null;
  pageSize?: number;
  onEditRecord?: (recordId: string) => void;
  onDeleteRecord?: (recordId: string) => void;
};

export default function RecordList({
  title,
  subtitle,
  emptyMessage,
  items,
  isLoading,
  className = "",
  busyRecordId = null,
  pageSize,
  onEditRecord,
  onDeleteRecord,
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const shouldShowLoadingState = isLoading && !items.length;
  const hasPagination = typeof pageSize === "number" && pageSize > 0;
  const totalPages = hasPagination ? Math.max(1, Math.ceil(items.length / pageSize)) : 1;

  useEffect(() => {
    setCurrentPage((previousPage) => Math.min(previousPage, totalPages));
  }, [totalPages]);

  const visibleItems = useMemo(() => {
    if (!hasPagination || !pageSize) {
      return items;
    }

    const startIndex = (currentPage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  }, [currentPage, hasPagination, items, pageSize]);

  return (
    <section className={`record-panel record-panel--records ${className}`.trim()}>
      <header className="record-panel__header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </header>

      {shouldShowLoadingState ? (
        <div className="record-empty-state record-empty-state--loading">
          <AppLoader compact message="Carregando registros..." />
        </div>
      ) : items.length ? (
        <>
          <div className={`record-list ${hasPagination ? "record-list--paginated" : ""}`.trim()}>
            {visibleItems.map((item) => (
              <article className="record-card" key={item.id}>
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
            ))}
          </div>

          {hasPagination && totalPages > 1 ? (
            <div className="record-pagination">
              <button
                type="button"
                className="record-pagination__button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </button>

              <span className="record-pagination__status">
                Pagina {currentPage} de {totalPages}
              </span>

              <button
                type="button"
                className="record-pagination__button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="record-empty-state">{emptyMessage}</div>
      )}
    </section>
  );
}
