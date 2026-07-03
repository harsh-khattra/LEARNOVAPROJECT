import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { CourseDashboardPage } from '../pages/CourseDashboardPage';
import { ManageContentPage } from '../pages/ManageContentPage';
import { CoursePlayerPage } from '../pages/CoursePlayerPage';
import { AdminApprovalDesk } from '../pages/AdminApproval';
import { LandingPage } from '../pages/LandingPage';
import { AssignmentDashboard } from '../pages/AssignmentDashboard';

import { QuizComponent } from '../pages/QuizComponent';

function LmsRoutes() {
  return (
    <Routes>
      <Route path="/lms/dashboard" element={<CourseDashboardPage />} />
      
   <Route path="student/landingPage" element={<LandingPage />} />

       <Route
              path="student/landingPage"
              element={<LandingPage />}
            />
    <Route
           path="student/assignments"
           element={<AssignmentDashboard />}
         />
git  c8d73be5ca153c69a548ac08994a3bd6bf56d4b6
      <Route path="/lms/managecontent/:id" element={<ManageContentPage />} />
    <Route path="/course-player/:id" element={<CoursePlayerPage />} />
    <Route path="admin/approval-desk" element={<AdminApprovalDesk />} />
     <Route path = "student/assignments" element= {<AssignmentDashboard />} />
      <Route path = "/student/assignments/:contentId" element= {<QuizComponent/>} />
    </Routes>
  );
}

export default LmsRoutes;