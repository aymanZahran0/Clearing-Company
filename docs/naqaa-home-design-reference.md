# Naqaa Home — Bundled Design Reference

## Scope and decoding status

Source: `references/naqaa-home-reference.html` (2,609,482 bytes). This document describes the page decoded from `script[type="__bundler/template"]`, its component logic, and all 17 entries in `script[type="__bundler/manifest"]`; it intentionally ignores the outer bundle's loading tile and thumbnail except where noted.

The template JSON decodes cleanly to a 30,594-character HTML document. The manifest also decodes cleanly. It contains one PNG, four JavaScript bundles, and twelve WOFF2 font files. No nested page bundles are declared (`page_order` is empty). React 18.3.1 and ReactDOM 18.3.1 are present as external-resource mirrors but the visible page is rendered by the bundled `DCLogic`/custom-element runtime.

Important limitations of the reference itself:

- The hero photograph is **not bundled**. The template contains an empty editable `image-slot` (`id="hero-photo"`) whose placeholder reads “صورة: فريق التنظيف داخل منزل عصري”. Therefore its intended subject is known, but no exact photograph, crop, or color treatment can be recovered.
- Elements are marked `data-responsive-grid="hero|cards3|cards4|why|footer"`, but no CSS or JavaScript in the decoded page or runtime implements those markers. There are no page `@media` rules. Responsive breakpoints cannot be decoded because they do not exist in the artifact.
- `pulseRing` is defined but never applied.
- The page has no `prefers-reduced-motion` treatment for its page animations. The image-slot authoring component has an unrelated reduced-motion rule for its own loading indicator.

## Page structure

The document is Arabic-first: the page wrapper uses `dir="rtl"`, `lang="ar"`, `direction: rtl`, Tajawal, an off-white background, and clipped horizontal overflow.

1. **Sticky header** — white, 1 px bottom divider, logo at the RTL start, nine wrapping navigation links, then “تسجيل الخروج” and “EN” buttons. Navigation items are الرئيسية، الخدمات، مناطق الخدمة، الأسئلة الشائعة، حجوزاتي، اشتراكاتي، الملف الشخصي، الإشعارات، الفواتير.
2. **Hero** — two-column grid. The text column contains a teal availability/location pill, 48 px headline (“نظافة احترافية لمنزلك، بالوقت الذي يناسبك”), supporting paragraph, primary and secondary CTAs, then three proof badges. The image column is a 420 px-high empty image slot inside a rounded, shadowed frame and cyan-to-blue backing plate. Two softly colored radial orbs float behind the content.
3. **Services** — section label and 34 px heading with “عرض جميع الخدمات”; a three-column, six-card grid. Each card contains an abstract colored square icon, name, description, price, and “التفاصيل ←”. Services: whole-home cleaning; deep kitchen/bath cleaning; steam upholstery; surface sanitization; post-construction cleaning; facade/window cleaning.
4. **How booking works** — white band, centered label/heading, then four equal step tiles: choose service, book appointment, receive price, enjoy service.
5. **Why choose us + service areas** — two equal columns. The first lists four assurances (trained team, quality guarantee, easy booking, transparent prices). The second shows service-area pills for أبها and خميس مشيط, followed by a 2×2 trust-stat panel.
6. **FAQ** — white band, 860 px maximum width, title/action row, then five accordion items. Item zero is open initially. Questions cover duration, supplied materials, coverage, cancellation/modification, and team insurance/training.
7. **Contact CTA** — pale cyan centered band with heading, support sentence, and two buttons (“الأسئلة الشائعة”, “تتبع حجزك”). Despite the copy mentioning WhatsApp/phone, neither button is labeled as a direct contact action.
8. **Footer** — white, three columns in a 1.4/1/1 ratio: logo/description, service links, quick links. A separated centered copyright row reads “© 2026 نقاء عسير. جميع الحقوق محفوظة.”

## Design language

The visual language is calm, hygienic, service-oriented, and highly rounded. It uses deep marine blue for authority, brighter cyan/teal for freshness and interaction, near-black blue-gray typography, white surfaces, and subtly warm off-white section grounds. Hierarchy comes from very heavy Tajawal headings (800–900), generous vertical section padding, rounded pills/cards, simple geometric marks, and alternating white/off-white bands.

The composition is conventional and content-forward: restrained gradients appear only behind the hero image; service cards use small colored abstract icons; proof is communicated through badges and animated numbers. Almost all styling is inline rather than tokenized CSS.

## Color inventory

HEX values below are approximate sRGB conversions. Alpha is listed separately where used.

