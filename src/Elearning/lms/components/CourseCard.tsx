import React, { useState } from 'react';
import type { Course } from '../types/lms';
import { formatCoursePrice, getStatusBadgeStyles } from '../utils/lmsShared';

// Interface ko bilkul aise hi verify kijiye
export interface CourseCardProps {
  course: Course;
  isTeacher: boolean; // <-- Make sure this line exists!
  onManageContent: (id: string) => void;
  onStartLearning: (id: string) => void;
  onPublish: (id: string) => void;
  onRevertToDraft: (id: string) => void;
  onDelete: (id: string) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  isTeacher,
  onManageContent,
  onStartLearning,
  onPublish,
  onRevertToDraft,
  onDelete
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const badgeStyle = getStatusBadgeStyles(course.status);

  return (
    <div className="modern-course-card">
      {/* Thumbnail Cover Layer */}
      <div className="card-thumbnail-wrapper">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} className="card-img" />
        ) : (
          <div className="no-image-placeholder">No Image Attached</div>
        )}
        
        <span className="badge-price">
          {formatCoursePrice(course.category)}
        </span>

        {/* Fixed Typo here */}
        {isTeacher && (
          <span className="badge-status" style={{
            backgroundColor: badgeStyle.backgroundColor, 
            color: badgeStyle.color, 
            border: badgeStyle.border
          }}>
            {badgeStyle.text}
          </span>
        )}
      </div>

      {/* Text Description Block */}
      <div className="card-body-content">
        <h3 className="card-main-title">{course.title}</h3>
        <p className="card-desc-summary">
          {course.description || 'No course curriculum description summary initialized yet.'}
        </p>

        {/* 📚 STUDENT ACCORDION UI */}
        {!isTeacher && (
          <div className="syllabus-accordion-section">
            <button 
              type="button" 
              className={`btn-toggle-syllabus ${isExpanded ? 'active' : ''}`}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "🔽 Hide Modules & Syllabus" : "👁️ View Course Modules & Lectures"}
            </button>

            {isExpanded && (
              <div className="syllabus-preview-tray">
                {/* @ts-ignore */}
                {course.chapters && course.chapters.length > 0 ? (
                  // @ts-ignore
                  course.chapters.map((chapter: any, index: number) => (
                    <div key={chapter.id} className="preview-chapter-group">
                      <h4 className="preview-chapter-title">
                         Module {index + 1}: {chapter.title}
                      </h4>

                      <ul className="preview-lecture-list">
                        {chapter.contents && chapter.contents.length > 0 ? (
                          chapter.contents.map((lecture: any) => (
                            <li key={lecture.id} className="preview-lecture-item">
                              <div className="lecture-meta-line">
                                <span className="lecture-icon-title"> {lecture.title}</span>
                                <span className="lecture-type-badge">{lecture.type || 'Video'}</span>
                              </div>
                              {lecture.description && (
                                <p className="lecture-desc-text" style = {{color: '#666', 
                                      fontSize: '13px', 
                                      marginTop: '4px',
                                     lineHeight: '1.4'}} >{lecture.description}</p>
                              )}
                            </li>
                          ))
                        ) : (
                          <li className="no-lectures-notice">No approved lectures inside this module yet.</li>
                        )}
                      </ul>
                    </div>
                  ))
                ) : (
                  <div className="no-modules-notice">No structured modules available for preview.</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions Footer */}
      <div className="card-footer-actions">
        {isTeacher ? (
          <>
            <button onClick={() => onManageContent(course.id)} className="btn-manage-syllabus">
              Manage Content & Syllabus
            </button>
            <div className="action-button-row">
              {course.status === 'draft' ? (
                <button onClick={() => onPublish(course.id)} className="btn-action-publish">
                  🚀 Publish Course
                </button>
              ) : (
                <button onClick={() => onRevertToDraft(course.id)} className="btn-action-draft">
                  ⚡ Set to Draft
                </button>
              )}
              <button onClick={() => onDelete(course.id)} className="btn-action-delete">
                Delete
              </button>
            </div>
          </>
        ) : (
          <button onClick={() => onStartLearning(course.id)} className="btn-student-start">
            ▶ Start Learning & Watch
          </button>
        )}
      </div>
    </div>
  );
};