import { Navigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

interface Props {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: Props) => {
  const { isAuth, loading } = useAuth();

  if (loading) return <h1>Loading...</h1>;

  return isAuth ? <>{children}</> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;