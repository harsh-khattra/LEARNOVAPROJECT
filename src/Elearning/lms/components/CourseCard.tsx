import React, { useState } from 'react';
import  type { Course } from '../types/lms';

interface CourseCardProps {
  course: Course;
  isTeacher: boolean;
  isEnrolled?: boolean;
  onManageContent: (id: string) => void;
  onPublish: (id: string) => void;
  onRevertToDraft: (id: string) => void;
  onDelete: (id: string) => void;
  onStartLearning: (id: string) => void;
}
export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  isTeacher,
  isEnrolled = false,
  onStartLearning
}) => {
  // Individual state for smooth standalone dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Cast course to any safely to access nested chapters if they exist in runtime data
  const courseData = course as any;

  return (
    <div className="course-catalog-card student-card-view">
      
      {/* Top Lock status tag overlay */}
      <div className="card-badge-status">
        <span className="badge-lock">🔒 Preview Lock</span>
      </div>

      <div className="course-card-thumbnail-box">
        <img src={courseData.thumbnail_url || '/placeholder.jpg'} alt={course.title} />
      </div>

      <div className="course-card-body-details">
        <span className="course-card-category">{courseData.category || "Academic"}</span>
        <h3 className="course-card-title">{course.title}</h3>
        <p className="course-card-desc">{course.description}</p>

        {/* 🚀 ULTRA-SMOOTH PLAYLIST ACCORDION DROPDOWN */}
        <div className="smooth-accordion-container">
          <button
            type="button"
            className={`syllabus-trigger-btn ${isDropdownOpen ? 'active' : ''}`}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span>📋 View Playlist ({courseData.chapters?.length || 0} Modules)</span>
            <span className="arrow-icon">{isDropdownOpen ? '▲' : '▼'}</span>
          </button>

          {/* Collapsible Dropdown Wrapper */}
          <div className={`smooth-dropdown-wrapper ${isDropdownOpen ? 'is-expanded' : ''}`}>
            <div className="syllabus-content-inner-scroll">
              {courseData.chapters && courseData.chapters.length > 0 ? (
                courseData.chapters.map((chapter: any, index: number) => (
                  <div key={chapter.id || index} className="syllabus-chapter-block">
                    <h4 className="syllabus-chapter-title">
                      M{index + 1}: {chapter.title}
                    </h4>
                    <ul className="syllabus-lessons-list">
                      {chapter.contents && chapter.contents.length > 0 ? (
                        chapter.contents.map((content: any, cIndex: number) => (
                          <li key={content.id || cIndex} className="syllabus-lesson-item">
                            <span className="lesson-name">📹 {content.title}</span>
                            <span className="lesson-lock-tag locked">🔒 Lock</span>
                          </li>
                        ))
                  ) : (
                        <li className="no-lessons-notice">No content items inside this module.</li>
                      )}
                    </ul>
                  </div>
                ))
              ) : (
                <p className="no-chapters-notice">No curriculum modules uploaded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Bottom CTA Action Button */}
      <div className="course-card-footer-actions">
  <button
    type="button"
    className={isEnrolled ? "btn-action-enrolled" : "btn-action-enroll"}
    onClick={() => !isEnrolled && onStartLearning(course.id)}
    disabled={isEnrolled}
  >
    {isEnrolled ? "Enrolled ✓" : "Enroll & Unlock Course 🔒"}
  </button>
</div>

    </div>
  );
};