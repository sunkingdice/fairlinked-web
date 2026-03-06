# Brand Guidelines

This skill helps keep copy, visuals, and behavior consistent with the Fairlinked brand. Use it when writing content, designing UI, or adding new pages so the site feels like one coherent product.

---

## Name and domain

- **Brand name:** **Fairlinked** (capital F, capital L; one word, no space).
- **Legal name:** Fairlinked - Alliance for digital fairness e.V.
- **Domain:** **fairlinked.eu** only.
  - Use **https://fairlinked.eu** in copy, config, canonical URLs, and links.
- **Contact:** hello@fairlinked.eu

---

## Positioning and tone

- **What this is:** A trade association and advocacy group for commercial LinkedIn users. A German nonprofit (e.V.) pursuing DMA enforcement and digital fairness.
- **Tone:** Professional, credible, community-oriented. Think trade body meets advocacy — factual, measured, inviting participation. Not aggressive or sensationalist.
- **Audience:** Commercial LinkedIn users, LinkedIn tool vendors, digital rights advocates, policymakers, journalists, potential members.
- **Tagline:** "The trade association and advocacy group for commercial Linkedin users"

---

## Visual identity

**Colors:**

| Role | Hex | Usage |
|------|-----|-------|
| Gradient top | `#288bed` | Background gradient — top |
| Gradient center | `#0A66C2` | Background gradient — center (LinkedIn blue) |
| Gradient bottom | `#02376b` | Background gradient — bottom |
| Text | `#ffffff` | All text on gradient background |
| Accent | `#E46124` | F-icon orange (used in logo only) |

Background is always `linear-gradient(to bottom, #288bed, #0A66C2 50%, #02376b)`.

**Fonts:**

| Role | Font | Weight |
|------|------|--------|
| Headings | Fira Mono | 500 |
| Body | Open Sans | 300, 400 |

Loaded from Google Fonts on the homepage. Self-hosted via the Nightfall theme on subpages.

**Logo:**

- **F-icon:** `assets/F-icon.svg` — Orange rounded square with white "F". Used as favicon, navbar icon, and homepage hero.
- **Full logo (dark bg):** `assets/logo_ondark.svg` — Full wordmark for dark/gradient backgrounds.
- **Full logo (light bg):** `assets/logo_onbright.svg` — Full wordmark for light backgrounds.
- **Favicon:** F-icon.svg served from `static/F-icon.svg`.

**Layout:**

- **Framework:** Hugo static site generator (>= 0.146.0)
- **Theme:** [hugo-theme-nightfall](https://github.com/LordMathis/hugo-theme-nightfall) v0.10.0
- **Homepage:** Custom standalone template (`layouts/home.html`) — centered F-icon, title, description.
- **Subpages:** Theme's default single layout with gradient background override via `layouts/_partials/custom-head.html`.
- **Navigation:** Auto-generated from content files, sorted by `weight` front matter (lower = further left).
- **Footer:** Configured via `footerHtml` param in hugo.toml.

---

## Content principles

1. **Professional and factual.** Every claim is substantiated.
2. **Accessible.** Written so a non-lawyer, non-technical person can understand.
3. **Community-focused.** Emphasize collective action and membership.
4. **No speculation.** If something is unconfirmed, say so explicitly.

---

## Legal and footer

- **Footer text:** Copyright 2025-2026 by Fairlinked - Alliance for digital fairness e.V.
- **Content files:** Markdown in `content/`. Each file automatically becomes a nav item.
- **Front matter:** Use `weight` to control menu order, `showMetadata: false` for static pages.

---

## Consistency checklist

When adding or changing content or UI:

1. Use **Fairlinked** (capital F, capital L, one word) consistently.
2. Use **fairlinked.eu** as the domain.
3. Keep the gradient background on all pages.
4. Use Fira Mono for headings, Open Sans for body.
5. Use the correct logo asset for the context (F-icon for small/favicon, full logo for larger uses).
6. Keep tone professional and community-oriented.

For frontend design principles, see [frontend-design.md](./frontend-design.md).
