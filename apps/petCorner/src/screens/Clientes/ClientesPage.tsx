import logoimg from "../../assets/Logo.svg";
import AppShell from "../../components/layout/AppShell";
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
        <ClientesRecordsSection {...clientStore} />
      </Main>
    </AppShell>
  );
}
