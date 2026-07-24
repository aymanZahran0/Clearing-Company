---
name: Nuqaa Asir
description: Two-role cleaning booking & operations platform, Arabic-first and RTL-aware
colors:
  primary: "#00375B"
  primary-hover: "#00536C"
  primary-tint: "#E7F4F9"
  accent: "#006477"
  bg: "#FFFFFF"
  surface: "#FAF8F4"
  ink: "#0B121A"
  muted: "#555F69"
  border: "#E0E5EB"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Noto Sans Arabic', sans-serif"
    fontSize: "clamp(1.875rem, 4vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Noto Sans Arabic', sans-serif"
    fontSize: "clamp(1.5rem, 2.5vw, 1.875rem)"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Noto Sans Arabic', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Noto Sans Arabic', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  sm: "6px"
  md: "8px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "32px"
  xl: "80px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.bg}"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.bg}"
  card:
    backgroundColor: "{colors.bg}"
    rounded: "{rounded.md}"
    padding: "16px"
---

# Design System: Nuqaa Asir

## 1. Overview

**Creative North Star: "The Trusted Professional"**

Nuqaa Asir is what a visitor should read as a real, organized operation the moment they land — clean, competent, and unfussy, like a well-run local business you'd actually hand your house keys to. The system is built around a deep navy primary (`#00375B`) drawn directly from the Nuqaa identity, paired with a restrained teal (`#006477`) that signals freshness and service without competing with the logo.

The system rejects the generic gig-economy look this platform explicitly wants to avoid: discount-banner clutter, stock icons, crowded undifferentiated listings. Surfaces stay quiet so navy, teal, and clear typographic hierarchy do the brand work, not decorative color.

**Key Characteristics:**
- Deep navy primary — confidence, clarity, and alignment with the logo
- Pure white surfaces; brand lives in primary + accent + typography, not background tint
- Flat by default; elevation is a hover response, not a resting state
- Generous 44px minimum touch targets throughout (Customer and Admin alike)
- Fully bilingual, RTL-mirrored — logical spacing and alignment, never hardcoded left/right

## 2. Colors

A restrained palette: one confident brand color, one supporting accent, and quiet neutrals that let both do the work.

### Primary
- **Nuqaa Navy** (`#00375B`): primary buttons, active navigation, headings, and focus rings.
- **Navy Hover** (`#00536C`): interactive hover state that bridges navy and teal.
- **Navy Tint** (`#E7F4F9`): selected navigation and quiet informational surfaces.

### Secondary
- **Teal** (`#006477`): links, secondary interactions, confirmation states, and supporting status accents.

### Neutral
- **Pure White** (`#FFFFFF`): the default background across both Customer and Admin surfaces.
- **Paper** (`#FAF8F4`): restrained secondary surface.
- **Ink** (`#0B121A`): primary body and heading text.
- **Muted** (`#555F69`): secondary text, descriptions, and captions.
- **Hairline** (`#E0E5EB`): dividers, card borders, and footer rules.

### Named Rules
**The Restraint Rule.** Navy carries primary actions and active states; teal supports links and secondary interactions. The pale blue tint is reserved for selection and focus, never decoration.

## 3. Typography

