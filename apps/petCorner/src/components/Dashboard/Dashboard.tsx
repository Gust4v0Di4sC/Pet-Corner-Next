import { useNavigate } from "react-router-dom";

import { useClient } from "../../hooks/useClient";
import { useDog } from "../../hooks/useDog";
import { useProducts } from "../../hooks/useProducts";
import { getDashboardDomainMeta, getDashboardDomainRoute } from "./dashboard.domain";
import DashboardChartCard from "./DashboardChartCard";
import DashboardSummaryCard from "./DashboardSummaryCard";
import { getChartSections, getSummaryCards } from "./dashboard.utils";
import "./dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  const { items: clients } = useClient("clientes");
  const { items: dogs } = useDog();
  const { items: products } = useProducts();

  const summaryCards = getSummaryCards(clients, dogs, products);
  const chartSections = getChartSections(clients, dogs, products);

  return (
    <section className="dashboard-view">
      <div className="dashboard-hero">
        <div>
          <h2>Resumo em tempo real dos dados cadastrados</h2>
          <p>
            Acompanhe clientes, animais e produtos com uma leitura mais direta do
            que ja foi cadastrado no sistema.
          </p>
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
          <DashboardChartCard key={section.title} {...section} />
        ))}
      </div>
    </section>
  );
}
