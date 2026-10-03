# Snowman

Three stacked spheres. The lowest is the largest: radii 0.50, 0.36, and 0.24, centered at y 0.62, 1.32, and 1.82.

![Snowman](snowman.png)

View B, summoned, idle. Neutral expression. No clothes, tool, or extra. Hue 32°, provisional.

The visor sits on the front of the head. `faceZ` is 0.28. The head radius is 0.24 and the visor is at the equator, so the surface there is about z 0.24 and the visor center is just in front of it. `faceZ` 0.18 left the visor inside the head.

Copied from `shapeBody` in `prototype/helferlein.prototype.html`.

```javascript
add(sphere(0.50, material, 32), 0, 0.62, 0);
add(sphere(0.36, material, 32), 0, 1.32, 0);
add(sphere(0.24, material, 32), 0, 1.82, 0);
place = { faceY: 1.82, faceZ: 0.28, faceR: 0.22, headTop: 2.06, shoulderY: 1.32, bodyR: 0.36 };
```
