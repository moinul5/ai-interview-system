/**
 * Loader.jsx
 * ----------
 * Reusable loading spinner.
 *
 * Props:
 *   fullScreen {boolean} - If true, centers the spinner in the full viewport.
 *   message    {string}  - Optional loading message to display below the spinner.
 */

const Loader = ({ fullScreen = false, message = "Loading..." }) => {
  if (fullScreen) {
    return (
      <div className="loader loader--fullscreen">
        <div className="loader__spinner" aria-label="Loading" />
        {message && <p className="loader__message">{message}</p>}
      </div>
    );
  }

  return (
    <div className="loader">
      <div className="loader__spinner" aria-label="Loading" />
      {message && <p className="loader__message">{message}</p>}
    </div>
  );
};

export default Loader;
