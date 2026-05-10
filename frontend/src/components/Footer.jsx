/**
 * Footer.jsx
 * ----------
 * Site-wide footer displayed on all public pages.
 */

import { Link } from "react-router-dom";
import { MdSmartToy, MdHome, MdLogin, MdPersonAdd } from "react-icons/md";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__inner">
        <p className="footer__brand">
          <MdSmartToy size={20} style={{ verticalAlign: "middle", marginRight: "6px" }} />
          InterviewAI
        </p>
        <p className="footer__copy">© {year} InterviewAI. All rights reserved.</p>
        <ul className="footer__links">
          <li>
            <Link to="/" className="footer__link">
              <MdHome size={14} style={{ verticalAlign: "middle", marginRight: "3px" }} />
              Home
            </Link>
          </li>
          <li>
            <Link to="/login" className="footer__link">
              <MdLogin size={14} style={{ verticalAlign: "middle", marginRight: "3px" }} />
              Login
            </Link>
          </li>
          <li>
            <Link to="/signup" className="footer__link">
              <MdPersonAdd size={14} style={{ verticalAlign: "middle", marginRight: "3px" }} />
              Signup
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
};

export default Footer;
