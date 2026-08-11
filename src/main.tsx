import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";

import "./Theme/Theme.css";

import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./Context/AuthContext.tsx";
import { ThemeProvider } from "./Theme/Theme.tsx";

registerSW({
  immediate: true,
});

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>

    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </ThemeProvider>
);