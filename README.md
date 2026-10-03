# Helferlein

<p align="center">
  <img src="docs/mascot.png" width="220" alt="Helferlein in its first look: a pale peanut-shaped android with a dark visor, two round blue eyes, a small smile and thin arms">
</p>

[![CI](https://github.com/pihme/helferlein/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/pihme/helferlein/actions/workflows/ci.yml)
[![License: PolyForm Noncommercial 1.0.0](https://img.shields.io/badge/license-PolyForm%20Noncommercial%201.0.0-blue)](LICENSE)
[![three.js](https://img.shields.io/badge/three.js-%3E%3D0.170-049ef4)](package.json)

Helferlein is an animated 3D avatar, built on [Three.js](https://threejs.org/), that a web page can summon as a visible helper. The name is everyday German for “little helper.” The page calls it into view: it swoops in from a small resting form, floats and idles while it waits, and holds a working pose while work is in progress. When the page says the finished work is on screen (the `applied` event), it spins, and a randomized new look appears while its back faces you. Dismissed, it folds back into the resting form.

A new look is one roll. It changes the hue and one or two of the body, the expression, the clothes, a tool in hand, and one extra such as bunny ears or a hat, never all of them. The colors of all parts are computed from that one hue, so they harmonize. Something that just changed sits out the next roll, and a new tool, new clothes, or a new extra stays for a while. The first look is a plain android with no clothes, no tool, and no extra. The rules are in [SPEC.md, section 6](SPEC.md#6-host-contract).

Helferlein draws only the figure. The page that embeds it (the *host*) owns everything around it: the chat, the panel, the navigation, the background.

- [Website](https://pihme.github.io/helferlein/): the live demo and wardrobe
- [Specification](SPEC.md): product spec, host contract, catalog
- [Contributing](CONTRIBUTING.md): issues welcome, outside pull requests not accepted for now
- [Security](SECURITY.md): private vulnerability reporting
- [Third-party notices](THIRD_PARTY_NOTICES.md): three.js, bundled into the script-tag build

## Status

The figure, the host contract, and the demo are implemented and covered by tests, which CI runs together with the build, a fixed size budget, and the type declarations. The catalog has eight bodies, five rollable expressions, six garments, twelve tools, and fourteen extras. The figure respects reduced motion and falls back to a still silhouette without WebGL. Still open, from [SPEC.md, section 10](SPEC.md#10-open): the base drawing, the lightness and chroma numbers per color role, another pass at the tool meshes and how each tool is held, and the placement of some extras. Helferlein is not published to npm; builds come from [GitHub Releases](https://github.com/pihme/helferlein/releases) or a checkout.

## Screenshots

The demo page (chat open, the figure above it) and the wardrobe, from `demo/`:

<p>
  <img src="docs/images/demo.png" alt="Demo page: a peanut-shaped figure in a striped shirt with bunny ears floats above a chat window with a sample reply" width="49%">
  <img src="docs/images/wardrobe.png" alt="Wardrobe page: a lightbulb-shaped figure in a suit with a propeller holds a magnifying glass, between the body, face and color choices on the left and the clothes and tool choices on the right" width="49%">
</p>

## Try it

On the [website](https://pihme.github.io/helferlein/), or locally. Needs Node.js 22 or newer and a browser with WebGL. The pages load ES modules, so serve the checkout over HTTP; opening the files directly (`file://`) does not work.

```bash
git clone https://github.com/pihme/helferlein.git
cd helferlein
npm ci
npm run build                   # dist/helferlein.js and dist/helferlein.min.js
python3 -m http.server 8000     # or any static file server
```

- <http://localhost:8000/demo/demo.html>: **Demo.** The page explains the avatar; the resting figure sits in the bottom right. Click it to summon it and open a chat. A message makes the figure work, then a fixed sample reply comes back (no model is called), the figure turns, and while its back faces you the page reloads with a new look and a new background. Closing the chat dismisses it.
- <http://localhost:8000/demo/wardrobe.html>: **Wardrobe.** Body, face, and color on the left, clothes, tool, and extra on the right. **Randomize** runs one roll, the same roll the demo uses; choosing a part plays the same turn. Drag the figure to turn it.
- <http://localhost:8000/prototype/helferlein.prototype.html>: the throwaway visual prototype, not the product.

Both demo pages load the script-tag build `dist/helferlein.min.js`, like any host would, and share the stored roll in the browser's local storage (key `helferlein-demo`).

## Use it

Two builds, the same API:

| File | Three.js | Load it with |
| --- | --- | --- |
| `dist/helferlein.min.js` | Bundled (tree-shaken, minified) | A plain `<script>` tag; it defines `window.Helferlein` |
| `dist/helferlein.js` | Not included: imports `three`, a peer dependency (`>=0.170.0`) | `import { mount } from "helferlein"` with a bundler or an import map |

Helferlein is **not on npm**. Each [GitHub Release](https://github.com/pihme/helferlein/releases) attaches `helferlein.min.js`, `helferlein.js` and the package file `helferlein-X.Y.Z.tgz`. After the repository is public, the website also serves the build of `main` at `https://pihme.github.io/helferlein/dist/helferlein.min.js`; for a fixed version, use a release file.

### Script tag

```html
<div id="helper" style="width: 320px; height: 360px"></div>
<script src="helferlein.min.js"></script>
<script>
  const figure = Helferlein.mount(document.getElementById("helper"));
  figure.summon();
</script>
```

### ES module

```bash
npm install three ./helferlein-X.Y.Z.tgz      # the package file from a release
```

```js
import { mount } from "helferlein";

const figure = mount(document.getElementById("helper"));

// Restore the look the page kept from last time, if any.
const saved = localStorage.getItem("helferlein");
if (saved) figure.setBlob(JSON.parse(saved));

figure.summon();                 // swoop in, then idle
figure.working();                // working pose while your page does its work
await figure.applied();          // the result is on the page: spin, new look
localStorage.setItem("helferlein", JSON.stringify(figure.getBlob()));
figure.dismiss();                // fold back into the resting form
```

Without a bundler, an import map points `three` at a three.js module build (from `node_modules/three/build/three.module.js` or a CDN of your choice):

```html
<script type="importmap">
  { "imports": { "three": "./node_modules/three/build/three.module.js" } }
</script>
<script type="module">
  import { mount } from "./node_modules/helferlein/dist/helferlein.js";
</script>
```

`mount(element, options)` draws into `element` (a container, or a `<canvas>`), so give the element a size. In a container it adds a canvas that fills it at any pixel ratio, without CSS from the page. A `<canvas>` passed in keeps its CSS size, or, without one, the size of its `width` and `height` attributes. It sets the CSS variable `--mesh-pad` on the element: the fraction of the view below the figure's lowest point, for placing it against an edge.

| Option | Default | Effect |
| --- | --- | --- |
| `reducedMotion` | follows `prefers-reduced-motion` | `true`: calm, see below. `false`: always animate. Left out, it follows the reader's setting, also when it changes while the page is open. |

### Host events

The host drives every motion; the avatar watches no files, processes, or network calls. [SPEC.md, section 6](SPEC.md#6-host-contract) is the contract.

| Call | What the figure does |
| --- | --- |
| `summon()` | Swoops out of the resting form, then idles. |
| `working()` | Working pose; the face pulses between focused and determined. Only while summoned. |
| `idle()` | Back to idle from working, look kept: a finished turn that was not applied. |
| `applied()` | Only after `working()`. Rolls a new look and spins; the look switches while the back faces the viewer. Returns a promise that resolves when the spin ends. |
| `applied({ look, memory })` | Spins to a roll the host already made, for example with `rollFrom`, as the demo does before it reloads. |
| `dismiss()` | Folds back into the resting form, with the resting face. A dismiss before the back faces the viewer keeps the previous look. |

*Applied* means the finished work is what the person now sees, for example after the host reloaded the page. It is the only event that rolls a new look.

### The stored roll

The look and its memory (what just changed, the locks, the absent streaks) are one plain JSON blob, `{ look, memory }`. The host decides where to keep it. The hue is a whole number of degrees, 0 to 359: `setLook`, `setBlob` and `rollFrom` round any other finite number and wrap it around the wheel (`-5` becomes `355`, `360` becomes `0`); a hue that is not a number is rejected.

| Call | Use |
| --- | --- |
| `getBlob()` | The current blob. |
| `setBlob(blob)` | Restores a blob without a spin. A blob with unknown or missing fields, or a value of the wrong type, is rejected with an error. The wardrobe's hue slider uses it. |
| `watchReveal(fn)` | Calls `fn` once, at the moment the new look appears during the next spin. The demo saves the roll and reloads the page there. |
| `returnFromBack()` | After such a reload: the figure starts facing away and turns back to the viewer. Returns a promise. |
| `setLook(partial)` | Sets parts of the look directly, for example `{ hue: 30 }`, without a spin. The memory is kept. It checks the values like `setBlob`. |
| `turn(yaw, pitch)` | Rotates the figure by the given radians; pitch stops at 70°. The wardrobe uses it for dragging. |
| `dispose()` | Stops the animation loop, frees the renderer, and removes what `mount` added. |

The module also exports `rollFrom(look, memory)` (one roll, as `applied()` does; it checks the look like `setBlob` and throws a `TypeError` without one), `defaultLook()`, `blankMemory()`, and the catalog lists `SHAPES`, `ROLL_EXPRESSIONS`, `CLOTHES`, `TOOLS`, `EXTRAS`. On the figure, `webgl` and `reducedMotion` tell the host which mode it runs in.

### Types

TypeScript declarations ship with the package (`types/index.d.ts`, the `types` entry in `package.json`): `mount`, `MountOptions`, the `Figure` with its host events, `Look`, `Memory`, `LookBlob`, and the catalog names as string unions.

### Reduced motion and no WebGL

- **Reduced motion** (`prefers-reduced-motion: reduce`, or `reducedMotion: true`): nothing floats, sways, or flaps, the swoop and the fold are cuts, the working face holds on focused, and `applied()` shows the new look at once and resolves without a spin. The events and the stored roll work the same.
- **No WebGL:** `mount` does not throw. It returns a still silhouette in the look's colors (`figure.webgl === false`, the cause in `figure.error`), with the class `helferlein-fallback` and `data-presence` / `data-activity` attributes for the host's CSS. The events, `applied()` and the stored roll work the same; a new roll changes the colors at once.

## Build and test

```bash
npm ci
npm run build       # esbuild: dist/helferlein.js (ESM, three external) and dist/helferlein.min.js (IIFE, three bundled)
npm run size        # fails above the fixed budget
npm run typecheck   # compiles types/check.ts against types/index.d.ts
npm test            # node --test
```

`dist/` is not committed: CI, the releases and the website build it. The size budget (`scripts/size.mjs`) is fixed per file, raw and gzip:

| File | Budget raw | Budget gzip |
| --- | --- | --- |
| `dist/helferlein.js` | 92,000 B | 23,000 B |
| `dist/helferlein.min.js` | 640,000 B | 165,000 B |

Most of `helferlein.min.js` is the three.js WebGL renderer, which tree-shaking cannot drop. The tests run offline in Node with Three.js and a stubbed canvas: the roll rules, the blob validation, the state machine, the catalog, the demo store, the figure built against Three.js, the reduced-motion and no-WebGL paths of `mount`, and that `types/index.d.ts` matches the code. CI runs them on Node.js 22 and 24, and once more against the lowest three.js in the peer range.

## Releases

Releases are automatic. After CI passes on `main`, `.github/scripts/release.py` reads the [Conventional Commits](https://www.conventionalcommits.org/) since the last tag: `feat` bumps the minor version, `fix` and `perf` the patch version. Before 1.0.0 a breaking change bumps the minor version too. A commit footer `Release-As: X.Y.Z` sets a version on purpose. Each release is a tag `vX.Y.Z` with a GitHub Release that attaches `helferlein.min.js`, `helferlein.js`, `helferlein-X.Y.Z.tgz`, `LICENSE` and `THIRD_PARTY_NOTICES.md`. Nothing is published to npm.

## Layout

| Path | Contents |
| --- | --- |
| `src/index.js` | The public entry: `mount`, `rollFrom`, `defaultLook`, `blankMemory`, the catalog lists |
| `src/three.js` | The Three.js classes the figure uses, as named imports (keeps the bundle tree-shaken) |
| `src/figure.js` | `mount`: renderer, scene, camera, the animation loop, reduced motion, the no-WebGL fallback, and the host calls |
| `src/machine.js` | The host-event state machine (summon, working, idle, applied, dismiss) |
| `src/roll.js` | The catalog lists, the default look, and `rollFrom`, one roll with sit-outs, locks, and streaks |
| `src/blob.js` | `readBlob` and `writeBlob`: validation of the stored roll |
| `src/draw.js` | The meshes: bodies, faces, clothes textures, tools, extras, and their colors |
| `src/catalog.js` | The registry each body, garment, tool, and extra is added to |
| `src/motion.js` | The spin, the working face pulse, ear flicks, and the named rig points |
| `types/` | `index.d.ts`, the declarations; `check.ts`, their compile check |
| `scripts/` | `build.mjs` (esbuild) and `size.mjs` (the size budget) |
| `demo/` | The included host: `demo.html` (chat), `wardrobe.html`, their scripts, the stored state (`store.js`), and the part icons |
| `site/` | The website's landing page; the Pages workflow adds the demo and the build |
| `prototype/` | The visual prototype (three.js through an import map from `node_modules`) |
| `assets/` | Reference sketches of the shape (SVG): [sheet](assets/helferlein-poses.svg), [resting](assets/helferlein-lamp.svg), [idle](assets/helferlein-idle.svg), [thinking](assets/helferlein-thinking.svg), [applied](assets/helferlein-applied.svg). Concept art, not the design |
| `design/` | Prototype notes per part, the tool grips (`holds.md`), and the implementation plan |
| `docs/images/` | The screenshots in this readme |
| `test/` | `node:test` suites |

## Third-party software

`dist/helferlein.min.js` bundles three.js (MIT); `dist/helferlein.js` imports it as a peer dependency instead. Licenses and the rest of the inventory: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## How this project is built

Helferlein is developed agent-first. AI coding agents write all code,
tests, and documentation, and review each other's changes, under human
direction: specs, design decisions, and acceptance based on observed
behaviour and test results. No human reads the code line by line. This
is a deliberate choice. Quality rests on automated tests, CI, and
independent agent review.

Evaluate the code against your own requirements before you depend on it.
Found a problem? Open an issue.

## License

[PolyForm Noncommercial License 1.0.0](LICENSE). Source-available; not OSI Open Source. Commercial use is not granted. Other licenses can be negotiated with the copyright holder.
