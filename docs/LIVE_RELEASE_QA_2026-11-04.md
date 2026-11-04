# Live browser release: QA and scope record — 4 November 2026

## Verified build
- Git revision: `34f857ca3b73072d90c94d2c094ce59cdf7cc288`
- CI: [Production build workflow #81](https://github.com/thotsl4yer69/thegame/actions/runs/41811197236) — **success**
- Security: npm production dependency audit **passed**, full dependency audit **passed** after upgrading Vite from 7.3.6 to 7.3.7.
- TypeScript and authored asset matrix: **passed**
- Vite production build: **passed**
- Browser tests: **passed** for desktop journey, mobile landscape touch controls, offline reload, overworld campaign choices, and mobile portrait rotation/landscape flow
- Vercel production deployment for commit: **READY**, https://ts69-just-the-tip.vercel.app/

## Why changes were necessary
Previous GitHub Production build runs were failing in the dependency audit before any of the Playwright browser tests executed. Reporting the Vercel READY state as proof of gameplay quality was incorrect. The audit failure was resolved with patched Vite 7.3.7. The Android portrait orientation previously lacked a clear, usable path for a landscape-first arcade game, so a rotation prompt and a corresponding Playwright regression test were added.

## Not verified / release acceptance pending
- Actual gameplay on the project owner's Android handset, including browser version and hardware.
- Game-design quality, gameplay enjoyment, performance on lower-memory Android handsets, and end-to-end boss clear.
- Unique players, actual distribution, audience retention or revenue.

Do not claim these are verified. The Playwright suite passing is not the same as independent human playtesting or live field validation.

## Brand
This remains an individual experimental **18+** game, not the flagship of the broader THOTSL4YER69 INDUSTRIES brand. The company-facing site leads with actual merchandise and creative projects and describes the game as under review until owner acceptance.
