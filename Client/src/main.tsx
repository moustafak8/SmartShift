import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/tailwind.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { Providers } from "./providers";
import { AuthProvider } from "./hooks/context/AuthContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
      <Providers>
        <App />
      </Providers>
    </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
