import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lmsService } from '../services/lmsService';
import type { Course, CourseStatus } from '../types/lms';
import { CURRENT_USER, formatCoursePrice, getStatusBadgeStyles } from '../utils/lmsShared';
import './courseDashboard.css';

export const CourseDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Marketing');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isTeacher = CURRENT_USER.role === 'teacher' || CURRENT_USER.role === 'admin' || CURRENT_USER.role === 'employee';

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      let data: Course[] = [];
      
      if (isTeacher) {
        data = await lmsService.fetchTeacherCourses(CURRENT_USER.id);
      } else {
        data = await lmsService.fetchCourses('all'); 
      }
      setCourses(data);
    } catch (err) {
      console.error("Error loading courses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return alert('Please enter a course title.');

    try {
      setSubmitting(true);
      await lmsService.createCourse(
        {
          title: formTitle,
          description: formDescription,
          category: formCategory,
          thumbnail_file: formFile
        },
        CURRENT_USER.id
      );
      
      setFormTitle('');
      setFormDescription('');
      setFormCategory('Marketing');
      setFormFile(null);
      setIsModalOpen(false);
      
      loadDashboardData();
    } catch (err) {
      alert('Error creating your course canvas.');
    } finally {
      setSubmitting(false);
    }
  };

  // 🚀 BULK PUBLISH: Jab course ko publish karenge toh internal videos automatic sync hongi
  const handlePublishCourseClick = async (courseId: string) => {
    const confirmPublish = window.confirm(
      "all modules will go for approval to admin."
    );
    
    if (!confirmPublish) return;

    try {
      await lmsService.publishCourseAndSubmitAllVideos(courseId);
      alert("Course Status Updated! Internal videos are now pending with Admin.");
      loadDashboardData(); // UI refresh
    } catch (error) {
      console.error("Publishing failed:", error);
      alert("Course publish karne me koi dikkat aayi.");
    }
  };

  // ⚡ DRAFT TOGGLE: Agar published se wapas draft par lekar jaana ho
  const handleRevertToDraft = async (id: string) => {
    try {
      await lmsService.updateCourseStatus(id, 'draft');
      alert("Course reverted back to Draft mode.");
      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm('Delete this course blueprint?')) {
      try {
        await lmsService.deleteCourse(id);
        loadDashboardData();
      } catch (err) {
        alert('Failed to drop table row item.');
      }
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading Workspace...</div>;

  return (
    <div className="dashboard-container">
      
      {/* Hero Header Banner */}
      <div className="hero-banner">
        <div className="hero-body">
          <h1 className="hero-title">{isTeacher ? "Teacher Management Dashboard" : "Student Study Terminal"}</h1>
          <p className="hero-subtitle">
            {isTeacher 
              ? "Manage your course catalogs, monitor analytics, and architect advanced educational modules."
              : "Browse courses created by your organisation's experts. Learn a new skill at your own pace."}
          </p>
          <br/>
          <div className="search-container">
            <input 
              type="text"
              className="search-input"
              placeholder="Search active catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Workspace Container */}
      <main className="main-content">
        <div className="workspace-header">
          <h2 className="workspace-title">
            {isTeacher ? "Your Created Courses" : "Available Academic Programs"}
          </h2>
          
          {isTeacher && (
            <button onClick={() => setIsModalOpen(true)} className="btn-create">
              + Create New Course
            </button>
          )}
        </div>

        {/* 📦 CLEAN UNIFORM GRID */}
        <div className="course-grid">
          {filteredCourses.length === 0 ? (
            <div className="empty-state">No courses found matching your criteria.</div>
          ) : (
            filteredCourses.map((course) => {
              const badgeStyle = getStatusBadgeStyles(course.status);
              return (
                <div key={course.id} className="modern-course-card">
                  
                  {/* Thumbnail Layer with Absolute Badges */}
                  <div className="card-thumbnail-wrapper">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} className="card-img" />
                    ) : (
                      <div className="no-image-placeholder">No Image Attached</div>
                    )}
                    
                    {/* Price Tag (Top Left) */}
                    <span className="badge-price">
                      {formatCoursePrice(course.category)}
                    </span>

                    {/* Status Badge (Top Right - Visible only to Teachers) */}
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

                  {/* Text Content Body */}
                  <div className="card-body-content">
                    <h3 className="card-main-title">{course.title}</h3>
                    <p className="card-desc-summary">
                      {course.description || 'No course curriculum description summary initialized yet.'}
                    </p>
                  </div>

                  {/* Card Action Footer */}
                  <div className="card-footer-actions">
                    {isTeacher ? (
                      <>
                        <button
                          onClick={() => navigate(`/learning/lms/managecontent/${course.id}`)}
                          className="btn-manage-syllabus"
                        >
                          Manage Content & Syllabus
                        </button>
                        <div className="action-button-row">
                          {course.status === 'draft' ? (
                            <button 
                              onClick={() => handlePublishCourseClick(course.id)} 
                              className="btn-action-publish"
                            >
                              🚀 Publish Course
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleRevertToDraft(course.id)} 
                              className="btn-action-draft"
                            >
                              ⚡ Set to Draft
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteClick(course.id)} 
                            className="btn-action-delete"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={() => navigate(`/learning/student/course-player/${course.id}`)}
                        className="btn-student-start"
                      >
                        ▶ Start Learning & Watch
                      </button>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>
      </main>

      {/* --- CREATE COURSE MODAL --- */}
      {isModalOpen && isTeacher && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Create New Course Blueprint</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="modal-form">
              <div className="form-group">
                <label>Course Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Intro to Advanced Content Architecture" 
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Category Type</label>
                <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                  <option value="Marketing">Marketing</option>
                  <option value="Premium">Premium ($5.00)</option>
                  <option value="Development">Development</option>
                  <option value="Business">Business</option>
                  <option value="Skills">Skills</option>
                  <option value="Learning">Learning</option>
                </select>
              </div>

              <div className="form-group">
                <label>Course Description</label>
                <textarea 
                  rows={4} 
                  placeholder="Provide a detailed curriculum breakdown summary..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Thumbnail Cover Image</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setFormFile(e.target.files?.[0] || null)}
                />
              </div>

              <div className="modal-footer-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit-form" disabled={submitting}>
                  {submitting ? 'Uploading Assets...' : 'Save & Initialize'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};