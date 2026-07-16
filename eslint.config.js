// Shared flat ESLint config (ESLint 9+) extended by apps/web and apps/api.
// Using flat-config `ignores` instead of a separate .eslintignore file.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import i18next from "eslint-plugin-i18next";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/.vite/**",
      "**/prisma/migrations/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Standard convention: an underscore-prefixed binding (e.g. destructuring
  // a field solely to exclude it — `{ id: _id, ...rest }`) is intentionally
  // unused.
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { varsIgnorePattern: "^_", argsIgnorePattern: "^_" },
      ],
    },
  },
  // research.md R11: guards against new hardcoded user-facing strings in
  // Admin/Customer UI now that Phase 6 has closed the existing gap.
  {
    files: ["apps/web/src/**/*.tsx"],
    plugins: { i18next },
    rules: {
      "i18next/no-literal-string": "error",
    },
  },
  // Several files already carried `eslint-disable-next-line
  // react-hooks/exhaustive-deps` comments referencing this rule without the
  // plugin ever being registered — registering it properly both resolves
  // those "unknown rule" errors and gives real hook-dependency enforcement.
  {
    files: ["apps/web/src/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/exhaustive-deps": "error",
      "react-hooks/rules-of-hooks": "error",
    },
  }
);
