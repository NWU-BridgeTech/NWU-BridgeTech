# UI primitives

These components were installed from the official [shadcn/ui](https://ui.shadcn.com/docs/components/radix/sidebar) registry using `npx shadcn@latest add sidebar` (New York style, JavaScript, Radix).

BridgeTech's menu, icons, and visual customisation live in `../Sidebar.jsx` and `../Sidebar.css`. Keep route-specific content out of these primitives.

The shared Tailwind theme is in `src/shadcn.css`. Tailwind's global Preflight reset is deliberately omitted to preserve the existing page CSS; a scoped reset covers the sidebar and dialog surfaces.

Local adaptations:

- Use the project's `@/lib/utils` class-name helper.
- Remove unused React imports for the automatic JSX runtime.
- Use a stable skeleton width instead of random values during rendering.
- Subscribe to the mobile media query with `useSyncExternalStore` in `src/hooks/use-mobile.js`.

When regenerating these files, review these adaptations and test desktop collapse, route highlighting, and the mobile drawer.
