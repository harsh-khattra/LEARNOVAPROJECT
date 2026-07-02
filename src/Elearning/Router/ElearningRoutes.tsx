import { Routes, Route } from "react-router-dom";

import StudentDashboard from "../Student/Dashboard";
import Discussion from "../Student/Discussion";
import Certificates from "../../Progress/Certificate/Certificate";

import TeacherDashboard from "../Teacher/Dashboard";

//  REMOVED: import  ← this was causing the parse error
// import AdminDashboard from "../Admin/Dashboard";
import Analytics from "../Admin/Analytics";

import QuizPerformancePage from "../../Progress/Quiz/Quizperformance";
import CourseCompletion from "../../Progress/Coursecompletion/CourseCompletion";
import TimeSpentAnalytics from "../../Progress/Timespent/Timespent";
import { CourseDashboardPage } from "../lms/pages/CourseDashboardPage";
import { AvailableCourses } from "../lms/pages/AvailableCourses";
import { AdminApprovalDesk } from "../lms/pages/AdminApproval";
import { ManageContentPage } from "../lms/pages/ManageContentPage";
import { CoursePlayerPage } from "../lms/pages/CoursePlayerPage";
import EnrolledCourses from "../../Progress/Enrolled/Enrolledcourses";
import { LandingPage } from "../lms/pages/LandingPage";
import { AssignmentDashboard } from "../lms/pages/AssignmentDashboard";
import Downloadcert from "../../Progress/Certificate/Downloadcert";

const ElearningRoutes = () => {
  return (
    <Routes>

      {/* ── Progress ── */}
      <Route path="student/quiz"        element={<QuizPerformancePage />} />
      <Route path="student/completion"  element={<CourseCompletion />} />
      <Route path="student/timespent"   element={<TimeSpentAnalytics />} />
      <Route path="student/enroll"      element={<EnrolledCourses />} />

      {/* ── Student ── */}
      <Route path="student/landingPage"   element={<LandingPage />} />
      <Route path="student/assignments"   element={<AssignmentDashboard />} />
      <Route path="student/courses"       element={<CourseDashboardPage />} />
      <Route path="student/discussion"    element={<Discussion />} />

      {/* Certificate list page (tabs: Enrolled / Active / Completed / Certificates) */}
      <Route path="student/certificates"  element={<Certificates />} />

      {/* Certificate detail/download page — opened when "View certificate" is clicked */}
      <Route
        path="student/downloadcertificate/:certId"
        element={<Downloadcert />}
      />

      <Route path="employee/courses"      element={<AvailableCourses />} />

      {/* ── Teacher ── */}
      <Route path="teacher/dashboard"     element={<TeacherDashboard />} />

      {/* ── Admin ── */}
      <Route path="admin/approval-desk"   element={<AdminApprovalDesk />} />
      <Route path="admin/analytics"       element={<Analytics />} />

      {/* ── LMS ── */}
      <Route path="lms/dashboard"         element={<CourseDashboardPage />} />
      <Route path="lms/managecontent/:id" element={<ManageContentPage />} />
      <Route path="learning/course-player/:id" element={<CoursePlayerPage />} />
      <Route path="/lms/dashboard"        element={<CourseDashboardPage />} />
      <Route path="/course-player/:id"    element={<CoursePlayerPage />} />

    </Routes>
  );
};

export default ElearningRoutes;