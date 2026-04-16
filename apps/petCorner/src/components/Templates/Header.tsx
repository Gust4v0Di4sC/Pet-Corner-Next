import './header.css';
import React from 'react';

// Tipagem explícita das props
type HeaderProps = {
  icon: string;
  title: string;
  subtitle: string;
};

const Header: React.FC<HeaderProps> = ({ icon, title, subtitle }) => {
  return (
    <header className="header d-none d-sm-flex flex-column">
      <h1 className="header__title">
        <i className={`fa fa-${icon} header__icon`} aria-hidden="true"></i>
        <span>{title}</span>
      </h1>
      <p className="header__subtitle">{subtitle}</p>
    </header>
  );
};

export default Header;
