/**
 * Home.jsx
 * --------
 * Public landing page.
 * Introduces the AI Interview Preparation System.
 * Hero section uses React Bits Orb (WebGL) as an animated background.
 */

import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MdSmartToy, MdSpeed, MdFactCheck } from "react-icons/md";
import {
  FaGoogle,
  FaMicrosoft,
  FaAmazon,
  FaApple,
  FaMeta,
  FaStripe,
  FaSlack
} from "react-icons/fa6";
import Orb from "../components/Orb";

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="page page--home">
      {/* ── Hero Section ── */}
      <section className="hero">
        {/* Orb WebGL background — absolutely fills the hero */}
        <Orb
          hue={240}
          hoverIntensity={0.4}
          rotateOnHover={false}
          forceHoverState={false}
          backgroundColor="#0d0d1a"
        />

        {/* Overlay gradient for text readability */}
        <div className="hero__overlay" aria-hidden="true" />

        <div className="hero__content">
          <div className="hero__badge">
            <MdSmartToy size={14} />
            <span>AI-Powered Interview Training</span>
          </div>
          <h1 className="hero__title">
            Ace Your Next Interview with{" "}
            <span className="hero__title-accent">AI</span>
          </h1>
          <p className="hero__subtitle">
            Practice real interview questions, get instant AI feedback, and
            improve your performance — all in one place.
          </p>
          <div className="hero__actions">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn--primary btn--lg">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/signup" className="btn btn--hero-primary btn--lg">
                  Get Started Free
                </Link>
                <Link to="/login" className="btn btn--hero-outline btn--lg">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Trusted By Section (Logo Marquee) ── */}
      <section className="trusted-by">
        <p className="trusted-by__text">Trusted by candidates who landed offers at</p>
        <div className="marquee-container">
          <div className="marquee">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="marquee__content" aria-hidden={i > 0}>
                <FaGoogle className="marquee__logo" />
                <FaMicrosoft className="marquee__logo" />
                <FaAmazon className="marquee__logo" />
                <FaApple className="marquee__logo" />
                <FaMeta className="marquee__logo" />
                <FaStripe className="marquee__logo" />
                <FaSlack className="marquee__logo" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="features">
        <h2 className="features__title">Why InterviaAI?</h2>
        <div className="features__grid">
          {[
            {
              icon: <MdSmartToy />,
              title: "AI-Powered Questions",
              desc: "Questions tailored to your resume and target role.",
            },
            {
              icon: <MdSpeed />,
              title: "Instant Feedback",
              desc: "Get real-time scores and improvement tips after each answer.",
            },
            {
              icon: <MdFactCheck />,
              title: "Resume Analysis",
              desc: "Upload your resume; our AI extracts skills and suggests questions.",
            },
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
