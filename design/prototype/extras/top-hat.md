# Top hat

A flat brim, a tall crown, and a darker band. Worn, so it takes the accessories color.

![Top hat](top-hat.png)

View B, the reference android, summoned and idle. Neutral expression. No clothes or tool. Hue 210°, provisional.

Copied from `addExtra` in `prototype/helferlein.prototype.html`.

```javascript
        if (name === "Top hat") {
          put(solid(new THREE.CylinderGeometry(0.28 * s, 0.28 * s, 0.035, 24), m), 0, top - 0.01, 0);
          put(solid(new THREE.CylinderGeometry(0.125 * s, 0.135 * s, 0.24 * s, 20), m), 0, top + 0.11 * s, 0);
          put(solid(new THREE.CylinderGeometry(0.142 * s, 0.142 * s, 0.045 * s, 20), band), 0, top + 0.035 * s, 0);
        }
```
