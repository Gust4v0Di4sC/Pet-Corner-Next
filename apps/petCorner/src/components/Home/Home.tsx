// src/screens/Home/Home.tsx
import Main from "../Templates/Main";
import Nav from "../Templates/Nav";
import Footer from "../Templates/Footer";
import Logo from "../Templates/Logo";
import logoimg from "../../assets/Logo-home-alt.svg";
import "./home.css";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="app">
      <Logo src={logoimg} />
      <Nav />

      <Main icon="home" title="Início" subtitle="Sistema para Gestão de petshop">
        <div className="box-button-tab">
          <button onClick={() => navigate("/clientes")}>Clientes</button>
          <button onClick={() => navigate("/caes")}>Cães</button>
          <button onClick={() => navigate("/prods")}>Produtos</button>
        </div>
      </Main>

      <Footer />
    </div>
  );
}