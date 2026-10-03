# Beret

A soft disk tilted over the forehead, with a small nub. Worn, so it takes the accessories color.

![Beret](beret.png)

View B, the reference android, summoned and idle. Neutral expression. No clothes or tool. Hue 210°, provisional.

Copied from `addExtra` in `prototype/helferlein.prototype.html`.

```javascript
        } else if (name === "Beret") {
          const beret = put(sphere(0.26 * s, m, 20), 0.05 * s, top - 0.045 * s, 0.02);
          beret.scale.set(1.2, 0.38, 1.05);
          beret.rotation.z = -0.5;
          put(sphere(0.04 * s, band, 10), 0.10 * s, top + 0.02 * s, 0.04);
        }
```
