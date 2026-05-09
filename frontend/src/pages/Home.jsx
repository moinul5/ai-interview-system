/**
 * Home.jsx
 * --------
 * Public landing page.
 * Introduces the AI Interview Preparation System.
 */

import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="page page--home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero__content">
          <h1 className="hero__title">
            Ace Your Next Interview with <span className="text-accent">AI</span>
          </h1>
          <p className="hero__subtitle">
            Practice real interview questions, get instant AI feedback, and improve
            your performance — all in one place.
          </p>
          <div className="hero__actions">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn--primary">Go to Dashboard</Link>
            ) : (
              <>
                <Link to="/signup" className="btn btn--primary">Get Started Free</Link>
                <Link to="/login" className="btn btn--outline">Sign In</Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2 className="features__title">Why InterviewAI?</h2>
        <div className="features__grid">
          {[
            { icon: "🤖", title: "AI-Powered Questions",  desc: "Questions tailored to your resume and target role." },
            { icon: "📊", title: "Instant Feedback",      desc: "Get real-time scores and improvement tips after each answer." },
            { icon: "📄", title: "Resume Analysis",       desc: "Upload your resume; our AI extracts skills and suggests questions." },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="feature-card">
              <span className="feature-card__icon">{icon}</span>
              <h3 className="feature-card__title">{title}</h3>
              <p className="feature-card__desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
