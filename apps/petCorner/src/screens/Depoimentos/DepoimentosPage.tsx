import logoimg from "../../assets/Logo.svg";
import AppShell from "../../components/layout/AppShell";
import Main from "../../components/Templates/Main";
import { useTestimonials } from "../../hooks/useTestimonials";
import { DepoimentosRecordsSection } from "./DepoimentosRecordsSection";

export default function DepoimentosPage() {
  const testimonialsStore = useTestimonials();

  return (
    <AppShell logoSrc={logoimg}>
      <Main
        icon="comments"
        title="Depoimentos"
        subtitle="Gerencie os depoimentos exibidos na landing"
        fillHeight
        contentClassName="record-management-shell"
      >
        <DepoimentosRecordsSection {...testimonialsStore} />
      </Main>
    </AppShell>
  );
}
