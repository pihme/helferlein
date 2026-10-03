# Contributing

Source-available under [PolyForm Noncommercial 1.0.0](LICENSE). Other licenses can be negotiated with the copyright holder.

## Contributions

This project does not accept outside code contributions at the moment, so that its licensing stays in one hand. Issues, bug reports and ideas are very welcome: please [open an issue](https://github.com/pihme/helferlein/issues/new/choose).

## Good issues

Pick the matching [issue form](https://github.com/pihme/helferlein/issues/new/choose) (bug report, feature request, documentation, question). A good report names the Helferlein version or commit, how you load it (script tag or ES module, and the three.js version), your browser and OS, what you did, what you expected and what happened, with a screenshot if it helps.

## Security and secrets

The tracker is public. Never paste tokens, keys, credentials or real service responses into an issue. Please report vulnerabilities privately, as described in [SECURITY.md](SECURITY.md).

## Build and test locally

Needs Node.js 22 or newer. The tests run offline in Node with Three.js and a stubbed canvas; no browser and no GPU are needed. The demo pages need a browser with WebGL.

```bash
npm ci
npm run build       # dist/helferlein.js and dist/helferlein.min.js
npm run size        # the fixed size budget
npm run typecheck   # types/index.d.ts
npm test
```
