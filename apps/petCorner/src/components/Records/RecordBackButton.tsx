import { AppIcon } from "../icons/AppIcon";

type Props = {
  label?: string;
  onClick: () => void;
};

export function RecordBackButton({ label = "Voltar ao dashboard", onClick }: Props) {
  return (
    <button type="button" className="record-management__back" onClick={onClick}>
      <AppIcon name="arrow-left" /> {label}
    </button>
  );
}
