import logoimg from "../../assets/Logo.svg";
import AppShell from "../../components/layout/AppShell";
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
        <ServicosRecordsSection {...servicesStore} />
      </Main>
    </AppShell>
  );
}
