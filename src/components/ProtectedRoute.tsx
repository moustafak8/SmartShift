import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/context/AuthContext";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { Loader2 } from "lucide-react";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const shouldFetchUser = !user;
  useCurrentUser(shouldFetchUser);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#2563EB] mx-auto mb-4" />
          <p className="text-[#6B7280] text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
