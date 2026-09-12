# Return-to-top control design

## Objective

Provide an unobtrusive, accessible way to return to the start of any Synapse page after reading a long page.

## Scope

- Render one control from `RootLayout.astro`, ensuring it is present on every route that uses the shared shell.
- Keep it hidden initially and reveal it after the user scrolls roughly 400 pixels.
- Use a Lucide upward-arrow icon, an accessible name, fixed lower-right placement, keyboard focus treatment, and responsive safe spacing.
- On activation, return to the top with smooth scrolling unless the user requests reduced motion.

## Implementation

The layout owns the markup and minimal browser event handling; global CSS owns its fixed position, visibility transition, focus state, and reduced-motion override. The scroll listener toggles a data or class state only when the visibility changes. The control is a native button so it remains keyboard operable without a React island.

## Behavior and edge cases

- Short pages never reach the threshold, so the control remains hidden.
- The control returns to the top of the document without changing routes or history.
- Users with `prefers-reduced-motion: reduce` receive an immediate return instead of a smooth animation.
- The button remains usable in both light and dark themes and on small screens.

## Verification

- Run Astro/TypeScript checks, linting, and the production build.
- Manually confirm on a long page that the button is absent at page start, appears after the threshold, returns to top, and is keyboard accessible.
