# Vendored MyOperator design-system components

Copied from the `storybook-npm` repo (`src/`), which lives outside this
project. They are vendored rather than imported across repos because a build
machine only has *this* repo — aliasing to a sibling path builds on a laptop
and fails everywhere else.

Imported in app code as `@sb/components/ui/button`; the components' own
internal `@/lib/utils` imports resolve here too, which is why the original
directory layout is preserved.

`tokens.css` is the design-system's `src/index.css` (colour tokens plus the
Tailwind layer directives). `tailwind.config.js` is its Tailwind theme, which
the root `tailwind.config.js` extends.

## Refreshing

Re-copy the files from the source repo, keeping the same paths, then check
whether any newly-added import needs a package adding to `package.json`.
Only the components the showcase actually uses are here, not the whole
library. Do not hand-edit these files — changes belong upstream.

The published npm package (`shadcn-react-app`) is not a substitute: at the
time of writing it ships six components and no stylesheet.
