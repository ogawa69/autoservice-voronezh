# AUTOSERVICE/01

**A portfolio demo built to show how I develop animation-heavy websites—not just how I style static sections.**

I built AUTOSERVICE/01 from the interaction logic up. The car responds to scroll. Pricing gets different interactions on desktop and mobile. The final scene moves from customer proof to contact. Behind those visuals are reliable media loading, reduced-motion states, keyboard controls, tests, and a strict bundle budget.

[View the live site](https://autoservice-voronezh.vercel.app) · [Read the architecture](./ARCHITECTURE.md)

[![AUTOSERVICE/01 — black performance car with its headlights on](./public/hero/dark.png)](https://autoservice-voronezh.vercel.app)

## Main sequences

- **Exterior-to-engine hero.** Wheel, touch, and keyboard input can accelerate the opening video up to 4×. The intro then hands control to a reversible, scroll-scrubbed reveal.
- **Device-specific pricing.** Desktop presents services as a spatial card sequence. Mobile gets a compact 3D flip with keyboard controls, built for the smaller viewport.
- **Drive-away finale.** The closing sequence moves from video into opposing review marquees. Typed contact details and a map complete the page.

## Production details

Good motion has to survive more than a perfect desktop recording. Loading states, reverse scrolling, accessibility, and maintainability are part of the interaction itself.

- **Stable media handoffs.** The poster stays visible until the first decoded video frame is ready. Failed video requests retry before the page switches to a static fallback.
- **Responsive behavior, not just responsive layout.** Pricing, contact dialogs, media, and scroll timing change between desktop and mobile. Reduced-motion preferences receive deliberate static states.
- **Measured performance.** Initial JavaScript dropped from about 891 kB to 645.6 kB raw, and from 279.9 kB to 203.1 kB gzip. Lower sections load as separate chunks. CI rejects builds above 700 kB raw or 225 kB gzip.
- **Code that can be changed safely.** Hero, pricing, promotions, and drive-away each own their components, hooks, styles, types, and state logic. The project has 49 React component files. None exceeds 199 lines.
- **Regression coverage.** The 18 automated tests cover video handoffs, reverse scrubbing, restored scroll positions, mobile card continuity, and motion-state logic. Every push runs TypeScript, ESLint, tests, a production build, and the bundle budget check.

## Run it locally

Requires Node.js 22 and npm.

```bash
npm ci
npm run dev
```

Create and preview a production build:

```bash
npm run build
npm run preview
```

Run the complete verification suite:

```bash
npm run check
```

## Stack

React 19 · TypeScript · Vite · GSAP · Motion · Lenis · Swiper · Tailwind CSS

> **Demo content:** This is a fictional portfolio project. The business name, address, phone number, reviews, promotions, and other commercial content do not represent a real service center.