| Role / usage | Exact value | Approx. HEX |
|---|---:|---:|
| Page background | `oklch(98% 0.006 90)` | `#FAF8F4` |
| Warm inset panel | `oklch(96% 0.008 90)` | `#F4F2EC` |
| White surfaces | `#fff`, `#ffffff` | `#FFFFFF` |
| Default ink | `oklch(22% 0.015 250)` | `#151B21` |
| Strong heading | `oklch(18% 0.02 250)` | `#0B121A` |
| FAQ question | `oklch(20% 0.02 250)` | `#0F171F` |
| Dark neutral | `oklch(30% 0.02 250)` | `#262F38` |
| Badge neutral | `oklch(32% 0.02 250)` | `#2B343D` |
| Body text | `oklch(45% 0.02 250)` | `#4D5660` |
| FAQ answer | `oklch(46% 0.02 250)` | `#505963` |
| Muted text | `oklch(48% 0.02 250)` | `#555F69` |
| Copyright text | `oklch(55% 0.02 250)` | `#69737D` |
| Primary marine | `oklch(32% 0.09 240)` | `#00375B` |
| Primary hover | `oklch(40% 0.1 220)` | `#00536C` |
| Deep teal text | `oklch(34% 0.09 220)` | `#004158` |
| Area-pill text | `oklch(30% 0.09 220)` | `#00364C` |
| Link teal | `oklch(45% 0.1 210)` | `#006374` |
| Link-hover teal | `oklch(45% 0.11 210)` | `#006477` |
| Border-hover cyan | `oklch(60% 0.1 210)` | `#1590A1` |
| Freshness accent | `oklch(60% 0.13 200)` | `#00969F` |
| Pale cyan surface | `oklch(96% 0.02 220)` | `#E4F5FB` |
| Pale button surface | `oklch(96% 0.015 220)` | `#E7F4F9` |
| Pale pill surface | `oklch(94% 0.03 210)` | `#D5F1F6` |
| Logout hover | `oklch(92% 0.03 220)` | `#D0EAF3` |
| Dividers | `oklch(91% 0.012 250)` | `#DBE2E9` |
| Card borders | `oklch(92% 0.01 250)` | `#E0E5EB` |
| Light divider | `oklch(93% 0.008 250)` | `#E4E8ED` |
| Neutral border | `oklch(88% 0.012 250)` | `#D2D8DF` |
| Strong neutral border | `oklch(85% 0.015 250)` | `#C7CFD7` |
| Cool border | `oklch(88% 0.02 230)` | `#CBDAE2` |
| Hover border | `oklch(85% 0.02 220)` | `#C0D1D7` |
| Hero plate start | `oklch(88% 0.05 200)` | `#B2E2E4` |
| Hero plate end | `oklch(92% 0.03 230)` | `#D1E9F5` |

Service icon colors are `oklch(60% 0.13 200)` ≈ `#00969F`; `55% 0.1 230` ≈ `#1E7CA1`; `65% 0.1 180` ≈ `#38A391`; `50% 0.1 250` ≈ `#32669A`; `58% 0.11 210` ≈ `#008B9E`; and `62% 0.09 195` ≈ `#339797`.

Transparent effects:

- Top-left orb: `oklch(85% 0.06 190 / 0.55)` ≈ `#A0DBD6` at 55%, fading to transparent at 70% radius.
- Bottom-right orb: `oklch(80% 0.07 230 / 0.45)` ≈ `#8FC7E2` at 45%, fading at 70%.
- Primary shadow: `oklch(32% 0.09 240 / 0.55)` ≈ `#00375B` at 55%.
- Hero-image shadow: `oklch(25% 0.05 240 / 0.35)` ≈ `#062437` at 35%.
- Card-hover shadow: `oklch(30% 0.05 240 / 0.28)` ≈ `#133144` at 28%.

## Typography

The sole family is **Tajawal**, falling back to `sans-serif`. The bundle includes Arabic and Latin subsets for weights 300, 400, 500, 700, 800, and 900 (12 WOFF2 files total), each with `font-display: swap`. Weight 300 and 400 are embedded but not explicitly used by the page; unspecified text inherits 400.

| Element | Size | Weight | Line height |
|---|---:|---:|---:|
| Hero H1 | 48 px | 900 | 1.25 (60 px) |
| Major section H2 | 34 px | 900 | normal |
| Why H2 | 32 px | 900 | normal |
| FAQ H2 | 30 px | 900 | normal |
| CTA H2 | 28 px | 900 | normal |
| Service-area H3 | 22 px | 900 | normal |
| Trust statistic | 28 px | 900 | normal |
| Step number | 20 px | 900 | normal |
| Service-card H3 | 18 px | 800 | normal |
| Step H3 | 17 px | 800 | normal |
| Hero body | 18 px | 400 | 1.9 (34.2 px) |
| Section/body lead | 16 px | 400 | 1.9 (30.4 px) where specified |
| FAQ question | 16 px | 700 | normal |
| Primary CTA | 16 px | 800 | normal |
| Secondary CTA | 16 px | 700 | normal |
| Cards/body/footer | 14 px | 400 | 1.7 or 1.8 |
| Section labels | 14 px | 800 | normal |
| Header navigation | 15 px | 500 | normal |
| Prices | 15 px | 800 | normal |
| Pills/badges/meta | 13–15 px | 700–800 | normal |

