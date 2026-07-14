import type { Config } from "tailwindcss";

// tailwindcss-rtl adds `rtl:`/`ltr:` variants and logical-property utilities
// so components mirror correctly per constitution Principle III (logical
// properties, not hardcoded left/right) without per-page overrides.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  corePlugins: {
    // Ant Design ships its own reset; avoid Tailwind's preflight fighting it.
    preflight: false,
  },
  plugins: [require("tailwindcss-rtl")],
} satisfies Config;
