import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SupabaseClient } from '../../../Helper/Supabase';
import { lmsService } from '../services/lmsService';
import './AvailableCourse.css';


const CourseCard: React.FC<{ course: any; isEnrolled: boolean; navigate: any }> = ({ course, isEnrolled, navigate }) => {
  //  Har single card ka dropdown ab is local state se control hoga, isliye koi clash nahi hoga
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className={`course-catalog-card ${isEnrolled ? 'unlocked' : 'locked'}`}>
      
      {/* Lock / Unlocked Badge */}
      <div className="card-badge-status">
        {isEnrolled ? (
          <span className="badge-open">✅ Unlocked</span>
        ) : (
          <span className="badge-lock">🔒 Enrolled Guard</span>
        )}
      </div>

      <div className="course-card-thumbnail-box">
        <img src={course.thumbnail_url || '/placeholder.jpg'} alt={course.title} />
      </div>

      <div className="course-card-body-details">
        <span className="course-card-category">{course.category}</span>
        <h3 className="course-card-title">{course.title}</h3>
        <p className="course-card-desc">{course.description}</p>
        
        {/* Playlist Accordion Area */}
        <div className="smooth-accordion-container">
          <button 
            type="button" 
            className={`syllabus-trigger-btn ${isDropdownOpen ? 'active' : ''}`}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)} // Simply toggle local state
          >
            <span>📋 View Course Playlist ({course.chapters?.length || 0} Modules)</span>
            <span className="arrow-icon">{isDropdownOpen ? '▲' : '▼'}</span>
          </button>

          {/* Smooth Height Dropdown Wrapper */}
          <div className={`smooth-dropdown-wrapper ${isDropdownOpen ? 'is-expanded' : ''}`}>
            <div className="syllabus-content-inner-scroll">
              {course.chapters && course.chapters.length > 0 ? (
                course.chapters.map((chapter: any, index: number) => (
                  <div key={chapter.id || index} className="syllabus-chapter-block">
                    <h4 className="syllabus-chapter-title">
                      M{index + 1}: {chapter.title}
                    </h4>
                    <ul className="syllabus-lessons-list">
                      {chapter.contents && chapter.contents.length > 0 ? (
                        chapter.contents.map((content: any, cIndex: number) => (
                          <li key={content.id || cIndex} className="syllabus-lesson-item">
                            <span className="lesson-name">📹 {content.title}</span>
                            <span className={`lesson-lock-tag ${isEnrolled ? 'open' : 'locked'}`}>
                              {isEnrolled ? '🔓 Play' : '🔒 Lock'}
                            </span>
                          </li>
                        ))
                      ) : (
                        <li className="no-lessons-notice">No videos inside this module yet.</li>
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

      {/* Footer Enroll/Start Buttons */}
      <div className="course-card-footer-actions">
        {isEnrolled ? (
          <button 
            type="button"
            className="btn-action-start"
            onClick={() => navigate(`/learning/student/course-player/${course.id}`)}
          >
            Resume Learning ▶
          </button>
        ) : (
          <button 
            type="button"
            className="btn-action-enroll"
            onClick={() => navigate(`/learning/student/enroll/${course.id}`)}
          >
            Enroll in Course 🔒
          </button>
        )}
      </div>

    </div>
  );
};



export const AvailableCourses: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCatalogData = async () => {
      try {
        setLoading(true);
        const { data: { user }, error: authError } = await SupabaseClient.auth.getUser();
        if (authError || !user) {
          setError("User session missing. Please login again.");
          return;
        }
        const currentEmployeeId = user.id;

        const [allCourses, enrolledIds] = await Promise.all([
          lmsService.fetchCourses(),
          lmsService.fetchEmployeeEnrollments(currentEmployeeId)
        ]);

        setCourses(allCourses || []);
        setEnrolledCourseIds(enrolledIds || []);
      } catch (err) {
        console.error("Error loading catalog:", err);
        setError("Failed to synchronize curriculum access logs.");
      } finally {
        setLoading(false);
      }
    };

    loadCatalogData();
  }, []);

  const filteredCourses = courses.filter((course) => {
    const matchesTitle = course.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = course.category?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTitle || matchesCategory;
  });

  if (loading) return <div className="catalog-loading">Verifying Course Access...</div>;
  if (error) return <div className="catalog-error">⚠️ {error}</div>;

  return (
    <div className="courses-catalog-container">
      
      {/* Control Panel / Search Header */}
      <div className="catalog-control-panel">
        <div className="panel-left">
          <h2>Available Training Curriculums</h2>
          <p>Explore, search, and preview course contents before enrolling.</p>
        </div>
        
        <div className="panel-right search-box-wrapper">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Search by course title or category..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="catalog-search-input"
          />
          {searchTerm && (
            <button type="button" className="clear-search-btn" onClick={() => setSearchTerm('')}>✕</button>
          )}
        </div>
      </div>

      {/* Course Cards Grid Layout */}
      <div className="courses-grid-layout">
        {filteredCourses.length === 0 ? (
          <div className="empty-catalog-notice">
            <p>🔍 No courses found matching "{searchTerm}"</p>
          </div>
        ) : (
          filteredCourses.map((course) => {
            // Check enrollment logic dynamically
            const isEnrolled = enrolledCourseIds.includes(course.id);

            //  Call isolated component for clean, un-entangled state handling
            return (
              <CourseCard 
                key={course.id} 
                course={course} 
                isEnrolled={isEnrolled} 
                navigate={navigate} 
              />
            );
          })
        )}
      </div>
    </div>
  );
};