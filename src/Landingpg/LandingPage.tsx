// src/LandingPage/LandingPage.tsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import "./LandingPage.css";



import logo2 from "../../src/assets/logo2.png"

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
<div className="lp-nav-logo">
  <img src={logo2} alt="Learnova Logo" className="lp-logo-img" />
  <p style={{color:"black"}}>
    LEARN<span>OVA</span>
  </p>
</div>
  <div className="lp-nav-right">

    {!isAuth && (
      <div className="lp-nav-buttons">
        <button className="btn-primary" onClick={() => navigate("/signup")}>
          Sign up
        </button>
        <button className="btn-primary" onClick={() => navigate("/login")}>
          Sign in
        </button>
      </div>
    )}
  </div>
</nav>

      {/* ── Hero ── */}
      <div className="lp-hero">
        <div className="lp-badge">Your Complete Learning Hub</div>
        <h1>Master New Skills with <br />LEARNOVA</h1>
        <p>Learn through structured courses, monitor your progress, collaborate in discussions, and achieve your goals with industry-ready content.</p>
      </div>

    {/* ── Main card ── */}


  <div className="lp-card" onClick={() => goTo("/learning/student/LandingPage")}>
    <div className="lp-card-icon icon-teal">🎓</div>
    <h2>eLearning</h2>
    <p>
      Access courses, track your progress, join discussions, and earn certificates.
    </p>
    <ul className="lp-card-features">
      <li>My courses & progress</li>
      <li>Discussions & forums</li>
      <li>Certificates</li>
    </ul>
    <button className="card-cta cta-teal">
      Open eLearning →
    </button>
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