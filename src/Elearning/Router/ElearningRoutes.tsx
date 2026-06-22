import React from 'react';
import { Routes, Route } from "react-router-dom";

import StudentDashboard from "../Student/Dashboard";
import Discussion from "../Student/Discussion";
import Certificates from "../Student/Certificate";

import TeacherDashboard from "../Teacher/Dashboard";
import TeacherCourses from "../Teacher/Courses";

import Analytics from "../Admin/Analytics";
import { ManageContentPage } from '../lms/pages/ManageContentPage';
import { CourseDashboardPage } from '../lms/pages/CourseDashboardPage';
import { CoursePlayerPage } from '../lms/pages/CoursePlayerPage';
import { AdminApprovalDesk } from '../lms/pages/AdminApproval';
import { AvailableCourses } from '../lms/pages/AvailableCourses';

const ElearningRoutes = () => {
  return (
    <Routes>
      {/* Student */}
      <Route path="student/dashboard" element={<StudentDashboard />} />
      <Route path="student/courses" element={<CourseDashboardPage />} />
      <Route path="student/discussion" element={<Discussion />} />
      <Route path="student/certificates" element={<Certificates />} />
      <Route path = "employee/courses" element = {< AvailableCourses />} />

      {/* Teacher */}
      <Route path="teacher/dashboard" element={<TeacherDashboard />} />
      <Route path="teacher/courses" element={<TeacherCourses />} />

      {/* Admin */}
      <Route path="admin/approval-desk" element={<AdminApprovalDesk />} />
      <Route path="admin/analytics" element={<Analytics />} />
    
      {/* LMS Core - FIXED: Added /:id parameter */}
      <Route path="/lms/dashboard" element={<CourseDashboardPage />} />
      <Route path="lms/managecontent/:id" element={<ManageContentPage />} />
      
       
       <Route path="/learning/course-player/:id" element={<CoursePlayerPage />} />
    </Routes>
  );
};

export default ElearningRoutes;