import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/context/AuthContext";

type RoleBasedRouteProps = {
  children: React.ReactNode;
  allowedRoles: ("manager" | "employee")[];
};

export const RoleBasedRoute = ({ children, allowedRoles }: RoleBasedRouteProps) => {
  const { user, getUserRole } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = getUserRole();

  if (!userRole || !allowedRoles.includes(userRole)) {
    if (userRole === "manager") {
      return <Navigate to="/manager/dashboard" replace />;
    } else if (userRole === "employee") {
      return <Navigate to="/employee/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
