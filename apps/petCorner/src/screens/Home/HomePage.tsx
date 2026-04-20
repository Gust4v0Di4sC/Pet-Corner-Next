import logoimg from "../../assets/Logo.svg";
import Dashboard from "../../components/Dashboard/Dashboard";
import AppShell from "../../components/layout/AppShell";
import Main from "../../components/Templates/Main";

export default function HomePage() {
  return (
    <AppShell logoSrc={logoimg} chatFabPlacement="resource-fab">
      <Main
        icon="home"
        title="Dashboard"
        subtitle="Resumo visual dos clientes, animais e itens cadastrados"
      >
        <Dashboard />
      </Main>
    </AppShell>
  );
}
