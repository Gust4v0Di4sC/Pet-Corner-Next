import AppLoader from "../Templates/AppLoader";
import { useRecordPagination } from "../../hooks/records";
import { RecordCard } from "./RecordCard";
import { RecordPagination } from "./RecordPagination";
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
  const shouldShowLoadingState = isLoading && !items.length;
  const pagination = useRecordPagination({ items, pageSize });

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
          <div
            className={`record-list ${
              pagination.hasPagination ? "record-list--paginated" : ""
            }`.trim()}
          >
            {pagination.visibleItems.map((item) => (
              <RecordCard
                key={item.id}
                item={item}
                busyRecordId={busyRecordId}
                onEditRecord={onEditRecord}
                onDeleteRecord={onDeleteRecord}
              />
            ))}
          </div>

          {pagination.hasPagination ? (
            <RecordPagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPreviousPage={pagination.goToPreviousPage}
              onNextPage={pagination.goToNextPage}
            />
          ) : null}
        </>
      ) : (
        <div className="record-empty-state">{emptyMessage}</div>
      )}
    </section>
  );
}
