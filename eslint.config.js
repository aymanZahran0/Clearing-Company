// Shared flat ESLint config (ESLint 9+) extended by apps/web and apps/api.
// Using flat-config `ignores` instead of a separate .eslintignore file.
import js from "@eslint/js";
import tseslint from "typescript-eslint";

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
  ...tseslint.configs.recommended
);
