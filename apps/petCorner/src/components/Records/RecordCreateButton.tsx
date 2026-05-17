import { AppIcon } from "../icons/AppIcon";

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
      <AppIcon name="plus" />
    </button>
  );
}
