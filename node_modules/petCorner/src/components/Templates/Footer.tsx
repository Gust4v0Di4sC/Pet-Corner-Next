import './footer.css';
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <span>
        Desenvolvido com <i className="fa fa-heart text-danger"></i> por{' '}
        <strong>GusT<span className="text-danger">4</span>v0Di4sC</strong>
      </span>
    </footer>
  );
};

export default Footer;
