# Halo

A thin glowing ring above the head. Grown, so it takes the features color. It stays separate from the crown.

![Halo](halo.png)

View B, the reference android, summoned and idle. Neutral expression. No clothes or tool. Hue 210°, provisional.

Copied from `addExtra` in `prototype/helferlein.prototype.html`.

```javascript
        } else if (name === "Halo") {
          const halo = put(solid(new THREE.TorusGeometry(0.34 * s, 0.034 * s, 10, 32), hot), 0, top + 0.16 * s, 0);
          halo.rotation.x = Math.PI / 2;
        }
```
