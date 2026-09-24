import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/theme.css";
import "./styles/global.css";
import { applyTheme, resolveTheme } from "./lib/theme";
import ArcadePortfolio from "./arcade/ArcadePortfolio";

// The pre-paint script in the <head> already set the attribute; this keeps
// the document honest if storage changed between paint and boot.
applyTheme(resolveTheme());

// The old design doc linked the cabinet as /#arcade. It has a real URL now.
if (window.location.pathname === "/" && window.location.hash === "#arcade") {
  window.location.replace("/arcade/");
}

const root = document.getElementById("root");
if (!root) throw new Error("#root is missing from the document");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ArcadePortfolio />
  </React.StrictMode>,
);
