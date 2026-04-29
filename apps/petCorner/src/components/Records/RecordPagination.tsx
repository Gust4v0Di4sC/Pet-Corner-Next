type Props = {
  currentPage: number;
  totalPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
};

export function RecordPagination({
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
}: Props) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="record-pagination">
      <button
        type="button"
        className="record-pagination__button"
        onClick={onPreviousPage}
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
        onClick={onNextPage}
        disabled={currentPage === totalPages}
      >
        Próxima
      </button>
    </div>
  );
}
