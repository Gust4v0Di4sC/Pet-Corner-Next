type Props = {
  ariaLabel: string;
  onClick: () => void;
};

export function RecordCreateButton({ ariaLabel, onClick }: Props) {
  return (
    <button
      type="button"
      className="record-management__fab"
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <i className="fa fa-plus" aria-hidden="true" />
    </button>
  );
}
