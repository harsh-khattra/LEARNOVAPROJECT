import { Routes, Route } from "react-router-dom";

import { useAuth } from "../../Context/AuthContext";
import ProtectedRoute from "../ProtectedRoute";

import Discussion from "../Discussion/DiscussionModule";
import Certificates from "../../Progress/Certificate/Certificate";
import Unauthorized from "../Unauthorized";

import TeacherDashboard from "../Teacher/Dashboard";
import Analytics from "../Admin/Analytics";

import QuizPerformancePage from "../../Progress/Quiz/Quizperformance";
import CourseCompletion from "../../Progress/Coursecompletion/CourseCompletion";
import TimeSpentAnalytics from "../../Progress/Timespent/Timespent";

import EnrolledCourses from "../../Progress/Enrolled/Enrolledcourses";
import Downloadcert from "../../Progress/Certificate/Downloadcert";

import { LandingPage } from "../lms/pages/LandingPage";
// import { AssignmentDashboard } from "../lms/pages/AssignmentDashboard";
import { QuizComponent } from "../lms/pages/QuizComponent";

import { AssignmentDashboard } from '../lms/pages/AssignmentDashboard';

import { CourseDashboardPage } from "../lms/pages/CourseDashboardPage";
import { AvailableCourses } from "../lms/pages/AvailableCourses";
import { AdminApprovalDesk } from "../lms/pages/AdminApproval";
import { ManageContentPage } from "../lms/pages/ManageContentPage";
import { CoursePlayerPage } from "../lms/pages/CoursePlayerPage";





const ElearningRoutes = () => {
  const { permissions } = useAuth();
console.log("Permissions:", permissions);
console.log("viewEnrollments:", permissions.viewEnrollments);
  return (
    <Routes>
      {/* Unauthorized */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* ---------------- STUDENT ---------------- */}

      <Route
        path="student/landingPage"
        element={
          <ProtectedRoute allow={permissions.lmsDashboard}>
            <LandingPage />
          </ProtectedRoute>
        }
      />


      <Route
        path="teacher/courses"
        element={
          <ProtectedRoute allow={permissions.uploadCourses}>
            <CourseDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="student/courses"
        element={
          <ProtectedRoute allow={permissions.viewCourses}>
            <AvailableCourses />
          </ProtectedRoute>
        }
      />




      <Route
        path="student/assignments"
        element={
          <ProtectedRoute allow={permissions.viewAssignments}>
            <AssignmentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="student/assignments/:contentId"
        element={
          <ProtectedRoute allow={permissions.viewQuiz}>
            <QuizComponent />
          </ProtectedRoute>
        }
      />


      <Route
        path="student/discussion"
        element={
          <ProtectedRoute allow={permissions.viewForum}>
            <Discussion />
          </ProtectedRoute>
        }
      />


      <Route path="employee/courses"      element={<AvailableCourses />} />


      <Route
        path="student/certificates"
        element={
          <ProtectedRoute allow={permissions.viewCertificates}>
            <Certificates />
          </ProtectedRoute>
        }
      />

      <Route
        path="student/downloadcertificate/:certId"
        element={
          <ProtectedRoute allow={permissions.viewCertificates}>
            <Downloadcert />
          </ProtectedRoute>
        }
      />

      <Route
        path="student/quiz"
        element={
          <ProtectedRoute allow={permissions.viewQuiz}>
            <QuizPerformancePage />
          </ProtectedRoute>
        }
      
/>

      <Route
        path="student/completion"
        element={
          <ProtectedRoute allow={permissions.viewCompletion}>
            <CourseCompletion />
          </ProtectedRoute>
        }
      />


      {/* Student */}
      <Route path="student/landingPage" element={<LandingPage />} />
      <Route path="student/courses" element={<CourseDashboardPage />} />
      <Route path="student/discussion" element={<Discussion />} />
      <Route path="student/certificates" element={<Certificates />} />
      <Route path = "employee/courses" element = {< AvailableCourses />} />
      <Route path = "student/assignments" element= {<AssignmentDashboard />} />


      <Route
        path="student/timespent"
        element={
          <ProtectedRoute allow={permissions.viewTimespent}>
            <TimeSpentAnalytics />
          </ProtectedRoute>
        }
      />


      <Route
        path="student/enroll"
        element={
          <ProtectedRoute allow={permissions.viewEnrollments}>
            <EnrolledCourses />
          </ProtectedRoute>
        }
      />


      <Route path="lms/managecontent/:id" element={<ManageContentPage />} />
      <Route path="learning/course-player/:id" element={<CoursePlayerPage />} />
      <Route path="/lms/dashboard"        element={<CourseDashboardPage />} />
      <Route path="/course-player/:id"    element={<CoursePlayerPage />} />


      {/* ---------------- TEACHER ---------------- */}

      <Route
        path="teacher/dashboard"
        element={
          <ProtectedRoute allow={permissions.lmsDashboard}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="lms/managecontent/:id"
        element={
          <ProtectedRoute allow={permissions.uploadCourses}>
            <ManageContentPage />
          </ProtectedRoute>
        }
      />

      {/* ---------------- ADMIN ---------------- */}

      <Route
        path="admin/approval-desk"
        element={
          <ProtectedRoute allow={permissions.adminPanel}>
            <AdminApprovalDesk />
          </ProtectedRoute>
        }
      />

      <Route
        path="admin/analytics"
        element={
          <ProtectedRoute allow={permissions.adminPanel}>
            <Analytics />
          </ProtectedRoute>
        }
      />

      {/* ---------------- LMS ---------------- */}

      <Route
        path="lms/dashboard"
        element={
          <ProtectedRoute allow={permissions.lmsDashboard}>
            <CourseDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Course Player (Public after enrollment logic) */}

      <Route
        path="learning/course-player/:id"
        element={<CoursePlayerPage />}
      />

      <Route
        path="course-player/:id"
        element={<CoursePlayerPage />}
      />
    </Routes>
  );
};

export default ElearningRoutes;