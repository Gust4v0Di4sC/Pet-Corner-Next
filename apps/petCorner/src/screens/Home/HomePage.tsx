import "./home.css";
import Main from "../../components/Templates/Main";


import AppShell from "../../components/layout/AppShell";
import logoimg from "../../assets/Logo-home-alt.svg";

export default function HomePage() {
  // const location = useLocation();
  // const routeConfig = getRouteConfig(location.pathname);

  return (
    <AppShell logoSrc={logoimg}>
      <Main icon="home" title="Inicio" subtitle="Sistema para Gestão de petshop">
       
      </Main>
    </AppShell>
  );
}
