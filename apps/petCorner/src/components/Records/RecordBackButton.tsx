type Props = {
  label?: string;
  onClick: () => void;
};

export function RecordBackButton({ label = "Voltar ao dashboard", onClick }: Props) {
  return (
    <button type="button" className="record-management__back" onClick={onClick}>
      <i className="fa fa-arrow-left" aria-hidden="true" /> {label}
    </button>
  );
}
