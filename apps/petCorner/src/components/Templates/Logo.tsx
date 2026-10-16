import './logo.css';
import { Link } from 'react-router-dom';
import { DASHBOARD_ROUTE } from '../Dashboard/dashboard.domain';

type LogoProps = {
  src: string;
  mobileSrc?: string;
  alt?: string;
};

function Logo({ src, mobileSrc }: LogoProps) {
  return (
    <aside className="logo">
      <Link to={DASHBOARD_ROUTE} className="logo" aria-label="Ir para o painel administrativo">
        <img className="logo__image logo__image--desktop" src={src} alt="" aria-hidden="true" />
        {mobileSrc ? (
          <img className="logo__image logo__image--mobile" src={mobileSrc} alt="" aria-hidden="true" />
        ) : null}
      </Link>
    </aside>
  );
}

export default Logo;
