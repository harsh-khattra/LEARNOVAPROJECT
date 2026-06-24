import { Routes, Route } from "react-router-dom";

import StudentDashboard from "../Student/Dashboard";
// import MyCourses from "../Student/MyCourses";
import Discussion from "../Student/Discussion";
import Certificates from "../Student/Certificate";

import TeacherDashboard from "../Teacher/Dashboard";
import TeacherCourses from "../Teacher/Courses";

import AdminDashboard from "../Admin/Dashboard";
import Analytics from "../Admin/Analytics";
import QuizPerformancePage from "../../Progress/Quiz/Quizperformance";
import CourseCompletion from "../../Progress/Coursecompletion/Completion";
import TimeSpentAnalytics from "../../Progress/Timespent/Timespent";
import { CourseDashboardPage } from "../lms/pages/CourseDashboardPage";
import { AvailableCourses } from "../lms/pages/AvailableCourses";
import { AdminApprovalDesk } from "../lms/pages/AdminApproval";
import { ManageContentPage } from "../lms/pages/ManageContentPage";
import { CoursePlayerPage } from "../lms/pages/CoursePlayerPage";
import Enrollment from "../../Progress/Enrollment/enroll";
import EnrolledCourses from "../../Progress/Enrolled/Enrolledcourses";


const ElearningRoutes = () => {
  return (
    <Routes>

{/* Progress */}

 <Route
        path="student/quiz"
        element={<QuizPerformancePage />}
      />
 <Route
        path="student/completion"
        element={<CourseCompletion />}
      />
 <Route
        path="student/timespent"
        element={<TimeSpentAnalytics />}
      />
 <Route
        path="student/enroll"
        element={<EnrolledCourses />}
      />
      {/* Student */}

      <Route
        path="student/dashboard"
        element={<StudentDashboard />}
      />

      <Route
        path="student/courses"
        element={<CourseDashboardPage />}
      />

      <Route
        path="student/discussion"
        element={<Discussion />}
      />

      <Route
        path="student/certificates"
        element={<Certificates />}
      />
      
<Route
        path="student/courses"
        element={<Certificates />}
      />
        <Route
        path="employee/courses"
        element={<AvailableCourses/>}
      />

      {/* Teacher */}

      <Route
        path="teacher/dashboard"
        element={<TeacherDashboard />}
      />
  {/* <Route
        path="teacher/courses"
        element={<TeacherCourses/>}
      /> */}

    
      {/* Admin */}

      <Route
        path="admin/approval-desk"
        element={<AdminApprovalDesk />}
      />

      <Route
        path="admin/analytics"
        element={<Analytics />}

      />

        <Route
        path="lms/dashboard"
        element={<CourseDashboardPage/>}
      />
        <Route
        path="lms/managecontent/:id"
        element={<ManageContentPage/>}
      />
  <Route
        path="learning/course-player/:id"
        element={<CoursePlayerPage/>}
      />


    </Routes>
  );
};

export default ElearningRoutes;