import './nav.css';
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Nav: React.FC = () => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <aside className="menu-area">
      <nav className="menu">
        {/* Componentizar os links se quiser futuramente */}
        <Link to="/clientes">
          <i className="fa fa-users"></i> Clientes
        </Link>
        <Link to="/caes">
          <i className="fa fa-paw"></i> Animais
        </Link>
        <Link to="/prods">
          <i className="fa fa-medkit"></i> Produtos
        </Link>
        <Link to="#" onClick={handleLogout}>
          <i className="fa fa-sign-out"></i> Logout
        </Link>
      </nav>
    </aside>
  );
};

export default Nav;
