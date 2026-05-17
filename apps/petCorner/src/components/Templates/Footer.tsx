import './footer.css';
import { AppIcon } from "../icons/AppIcon";

function Footer() {
  return (
    <footer className="footer">
      <span>
        Desenvolvido com <AppIcon name="heart" className="text-danger" /> por{' '}
        <strong>GusT<span className="text-danger">4</span>v0Di4sC</strong>
      </span>
    </footer>
  );
}

export default Footer;
