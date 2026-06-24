import React, { useState } from "react";
import "./Enroll.css";

interface EnrollmentProps {
  onClose: () => void;
}

const Enrollment: React.FC<EnrollmentProps> = ({ onClose }) => {
  const [coupon, setCoupon] = useState("");

  const relatedCourses = [
    { title: "Complete React & TypeScript Bootcamp", rating: 4.8, badge: "Certificate" },
    { title: "Node.js & Express Backend Mastery", rating: 4.7, badge: "Certificate" },
    { title: "MongoDB & SQL Complete Course", rating: 4.8, badge: "Certificate" },
  ];

  return (
    <div className="card-wrapper">
      {/* Close button */}
      <button className="modal-close-btn" onClick={onClose} aria-label="Close">
        ✕
      </button>

      {/* Header */}
      <div className="card-header">
        <div className="card-icon">⚡</div>
        <div className="card-header-text">
          <h2 className="card-title">Python for Data Science & ML</h2>
          <p className="card-subtitle">Master Python, Pandas, NumPy and scikit-learn</p>
          <div className="card-meta">
            <span className="rating">⭐ 4.9</span>
            <span className="dot">•</span>
            <span>👥 51,000 students</span>
            <span className="dot">•</span>
            <span>⏱️ 36h</span>
            <span className="dot">•</span>
            <span className="cert-badge">🎓 Certificate</span>
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="price-section">
        <span className="price-current">₹599</span>
        <span className="price-original">₹3,499</span>
        <span className="price-discount">83% off</span>
      </div>
      <p className="price-urgency">⏰ 2 days left at this price!</p>

      {/* Coupon */}
      <div className="coupon-row">
        <input
          className="coupon-input"
          type="text"
          placeholder="Have a coupon?"
          value={coupon}
          onChange={(e) => setCoupon(e.target.value)}
        />
        <button className="coupon-btn">Apply</button>
      </div>

      {/* CTA Buttons */}
      <button className="btn-enroll">Enroll now</button>
      <button className="btn-wishlist">♡ Add to wishlist</button>

      {/* Features */}
      <ul className="features-list">
        <li>🖥️ On-demand video lectures</li>
        <li>📥 Downloadable resources</li>
        <li>♾️ Lifetime access</li>
        <li>🎓 Certificate of completion</li>
      </ul>
      <p className="money-back">♡ 30-day money-back guarantee</p>

      {/* Share */}
      <div className="share-row">
        <span className="share-label">Share:</span>
        <button className="share-btn linkedin">LinkedIn</button>
        <button className="share-btn twitter">Twitter</button>
        <button className="share-btn copy">Copy link</button>
      </div>

      {/* What You'll Learn */}
      <div className="learn-section">
        <h3 className="section-title">What you will learn</h3>
        <div className="learn-grid">
          {[
            "Python basics", "Pandas & NumPy",
            "Data visualization", "Machine learning",
            "Model evaluation", "Real datasets",
          ].map((item) => (
            <div key={item} className="learn-item">
              <span className="check">✓</span> {item}
            </div>
          ))}
        </div>
      </div>

      {/* Students Also Bought */}
     
    </div>
  );
};

export default Enrollment;