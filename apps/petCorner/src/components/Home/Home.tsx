import logoimg from "../../assets/Logo-home-alt.svg";
import Dashboard from "../Dashboard/Dashboard";
import AppShell from "../layout/AppShell";
import Main from "../Templates/Main";
import "./home.css";

export default function Home() {
  return (
    <AppShell logoSrc={logoimg}>
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
