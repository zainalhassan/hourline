# Design System

Hourline uses the shared [**Transit theme**](https://github.com/zainalhassan/design-system) from `@zainalhassan/design-system` — inspired by [Transit 6.0](https://blog.transitapp.com/six-o/).

## Source of truth

| Layer | Location | Purpose |
|-------|----------|---------|
| Design tokens | [`design-system` repo](https://github.com/zainalhassan/design-system) → `themes/transit/tokens.json` | Colors, spacing, typography (W3C format) |
| Component spec | `design-system/specs/transit.md` | ETA cards, buttons, route colours |
| CSS variables | `@zainalhassan/design-system/transit/variables.css` | Stack-agnostic theme |
| shadcn mapping | [`app/globals.css`](../app/globals.css) | Maps Transit tokens → shadcn/ui variables |

## Workflow

1. **Edit tokens** in the `design-system` repo (`themes/transit/tokens.json`)
2. Run `npm run build` in `design-system` to regenerate `dist/`
3. **Bump the dependency** in Hourline (`npm install` picks up the updated package)
4. **Adjust shadcn mapping** in `globals.css` only if new semantic tokens are added

## Figma setup

Create a Figma library using variables that match the Transit theme tokens:

**Collections:**
- `color/brand` — primary green, secondary
- `color/route` — line colours (red, blue, orange, …)
- `color/semantic` — success, warning, destructive
- `spacing/*`, `radius/*`, `typography/*`

**Components to build:**
- ETA card (signature Transit 6.0 pattern)
- Button (primary, secondary, ghost)
- Input, Card, Badge, Table
- App navigation bar
- Stat card (analytics)

See the [Transit component spec](https://github.com/zainalhassan/design-system/blob/main/specs/transit.md) for details.

## This project (Next.js)

UI built with **shadcn/ui** in `components/ui/`. Typography: **Plus Jakarta Sans** (Puffin Transit substitute).

Domain components:

- `SectionCard` / `PageHeader` → page layout
- `StatCard` → weekly totals
- `EntriesTable` / `EntryForm` → timesheet logging
- `TemplateEditor` → personal template field config

## Principles

1. **Tokens over hardcoded values** — import from `@zainalhassan/design-system`
2. **Theme lives in design-system repo** — not in this project
3. **Route palette for accents** — `var(--color-route-*)` where appropriate
4. **Dark mode** — `next-themes` with Transit dark tokens
