# Chef's hat

A band, a tall puff, and a flattened top. Worn, so it takes the accessories color.

![Chef's hat](chefs-hat.png)

View B, the reference android, summoned and idle. Neutral expression. No clothes or tool. Hue 210°, provisional.

Copied from `addExtra` in `prototype/helferlein.prototype.html`.

```javascript
        } else if (name === "Chef's hat") {
          put(solid(new THREE.CylinderGeometry(0.20 * s, 0.21 * s, 0.07 * s, 20), band), 0, top - 0.01, 0);
          put(solid(new THREE.CylinderGeometry(0.24 * s, 0.20 * s, 0.18 * s, 20), m), 0, top + 0.09 * s, 0);
          const cap = put(sphere(0.24 * s, m, 18), 0, top + 0.16 * s, 0);
          cap.scale.y = 0.55;
        }
```
