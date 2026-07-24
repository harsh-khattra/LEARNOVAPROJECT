import React from "react";
import "./CourseCard.css";

interface CourseCardProps {
  videoTitlePrefix?: string;
  videoSubtitle?: string;
  videoTitle?: string;
  instructorName: string;
  isVerified?: boolean;
  rating: number;
  reviewCount: number;
  courseTitle: string;
  tags: string[];
  extraTagsCount?: number;
  level: string;
  studentsCount: string;
  duration: string;
  onLearnMore?: () => void;
  onWatchNow?: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({
  videoTitlePrefix = "From Brent Eviston",
  videoSubtitle = "The award winning creator of the bestselling",
  videoTitle = "Art & Science of Drawing",
  instructorName,
  isVerified = true,
  rating,
  reviewCount,
  courseTitle,
  tags,
  extraTagsCount = 0,
  level,
  studentsCount,
  duration,
  onLearnMore,
  onWatchNow,
}) => {
  return (
    <div className="course-card">
      {/* Video Preview */}
      <div className="course-card__video">
        <div className="course-card__video-overlay">
          <p className="course-card__video-prefix">{videoTitlePrefix}</p>
          <p className="course-card__video-subtitle">{videoSubtitle}</p>
          <p className="course-card__video-title">{videoTitle}</p>
        </div>
        <button className="course-card__mute-btn" aria-label="Unmute video">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        </button>
      </div>

      {/* Instructor + Rating */}
      <div className="course-card__row">
        <div className="course-card__instructor">
          <span>{instructorName}</span>
          {isVerified && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#1d9e75">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#1d9e75" strokeWidth="2" fill="none" />
            </svg>
          )}
        </div>
        <div className="course-card__rating">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#e59819">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="course-card__rating-val">{rating}</span>
          <span className="course-card__rating-count">({reviewCount})</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="course-card__title">{courseTitle}</h3>

      {/* Tags */}
      <div className="course-card__tags">
        {tags.map((tag) => (
          <span key={tag} className="course-card__tag">
            {tag}
          </span>
        ))}
        {extraTagsCount > 0 && (
          <span className="course-card__tag-more">+{extraTagsCount}</span>
        )}
      </div>

      {/* Meta info */}
      <div className="course-card__meta">
        <span className="course-card__meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          {level}
        </span>
        <span className="course-card__meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          {studentsCount}
        </span>
        <span className="course-card__meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {duration}
        </span>
      </div>

      {/* Buttons */}
      <div className="course-card__btn-row">
        <button className="course-card__btn course-card__btn--outline" onClick={onLearnMore}>
          Learn more
        </button>
        <button className="course-card__btn course-card__btn--solid" onClick={onWatchNow}>
          Watch now
        </button>
      </div>
    </div>
  );
};

export default CourseCard;