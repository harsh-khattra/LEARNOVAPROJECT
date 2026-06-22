import { useState } from "react";
import "./CourseCompletion.css";
import { NavLink } from "react-router-dom";
import ShareModal from "./Sharemodal";
import advancedReactThumb from "../advanced-react-thumbnail.png";

interface Course {
  icon: string;
  name: string;
  meta: string;
  thumbnail: string; 
  instructorName: string;
   title: string; 
  rating: number;
  reviewCount: number;
  tags: string[];
  studentsCount: string;
  duration: string;
  level: string;
}

const courses: Course[] = [
  {
    icon: "⚛",
    name: "Advanced React patterns",
    meta: "6 hours, intermediate",
    thumbnail: advancedReactThumb, 
    instructorName: "Rahul Sharma",
    title: "Advanced React Patterns: HOC, Render Props & Custom Hooks", 
    rating: 4.8,
    reviewCount: 312,
    tags: ["Higher Order Components", "Custom Hooks", "Performance"],
    studentsCount: "12k",
    duration: "6 hours",
    level: "Intermediate",
  },
  {
    icon: "🖥",
    name: "Node.js for backend devs",
    meta: "8 hours, intermediate",
    thumbnail: advancedReactThumb, 
    instructorName: "Priya Verma",
    title: "Advanced React Patterns: HOC, Render Props & Custom Hooks", 
    rating: 4.6,
    reviewCount: 198,
    tags: ["REST APIs", "Authentication", "MongoDB"],
    studentsCount: "8.2k",
    duration: "8 hours",
    level: "Intermediate",
  },
  {
    icon: "💼",
    name: "Build your portfolio",
    meta: "4 hours, beginner",
    instructorName: "Aman Gupta",
    thumbnail: advancedReactThumb, 
    title: "Advanced React Patterns: HOC, Render Props & Custom Hooks", 
    rating: 4.7,
    reviewCount: 145,
    tags: ["Personal Branding", "Project Showcase", "Deployment"],
    studentsCount: "5.6k",
    duration: "4 hours",
    level: "Beginner",
  },
];

const CourseCompletion = () => {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [hovered, setHovered] = useState<number>(0);
  const [openCourseId, setOpenCourseId] = useState<number | null>(null);

  return (
    <div className="course-completed-page">
      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div className="progress-bar-track">
          <div className="progress-bar-fill"></div>
        </div>
        <span className="progress-label">100% complete</span>
      </div>

      {/* Hero */}
      <div className="hero-section">
        <div className="trophy-icon-wrapper">
          <span className="trophy-icon">&#127942;</span>
        </div>
        <h1 className="hero-title">Course completed</h1>
        <p className="hero-subtitle">Complete web development bootcamp</p>
        <p className="hero-date">
          Completed on{" "}
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Time spent</span>
          <span className="stat-value">32h 15m</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Final score</span>
          <span className="stat-value">92%</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Modules done</span>
          <span className="stat-value">18 / 18</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Rank earned</span>
          <span className="stat-value">Top 12%</span>
        </div>
      </div>

      {/* Certificate */}
      <div className="certificate-card">
        <div className="certificate-icon-wrapper">
          <span>&#128203;</span>
        </div>
        <div className="certificate-text">
          <p className="certificate-title">Your certificate is ready</p>
          <p className="certificate-subtitle">
            Download it or add it straight to your LinkedIn profile
          </p>
        </div>
        <div className="certificate-actions">

         <NavLink to="/learning/student/certificate" style={{ textDecoration: "none" }}>
  <button className="btn">
    <span className="btn-icon">&#8681;</span> View certificate
  </button>
</NavLink>

    <button className="btn" onClick={() => setIsShareOpen(true)}>
            <span className="btn-icon">&#8599;</span> Share
          </button>

          {isShareOpen && (
            <ShareModal
              link="https://codepen.io/ayoisaiah/pen/YbqGdaW"
              onClose={() => setIsShareOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Rate + Share Row */}
      <div className="two-col-row">
        <div className="card rate-card">
          <p className="card-title">Rate this course</p>
          <div className="stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className="star"
                style={{ color: star <= (hovered || rating) ? "#f5a623" : "#ccc" }}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(star)}
              >
                &#9733;
              </span>
            ))}
          </div>
          <p className="tap-to-rate">Tap to rate</p>
        </div>

        <div className="card share-card">
          <p className="card-title">Share your achievement</p>
          <div className="share-icons">
            <button
              className="share-btn"
              title="Share on LinkedIn"
              onClick={() =>
                window.open(
                  `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                    window.location.href
                  )}`,
                  "_blank"
                )
              }
            >
              in
            </button>

            <button
              className="share-btn"
              title="Share on X"
              onClick={() =>
                window.open(
                  `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    "I just completed 'Web Development Bootcamp' on Udemy! 🎉"
                  )}&url=${encodeURIComponent(window.location.href)}`,
                  "_blank"
                )
              }
            >
              X
            </button>

            <button
              className="share-btn"
              title="Copy link"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Link copied!");
              }}
            >
              &#128279;
            </button>
          </div>
        </div>
      </div>

      {/* Continue Learning */}
      <div className="continue-section">
        <p className="section-title">Continue learning</p>
        <div className="courses-grid">
          {courses.map((course, idx) => (
  <div
    className="course-card-wrapper"
    key={idx}
    onMouseEnter={() => setOpenCourseId(idx)}
    onMouseLeave={() => setOpenCourseId(null)}
  >
    <div className="course-card">
      <img
        src={course.thumbnail}
        alt={course.name}
        className="course-thumbnail"
      />
      <p className="course-name">{course.name}</p>
      <p className="course-meta">{course.meta}</p>
    </div>

    {openCourseId === idx && (
      <div className="course-dropdown">
        <div className="course-dropdown__row">
          <span className="course-dropdown__instructor">{course.instructorName}</span>
          <span className="course-dropdown__rating">
            ★ {course.rating}{" "}
            <span style={{ color: "#6a6f73" }}>({course.reviewCount})</span>
          </span>
        </div>
        <h4 className="course-dropdown__title">{course.title}</h4>
        <div className="course-dropdown__tags">
          {course.tags.map((tag) => (
            <span key={tag} className="course-dropdown__tag">
              {tag}
            </span>
          ))}
        </div>

        <div className="course-dropdown__meta">
          <span>{course.level}</span>
          <span>•</span>
          <span>{course.studentsCount} students</span>
          <span>•</span>
          <span>{course.duration}</span>
        </div>

        <div className="course-dropdown__btn-row">
          <button className="course-dropdown__btn course-dropdown__btn--outline">
            Learn more
          </button>
         <button
  className="course-dropdown__btn course-dropdown__btn--solid"
  onClick={() => window.open("https://youtu.be/MdvzlDIdQ0o?si=ZRUFZjWg-EICQ72Z", "_blank")}
>
  Watch now
</button>
        </div>
      </div>
    )}
  </div>
))}
        </div>
      </div>

      {/* Scroll hint */}
      <div className="scroll-hint">
        <button className="scroll-btn">&#8595;</button>
      </div>
    </div>
  );
};

export default CourseCompletion;