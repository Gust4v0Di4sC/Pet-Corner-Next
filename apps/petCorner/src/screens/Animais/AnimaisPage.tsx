import logoimg from "../../assets/Logo.svg";
import AppShell from "../../components/layout/AppShell";
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
        <AnimaisRecordsSection {...dogStore} />
      </Main>
    </AppShell>
  );
}
