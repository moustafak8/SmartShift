import Landingpage from "./pages/Landingpage";
import { Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/Loginpage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleBasedRoute } from "./components/RoleBasedRoute";
import { Dashboard as EmployeeDashboard } from "./pages/Employee/Dashboard";
import { Dashboard as ManagerDashboard } from "./pages/Manager/Dashboard";
import { Wellness } from "./pages/Employee/Wellness";
import { Score } from "./pages/Employee/Score";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Landingpage />} />
      <Route
        path="/employee/dashboard"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={["employee"]}>
              <EmployeeDashboard />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/wellness"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={["employee"]}>
              <Wellness />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/score"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={["employee"]}>
              <Score />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/dashboard"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={["manager"]}>
              <ManagerDashboard />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
