import { Navigate, Route, Routes } from "react-router-dom";
import PageLoader from "../UI/PageLoader";
import { useAuth } from "../../Context/AuthContext";
import { ProtectedRoute, PublicRoute } from "../../Helper/ProtectedRoute";
import Login from "../Authentication/Login";
import SignUp from "../Authentication/SignUp";
import Dashboard from "../Dashboard/Dashboard";
import Leave from "../leave/Leave";
import ShowForm from "../leave/ShowForm";
import ApproveLeave from "../leave/ApproveLeave";
import ShowTable from "../leave/ShowTable";
import Management from "../Mangement/Management";
import Privacy from "../../FacebookrequiredPages/Privacy";
import DataDeletion from "../../FacebookrequiredPages/DataDeletion";
import TermsofService from "../../FacebookrequiredPages/TermsofService";
import Discussion from "../Discussion/Discussion";

const HrmsRoutes = () => {
  const { loading, isAuth, permissions } = useAuth();

  return (
    <Routes>

      {/* Default redirect — now points to /hrms/... */}
      <Route
        path="/"
        element={
          loading ? (
            <PageLoader />
          ) : !isAuth ? (
            <Navigate to="/login" replace />
          ) : permissions.dashboard ? (
            <Navigate to="/hrms/dashboard" replace />   
          ) : permissions.management ? (
            <Navigate to="/hrms/management" replace />  
          ) : (
            <Navigate to="/hrms/leave" replace />       
          )
        }
      />

      {/* All paths are now relative — no leading slash */}
      <Route
        path="signup"                                   
        element={
          <ProtectedRoute allowed={permissions.management}>
            <SignUp />
          </ProtectedRoute>
        }
      />
      <Route
        path="dashboard"                               
        element={
          <ProtectedRoute allowed={permissions.dashboard}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="leave"                                 
        element={
          <ProtectedRoute allowed={true}>
            <Leave />
          </ProtectedRoute>
        }
      />
      <Route
        path="applyleave"                              
        element={
          <ProtectedRoute allowed={permissions.applyLeave}>
            <ShowForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="approveleave"                            
        element={
          <ProtectedRoute allowed={permissions.approveLeave}>
            <ApproveLeave />
          </ProtectedRoute>
        }
      />
      <Route
        path="leavetable"                              
        element={
          <ProtectedRoute allowed={permissions.leaveTable}>
            <ShowTable />
          </ProtectedRoute>
        }
      />
      <Route
        path="management"                              
        element={
          <ProtectedRoute allowed={permissions.management}>
            <Management />
          </ProtectedRoute>
        }
      />
      <Route
        path="discussion"                              
        element={
          <ProtectedRoute allowed={permissions.discussion}>
            <Discussion />
          </ProtectedRoute>
        }
      />

      {/* Facebook pages — keep as relative too */}
      <Route path="datadeletion" element={<DataDeletion />} />
      <Route path="privacypolicy" element={<Privacy />} />
      <Route path="termsofservice" element={<TermsofService />} />

    </Routes>
  );
};

export default HrmsRoutes;

// import { Navigate, Route, Routes } from 'react-router-dom'
// import PageLoader from '../UI/PageLoader'
// import { useAuth } from '../../Context/AuthContext'
// import { ProtectedRoute, PublicRoute } from '../../Helper/ProtectedRoute'
// import Login from '../Authentication/Login'
// import SignUp from '../Authentication/SignUp'
// import Dashboard from '../Dashboard/Dashboard'
// import Leave from '../leave/Leave'
// import ShowForm from '../leave/ShowForm'
// import ApproveLeave from '../leave/ApproveLeave'
// import ShowTable from '../leave/ShowTable'
// import Management from '../Mangement/Management'
// import Privacy from "../../FacebookrequiredPages/Privacy";
// import DataDeletion from '../../FacebookrequiredPages/DataDeletion'
// import TermsofService from '../../FacebookrequiredPages/TermsofService'
// import Discussion from '../Discussion/Discussion'


// const HrmsRoutes = () => {
//   const { loading, isAuth, permissions } = useAuth();
//   return (
//     <>
//       <Routes>        
//         <Route
//           path="/"
//           element={
//             loading ? (
//               <PageLoader />
//             ) : !isAuth ? (
//               <Navigate to="/login" replace />
//             ) : permissions.dashboard ? (
//               <Navigate to="/dashboard" replace />
//             ) : permissions.management ? (
//               <Navigate to="/management" replace />
//             ) : (
//               <Navigate to="/leave" replace />
//             )
//           }
//         />
//         <Route
//           path="/login"
//           element={
//             <PublicRoute>
//               <Login />
//             </PublicRoute>
//           }
//         />
//         <Route
//           path="/signup"
//           element={
//             <ProtectedRoute allowed={permissions.management}>
//               <SignUp />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/dashboard"
//           element={
//             <ProtectedRoute allowed={permissions.dashboard}>
//               <Dashboard />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/leave"
//           element={
//             <ProtectedRoute allowed={true}>
//               <Leave />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/applyleave"
//           element={
//             <ProtectedRoute allowed={permissions.applyLeave}>
//               <ShowForm />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/approveleave"
//           element={
//             <ProtectedRoute allowed={permissions.approveLeave}>
//               <ApproveLeave />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/leavetable"
//           element={
//             <ProtectedRoute allowed={permissions.leaveTable}>
//               <ShowTable />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/management"
//           element={
//             <ProtectedRoute allowed={permissions.management}>
//               <Management />
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path="/discussion"
//           element={
//             <ProtectedRoute allowed={permissions.discussion}>
//               <Discussion />
//             </ProtectedRoute>
//           }
//         /> 

//         <Route
//           path="/datadeletion"
//           element={
//             <DataDeletion />
//           }
//         />
//         <Route
//           path="/privacypolicy"
//           element={
//             <Privacy />
//           }
//         />
//         <Route
//           path="/termsofservice"
//           element={
//             <TermsofService />
//           }
//         />
//       </Routes>
//     </>
//   )
// }

// export default HrmsRoutes