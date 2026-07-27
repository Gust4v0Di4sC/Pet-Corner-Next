import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { useClient } from "../../hooks/useClient";
import { useDog } from "../../hooks/useDog";
import { useProducts } from "../../hooks/useProducts";
import { listAdminOrders } from "../../services/orderTrackingService";
import AppLoader from "../Templates/AppLoader";
import { getDashboardDomainMeta, getDashboardDomainRoute } from "./dashboard.domain";
import DashboardChartCard from "./DashboardChartCard";
import DashboardSummaryCard from "./DashboardSummaryCard";
import { getChartSections, getSummaryCards } from "./dashboard.utils";
import "./dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  const { items: clients, isLoading: clientsLoading } = useClient("clientes");
  const { items: dogs, isLoading: dogsLoading } = useDog();
  const { items: products, isLoading: productsLoading } = useProducts();
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["dashboard", "orders"],
    queryFn: async () => listAdminOrders({ maxResults: 300 }),
  });

  const summaryCards = getSummaryCards(clients, dogs, products);
  const chartSections = getChartSections(clients, dogs, products, orders);
  const isInitialLoading =
    (clientsLoading || dogsLoading || productsLoading || ordersLoading) &&
    !clients.length &&
    !dogs.length &&
    !products.length &&
    !orders.length;

  return (
    <section className="dashboard-view">
      {isInitialLoading ? (
        <AppLoader className="dashboard-loader" message="Carregando indicadores do dashboard..." />
      ) : (
        <>
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
        </>
      )}
    </section>
  );
}
