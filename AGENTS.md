# AGENTS.md

This file is for the coding agent working in this repo. Read it at the start of a session.

## What this repo is

**Helferlein** is an animated 3D avatar that a web page can summon as a visible helper (repo description: “Animated 3D avatar.”). Spec and decisions: `SPEC.md`. User docs: `README.md`. Everyday German for “little helper.”

This tree is the product. README and SPEC stay standalone: do not name a host application, a habitat, or an idea garden. The host contract in SPEC.md is how a page uses the avatar. Do not special-case one host inside the avatar.

Implementation follows `design/implementation.md`. Start at its `Next` stop.

License: **PolyForm Noncommercial 1.0.0** (`LICENSE`). Source-available, not OSI Open Source. Do not relicense to Apache/MIT/GPL.

## How to work here

- README.md is the public face. SPEC.md is the product. This file is for the agent.
- The avatar is a figure a host summons, not a control for one kind of UI. It does not implement a panel or a chat. A host may use the resting form as a button that opens a panel; that is one integration, not the product. The included demo is a host, specified in SPEC.md section 13. Do not build the chat into the figure.
- Motions run summoned (the swoop into idle), idle, working, applied, dismissed. Working pulses the face between focused and determined. Dismissed uses the resting face. Applied spins; the new look appears while the back faces the viewer. A roll changes the hue and one or two of body, expression, clothes, tool, and extra. The sit-out, the locks, the absent streaks, and the chances are SPEC.md section 6. Follow that section. The first look is the android with no clothes, no tool, and no extra. Rollable expressions are neutral, curious, pleased, surprised, and wink.
- That “page now shows the finished work” signal is a host event. It is not “a plugin loaded” and not “a task object became active.”
- A new look is one randomize roll. Color is calculated from one hue, with the role table in SPEC.md. Do not store a palette list.
- The roll survives the host reloading the page, and it stays until the next such signal.
- Prefer small, reversible files.
- Stack: plain JavaScript ES modules, no UI framework. Three.js is a **peer dependency** (`peerDependencies.three` in `package.json`; CI tests the floor of that range and the dev version). `src/three.js` lists the Three.js classes the figure uses as named imports, so the bundle stays tree-shaken; a new class goes there. Do not vendor a Three.js build again.
- Build: `npm run build` (esbuild, `scripts/build.mjs`) writes `dist/helferlein.js` (ESM, `three` external) and `dist/helferlein.min.js` (IIFE, `window.Helferlein`, three bundled, with the three.js MIT notice in its banner). `dist/` is not committed; CI, the release and the Pages workflow build it. The demo pages load `dist/helferlein.min.js`, so build before opening them.
- Size budget: `npm run size` (`scripts/size.mjs`) fails above the fixed raw and gzip budgets. Raising a budget is its own commit with the reason.
- Public API: `src/index.js` and `types/index.d.ts` change together; `test/types.test.js` checks that the declared catalog, look and exports match the code. `npm run typecheck` compiles `types/check.ts`.
- Reduced motion and no WebGL are part of the contract: with `prefers-reduced-motion: reduce` (or `reducedMotion: true`) nothing floats or swoops and a roll appears at once; without WebGL `mount` returns the still fallback (`webgl: false`) instead of throwing. `test/mount.test.js` covers both.
- Layout: `src/` the figure (`index.js` public entry, `figure.js` mount, `machine.js` host events, `roll.js` rolls, `blob.js` stored roll, `draw.js` meshes, `catalog.js`, `motion.js`), `types/` declarations, `demo/` the included host, `site/` the Pages landing page, `prototype/` the throwaway prototype (Three.js via import map from `node_modules`), `design/` notes and the mugshot tool, `docs/images/` README screenshots, `test/` `node:test` suites, `scripts/` build, size, and mugshots.
- Tests: `npm test` must pass before anything lands on `main`, together with `npm run build`, `npm run size` and `npm run typecheck`. Tests stay offline: no real accounts, tokens or live services.
- Release paths (only commits touching them can cut a release) are listed in `.github/release.json`. A Dependabot bump of the `three` dev dependency is `chore(deps-dev)` and cuts no release, although it changes the three.js inside `dist/helferlein.min.js`; it ships with the next `feat`/`fix` release.
- npm: not published. `"private": true` in `package.json` stays until the maintainer decides to publish; the note for a provenance publish step is in `.github/workflows/ci.yml`.

