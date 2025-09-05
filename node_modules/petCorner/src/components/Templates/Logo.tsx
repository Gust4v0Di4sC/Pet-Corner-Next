import './logo.css';
import React from 'react';
import { Link } from 'react-router-dom';

type LogoProps = {
  src: string;
  alt?: string;
};

const Logo: React.FC<LogoProps> = ({ src, alt = "Logo" }) => {
  return (
    <aside className="logo">
      <Link to="/" className="logo">
        <img src={src} alt={alt} />
      </Link>
    </aside>
  );
};

export default Logo;
