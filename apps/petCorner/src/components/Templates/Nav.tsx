import "./nav.css";
import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import {
  ANIMALS_ROUTE,
  CLIENTS_ROUTE,
  DASHBOARD_ROUTE,
  PRODUCTS_ROUTE,
} from "../Dashboard/dashboard.domain";

const Nav: React.FC = () => {
  const { logout } = useAuth();
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navigationItems = [
    { to: DASHBOARD_ROUTE, icon: "home", label: "Dashboard" },
    { to: CLIENTS_ROUTE, icon: "users", label: "Clientes" },
    { to: ANIMALS_ROUTE, icon: "paw", label: "Animais" },
    { to: PRODUCTS_ROUTE, icon: "medkit", label: "Produtos" },
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
            <i className={`fa ${isOpen ? "fa-times" : "fa-bars"}`} />
          </button>

          <div className="menu__brand">
            <span>Navegacao</span>
            <strong>PetCorner</strong>
          </div>
        </div>

        <div className="menu__links">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `menu__link${isActive ? " is-active" : ""}`}
            >
              <i className={`fa fa-${item.icon}`} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <button type="button" className="menu__logout" onClick={handleLogout}>
          <i className="fa fa-sign-out" />
          <span>Logout</span>
        </button>
      </nav>
    </aside>
  );
};

export default Nav;
