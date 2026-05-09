/**
 * Footer.jsx
 * ----------
 * Site-wide footer displayed on all public pages.
 */

import { Link } from "react-router-dom";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__inner">
        <p className="footer__brand">🎯 InterviewAI</p>
        <p className="footer__copy">© {year} InterviewAI. All rights reserved.</p>
        <ul className="footer__links">
          <li><Link to="/" className="footer__link">Home</Link></li>
          <li><Link to="/login" className="footer__link">Login</Link></li>
          <li><Link to="/signup" className="footer__link">Signup</Link></li>
          {/* TODO: Add Privacy Policy / Terms links once pages exist */}
        </ul>
      </div>
    </footer>
  );
};

export default Footer;
