import logoimg from "../../assets/Logo.svg";
import {
  ORDERS_ROUTE,
  PRODUCTS_ROUTE,
  SERVICES_ROUTE,
} from "../../components/Dashboard/dashboard.domain";
import AppShell from "../../components/layout/AppShell";
import SectionTabs from "../../components/layout/SectionTabs";
import Main from "../../components/Templates/Main";
import { useServices } from "../../hooks/useServices";
import { ServicosRecordsSection } from "./ServicosRecordsSection";

export default function ServicosPage() {
  const servicesStore = useServices();

  return (
    <AppShell logoSrc={logoimg}>
      <Main
        icon="scissors"
        title="Servicos"
        subtitle="Gerencie os servicos oferecidos pelo petshop"
        fillHeight
        contentClassName="record-management-shell"
      >
        <SectionTabs
          label="Produtos, serviços e pedidos"
          tabs={[
            { to: PRODUCTS_ROUTE, icon: "medkit", label: "Produtos" },
            { to: SERVICES_ROUTE, icon: "scissors", label: "Serviços" },
            { to: ORDERS_ROUTE, icon: "shopping-bag", label: "Pedidos" },
          ]}
        />
        <ServicosRecordsSection {...servicesStore} />
      </Main>
    </AppShell>
  );
}
