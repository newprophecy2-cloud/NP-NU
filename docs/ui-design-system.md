# NP-NU UI Design System

## 1. Visual Identity

NP-NU uses a crisp, high-trust civic-academic aesthetic tailored for Bangladeshi students on mobile devices (360px+) and desktop browsers—completely distinct from the legacy NU site.

- **Brand Name:** NP-NU (*National University Fast Admission & Academic Platform*)
- **Color Palette (WCAG AA+ contrast):**
  - Primary Ink / Slate: `#0F172A` (headings), `#334155` (body)
  - Primary Brand Emerald-Teal: `#0F766E` (primary CTAs, active progress) & `#115E59` (hover)
  - Institutional Navy Accent: `#1E3A8A` (official source citations, academic tags)
  - Surface / Canvas: `#F8FAFC` (page background), `#FFFFFF` (cards), `#F1F5F9` (subtle panels)
  - Borders: `#CBD5E1` / `#E2E8F0`
  - Semantic Badges (never color-only; always paired with icon/text):
    - `VERIFIED` / `Eligible`: `#065F46` on `#D1FAE5`
    - `NEEDS_REVIEW` / `Closing soon` / `Manual verification`: `#92400E` on `#FEF3C7`
    - `UNVERIFIED` / `Student-reported`: `#1E40AF` on `#DBEAFE`
    - `NOT ELIGIBLE` / `FAILED` / `Closed`: `#991B1B` on `#FEE2E2`
    - `STALE` / `Unavailable`: `#475569` on `#E2E8F0`
- **Typography:** `Plus Jakarta Sans` (Latin) + `Noto Sans Bengali` (Bengali script) with system fallbacks (`sans-serif`), minimum `16px` (`1rem`) on form inputs to prevent mobile browser zoom.
- **Accessibility & Mobile-First Rules:**
  - Single `<main>` landmark, skip-to-content link, sequential `<h1>`–`<h3>` hierarchy.
  - Touch targets `>= 44px` on coarse pointers (`@media (pointer: coarse)`).
  - Visible `:focus-visible` `3px` outline with `outline-offset: 2px`.
  - Container-query responsive tables that stack cleanly below `640px` without horizontal page overflow.
  - Clear non-official disclaimer banner in header/footer and before external portal handoff.
