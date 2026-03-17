// Intercept auth tokens landing on wrong page — redirect to callback
const hash = window.location.hash;
if (hash && window.location.pathname !== '/auth/callback') {
  if (hash.includes('access_token') || hash.includes('error=') || hash.includes('type=')) {
    window.location.replace('/auth/callback' + hash);
    throw new Error('Redirecting to auth callback');
  }
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
