# CLAUDE.md

Guidance for Claude Code (and other agents) working in `apps/web`.

## Design Context

This app has committed design context — read it before making any UI change:

- [`PRODUCT.md`](./PRODUCT.md) — register (`brand`), platform (`web`), users, positioning, brand personality (trustworthy, meticulous, warm), anti-references (generic gig-economy apps).
- [`DESIGN.md`](./DESIGN.md) — visual system: "The Trusted Professional." Deep wine primary (`#741942`), muted teal accent (`#23817D`), pure white surfaces, flat-by-default elevation, 44px minimum touch targets, full RTL mirroring for the Arabic-default locale.
- [`.impeccable/design.json`](./.impeccable/design.json) — machine-readable extension of DESIGN.md (tonal ramps, component snippets) for the `/impeccable` skill's live mode.

Use the `/impeccable` skill (`critique`, `audit`, `polish`, `colorize`, `live`, etc.) for design work in this app; it reads these files automatically.