**Display/Body Font:** System stack — `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Noto Sans Arabic", sans-serif` (Ant Design's default stack, extended with Noto Sans Arabic for the Arabic-default locale).

**Character:** No display/body contrast pairing — one workable system stack carries every size, weighted through size and weight rather than a second typeface. Plain and legible over expressive; this is a transactional, bilingual interface first.

### Hierarchy
- **Display** (700, `clamp(1.875rem, 4vw, 3rem)` / 30–48px, line-height 1.2): hero H1 only, one per page.
- **Headline** (700, 24–30px, line-height 1.3): section H2s ("Services", "Why Choose Us", etc.).
- **Title** (600, 16px): card titles, feature headings (H3).
- **Body** (400, 16–18px, line-height 1.6, max 65–75ch): paragraph copy, descriptions.
- **Label** (600, 14px): buttons, nav items, form labels, footer column headers.
- **Caption** (400, 12px): legal/copyright line only.

### Named Rules
**The One System Stack Rule.** Every weight and size comes from the same font stack. The navy/teal palette and spacing carry the brand voice.

## 4. Elevation

Flat by default. Ant Design's Card and Button components carry no resting shadow; `shadow-sm` (Tailwind, `0 1px 2px rgba(0,0,0,0.05)`) appears only on the sticky header/footer chrome to separate it from scrolling content. Interactive cards (service cards on the Customer catalog) lift into a soft shadow only on hover, via Ant Design's built-in `hoverable` treatment — elevation is a response to interaction, not a resting state.

### Shadow Vocabulary
- **Chrome** (`box-shadow: 0 1px 2px rgba(0,0,0,0.05)`): header and footer, to separate fixed/sticky chrome from content.
- **Hover Lift** (Ant Design default hoverable Card shadow): service/catalog cards only, on hover/focus.

### Named Rules
**The Flat-By-Default Rule.** Surfaces rest flat. Shadow is earned by interaction (hover, focus), never applied decoratively to a static card or section.

## 5. Components

### Buttons
- **Shape:** 6px corner radius (Ant Design default `borderRadius: 6`).
- **Primary:** Nuqaa Navy (`#00375B`) fill, white text, 12px/24px padding, `size="large"` everywhere a Customer or Admin can tap it. Ant Design derives `controlHeightLG` as `controlHeight × 1.25` (40px by default) — short of the 44px minimum — so the theme sets `controlHeightLG: 44` explicitly in `AppProviders.tsx` rather than relying on the derived default.
- **Secondary/Default:** Ant Design's default ghost/outline button — hairline border, ink text, no fill.
- **Hover/Focus:** fill shifts to Navy Hover (`#00536C`); focus uses the primary token.

### Cards
- **Corner Style:** 8px radius (Tailwind `rounded-lg`) on bespoke fallback cards; Ant Design default radius on `<Card>`.
- **Background:** pure white.
- **Shadow Strategy:** flat at rest, soft lift on hover only (see Elevation).
- **Border:** 1px Hairline (`#F3F4F6`) on bespoke cards; Ant Design's own border treatment on `<Card>`.
- **Internal Padding:** 16px.

### Inputs / Fields
- **Style:** Ant Design default — hairline stroke, white background, 6px radius.
- **Focus:** Ant Design's primary-colored border and focus treatment, inheriting Nuqaa Navy.
- **Error / Disabled:** Ant Design defaults, unmodified.

### Navigation
- **Customer (AppShell):** white header, `shadow-sm`, inline nav links above `sm`, collapsing into a `Drawer` (280px, opens from the reading-direction edge — right in Arabic/RTL, left in English/LTR) below it. Every link/button is `min-h-11` (44px).
- **Admin (AdminShell):** fixed-height header + independently-scrolling `Sider` (220px, light theme) above `lg`, collapsing into the same `Drawer` pattern (260px) below it. Active routes inherit Nuqaa Navy and its pale-blue selection tint.

### Named Rules
**The 44px Rule.** Every tappable element — nav link, button, drawer toggle, logout — is at least 44×44px. Non-negotiable across both Customer and Admin, not just "large" screens.

## 6. Do's and Don'ts

### Do:
- **Do** use Nuqaa Navy (`#00375B`) for primary actions and active navigation, with Navy Tint (`#E7F4F9`) for selected backgrounds.
- **Do** use teal (`#006477`) for links and supporting interactions.
- **Do** size every interactive element to at least 44×44px (The 44px Rule) — this is a bilingual, cross-generation customer base, not a power-user tool.
- **Do** mirror all spacing, icons, and Drawer placement per reading direction (RTL for Arabic, the default locale) — logical properties, never hardcoded left/right.
- **Do** keep cards flat at rest; reserve shadow for hover/interaction (The Flat-By-Default Rule).

### Don't:
- **Don't** build discount-banner clutter, stock icons, or crowded undifferentiated listings — the explicit "generic gig-economy app" anti-reference from PRODUCT.md.
- **Don't** use wine, pink, or warm red for brand navigation or primary actions; reserve red for destructive and error states.
- **Don't** introduce a second display typeface for "personality." One system stack, carried by size/weight/color.
- **Don't** substitute Ant Design's default bright blue (`#1677ff`) for the darker Nuqaa Navy.
- **Don't** apply resting shadows to static cards or sections — elevation is earned by hover, not decoration.