No letter-spacing, text-transform, fluid type (`clamp`), or explicit heading line-height other than the H1 is defined.

## Layout, spacing, radii, borders, and shadows

- Primary content maximum: 1280 px; FAQ maximum: 860 px; hero paragraph maximum: 520 px; footer description maximum: 320 px.
- Global horizontal section inset: 40 px. Vertical rhythms: hero 76/96 px; services 70 px; booking 70 px; why 76 px; FAQ 70 px; contact 64 px; footer 56/28 px.
- Header: 16×40 px padding, 24 px top-level gap, 28 px nav gap, 12 px action gap; sticky at `top:0`, `z-index:50`.
- Hero grid: 1.05fr/0.95fr, 56 px gap. Why grid: 1fr/1fr, 60 px. Service grid gap: 22 px. Step grid gap: 24 px. Footer columns: 1.4fr/1fr/1fr, 40 px.
- Common internal gaps: 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, and 44 px.
- Radii: 2 px decorative diamond; 10 px badges/small buttons; 12 px main buttons; 13 px service icons; 14 px FAQ rows; 16 px cards/panels; 20 px hero media frame; 28 px hero backing plate; 50% circles; 999 px pills.
- Borders: 1 px for header/footer dividers, cards, pills, and utility buttons; 1.5 px for secondary CTAs.
- Shadows: primary CTA `0 10px 24px -8px`; hero media `0 30px 60px -20px`; service-card hover `0 18px 34px -14px`. No other page shadows.

## Motion and interaction inventory

### Ambient/decorative animation

- `floatA`: top-left hero orb, 9 s, `ease-in-out`, infinite. At 50% it moves `translateY(-16px)` and rotates 4°; endpoints are zero translation/rotation.
- `floatB`: bottom-right hero orb, 11 s, `ease-in-out`, infinite. At 50% it moves down 14 px; endpoints return to zero.
- `pulseRing`: keyframes scale 0.9/opacity .5 → scale 1.35/opacity 0 at 70% → opacity 0 at 100%; **unused**, with no duration or trigger.

### Hover transitions

- Header/footer links: color, 200 ms, `ease`.
- Logout and language buttons: `all`, 200 ms, `ease`; logout changes pale-cyan background, language changes border/text.
- Primary CTAs: transform and background (hero) or `all` (contact), 200 ms, `ease`; hover changes to teal and lifts 2 px.
- Secondary CTAs: `all`, 200 ms, `ease`; hover changes border/text and lifts 2 px where specified.
- Utility outline buttons: `all`, 200 ms, `ease`; border and text become cyan/teal.
- Service cards: transform, box-shadow, border-color, 250 ms, `ease`; hover lifts 6 px, adds shadow, and cools the border.

`style-hover` is a runtime-specific attribute transformed into actual pointer hover handling by the DC runtime; it is not native HTML.

### Scroll reveals

An `IntersectionObserver` watches hero, services, booking steps, why/areas, and FAQ with threshold `0.15`. Once intersecting, the element is marked visible and immediately unobserved (one-shot). Services, booking, why, and FAQ begin at opacity 0 and `translateY(28px)`, then transition to opacity 1 / Y 0 over 700 ms `ease`. The hero is observed but has no reveal style (`heroTextStyle` is empty), so observation produces no visible hero entrance.

### Counters

When the why section first reaches 15% visibility, four values animate from zero to 500+, 4.9, 3+, and 98%. Duration is 1,300 ms, driven by `requestAnimationFrame`, with cubic ease-out `1 - (1-p)^3`. Bookings, years, and satisfaction round to integers each frame; rating uses one decimal place. The sequence runs once.

### Accordion

FAQ item zero is open on initial render. Clicking a question toggles it; opening one closes the previous one because state stores one index or `null`. The chevron rotates from 0° to −90° over 250 ms `ease`. The answer transitions `max-height` between 0 and 240 px over 350 ms `ease`, and opacity over 300 ms `ease`. Content is clipped; horizontal padding remains 22 px and open text has an 18 px bottom margin.

### Image-slot behavior

The hero slot is an authoring custom element rather than a shipped image. At 100%×420 px and `shape="rect"`, it shows a placeholder until a source is supplied. The bundled component supports drag/drop, file picking, persisted crop/pan/resize state, and editable controls only when its host authoring bridge is available. None of those controls supplies an image in this artifact.

