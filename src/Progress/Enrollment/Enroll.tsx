import React, { useState } from "react";
import { SupabaseClient } from "../../Helper/Supabase";
import { lmsService } from "../../Elearning/lms/services/lmsService";
import "./Enroll.css";

interface CourseInfo {
  id: string;
  title: string;
  description?: string;
  category?: string;
}

interface EnrollmentProps {
  course: CourseInfo;
  onClose: () => void;
  onEnrolled: (courseId: string) => void;
}

const Enrollment: React.FC<EnrollmentProps> = ({ course, onClose, onEnrolled }) => {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleEnrollClick = async () => {
    setErrorMsg(null);
    setIsEnrolling(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await SupabaseClient.auth.getUser();

      if (authError || !user) {
        setErrorMsg("Please log in to enroll in this course.");
        setIsEnrolling(false);
        return;
      }

      await lmsService.enrollEmployeeInCourse(user.id, course.id);

      onEnrolled(course.id);
      onClose();
    } catch (err) {
      console.error("Enrollment failed:", err);
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <div className="card-wrapper">
      <button className="modal-close-btn" onClick={onClose} aria-label="Close">
        ✕
      </button>

      <div className="card-header">
        <div className="card-icon">⚡</div>
        <div className="card-header-text">
          <h2 className="card-title">{course.title}</h2>
          <p className="card-subtitle">{course.description}</p>
          <div className="card-meta">
            <span className="cert-badge">🎓 Certificate</span>
          </div>
        </div>
      </div>

      <button
        className="btn-enroll"
        onClick={handleEnrollClick}
        disabled={isEnrolling}
      >
        {isEnrolling ? "Enrolling…" : "Enroll now"}
      </button>
      <button className="btn-wishlist" disabled={isEnrolling}>
        ♡ Add to wishlist
      </button>

      {errorMsg && (
        <p style={{ color: "red", marginTop: "8px" }}>{errorMsg}</p>
      )}

      <ul className="features-list">
        <li>🖥️ On-demand video lectures</li>
        <li>📥 Downloadable resources</li>
        <li>♾️ Lifetime access</li>
        <li>🎓 Certificate of completion</li>
      </ul>
      <p className="money-back">♡ 30-day money-back guarantee</p>

      <div className="share-row">
        <span className="share-label">Share:</span>
        <button className="share-btn linkedin">LinkedIn</button>
        <button className="share-btn twitter">Twitter</button>
        <button className="share-btn copy">Copy link</button>
      </div>
    </div>
  );
};

export default Enrollment;