/**
 * NotFound.jsx
 * ------------
 * 404 fallback page for unmatched routes.
 */

import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="page page--notfound">
      <div className="notfound">
        <h1 className="notfound__code">404</h1>
        <h2 className="notfound__title">Page Not Found</h2>
        <p className="notfound__desc">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn btn--primary">Go Back Home</Link>
      </div>
    </div>
  );
};

export default NotFound;
