// src/LandingPage/LandingPage.tsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import "./LandingPage.css";

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuth } = useAuth();

  const goTo = (path: string) => {
    navigate(isAuth ? path : "/login", {
      state: { returnTo: path }, // so login can redirect back
    });
  };

  return (
    <div className="landing-page">

      {/* ── Navbar ── */}
      <nav className="lp-nav">
        <div className="lp-nav-logo">LEARN<span>OVA</span></div>
        <div className="lp-nav-right">
         
          {!isAuth && (
            <button className="btn-primary" onClick={() => navigate("/login")}>
              Sign in
            </button>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="lp-hero">
        <div className="lp-badge">Your all-in-one workplace platform</div>
        <h1>Everything your team needs,<br />in one place</h1>
        <p>Manage your people and grow their skills — seamlessly switch between HR management and learning tools.</p>
      </div>

      {/* ── Main cards ── */}
      <div className="lp-cards">

        <div className="lp-card" onClick={() => goTo("/hrms/dashboard")}>
          <div className="lp-card-icon icon-blue">🏢</div>
          <h2>HRMS</h2>
          <p>Manage attendance, leaves and your entire workforce in one dashboard.</p>
          <ul className="lp-card-features">
            <li>Leave & attendance</li>
            <li>Employee management</li>
            <li>Discussions </li>
          </ul>
          <button className="card-cta cta-blue">Open HRMS →</button>
        </div>

        <div className="lp-card" onClick={() => goTo("/learning/dashboard")}>
          <div className="lp-card-icon icon-teal">🎓</div>
          <h2>eLearning</h2>
          <p>Access courses, track your progress, join discussions, and earn certificates.</p>
          <ul className="lp-card-features">
            <li>My courses & progress</li>
            <li>Discussions & forums</li>
            <li>Certificates</li>
          </ul>
          <button className="card-cta cta-teal">Open eLearning →</button>
        </div>

      </div>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <p>© 2026 LEARNOVA</p>
        <div className="lp-footer-links">
          <a href="#">Privacy</a>
          <a href="#">Support</a>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;