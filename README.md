# THOTSL4YER69 — JUST THE TIP

An adults-only, four-act browser brawler about one catastrophically cooked night. This is an original autobiographical parody: vulgar, violent, sexy, stupid and entirely fictional.

## Play

```bash
npm install
npm run dev
```

Vite prints the local address. For a deployable build:

```bash
npm run build
npm run preview
```

The complete static release is emitted to `dist/`.

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Move | A/D or arrows | Left/right buttons |
| Jump | W or Space | Up button |
| Three-hit combo | J | Smack |
| Heavy attack | H | Hard |
| Invulnerable dash | Shift | Dash |
| Consume packet | K | Bag |
| Pigeon air support | L | Pigeon |
| Make it rain ($50) | T | $$$ |
| Pause | Escape | — |

## Complete campaign

1. **The Pink Pigeon** — neon strip-club opening act; Roxi, Lexi, Lola and Chad Chain.
2. **Back-Alley Sermon** — wet-brick 2am chaos; Nyx, Viper, CoinDaddy and the Bag Goblin.
3. **Casino Purgatory** — gold-plated financial self-harm; Candy, Suki, Bianca and CoinDaddy.
4. **Kebab Judgment** — dawn, garlic sauce and consequences; the expanded baddie cast and Damo the Door.

Each act has two escalating crowd waves, a boss, a unique authored environment and a post-act upgrade choice. The final act ends the run and records the best score locally.

## Systems

- Original 84-image production art set: Jack, eight adult female baddies, four male grotesques, pigeon, props, pickups, impact FX and four venues
- Three-hit combo, heavy attack, knockback, dash invulnerability and weapon durability
- Distinct rush, ranged, tease and heavy enemy behaviour
- HIGH meter, damage-buff packets, pigeon screen special and full-meter MONEY SHOT finisher
- MAKE IT RAIN system: spend filthy cash to distract nearby baddies and build HIGH
- Seductive stun attacks from tease-class baddies
- Cash, scoring, combo multiplier, health, drops and boss health
- Six run-changing degenerate upgrades
- Hammer and bottle weapons; packets, energy, kebab and cash pickups
- Four unique venue hazards: bottle-service rain, live puddles, casino debt projectiles and hot grease
- Signature boss mechanics: Chad reinforcements, Goblin theft/teleport, Candy wallet-heal and Damo ground slam
- Three saved difficulty profiles: Messy, Cooked and Unhinged
- Eight persistent degeneracy achievements and eight unlockable after-dark baddie dossiers
- Procedural club beat and synthesized combat/pickup/audio feedback
- Vulgar reactive dialogue, stage intros, boss callouts and complete dawn ending
- Desktop keyboard and responsive mobile touch controls
- Pause, mute, death/retry, content gate and persistent local best score
- Installable PWA shell, offline-after-first-load cache and locally bundled fonts

## Architecture

- Phaser 3 renders and animates the playfield.
- TypeScript simulation owns campaign state, combat, AI, progression and saves.
- DOM/CSS owns menus, cast gallery, HUD, upgrade selection and touch controls.
- Vite produces the browser release.

## Content note

All characters are fictional adults aged 25+. The game contains adult themes, overtly sexualised costumes and dialogue, coarse language, substance parody, blood and stylised arcade violence. The novelty “packets” are fictional game power-ups, not representations or instructions for real substances.

## Release verification

```bash
npm run check
npm run build
npx playwright install chromium
npm run test:e2e
```

The release gates cover strict TypeScript validation, the complete production-asset matrix, the production build, a desktop gameplay journey and responsive mobile touch controls. See [`docs/PLAYTEST_REPORT.md`](docs/PLAYTEST_REPORT.md) for captured browser evidence and the defects found during the ownership pass.

See `CREDITS.md` for asset and dependency provenance.
