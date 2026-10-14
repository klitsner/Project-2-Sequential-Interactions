# Project 2: Sequential Interactions

**Live site:** https://klitsner.github.io/Project-2-Sequential-Interactions/

## Statement sequence prototype

One continuous interaction built from the four studies (`study-*.zip`): a sheet of paper on the ground is
**picked up → flipped → crumpled → thrown** into a trash can. It lives in [`/docs`](docs/) and runs as plain
HTML/JS (no build step). To publish it, set GitHub Pages to deploy from the `main` branch, `/docs` folder.

- `docs/js/core.js`, `common.js` — the studies' shared helpers (one copy)
- `docs/js/paper.js` — the one sheet's faces, reused by every step
- `docs/js/stage-*.js` — each study, adapted as a step
- `docs/js/sequence.js` — runs the steps in order, the hand-off transitions, reset and the ending
