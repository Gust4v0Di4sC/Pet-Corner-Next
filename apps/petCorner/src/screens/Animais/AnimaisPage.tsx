import logoimg from "../../assets/Logo.svg";
import {
  ANIMALS_ROUTE,
  CLIENTS_ROUTE,
} from "../../components/Dashboard/dashboard.domain";
import AppShell from "../../components/layout/AppShell";
import SectionTabs from "../../components/layout/SectionTabs";
import Main from "../../components/Templates/Main";
import { useDog } from "../../hooks/useDog";
import { AnimaisRecordsSection } from "./AnimaisRecordsSection";

export default function AnimaisPage() {
  const dogStore = useDog();

  return (
    <AppShell logoSrc={logoimg}>
      <Main
        icon="paw"
        title="Animais"
        subtitle="Gerencie os animais cadastrados no sistema"
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
        <AnimaisRecordsSection {...dogStore} />
      </Main>
    </AppShell>
  );
}
