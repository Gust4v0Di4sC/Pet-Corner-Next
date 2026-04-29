import { useEffect, useMemo, useState } from "react";

import type { RecordListItem } from "../../components/Records/record.types";

type Params = {
  items: RecordListItem[];
  pageSize?: number;
};

export function useRecordPagination({ items, pageSize }: Params) {
  const [currentPage, setCurrentPage] = useState(1);
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

  return {
    currentPage,
    hasPagination,
    totalPages,
    visibleItems,
    goToNextPage: () => setCurrentPage((page) => Math.min(totalPages, page + 1)),
    goToPreviousPage: () => setCurrentPage((page) => Math.max(1, page - 1)),
  };
}
