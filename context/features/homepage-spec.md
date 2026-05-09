# Homepage Implementation

## Overview

Build the real app homepage at `/` using the approved mockup in `prototypes/homepage/` as the visual and interaction reference.

## Requirements

- Replace the current iframe/prototype root with a real Next.js homepage implementation
- Use Tailwind + shadcn patterns consistent with the rest of the app
- Keep implementation clean, reusable, and DRY
- Ensure all buttons and links route to correct app destinations

## Architecture

- Use Server Components by default for static sections/layout
- Use Client Components only where interactivity is required:
  - Navbar scroll opacity behavior
  - Chaos icon animation and mouse-repel interaction
  - Scroll reveal/fade-in behavior
  - Pricing monthly/yearly toggle
- Keep client logic isolated to focused components/hooks

## Sections to Implement

- Fixed top navigation with brand, Features/Pricing anchors, Sign In and Get Started actions
- Hero text with headline, gradient emphasis, supporting copy, and CTAs
- Chaos to order visual:
  - Left: animated chaos container with 8 floating developer-tool icons
  - Center: pulsing transform arrow (rotates on mobile)
  - Right: dashboard preview with sidebar + colored item cards
- Features grid (6 cards)
- AI/Pro section with checklist + editor/tag preview
- Pricing section with Free vs Pro and monthly/yearly toggle (`$8/mo` vs `$72/yr`)
- CTA section
- Footer with current year

## Routing and Link Behavior

- Brand logo: `/`
- Sign In button: `/sign-in`
- Get Started and primary CTA buttons: `/register`
- Features nav link: `#features`
- Pricing nav link: `#pricing`
- Keep all internal navigation using Next.js Link where appropriate

## Styling and UX

- Preserve dark theme and item-type accent colors from the mockup spec
- Match spacing, hierarchy, and visual composition from `prototypes/homepage/`
- Ensure responsive behavior:
  - Mobile stacks chaos/arrow/dashboard vertically
  - Arrow points down on mobile
  - Grids collapse to single column on small screens
- Keep animations smooth and lightweight

## References

- `context/features/homepage-mockup-spec.md`
- `prototypes/homepage/index.html`
- `prototypes/homepage/styles.css`
- `prototypes/homepage/script.js`
