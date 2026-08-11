import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lmsService } from '../services/lmsService';
import type { Course } from '../types/lms';
import { CURRENT_USER, formatCoursePrice, getStatusBadgeStyles } from '../utils/lmsShared';
import './courseDashboard.css';
import { SupabaseClient } from '../../../Helper/Supabase';
import Loader2 from '../../Header/Loader2';

export const CourseDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Marketing');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formPlaylistUrl, setFormPlaylistUrl] = useState(''); // NEW: Playlist URL State
  const [submitting, setSubmitting] = useState(false);

  const isTeacher = CURRENT_USER.role === 'teacher' || CURRENT_USER.role === 'admin' || CURRENT_USER.role === 'employee';

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await SupabaseClient.auth.getUser();

      if (user) {
        setUserId(user.id);
      }
      
      const data = await lmsService.fetchAllCourses();
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

    if (!userId) {
      alert("User authentication lost. Please log in again.");
      return;
    }

    try {
      setSubmitting(true);

      // Extract clean playlist ID if a full YouTube URL is provided
      let cleanPlaylistId = formPlaylistUrl.trim();
      if (cleanPlaylistId.includes('list=')) {
        cleanPlaylistId = cleanPlaylistId.split('list=')[1].split('&')[0];
      }

      await lmsService.createCourse(
        {
          title: formTitle,
          description: formDescription,
          category: formCategory,
          thumbnail_file: formFile,
          youtube_playlist_id: cleanPlaylistId || undefined
        },
        userId
      );

      // Reset Form State
      setFormTitle('');
      setFormDescription('');
      setFormCategory('Marketing');
      setFormFile(null);
      setFormPlaylistUrl('');
      setIsModalOpen(false);
      
      loadDashboardData();
    } catch (err) {
      console.error("Course creation error:", err);
      alert('Error creating your course canvas.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishCourseClick = async (courseId: string) => {
    const confirmPublish = window.confirm("All modules will go for approval to admin.");
    if (!confirmPublish) return;

    try {
      await lmsService.publishCourseAndSubmitAllVideos(courseId);
      alert("Course Status Updated! Internal videos are now pending with Admin.");
      loadDashboardData();
    } catch (error) {
      console.error("Publishing failed:", error);
      alert("Error publishing course.");
    }
  };

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
    if (window.confirm('Delete this course blueprint and all associated items?')) {
      try {
        await lmsService.deleteCourse(id);
        loadDashboardData();
      } catch (err) {
        alert('Failed to delete course record.');
      }
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    }

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
    };
  }, [isModalOpen]);

  if (loading) {
    return <Loader2 />;
  }

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

        {/* CLEAN UNIFORM GRID */}
        <div className="course-grid">
          {filteredCourses.length === 0 ? (
            <div className="empty-state">No courses found matching your criteria.</div>
          ) : (
            filteredCourses.map((course) => {
              const badgeStyle = getStatusBadgeStyles(course.status);
              return (
                <div key={course.id} className="modern-course-card">
                  
                  {/* Thumbnail Layer */}
                  <div className="card-thumbnail-wrapper">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} className="card-img" />
                    ) : (
                      <div className="no-image-placeholder">No Image Attached</div>
                    )}
                    
                    <span className="badge-price">
                      {formatCoursePrice(course.category)}
                    </span>

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

              {/* YouTube Playlist URL or ID Field */}
              <div className="form-group">
                <label style={{ color: '#2563eb', fontWeight: '600' }}>
                  YouTube Playlist Link / ID (Optional)
                </label>
                <input 
                  type="text" 
                  placeholder="https://www.youtube.com/playlist?list=PL..." 
                  value={formPlaylistUrl}
                  onChange={(e) => setFormPlaylistUrl(e.target.value)}
                />
                <small style={{ color: '#6b7280', fontSize: '12px' }}>
                  Paste a full YouTube playlist URL or ID to attach subject videos to this course.
                </small>
              </div>

              <div className="form-group">
                <label>Course Description</label>
                <textarea 
                  rows={3} 
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