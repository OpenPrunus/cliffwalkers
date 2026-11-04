# Cliffwalkers

[![CI](https://github.com/OpenPrunus/cliffwalkers/actions/workflows/ci.yml/badge.svg)](https://github.com/OpenPrunus/cliffwalkers/actions/workflows/ci.yml)

A line of little walkers leaves a hatch and marches straight on, never stopping — toward cliffs, walls, water and the void. You cannot
steer them. You can only give a few of them **skills** so that enough of them reach the door. A puzzle game in the spirit of the 1991
classic, in the browser, with no account, installable and playable offline.

## Features

- **Eight skills**: climber, floater (parachute), bomber (5 s fuse, leaves a crater), blocker, builder (a staircase that climbs until it
  reaches ground, up to 30 steps), basher (horizontal tunnel), miner (diagonal tunnel), digger (down).
- **Markers**: climber, floater, builder, basher, miner and digger are *planted on the scenery* — tap where you want the work done and the
  first walker to pass over the marker carries it out (a floater or climber marker serves every walker that passes, while stock lasts;
  tap a marker to remove it). Only the blocker and the bomber are given to a particular walker by tapping it. Steel stops the diggers; falling more than 60 px kills without a parachute.
- **Destructible terrain** on a pixel grid, water, steel, a time limit, a release rate you can raise, fast-forward, pause and a "blow
  everyone up" button.
- **Eight levels** that each teach a skill (the first one is the wall, with the Basher already selected); only the skills a level offers are shown, with a hint under the scene; progress and best scores are kept in the browser, levels unlock one after the other.
- **Mouse, touch and keyboard** (1–8 skills, P/Space pause, F fast, N nuke, +/− release rate, R restart, Esc leave). The scene is pixel
  art scaled without blur and fits any screen, portrait or landscape.
- French and English, synthesized sounds, **installable and playable offline** (PWA: manifest, icons, network-first service worker).

## Run it

```bash
docker compose up -d --build     # http://localhost:8099
# or, without Docker, any static server on web/:
npm run serve                    # python3 -m http.server 8099 --directory web
```

It is a static site: `web/` is the whole game (HTML, CSS and JavaScript modules, no build step, no dependency).

## How it works

```
web/js/engine.js   the simulation: terrain, walkers, skills, game rules. Integer-only and deterministic (30 steps per second)
web/js/levels.js   the levels: terrain description, entrance, door, skills, goal, time — and the recorded SOLUTION of each level
web/js/render.js   the drawing (terrain image updated only when it changes, pixel-art walkers)
web/js/main.js     screens, game loop, mouse / touch / keyboard, progress
```

Because the engine is deterministic, **every level ships with a solution** (a list of `{ id, skill, age | x }` orders) that the tests
replay: a level that cannot be won, or that can be won with no skill at all, fails the build.

## Tests

```bash
npm run test:unit      # engine (every skill), levels and their solutions, translations, PWA
npm run test:browser   # a real headless Chrome: menus, a full level by mouse and by touch, phone layouts, offline
```

## License

MIT — see [LICENSE](LICENSE).
