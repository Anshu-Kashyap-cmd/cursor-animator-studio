import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Gracefully intercept and suppress browser extension errors (like MetaMask, Ethereum, phantom, or LPC)
// that frequently fail when run within a sandboxed iframe.
if (typeof window !== "undefined") {
  const isExtensionNoise = (message: string) => {
    const lower = (message || "").toLowerCase();
    return (
      lower.includes("metamask") ||
      lower.includes("ethereum") ||
      lower.includes("web3") ||
      lower.includes("provider") ||
      lower.includes("rpc") ||
      lower.includes("wallet") ||
      lower.includes("extension")
    );
  };

  window.addEventListener("error", (event) => {
    const errorMsg = event.message || (event.error && event.error.message) || "";
    if (isExtensionNoise(errorMsg)) {
      console.warn("[Extension Shield] Suppressed sandboxed iframe extension error:", errorMsg);
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const errorMsg = reason ? (reason.message || String(reason)) : "";
    if (isExtensionNoise(errorMsg)) {
      console.warn("[Extension Shield] Suppressed sandboxed iframe extension rejection:", errorMsg);
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
