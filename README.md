# AUTOSERVICE/01

A cinematic, responsive landing page concept for an auto repair shop, built as a portfolio demo with React, TypeScript, Vite, and scroll-driven motion.

[View the live demo](https://autoservice-voronezh.vercel.app)

> [!IMPORTANT]
> This is a demo project. The company name, address, phone number, reviews, promotions, and all other business content are fictional. The site does not represent a real service center, and its contact details are not intended for customer enquiries.

## Highlights

- Scroll-driven visual storytelling powered by GSAP and Motion
- Responsive interactions tailored to desktop and mobile layouts
- Feature-oriented TypeScript architecture with one React component per file
- Deferred sections, code splitting, and an enforced initial bundle budget

## Getting started

Requires Node.js 22 and npm.

```bash
npm ci
npm run dev
```

Vite prints the local development URL after startup. To verify the production build:

```bash
npm run build
npm run preview
```

## Quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run check:bundle
```

Run the complete verification suite with:

```bash
npm run check
```

## Project structure

Code is grouped by responsibility instead of being collected in a single component directory:

- `src/app` — application entry point and providers;
- `src/pages` — page composition;
- `src/sections` — major page sections;
- `src/features` — user-facing flows, such as contact requests;
- `src/shared` — reusable UI and hooks;
- `src/content/demo` — the single source of demo content;
- `public` — images and video assets.

Each module keeps its root component next to its styles, types, and public `index.ts`. Internal components, hooks, model logic, and utilities live in dedicated subdirectories. Every React component has its own `.tsx` file.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for dependency boundaries and module conventions.

## Core technologies

- React 19
- TypeScript
- Vite
- GSAP and Motion
- Lenis
- Swiper
- Tailwind CSS
