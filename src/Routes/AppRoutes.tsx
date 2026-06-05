import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

import HrmsLayout from "../Hrms/Layout/HrmsLayout";
import LearningLayout from "../Elearning/Layout/ElearningLayout";
import LandingPage from "../Landingpg/LandingPage";
import Login from "../Hrms/Authentication/Login";

import HrmsRoutes from "../Hrms/Router/HrmsRoutes";
import ElearningRoutes from "../Elearning/Router/ElearningRoutes";
// import { ProtectedRoute } from "../Helper/ProtectedRoute";
import type { Locale } from "../App";
import type { Dispatch, SetStateAction } from "react";
interface AppRoutesProps {
  locale: Locale;
  setLocale: Dispatch<SetStateAction<Locale>>;
}
//navigate to / if no user logout
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuth } = useAuth();
  return isAuth ? <>{children}</> : <Navigate to="/" replace />;
};

const AppRoutes = ({ locale, setLocale }: AppRoutesProps) => {
  return (
    <Routes>

      {/* Public — no layout */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />  {/* just Login, not all HrmsRoutes */}

      {/* HRMS zone — layout wraps content via <Outlet /> */}
      <Route
        path="/hrms"
        element={
          <ProtectedRoute>
            <HrmsLayout locale={locale} setLocale={setLocale}/>
          </ProtectedRoute>
        }
      >
        <Route path="*" element={<HrmsRoutes />} />
      </Route>

      {/* eLearning zone */}
      <Route
        path="/learning"
        element={
          <ProtectedRoute>
            <LearningLayout />
          </ProtectedRoute>
        }
      >
        <Route path="*" element={<ElearningRoutes />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
};

export default AppRoutes;
// import { Routes, Route } from "react-router-dom";

// import HrmsLayout from "../Hrms/Layout/HrmsLayout";
// import LearningLayout from "../Elearning/Layout/ElearningLayout";

// import HrmsRoutes from "../Hrms/Router/HrmsRoutes";
// import ElearningRoutes from "../Elearning/Router/ElearningRoutes";

// const AppRoutes = () => {
//   return (
//     <Routes>
//       <Route path="/hrms/*" element={<HrmsLayout />}>
//         <Route path="*" element={<HrmsRoutes />} />
//       </Route>

//       <Route path="/learning/*" element={<LearningLayout />}>
//         <Route path="*" element={<ElearningRoutes />} />
//       </Route>

//       <Route path="*" element={<HrmsRoutes />} />
//     </Routes>
//   );
// };

// export default AppRoutes;