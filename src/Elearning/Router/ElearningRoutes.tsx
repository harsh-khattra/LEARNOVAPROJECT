import { Routes, Route } from "react-router-dom";

import StudentDashboard from "../Student/Dashboard";
import MyCourses from "../Student/MyCourses";
import Discussion from "../Student/Discussion";
import Certificates from "../Student/Certificate";

import TeacherDashboard from "../Teacher/Dashboard";
import TeacherCourses from "../Teacher/Courses";

import AdminDashboard from "../Admin/Dashboard";
import Analytics from "../Admin/Analytics";

const ElearningRoutes = () => {
  return (
    <Routes>
      {/* Student */}

      <Route
        path="student/dashboard"
        element={<StudentDashboard />}
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