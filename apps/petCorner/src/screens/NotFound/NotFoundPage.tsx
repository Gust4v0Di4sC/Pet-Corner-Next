import type { CSSProperties } from "react";
import { Link, useLocation } from "react-router-dom";

import pawPrint from "../../assets/paw-print.svg";
import { DASHBOARD_ROUTE } from "../../components/Dashboard/dashboard.domain";
import { useAuth } from "../../hooks/useAuth";
import "./notfound.css";

type DecorativePaw = {
  left: string;
  top: string;
  size: string;
  rotate: string;
  duration: string;
  delay: string;
};

const DECORATIVE_PAWS: DecorativePaw[] = [
  { left: "8%", top: "16%", size: "96px", rotate: "-18deg", duration: "4.2s", delay: "0s" },
  { left: "26%", top: "10%", size: "78px", rotate: "12deg", duration: "4.8s", delay: "0.3s" },
  { left: "84%", top: "18%", size: "86px", rotate: "-14deg", duration: "4.5s", delay: "0.15s" },
  { left: "90%", top: "72%", size: "88px", rotate: "10deg", duration: "4.9s", delay: "0.7s" },
  { left: "14%", top: "78%", size: "92px", rotate: "-20deg", duration: "4.4s", delay: "0.45s" },
  { left: "68%", top: "88%", size: "70px", rotate: "18deg", duration: "4.7s", delay: "0.2s" },
];

export default function NotFoundPage() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const primaryRoute = user?.isAdmin ? DASHBOARD_ROUTE : "/";
  const primaryLabel = user?.isAdmin ? "Ir para o dashboard" : "Voltar para login";

  return (
    <main className="not-found-page">
      <div className="not-found-page__orbit" aria-hidden="true" />

      {DECORATIVE_PAWS.map((paw, index) => {
        const style = {
          "--paw-left": paw.left,
          "--paw-top": paw.top,
          "--paw-size": paw.size,
          "--paw-rotate": paw.rotate,
          "--paw-duration": paw.duration,
          "--paw-delay": paw.delay,
        } as CSSProperties;

        return (
          <img
            key={`${paw.left}-${paw.top}-${index}`}
            className="not-found-page__paw"
            src={pawPrint}
            alt=""
            aria-hidden="true"
            style={style}
          />
        );
      })}

      <section className="not-found-page__card" aria-labelledby="not-found-title">
        <p className="not-found-page__eyebrow">Erro de navegação</p>

        <div className="not-found-page__code" aria-hidden="true">
          <span>4</span>
          <span className="not-found-page__zero">
            <img src={pawPrint} alt="" />
          </span>
          <span>4</span>
        </div>

        <h1 id="not-found-title">Pagina nao encontrada</h1>
        <p>
          A rota que voce tentou acessar nao existe ou foi movida para outra area.
        </p>

        <p className="not-found-page__path">
          Rota atual: <code>{pathname}</code>
        </p>

        <div className="not-found-page__actions">
          <Link to={primaryRoute} className="not-found-page__button not-found-page__button--primary">
            {primaryLabel}
          </Link>
          <Link to="/" className="not-found-page__button not-found-page__button--ghost">
            Ir para pagina inicial
          </Link>
        </div>
      </section>
    </main>
  );
}

