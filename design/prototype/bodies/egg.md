# Egg

One rounded capsule. A sphere of radius 0.55, centered at y 1.22, scaled to 0.82, 1.22, 0.74.

![Egg](egg.png)

View B, summoned, idle. Neutral expression. No clothes, tool, or extra. Hue 32°, provisional.

Copied from `shapeBody` in `prototype/helferlein.prototype.html`.

```javascript
const bean = add(sphere(0.55, material, 36), 0, 1.22, 0);
bean.scale.set(0.82, 1.22, 0.74);
place = { faceY: 1.42, faceZ: 0.34, faceR: 0.38, headTop: 1.86, shoulderY: 1.12, bodyR: 0.42 };
```
