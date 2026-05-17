import './header.css';
import AdminNotificationBell from "../notifications/AdminNotificationBell";
import { AppIcon } from "../icons/AppIcon";

type HeaderProps = {
  icon: string;
  title: string;
  subtitle: string;
};

function Header({ icon, title, subtitle }: HeaderProps) {
  return (
    <header className="header">
      <div className="header__content">
        <h1 className="header__title">
          <AppIcon name={icon} className="header__icon" />
          <span>{title}</span>
        </h1>
        <p className="header__subtitle">{subtitle}</p>
      </div>
      <div className="header__actions">
        <AdminNotificationBell />
      </div>
    </header>
  );
}

export default Header;
