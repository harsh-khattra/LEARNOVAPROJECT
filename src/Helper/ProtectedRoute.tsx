import { Navigate} from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import PageLoader from "../Hrms/UI/PageLoader";


interface ProtectedRouteProps{
  children:React.ReactNode;
  allowed:boolean;
}

export function ProtectedRoute({children , allowed}:ProtectedRouteProps){
  const {isAuth , loading , permissions} = useAuth();


  if(loading){
    return <PageLoader/>;
  }
  if(!isAuth){
    return <Navigate to="/login" replace/>
  }
  if(!allowed){
    if(permissions.dashboard)return <Navigate to="/hrms/dashboard" replace/>;
    if(permissions.management)return <Navigate to="/hrms/management" replace/>;
    return <Navigate to="/hrms/leave"replace/>;
  }
  return children
}


interface PublicRouteProps{
  children:React.ReactNode;
}

export function PublicRoute({children}:PublicRouteProps){
  const {isAuth , loading, permissions} = useAuth();

  if(loading){
    return <PageLoader/>;
  }
  if(isAuth){
    if(permissions.dashboard)return<Navigate to="/hrms/dashboard" replace/>;
    if(permissions.management)return <Navigate to="/hrms/management" replace />;
    return <Navigate to="/hrms/leave" replace/>;
  }
  return children;
}