import { Routes, Route } from "react-router-dom";

import StudentDashboard from "../Student/Dashboard";
import MyCourses from "../Student/MyCourses";
import Discussion from "../Student/Discussion";
import Certificates from "../Student/Certificate";
// import { ShareModal } from './ShareModal';

import TeacherDashboard from "../Teacher/Dashboard";
import TeacherCourses from "../Teacher/Courses";

import AdminDashboard from "../Admin/Dashboard";
import Analytics from "../Admin/Analytics";
import CourseCompletion from "../../Progress/Completion/CourseCompletion";
import QuizPerformancePage from "../../Progress/Quiz/QuizPerformancePage";
import Timespent from "../../Progress/Time/Timespent";
import Downloadcert from "../../Progress/Completion/Downloadcert";
import CourseEnrollment from "../../Progress/Courseenroll/Courseenrollment ";
const ElearningRoutes = () => {
  return (
    <Routes>
      {/* Student */}

    <Route
  path="student/dashboard"
  element={<StudentDashboard />}
/>

<Route
  path="student/coursecompletion"
  element={<CourseCompletion />}
/>

<Route
  path="student/quizperformance"
  element={<QuizPerformancePage />}
/>

<Route
  path="student/certificate"
  element={<Downloadcert />}
/>


<Route
  path="student/timespent"
  element={<Timespent />}
/>
<Route
  path="student/courseenrollment"
  element={<CourseEnrollment/>}
/>




     
      <Route
        path="student/courses"
        element={<MyCourses />}
      />

      <Route
        path="student/discussion"
        element={<Discussion />}
      />

      <Route
        path="student/certificates"
        element={<Certificates />}
      />

      {/* Teacher */}

      <Route
        path="teacher/dashboard"
        element={<TeacherDashboard />}
      />

      <Route
        path="teacher/courses"
        element={<TeacherCourses />}
      />

      {/* Admin */}

      <Route
        path="admin/dashboard"
        element={<AdminDashboard />}
      />

      <Route
        path="admin/analytics"
        element={<Analytics />}
      />
    </Routes>
  );
};

export default ElearningRoutes;