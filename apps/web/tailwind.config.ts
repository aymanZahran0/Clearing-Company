import type { Config } from "tailwindcss";
import tailwindcssRtl from "tailwindcss-rtl";

// tailwindcss-rtl adds `rtl:`/`ltr:` variants and logical-property utilities
// so components mirror correctly per constitution Principle III (logical
// properties, not hardcoded left/right) without per-page overrides.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // DESIGN.md token layer — keep in sync with the Ant Design
      // ConfigProvider theme in src/app/AppProviders.tsx (colorPrimary /
      // colorTextDescription derive from the same primary/muted values).
      colors: {
        primary: {
          DEFAULT: "#00375B",
          hover: "#00536C",
          tint: "#E7F4F9",
        },
        accent: {
          DEFAULT: "#006477",
          tint: "#D5F1F6",
        },
        paper: "#FAF8F4",
        ink: "#0B121A",
        muted: "#555F69",
        hairline: "#E0E5EB",
      },
      fontFamily: { sans: ["Tajawal", "ui-sans-serif", "system-ui", "sans-serif"] },
    },
  },
  corePlugins: {
    // Ant Design ships its own reset; avoid Tailwind's preflight fighting it.
    preflight: false,
  },
  plugins: [tailwindcssRtl],
} satisfies Config;
