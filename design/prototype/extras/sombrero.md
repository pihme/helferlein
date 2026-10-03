# Sombrero

A wide brim turned up at the edge, and a rounded crown. A darker band sits where the crown meets the brim. Worn, so it takes the accessories color.

![Sombrero](sombrero.png)

View B, the reference android, summoned and idle. Neutral expression. No clothes or tool. Hue 210°, provisional.

Copied from `addExtra` in `prototype/helferlein.prototype.html`.

```javascript
        } else if (name === "Sombrero") {
          put(lathe([
            [0.16 * s, 0.03 * s], [0.36 * s, 0.008 * s], [0.50 * s, 0.02 * s], [0.58 * s, 0.06 * s],
            [0.64 * s, 0.11 * s], [0.62 * s, 0.14 * s], [0.52 * s, 0.05 * s], [0.32 * s, 0],
            [0.16 * s, 0.012 * s], [0.16 * s, 0.03 * s]
          ], m), 0, top - 0.10 * s, 0);
          put(solid(new THREE.CylinderGeometry(0.155 * s, 0.17 * s, 0.18 * s, 20), m), 0, top - 0.01 * s, 0);
          const dome = put(sphere(0.155 * s, m, 22), 0, top + 0.08 * s, 0);
          dome.scale.y = 0.72;
          put(solid(new THREE.CylinderGeometry(0.15 * s, 0.17 * s, 0.045 * s, 20), band), 0, top - 0.04 * s, 0);
        }
```
