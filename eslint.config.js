import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";

const browserGlobals = {
  window: "readonly",
  document: "readonly",
  navigator: "readonly",
  console: "readonly",
  clearTimeout: "readonly",
  clearInterval: "readonly",
  setTimeout: "readonly",
  setInterval: "readonly",
  requestAnimationFrame: "readonly",
  cancelAnimationFrame: "readonly",
  AudioContext: "readonly",
  localStorage: "readonly",
  performance: "readonly",
  fetch: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly",
  ResizeObserver: "readonly",
  IntersectionObserver: "readonly",
  Blob: "readonly",
  // Used by the jsdom test setup (src/test/setup.js)
  global: "readonly",
  HTMLCanvasElement: "readonly",
  HTMLElement: "readonly",
  Element: "readonly",
  Event: "readonly",
  PopStateEvent: "readonly",
  KeyboardEvent: "readonly",
};

// The React rules and globals shared by the JS arcade and the TS surfaces.
const reactRules = {
  ...reactHooks.configs.recommended.rules,
  "react/prop-types": "off",
  "jsx-a11y/alt-text": "warn",
  "jsx-a11y/anchor-has-content": "warn",
  "react-hooks/preserve-manual-memoization": "off",
  "react-hooks/refs": "off",
};

const TS_FILES = ["src/**/*.{ts,tsx}", "e2e/**/*.ts"];

export default [
  js.configs.recommended,
  // typescript-eslint's recommended set ships unscoped, so it would judge the
  // JS arcade by TypeScript rules; pin every config in it to the TS files.
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: TS_FILES,
  })),
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat["jsx-runtime"],
  {
    settings: {
      react: { version: "19" },
    },
  },
  {
    // The arcade: JavaScript, as it has always been.
    files: ["src/**/*.{js,jsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: browserGlobals,
    },
    settings: {
      react: { version: "19" },
    },
    rules: {
      ...reactRules,
      "no-unused-vars": [
        "warn",
        { varsIgnorePattern: "^_", argsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Everything new: the floor, the shared UI, Receipts, and their tests.
    files: TS_FILES,
    plugins: {
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    languageOptions: {
      globals: { ...browserGlobals, process: "readonly" },
    },
    settings: {
      react: { version: "19" },
    },
    rules: {
      ...reactRules,
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { varsIgnorePattern: "^_", argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  {
    // Node scripts run by CI (the leaderboard workflow) and their tests.
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        process: "readonly",
        console: "readonly",
        fetch: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        Buffer: "readonly",
        TextEncoder: "readonly",
        TextDecoder: "readonly",
        crypto: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
      },
    },
  },
];
