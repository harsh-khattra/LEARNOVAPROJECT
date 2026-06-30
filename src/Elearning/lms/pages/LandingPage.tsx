import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1️⃣ Navigation hook import kiya
import './LandingPage.css';

export const LandingPage: React.FC = () => {
  const [showPromoVideo, setShowPromoVideo] = useState(false);
  const navigate = useNavigate(); // 2️⃣ Navigate function initialize kiya

  const globalStats = [
    { value: '200+', label: 'Premium Courses' },
    { value: '30+', label: 'Expert Instructors' },
    { value: '4000+', label: 'Global Students' }
  ];

  const topMentors = [
    { name: 'John Aidan', role: 'Full Stack Tech Lead', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256' },
    { name: 'Erika Mical', role: 'UI/UX Design Consultant', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256' },
    { name: 'Anny Rose', role: 'Data Science & AI Mentor', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256' },
    { name: 'Adrian Cruz', role: 'Backend Architecture Expert', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256' }
  ];

  // 3️⃣ Common helper function navigation handle karne ke liye
  const handleNavigateToCourses = () => {
    navigate('/learning/employee/courses'); 
  };

  return (
    <div className="ln-landing-wrapper">
      
      {/* 1️ HERO BLOCK WITH NAVIGATION TRIGGER */}
      <section className="ln-hero-banner">
        <div className="ln-hero-inner">
          <h1>E-Learning Experience <br/>Built For The Future</h1>
          <p className="ln-hero-lead-text">
            Join a global community of learners picking up in-demand technical skills, backed by guided professional roadmaps and real-world project portfolios.
          </p>
          
       
          <div className="ln-promo-media-box" onClick={() => setShowPromoVideo(true)}>
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200" 
              alt="Learnova Platform Overview" 
            />
            <button className="ln-media-play-trigger" aria-label="Play Platform Video">
              <span className="ln-play-icon"></span>
            </button>
          </div>
        </div>
      </section>

      {/* 2️ DATA METRICS STRIP */}
      <section className="ln-metrics-container">
        <div className="ln-metrics-flex-row">
          <div className="ln-metrics-title">
            <h2>Let Numbers Talk</h2>
          </div>
          <div className="ln-metrics-data-row">
            {globalStats.map((stat, idx) => (
              <div key={idx} className="ln-metric-card">
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3️ PLATFORM ECOSYSTEM & USPs */}
      <section className="ln-features-split-panel">
        <div className="ln-feature-row">
          <div className="ln-feature-side-label"><strong>OUR VISION</strong></div>
          <div className="ln-feature-main-desc">
            <p>To democratize professional tech education. We provide production-grade course setups, breaking down complex engineering workflows into visual, bite-sized chapters that anyone can master at their own pace.</p>
          </div>
        </div>

        <hr className="ln-divider" />

        <div className="ln-feature-row">
          <div className="ln-feature-side-label"><strong>OUR ECOSYSTEM</strong></div>
          <div className="ln-feature-main-desc">
            <p>Every single academic pipeline inside Learnova is stacked with structured resources designed to convert foundational knowledge into practical expertise:</p>
            <ul className="ln-bullet-list">
              <li>High-definition project-focused video lectures.</li>
              <li>Hand-written downloadable technical blueprints and cheatsheets.</li>
              <li>Comprehensive mock tasks and production deployment milestones.</li>
              <li>Industry-recognized shareable completion certificates.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4️ MEET THE MENTORS GRID */}
      <section className="ln-mentors-showcase">
        <span className="ln-section-badge">ACADEMIC EXPERTS</span>
        <h2 className="ln-section-headline">Meet The Instructors</h2>
        
        <div className="ln-mentors-grid">
          {topMentors.map((mentor, index) => (
            <div key={index} className="ln-mentor-profile-card">
              <div className="ln-mentor-avatar-wrap">
                <img src={mentor.img} alt={mentor.name} />
              </div>
              <h4>{mentor.name}</h4>
              <p>{mentor.role}</p>
              <div className="ln-mentor-socials">
                <span>🌐</span><span>💼</span><span>🐦</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5️ BOTTOM PREMIUM CTA BANNER WITH NAVIGATION */}
      <section className="ln-membership-cta-strip">
        <div className="ln-cta-canvas">
          <span className="ln-cta-badge">LIMITED OFFER</span>
          <h2>Get Unlimited Access To All Courses</h2>
          <p>Invest in your career growth. Gain unrestricted access to all current paths, source code repositories, and newly released content updates.</p>
          
          {/*  Bottom CTA button par onClick trigger lagaya */}
          <button 
            type="button" 
            className="ln-cta-btn" 
            onClick={handleNavigateToCourses}
          >
            Explore All Courses Now
          </button>
        </div>
      </section>

      {/* LIGHTBOX POPUP FOR VIDEO PREVIEW */}
      {showPromoVideo && (
        <div className="ln-video-modal-overlay" onClick={() => setShowPromoVideo(false)}>
          <div className="ln-video-modal-box" onClick={(e) => e.stopPropagation()}>
            <iframe 
              width="100%" 
              height="450" 
              src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
              title="Learnova Promo Video" 
              style={{ border: 'none', borderRadius: '16px' }}
              allowFullScreen
            />
            <button className="ln-close-modal-btn" onClick={() => setShowPromoVideo(false)}>✕ Close Stream</button>
          </div>
        </div>
      )}

    </div>
  );
};