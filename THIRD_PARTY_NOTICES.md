# Third-party software

Helferlein itself is licensed under [PolyForm Noncommercial 1.0.0](LICENSE). This file lists the third-party software it contains or runs, with the notices their licenses ask for.

## Bundled into `dist/helferlein.min.js`

### three.js

MIT license, <https://github.com/mrdoob/three.js>. The script-tag build `dist/helferlein.min.js` (built by `npm run build`, attached to each [GitHub Release](https://github.com/pihme/helferlein/releases), served on the website, and included in the package file as `helferlein/min`) contains the parts of three.js the figure uses, tree-shaken and minified, from the `three` version locked in `package-lock.json`. Its header comment names that version and carries the three.js license text below.

The ES module build `dist/helferlein.js` does **not** contain three.js: it imports `three`, a peer dependency you install yourself (see the [README](README.md)), under its own license. This repository no longer vendors a three.js build.

The three.js LICENSE file:

```
The MIT License

Copyright © 2010-2026 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

## Assets

Helferlein contains no third-party models, textures, fonts, icons, animations or shaders. The meshes, the clothes textures and the faces are generated in code (`src/draw.js`) through three.js. The sketches in `assets/`, the icons in `demo/icons.js`, the screenshots in `docs/images/` and `design/prototype/`, and the fallback silhouette in `src/figure.js` were made for this project. The pages use the browser's `system-ui` font and ship no font file.

The sources linked in [`design/holds.md`](design/holds.md) are references for how a person holds each tool. Helferlein links to them and contains none of their text or images.

## Development tools (run, not included)

Helferlein doesn't contain these. They are dev dependencies or programs used to build and test it; their own licenses apply to them.

| Program | License | Used for |
| --- | --- | --- |
| [three.js](https://threejs.org/) (`three`, dev and peer dependency) | MIT | The tests, the prototype page, and the input of `dist/helferlein.min.js` (above) |
| [esbuild](https://esbuild.github.io/) | MIT | `npm run build`: bundles `dist/helferlein.js` and `dist/helferlein.min.js` |
| [TypeScript](https://www.typescriptlang.org/) | Apache-2.0 | `npm run typecheck`: compiles `types/check.ts` against `types/index.d.ts` |
| [Node.js](https://nodejs.org/) | MIT | The tests (`node --test`, with the built-in `node:test` and `node:assert`), the build and the size check |
| A web browser | Its own | The demo, the wardrobe, the website and the prototype page, which use the browser's WebGL |
