import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/fonts.css";
import "./styles/theme.css";
import "./styles/global.css";
import { applyTheme, resolveTheme } from "./lib/theme";
import App from "./App";
import { recoverStaleChunks } from "./lib/staleChunks";

// The pre-paint script in the <head> already set the attribute; this keeps
// the document honest if storage changed between paint and boot.
applyTheme(resolveTheme());

// The old design doc linked the cabinet as /#arcade. It has a real URL now.
if (window.location.pathname === "/" && window.location.hash === "#arcade") {
  window.location.replace("/arcade/");
}

recoverStaleChunks();

// Which hand is on the machine: Tab marks the keyboard, any pointer clears
// it. The list's focus ring shows only for the keyboard (crtStyles.js).
window.addEventListener(
  "keydown",
  (e) => {
    if (e.key === "Tab") document.documentElement.dataset.input = "keyboard";
  },
  true,
);
window.addEventListener(
  "pointerdown",
  () => {
    delete document.documentElement.dataset.input;
  },
  true,
);

const root = document.getElementById("root");
if (!root) throw new Error("#root is missing from the document");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
