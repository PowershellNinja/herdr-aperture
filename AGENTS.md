# Agent contract: herdr-aperture

An Aperture Science / GLaDOS layout for the Herdr desktop app.

## Source of truth
1. The task brief (terminology table, GLaDOS personality, Cake and Boot
   Protocols, "preserve usability"). It wins over everything else.
2. Herdr's own docs decide what is possible: `~/.config/herdr-app/AGENTS.md`,
   `herdr.d.ts`, `gpui-kit.d.ts` (rewritten by Herdr on every start; read
   them, never copy them in). Never invent an API they don't list; write the
   limitation into `README.md` instead.

## Shape
- `aperture/` is the community-layout folder: `layouts/aperture.json`,
  `mods/aperture/`, `RECIPE.md`, `preview.png`.
- One mod, many roles (`props().role`), like Herdr 98 and LCARS.
- `events.js`, `lexicon.js`, `names.js`, `order.js` and `prefs.js` are pure: no `herdr` / `gpui-kit` imports, so
  `node --test` can run them.
- All art, sounds and dialogue are original. Fonts are OFL (Barlow).
  No Valve logos, audio or quoted game lines.

## Tier 2 here
- Anything that ends a terminal (Boot Protocol). It always asks first and
  acts only on the pane it was opened for.
- Writing outside `mods/aperture/` or `layouts/aperture.json` in the Herdr
  home. Never touch `settings.json`, `keys.json` or Herdr's shipped
  layouts and mods.

## Gate (all green before a commit)
```sh
npm test                                   # node --test on the pure logic
node tools/install.mjs                     # copy into ~/.config/herdr-app
herdr-app check ~/.config/herdr-app/mods/aperture
herdr-app do layout.switch --name aperture
herdr-app status                           # "errors": [] required
herdr-app shot                             # look at it
```

## Working rules
- Small, separately committed steps on a branch; never push to main.
- Herdr's usability stays intact: no key in `keys.json` changes, every
  action runs a real Herdr command, Herdr's own menus are reused.
- Rules added later name the incident that earned them.
