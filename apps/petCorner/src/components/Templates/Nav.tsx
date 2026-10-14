import "./nav.css";
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Tooltip } from "react-tooltip";

import { useAuth } from "../../hooks/useAuth";
import { AppIcon } from "../icons/AppIcon";
import {
  ANIMALS_ROUTE,
  CLIENTS_ROUTE,
  DASHBOARD_ROUTE,
  ORDERS_ROUTE,
  APPOINTMENTS_ROUTE,
  PRODUCTS_ROUTE,
  SERVICES_ROUTE,
  TESTIMONIALS_ROUTE,
} from "../Dashboard/dashboard.domain";

export default function Nav() {
  const { logout } = useAuth();
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navigationItems = [
    { to: DASHBOARD_ROUTE, icon: "home", label: "Dashboard", routes: [DASHBOARD_ROUTE] },
    {
      to: CLIENTS_ROUTE,
      icon: "users",
      label: "Clientes e animais",
      routes: [CLIENTS_ROUTE, ANIMALS_ROUTE],
    },
    {
      to: PRODUCTS_ROUTE,
      icon: "medkit",
      label: "Produtos e operações",
      routes: [PRODUCTS_ROUTE, SERVICES_ROUTE, ORDERS_ROUTE],
    },
    {
      to: APPOINTMENTS_ROUTE,
      icon: "calendar",
      label: "Agendamentos",
      routes: [APPOINTMENTS_ROUTE],
    },
    {
      to: TESTIMONIALS_ROUTE,
      icon: "comments",
      label: "Depoimentos",
      routes: [TESTIMONIALS_ROUTE],
    },
  ];

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside className={`menu-area${isOpen ? " is-open" : ""}`}>
      <button
        type="button"
        className={`menu-backdrop${isOpen ? " is-visible" : ""}`}
        onClick={() => setIsOpen(false)}
        aria-label="Fechar menu"
      />

      <nav className="menu" aria-label="Menu principal">
        <div className="menu__top">
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setIsOpen((currentValue) => !currentValue)}
            aria-expanded={isOpen}
            aria-label={isOpen ? "Retrair menu" : "Expandir menu"}
          >
            <AppIcon name={isOpen ? "times" : "bars"} />
          </button>

          <div className="menu__brand">
            <span>Navegação</span>
            <strong>PetCorner</strong>
          </div>
        </div>

        <div className="menu__links">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={() =>
                `menu__link${item.routes.includes(pathname) ? " is-active" : ""}`
              }
              data-tooltip-id="sidebar-tooltip"
              data-tooltip-content={item.label}
              data-tooltip-place="right"
            >
              <AppIcon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <button
          type="button"
          className="menu__logout"
          onClick={handleLogout}
          data-tooltip-id="sidebar-tooltip"
          data-tooltip-content="Logout"
          data-tooltip-place="right"
        >
          <AppIcon name="sign-out" />
          <span>Logout</span>
        </button>
      </nav>

      {!isOpen && <Tooltip id="sidebar-tooltip" className="menu__tooltip" opacity={1} />}
    </aside>
  );
}
