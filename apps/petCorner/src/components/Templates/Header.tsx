import './header.css';

type HeaderProps = {
  icon: string;
  title: string;
  subtitle: string;
};

function Header({ icon, title, subtitle }: HeaderProps) {
  return (
    <header className="header">
      <h1 className="header__title">
        <i className={`fa fa-${icon} header__icon`} aria-hidden="true"></i>
        <span>{title}</span>
      </h1>
      <p className="header__subtitle">{subtitle}</p>
    </header>
  );
}

export default Header;
