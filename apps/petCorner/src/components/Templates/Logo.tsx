import './logo.css';
import { Link } from 'react-router-dom';
import { DASHBOARD_ROUTE } from '../Dashboard/dashboard.domain';

type LogoProps = {
  src: string;
  mobileSrc?: string;
  alt?: string;
};

function Logo({ src, mobileSrc, alt = "Logo" }: LogoProps) {
  return (
    <aside className="logo">
      <Link to={DASHBOARD_ROUTE} className="logo">
        <img className="logo__image logo__image--desktop" src={src} alt={alt} />
        {mobileSrc ? (
          <img className="logo__image logo__image--mobile" src={mobileSrc} alt={alt} />
        ) : null}
      </Link>
    </aside>
  );
}

export default Logo;