## Shared rules

### Commits and changes

- [Conventional Commits](https://www.conventionalcommits.org/) for every commit: `feat:`, `fix:`, `perf:`, `docs:`, `test:`, `refactor:`, `chore:`, `ci:`, `build:`, optional scope, `!` for breaking changes.
- **Trivial changes go straight to `main`:** typos, small docs fixes, obvious small bugs, housekeeping. Keep commits small and focused; pull before you commit, CI pushes release commits to `main`.
- **Non-trivial findings become GitHub issues** (with the matching issue form): bugs you do not fix right away, design questions, anything that needs a decision. Do not hide them in a commit.
- **Never force-push**, never rewrite pushed history, never delete branches or tags.
- **No comments, reviews, label changes, closes or merges on other people's issues and PRs** unless the maintainer asked for it in the session. Exception: Dependabot PRs (see below). Opening issues for your own findings and closing them with your own commits (`Closes #n`) is fine.
- **Never write the skip-CI token** (the word `skip` and `ci` in square brackets, or any of its variants) in a commit message, not even quoted or explained: GitHub then skips CI for that push and no release is cut. Only `release.py` puts it in its own release commits.

### Versions and releases

- SemVer, one tag: `vX.Y.Z` (one component in `.github/release.json`, `tag_prefix` `v`).
- `feat:` bumps minor, `fix:`/`perf:` patch, `feat!:`/`fix!:` or a `BREAKING CHANGE:` footer major. **Before 1.0.0 a breaking change bumps the minor version** (0.3.x to 0.4.0, never to 1.0.0). Reaching 1.0.0 is a deliberate decision by the maintainer, not a side effect.
- `docs:`, `test:`, `refactor:`, `chore:`, `ci:`, `build:` never bump. A commit only counts when it touches a release path.
- **Release 1.0** (or any chosen version): an empty commit with the footer `Release-As: 1.0.0`, e.g. `git commit --allow-empty -m "chore: release 1.0" -m "Release-As: 1.0.0"`. With several artifacts in `.github/release.json`, name one per footer line: `Release-As: <name>@1.0.0` (the bare form is then ignored). It releases by itself, regardless of type or paths; upwards only (at or below the current version it is ignored with a warning); several footers: the highest wins. Only use it when the maintainer decided the version.
- After CI passes on a push to `main`, `.github/scripts/release.py` computes the version, updates the version file if there is one (commit `chore(release): …` by github-actions), creates the GitHub Release with notes and attaches the build. **Never tag, bump versions or create releases by hand.**

### Dependabot

- Commit prefixes (set in `.github/dependabot.yml`): runtime dependencies and shipped Docker base images `fix(deps):` (patch release), dev dependencies `chore(deps-dev):`, GitHub Actions `ci(deps):`, images that are not shipped (examples, tests) `chore(deps):`.
- **Never turn a dependency update into `feat!:`** or reword its title. A major dependency update is still `fix(deps)` / `chore(deps-dev)`. If it forces a breaking change on users (for example a new minimum runtime), that is a separate, deliberate commit after the maintainer decides.
- **Merge Dependabot PRs when CI is green** (squash, keep the Dependabot title). If one conflicts, comment `@dependabot rebase`. If CI is red and the fix is not obvious, leave the PR open and open an issue.

### Secrets

- Never commit, print, log or paste tokens, API keys, credentials, `.env` files, session files or real service responses: not in code, tests, fixtures, issues, PRs or commit messages. Use synthetic fixtures.
- Security problems are reported privately (`SECURITY.md`). Do not discuss an unfixed vulnerability in a public issue.

### Contributions

- Outside pull requests are not accepted (see `CONTRIBUTING.md`); issues are.
- `CONTRIBUTING.md` holds **only content for outside people**: license, how to report, how to build and test. Internal working rules (this file) never go there.

### Website

- Site: <https://pihme.github.io/helferlein/>, the live demo and wardrobe, built from `main` by `.github/workflows/pages.yml`: the landing page `site/index.html`, `demo/`, the pure `src/roll.js` and `src/blob.js`, and `dist/` (so `dist/helferlein.min.js` there is always the build of `main`). It runs after a successful CI run on `main` (`workflow_run`), release job included, and checks out `main` again, so after a release it builds the release commit and the files carry the released version. The workflow skips while the repository is private. Do not create a `gh-pages` branch by hand.
- **Repo description = site tagline.** Keep `site/index.html`, `package.json` `description` and the GitHub repo description in step.
- Helferlein is not in the family's `family.json` (Jigsaw) or the handbook generator yet; adding it is the maintainer's decision. When it joins, the family rules for the current status, the chronicles and the Jigsaw apply.

## Mugshots

A mugshot is one sheet of a single catalog item, for the status quo of a design and for the reference picture a later test compares against. The sheet is four panels: front, side, and top of the item on its own, then context. Context starts from the stage camera (`stageCamera` in `src/draw.js`) and backs up along that same view when the figure would leave the frame. A flat extra stands level in the three solo views; the angle it is worn at stays in context. In the top view the front points down, on a body and on every other item. In context, a garment, a tool, or an extra is worn on the android. A body is shown as itself, and its solo views include the face and the arms. A garment is the cloth on that shell, so its solo views have no face and no arms. A tool's solo views use the axes it was built in, working end toward the top of the front view; the grip appears only in context.

The tool is `design/mugshot.js`. The writer is `scripts/mugshots.mjs` (`npm run mugshots`). It is a helper, not part of the figure.

- `npm run mugshots` writes every item to `design/progress/<folder>/<slug>.png`.
- `npm run mugshots -- --into final` writes the reference set to `design/final`.
- `npm run mugshots -- --only wrench` writes one item. A catalog name or its prototype slug both match.
- `npm run mugshots -- --out <dir>` writes those same folders under `<dir>` instead, for a look that stays out of `design/progress`, `design/final`, and `design/locked`.
- `npm run mugshots -- --serve` prints a local URL for `design/mugshot.html` and leaves the viewer up.

Folders are `bodies`, `clothes`, `tools`, and `extras`, and the slug is the prototype picture's name. PNGs under `design/progress`, `design/final`, and `design/locked` are Git LFS. Headless Chromium is `/snap/bin/chromium`, or the browser in `CHROME` when it lives elsewhere. The run is done when each requested sheet is a PNG and its four panels are labeled Front, Side, Top, and Context.

## Locked designs

The PNG sheets in `design/locked` are the reference images, in the same folders and slugs as the mugshots. Every body, garment, tool, and extra has one.

After a geometry change, render a mugshot of each item whose mesh changed and compare it with that item's locked sheet. The work matches the reference when front, side, top, and context still show the same shape. Render with `npm run mugshots` into `design/progress`. When a panel differs, leave the locked sheet as it is and report the difference.

Leave every locked image unchanged during the work. Replace one only when the user explicitly asks to update that reference. The mugshot writer refuses to write into `design/locked`. Copy a finished progress sheet in by hand.

## Do not invent

- A drawing or a runtime beyond SPEC.md sections 11 and 12. The figure uses Three.js as a peer dependency and no UI framework. Every body publishes the same named points. A new body, clothes, tool, or extra is added on its own, without editing the others, and only when asked. The catalog in SPEC.md section 8 is the shipped set. Each look is the sheet in `design/locked` (SPEC.md section 9). Where a sheet and an older note disagree, the sheet wins. The pages in `design/prototype` are the earlier pass. Product grips are in `design/holds.md`, from how a person holds the object. The pose sketches are shape concept art, not hold references. Do not copy the prototype `HOLDS` angles into the implementation. The prototype pass is done.
- Lightness or chroma numbers for the color roles, or a warm/cool cut in the green band, until those are chosen. The shape of the function is in SPEC.md.
- A second product name, or a shortened CLI name
- Host-specific words in README.md or SPEC.md

## Agent skills

### Issue tracker

GitHub issues in `pihme/helferlein`, via `gh`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default roles: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`, plus `bug` / `enhancement`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: decisions in `SPEC.md`, optional root `GLOSSARY.md`. See `docs/agents/domain.md`.
