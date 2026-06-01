/**
 * PublicLayout.jsx
 * ----------------
 * Layout wrapper for public-facing pages (Home, Login, Signup).
 * Includes Navbar and Footer.
 */

import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const PublicLayout = () => {
  return (
    <div className="public-layout">
      <Navbar />
      <main className="public-layout__main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
