import Landingpage from "./pages/Landingpage";
import { Route, Routes, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/Loginpage";
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Landingpage />} />
    </Routes>
  );
}
