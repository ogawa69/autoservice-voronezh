# Architecture

The project uses a lightweight, feature-sliced structure organized around functional modules. Related code stays co-located instead of accumulating in a catch-all `components` directory.

## Layers

Dependencies flow from top to bottom:

```text
app → pages → sections → features → shared
                    ↘ content
```

- `app` wires global styles and providers, then starts the page;
- `pages` composes sections into routes or screens;
- `sections` contains self-contained, large page areas;
- `features` implements user flows that may be used across sections;
- `shared` provides context-free UI primitives and common hooks;
- `content` keeps typed data separate from presentation.

A module must not import from a layer above it. Modules should expose cross-module imports through their public `index.ts`.

## Module layout

A functional module follows this structure:

```text
module-name/
├── ModuleName.tsx
├── styles.css
├── types.ts
├── index.ts
├── components/
│   └── ChildComponent/
│       ├── ChildComponent.tsx
│       ├── types.ts
│       └── index.ts
├── hooks/
├── model/
└── lib/
```

Required root files:

- `ModuleName.tsx` — the root component and module composition point;
- `styles.css` — module-owned styles;
- `types.ts` — public contracts and prop types;
- `index.ts` — the smallest useful public API.

Optional subdirectories:

- `components` — internal visual building blocks only;
- `hooks` — state, effects, and behavior orchestration;
- `model` — pure domain logic, constants, and state transitions;
- `lib` — small, pure utility functions.

## Component rules

1. One React component per `.tsx` file.
2. Internal components must not be declared in their parent's file.
3. Root components stay focused on composition; state and effects move into hooks.
4. A reusable child component gets its own directory under `components`.
5. Prop types live in a neighboring `types.ts` when the component has a distinct contract.
6. Styles belong to their module and stay next to its root component.
7. External code imports a module through `index.ts`, never through its internal directories.

ESLint enforces the one-component-per-file rule and the component file size limit.

## Content

Demo data lives in `src/content/demo`. Components must not duplicate addresses, phone numbers, prices, promotions, or reviews as string literals in JSX. This boundary allows the demo source to be replaced without rebuilding the presentation layer.

## Imports

Code under `src` uses the `@` alias:

```ts
import { PricingSection } from "@/sections/pricing";
```

Use relative imports within a module. A deep import into another module's internals violates the module boundary.

## Verification

Every change must pass:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run check:bundle
```

CI runs the same sequence on Node.js 22. The bundle budget check prevents the initial JavaScript payload from growing beyond its defined limit.
