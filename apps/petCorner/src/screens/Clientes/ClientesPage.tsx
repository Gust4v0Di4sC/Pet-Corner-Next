import logoimg from "../../assets/Logo.svg";
import {
  ANIMALS_ROUTE,
  CLIENTS_ROUTE,
} from "../../components/Dashboard/dashboard.domain";
import AppShell from "../../components/layout/AppShell";
import SectionTabs from "../../components/layout/SectionTabs";
import Main from "../../components/Templates/Main";
import { useClient } from "../../hooks/useClient";
import { ClientesRecordsSection } from "./ClientesRecordsSection";

export default function ClientesPage() {
  const clientStore = useClient("clientes");

  return (
    <AppShell logoSrc={logoimg}>
      <Main
        icon="users"
        title="Clientes"
        subtitle="Gerencie os clientes cadastrados no sistema"
        fillHeight
        contentClassName="record-management-shell"
      >
        <SectionTabs
          label="Cadastros de clientes e animais"
          tabs={[
            { to: CLIENTS_ROUTE, icon: "users", label: "Clientes" },
            { to: ANIMALS_ROUTE, icon: "paw", label: "Animais" },
          ]}
        />
        <ClientesRecordsSection {...clientStore} />
      </Main>
    </AppShell>
  );
}
