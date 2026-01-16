import Landingpage from "./pages/Landingpage";
import { Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/Loginpage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleBasedRoute } from "./components/RoleBasedRoute";
import { Dashboard as EmployeeDashboard } from "./pages/Employee/Dashboard";
import { Dashboard as ManagerDashboard } from "./pages/Manager/Dashboard";
import { Wellness } from "./pages/Employee/Wellness";
import { Score } from "./pages/Employee/Score";
import { Profile } from "./pages/Employee/Profile";
import { ToastProvider } from "./components/ui/Toast";
import { RAGQuery } from "./pages/Manager/RAGQuery";
import { TeamOverview } from "./pages/Manager/TeamOverview";
import { Shifts } from "./pages/Manager/Shifts";
import { TeamWellness } from "./pages/Manager/TeamWellness";
import { Roles } from "./hooks/types/Roles";

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Landingpage />} />
        <Route
          path="/employee/dashboard"
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={[Roles.EMPLOYEE]}>
                <EmployeeDashboard />
              </RoleBasedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/wellness"
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={[Roles.EMPLOYEE]}>
                <Wellness />
              </RoleBasedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/score"
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={[Roles.EMPLOYEE]}>
                <Score />
              </RoleBasedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/profile"
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={[Roles.EMPLOYEE]}>
                <Profile />
              </RoleBasedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/dashboard"
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={[Roles.MANAGER]}>
                <ManagerDashboard />
              </RoleBasedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/query"
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={[Roles.MANAGER]}>
                <RAGQuery />
              </RoleBasedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/team"
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={[Roles.MANAGER]}>
                <TeamOverview />
              </RoleBasedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/schedule"  
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={[Roles.MANAGER]}>
                <Shifts />
              </RoleBasedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/team-wellness"
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={[Roles.MANAGER]}>
                <TeamWellness />
              </RoleBasedRoute>
            </ProtectedRoute>
          }
        />
      </Routes>
    </ToastProvider>
  );
}
