import type { DashboardSummaryCardData } from "./dashboard.types";

type Props = DashboardSummaryCardData & {
  actionLabel: string;
  onClick: () => void;
};

export default function DashboardSummaryCard({
  title,
  value,
  helper,
  accent,
  actionLabel,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      className="dashboard-summary-card"
      onClick={onClick}
      style={{ borderColor: accent }}
    >
      <span className="dashboard-summary-card__label">{title}</span>
      <strong className="dashboard-summary-card__value" style={{ color: accent }}>
        {value}
      </strong>
      <span className="dashboard-summary-card__helper">{helper}</span>
      <span className="dashboard-summary-card__action">{actionLabel}</span>
    </button>
  );
}
