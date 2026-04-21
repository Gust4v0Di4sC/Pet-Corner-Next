import './logo.css';
import { Link } from 'react-router-dom';
import { DASHBOARD_ROUTE } from '../Dashboard/dashboard.domain';

type LogoProps = {
  src: string;
  alt?: string;
};

function Logo({ src, alt = "Logo" }: LogoProps) {
  return (
    <aside className="logo">
      <Link to={DASHBOARD_ROUTE} className="logo">
        <img src={src} alt={alt} />
      </Link>
    </aside>
  );
}

export default Logo;
