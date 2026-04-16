import type { DashboardRecordGroup } from "./dashboard.types";

type Props = DashboardRecordGroup & {
  isLoading: boolean;
  className?: string;
};

export default function DashboardRecordList({
  title,
  subtitle,
  emptyMessage,
  items,
  isLoading,
  className = "",
}: Props) {
  return (
    <section className={`dashboard-panel dashboard-panel--records ${className}`.trim()}>
      <header className="dashboard-panel__header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </header>

      {isLoading ? (
        <div className="dashboard-empty-state">Carregando registros...</div>
      ) : items.length ? (
        <div className="dashboard-record-list">
          {items.map((item) => (
            <article className="dashboard-record-card" key={item.id}>
              <div className="dashboard-record-card__content">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.subtitle}</p>
                </div>

                <span className="dashboard-record-card__badge">{item.badge}</span>
              </div>

              <small>{item.detail}</small>
            </article>
          ))}
        </div>
      ) : (
        <div className="dashboard-empty-state">{emptyMessage}</div>
      )}
    </section>
  );
}
