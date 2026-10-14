import { useMemo, useState } from "react";

import AppLoader from "../Templates/AppLoader";
import { useRecordPagination } from "../../hooks/records";
import { RecordCard } from "./RecordCard";
import { RecordPagination } from "./RecordPagination";
import type { RecordListGroup } from "./record.types";
import "./records.css";

type Props = RecordListGroup & {
  isLoading: boolean;
  className?: string;
  busyRecordId?: string | null;
  pageSize?: number;
  searchPlaceholder?: string;
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
  searchPlaceholder,
  onEditRecord,
  onDeleteRecord,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedSearchQuery = searchQuery
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
  const filteredItems = useMemo(() => {
    if (!normalizedSearchQuery) {
      return items;
    }

    return items.filter((item) =>
      [item.title, item.subtitle, item.detail, item.badge]
        .join(" ")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("pt-BR")
        .includes(normalizedSearchQuery)
    );
  }, [items, normalizedSearchQuery]);
  const shouldShowLoadingState = isLoading && !items.length;
  const pagination = useRecordPagination({
    items: filteredItems,
    pageSize,
    resetKey: normalizedSearchQuery,
  });

  return (
    <section className={`record-panel record-panel--records ${className}`.trim()}>
      <header className="record-panel__header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>

        {searchPlaceholder ? (
          <label className="record-search">
            <span className="record-search__label">Pesquisar</span>
            <span className="record-search__field">
              <i className="fas fa-search" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
              />
            </span>
          </label>
        ) : null}
      </header>

      {shouldShowLoadingState ? (
        <div className="record-empty-state record-empty-state--loading">
          <AppLoader compact message="Carregando registros..." />
        </div>
      ) : filteredItems.length ? (
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
        <div className="record-empty-state">
          {normalizedSearchQuery
            ? "Nenhum registro corresponde a pesquisa informada."
            : emptyMessage}
        </div>
      )}
    </section>
  );
}
