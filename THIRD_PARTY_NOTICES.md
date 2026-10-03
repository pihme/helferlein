# Third-party software

Helferlein itself is licensed under [PolyForm Noncommercial 1.0.0](LICENSE). This file lists the third-party software it contains or runs, with the notices their licenses ask for.

## Contained in this repository

### three.js r160

MIT license, <https://github.com/mrdoob/three.js/tree/r160>. Vendored as [`prototype/three.min.js`](prototype/three.min.js), byte-identical to `build/three.min.js` of the npm package `three@0.160.0` (SHA-256 `170c6789f43217c96b3170f4b42fafe135de7f7cd48497a4218f9757ee1d49fa`). The figure, the demo pages (`demo/demo.html`, `demo/wardrobe.html`), the prototype page and the tests load this file. The file keeps its own license header. Its LICENSE file:

```
The MIT License

Copyright © 2010-2023 three.js authors

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

Helferlein contains no third-party models, textures, fonts, icons, animations or shaders. The meshes, the clothes textures and the faces are generated in code (`src/draw.js`) through three.js. The sketches in `assets/`, the icons in `demo/icons.js` and the screenshots in `design/prototype/` were made for this project. The pages use the browser's `system-ui` font and ship no font file.

The sources linked in [`design/holds.md`](design/holds.md) are references for how a person holds each tool. Helferlein links to them and contains none of their text or images.

## External programs (run, not included)

Helferlein doesn't contain, install or download these. Their own licenses apply to them.

| Program | License | Used by |
| --- | --- | --- |
| [Node.js](https://nodejs.org/) | MIT | The tests: `node --test`, with the built-in `node:test` and `node:assert` |
| A web browser | Its own | The demo and the prototype pages, which use the browser's WebGL |

`package.json` declares no dependencies, so `npm` installs nothing.