## RTL behavior

- RTL is set both semantically (`dir="rtl"`, `lang="ar"`) and in CSS (`direction:rtl`) on the root page wrapper.
- Flex/grid source order therefore begins visually from the right where the browser’s RTL flex/grid behavior applies. Text alignment is inherited/automatic; the booking heading and contact CTA override with center alignment.
- Physical offsets remain literal: the first orb uses `left:-40px`; the second uses `right:8%`; the service icon’s diamond uses `left:12px`. These do not mirror through logical properties.
- The detail cue is a literal left arrow (`←`), appropriate for progression toward the visual left in RTL. The FAQ chevron is `‹` and rotates −90° when open.
- The language toggle is “EN”, but there is no LTR mode/state or language-switch logic in the decoded component.

## Responsive behavior

There are **no implemented page breakpoints**: no `@media` blocks, container queries, `matchMedia`, viewport resize handler, or runtime mapping for `data-responsive-grid`. Consequently the exact reference behavior is:

- Horizontal section padding remains 40 px at every viewport.
- H1 remains 48 px and all other type remains fixed-size.
- Hero remains two columns with a 56 px gap; why remains two columns with 60 px gap.
- Services remain three columns; steps remain four columns; footer remains three columns.
- Header navigation may wrap because `flex-wrap:wrap`, but the header itself does not wrap and has no mobile menu.
- CTA rows, badges, section title/action rows, and area pills can wrap where `flex-wrap:wrap` is explicitly set.
- The page wrapper hides horizontal overflow, which can conceal over-wide content rather than adapting it.
- The hero image slot remains 420 px tall but has a fluid width within its grid track.

The `data-responsive-grid` attributes should be treated as unfulfilled intent, not as recoverable breakpoints. A future implementation will require new responsive decisions rather than transcription.

## Reusable components

1. Sticky site header with nav/actions.
2. Filled primary button (marine background, white text, 12 px radius).
3. Outline secondary button (white, 1–1.5 px cool border, 10–12 px radius).
4. Location/status pill (pale cyan, teal text, full pill radius).
5. Proof badge (white, subtle border, 10 px radius).
6. Section heading row (label + heavy heading + optional utility action).
7. Service card (abstract icon, title, copy, price/detail footer, lift hover).
8. Numbered process tile (warm surface, circular marine number).
9. Feature/assurance row (10 px teal dot + title/body).
10. Area pill.
11. 2×2 trust-stat panel.
12. FAQ accordion row.
13. Centered CTA band.
14. Three-column marketing footer.

## Recommended token extraction

The source has no CSS custom properties, but these inferred tokens faithfully consolidate its repeated values:

```css
:root {
  --font-sans-ar: "Tajawal", sans-serif;

  --color-bg: oklch(98% 0.006 90);
  --color-surface: #fff;
  --color-surface-warm: oklch(96% 0.008 90);
  --color-surface-cyan: oklch(96% 0.02 220);
  --color-ink: oklch(18% 0.02 250);
  --color-text: oklch(22% 0.015 250);
  --color-text-secondary: oklch(45% 0.02 250);
  --color-text-muted: oklch(48% 0.02 250);
  --color-primary: oklch(32% 0.09 240);
  --color-primary-hover: oklch(40% 0.1 220);
  --color-accent: oklch(60% 0.13 200);
  --color-link: oklch(45% 0.1 210);
  --color-border: oklch(92% 0.01 250);
  --color-border-strong: oklch(88% 0.012 250);

  --content-max: 1280px;
  --content-faq: 860px;
  --page-gutter: 40px;
  --section-space: 70px;
  --radius-sm: 10px;
  --radius-button: 12px;
  --radius-card: 16px;
  --radius-media: 20px;
  --radius-pill: 999px;

  --duration-fast: 200ms;
  --duration-card: 250ms;
  --duration-reveal: 700ms;
  --ease-standard: ease;
}
```

These are documentation-level inferred tokens only; no application files were changed.

## Asset inventory

- PNG logo: 1,715,096 bytes, 1408×768 RGBA. It contains the Arabic “نقاء عسير” wordmark plus a water-drop, sparkle, brush, and cyan/navy circular sweep on transparency. It is rendered at 44 px high in the header and 38 px in the footer.
- Tajawal: 12 WOFF2 files, separate Arabic/Latin subsets at weights 300/400/500/700/800/900; individual files are 8,296–10,584 bytes.
- DC page runtime: gzip-compressed in manifest, 66,404 bytes decoded.
- Editable image-slot component bundle: gzip-compressed, 63,740 bytes decoded.
- React production: 10,751 bytes decoded; ReactDOM production: 131,835 bytes decoded.
- No hero photo, other raster/vector imagery, icon font, or nested-page asset exists.

