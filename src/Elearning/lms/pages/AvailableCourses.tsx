import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lmsService } from '../services/lmsService';
import { SupabaseClient } from '../../../Helper/Supabase';
import type { Course } from '../types/lms';
import { CourseCard } from '../components/CourseCard';


import Enrollment from '../../../Progress/Enrollment/Enroll'; 



import './courseDashboard.css';

export const AvailableCourses: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);

  useEffect(() => {
    const loadStudentCatalog = async () => {
      try {
        setLoading(true);
        const data = await lmsService.fetchCourses('all');
        const approvedCourses = data.filter((course) => course.status === 'published');
        setCourses(approvedCourses);

        // Logged-in user ke existing enrollments fetch karo
        const {
          data: { user },
        } = await SupabaseClient.auth.getUser();

        if (user) {
          const enrolledIds = await lmsService.fetchEmployeeEnrollments(user.id);
          setEnrolledCourseIds(enrolledIds);
        }
      } catch (err) {
        console.error("Error loading student course catalog:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStudentCatalog();
  }, []);

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartLearning = (id: string) => {
    const course = courses.find((c) => c.id === id) || null;
    setSelectedCourse(course);
    setShowEnrollModal(true);
  };

  const closeEnrollModal = () => {
    setShowEnrollModal(false);
    setSelectedCourse(null);
  };

  const handleEnrolledSuccess = (courseId: string) => {
    setEnrolledCourseIds((prev) =>
      prev.includes(courseId) ? prev : [...prev, courseId]
    );
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Opening Student Study Terminal...</div>;

  return (
    <div className="dashboard-container">
      <div className="hero-banner student-theme">
        <div className="hero-body">
          <h1 className="hero-title">🎓 Student Study Terminal</h1>
          <p className="hero-subtitle">
            Browse corporate academic courses approved by your organization's experts. Learn at your own pace.
          </p>
          <br/>
          <div className="search-container">
            <input 
              type="text"
              className="search-input"
              placeholder="Search from available courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <main className="main-content">
        <div className="workspace-header">
          <h2 className="workspace-title">Available Academic Programs</h2>
        </div>

        <div className="course-grid">
          {filteredCourses.length === 0 ? (
            <div className="empty-state">No approved courses match your search criteria right now.</div>
          ) : (
            filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                isTeacher={false} 
                isEnrolled={enrolledCourseIds.includes(course.id)}
                onManageContent={(id: string) => {}} 
                onPublish={(id: string) => {}}
                onRevertToDraft={(id: string) => {}}
                onDelete={(id: string) => {}}
                onStartLearning={handleStartLearning}
              />
            ))
          )}
        </div>
      </main>

      {/* Enrollment Modal */}
      {showEnrollModal && selectedCourse && (
        <div className="modal-overlay" onClick={closeEnrollModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <Enrollment
              course={selectedCourse}
              onClose={closeEnrollModal}
              onEnrolled={handleEnrolledSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
};