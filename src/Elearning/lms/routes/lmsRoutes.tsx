import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { CourseDashboardPage } from '../pages/CourseDashboardPage';
import { ManageContentPage } from '../pages/ManageContentPage';
import { CoursePlayerPage } from '../pages/CoursePlayerPage';
import { AdminApprovalDesk } from '../pages/AdminApproval';
function LmsRoutes() {
  return (
    <Routes>
      <Route path="/lms/dashboard" element={<CourseDashboardPage />} />
      
   
      <Route path="/lms/managecontent/:id" element={<ManageContentPage />} />
    <Route path="/course-player/:id" element={<CoursePlayerPage />} />
    <Route path="admin/approval-desk" element={<AdminApprovalDesk />} />
    </Routes>
  );
}

export default LmsRoutes;