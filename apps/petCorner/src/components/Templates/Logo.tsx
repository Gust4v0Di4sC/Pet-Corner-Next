import './logo.css';
import React from 'react';
import { Link } from 'react-router-dom';
import { DASHBOARD_ROUTE } from '../Dashboard/dashboard.domain';

type LogoProps = {
  src: string;
  alt?: string;
};

const Logo: React.FC<LogoProps> = ({ src, alt = "Logo" }) => {
  return (
    <aside className="logo">
      <Link to={DASHBOARD_ROUTE} className="logo">
        <img src={src} alt={alt} />
      </Link>
    </aside>
  );
};

export default Logo;
