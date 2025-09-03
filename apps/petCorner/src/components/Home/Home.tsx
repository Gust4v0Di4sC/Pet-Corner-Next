import Main from "../Templates/Main"
import Nav from "../Templates/Nav"
import Footer from "../Templates/Footer"
import Logo from "../Templates/Logo"
import logoimg from "../../assets/Logo-home-alt.svg"
import "./home.css"
import { useLocation } from "react-router-dom"
import EntityManager from "../Clientes/EntityManager"
import { getRouteConfig } from "../../utils/routeMapper"

export default function Home() {
  const location = useLocation()
  
  const routeConfig = getRouteConfig(location.pathname);

  return (
    <div className="app">
      <Logo src={logoimg} />
      <Nav />
      <Main icon="home" title="Inicio" subtitle="Sistema para Gestão de petshop">
          <EntityManager 
          rotaKey={routeConfig.schemaKey} 
          columns={routeConfig.columns} 
        />
      </Main>
      <Footer />
    </div>
  )
}