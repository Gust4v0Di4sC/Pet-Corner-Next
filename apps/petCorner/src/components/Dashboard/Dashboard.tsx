import { useNavigate } from "react-router-dom";

import { useClient } from "../../hooks/useClient";
import { useDog } from "../../hooks/useDog";
import { useProducts } from "../../hooks/useProducts";
import { getDashboardDomainMeta, getDashboardDomainRoute } from "./dashboard.domain";
import DashboardChartCard from "./DashboardChartCard";
import DashboardSummaryCard from "./DashboardSummaryCard";
import {
  getChartSections,
  getQuickStats,
  getSummaryCards,
} from "./dashboard.utils";
import "./dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  const { items: clients, isLoading: clientsLoading } = useClient("clientes");
  const { items: dogs, isLoading: dogsLoading } = useDog();
  const { items: products, isLoading: productsLoading } = useProducts();

  const isLoading = clientsLoading || dogsLoading || productsLoading;
  const summaryCards = getSummaryCards(clients, dogs, products);
  const chartSections = getChartSections(clients, dogs, products);
  const quickStats = getQuickStats(clients, dogs, products);

  return (
    <section className="dashboard-view">
      <div className="dashboard-hero">
        <div>
          <span className="dashboard-eyebrow">Painel central</span>
          <h2>Resumo em tempo real dos dados cadastrados</h2>
          <p>
            Os cards mostram totais consolidados e levam para uma tela exclusiva
            com a listagem detalhada de cada dominio.
          </p>
        </div>

        <div className="dashboard-status">
          <span className={`dashboard-status__indicator${isLoading ? " is-loading" : ""}`} />
          {isLoading ? "Atualizando indicadores..." : "Indicadores sincronizados"}
        </div>
      </div>

      <div className="dashboard-summary-grid">
        {summaryCards.map(({ key: cardKey, ...card }) => (
          <DashboardSummaryCard
            key={cardKey}
            {...card}
            actionLabel={getDashboardDomainMeta(cardKey).cardActionLabel}
            onClick={() => navigate(getDashboardDomainRoute(cardKey))}
          />
        ))}
      </div>

      <div className="dashboard-charts-grid">
        {chartSections.map((section) => (
          <DashboardChartCard
            key={section.title}
            {...section}
          />
        ))}
      </div>

      <section className="dashboard-panel">
        <header className="dashboard-panel__header">
          <div>
            <h3>Indicadores rapidos</h3>
            <p>Medias e proporcoes derivadas dos registros atuais</p>
          </div>
        </header>

        <div className="dashboard-quick-stats">
          {quickStats.map((item) => (
            <article className="dashboard-quick-stat" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>

        <div className="dashboard-inline-note">
          <i className={`fa fa-${isLoading ? "refresh" : "check-circle"}`} aria-hidden="true" />
          <span>
            {isLoading
              ? "Sincronizando dados dos registros..."
              : "Os cards acima levam para telas exclusivas com a listagem completa."}
          </span>
        </div>
      </section>
    </section>
  );
}
