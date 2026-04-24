import './header.css';
import AdminNotificationBell from "../notifications/AdminNotificationBell";

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
          <i className={`fa fa-${icon} header__icon`} aria-hidden="true"></i>
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
