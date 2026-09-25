import React from "react";
import ReactDOM from "react-dom/client";
import "../styles/fonts.css";
import "../styles/theme.css";
import "../styles/global.css";
import { applyTheme, resolveTheme } from "../lib/theme";
import ReceiptsApp from "./ReceiptsApp";

applyTheme(resolveTheme());

const root = document.getElementById("root");
if (!root) throw new Error("#root is missing from the document");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ReceiptsApp />
  </React.StrictMode>,
);
