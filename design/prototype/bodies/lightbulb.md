# Lightbulb

An elongated glass bulb, a straight cylindrical socket, and a filament torus inside the glass. The filament is the one part baked into a shape.

![Lightbulb](lightbulb.png)

View B, summoned, idle. Neutral expression. No clothes, tool, or extra. Hue 32°, provisional. This shot shows the glass and the socket. The filament torus is in the drawing below and stays faint through the glass.

The socket is a straight cylinder, radius 0.15 and height 0.27, centered at y 0.97. That radius is about 1.75 times the thin socket it replaced (0.085), inside the 1.5–2 range asked for. The height is 0.75 times that earlier height (0.36). The top of the socket is near y 1.105, tucked into the glass, which starts at y 1.02. A wide concave foot did not stay, and the glass is this lathe, not a sphere.

Copied from `shapeBody` in `prototype/helferlein.prototype.html`.

```javascript
const hot = paint(look, "features", { emissive: colorOf(look, "features"), emissiveIntensity: 1.6 });
const glass = paint(look, "body", { transparent: true, opacity: 0.22, roughness: 0.04, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide });
const filament = add(solid(new THREE.TorusGeometry(0.12, 0.028, 8, 18), hot), 0, 1.62, 0);
filament.renderOrder = 1;
const bulb = lathe([
  [0.01, 1.02], [0.12, 1.08], [0.20, 1.22], [0.32, 1.44],
  [0.36, 1.66], [0.32, 1.88], [0.18, 2.04], [0.01, 2.14]
], glass);
bulb.renderOrder = 2;
g.add(bulb);
add(solid(new THREE.CylinderGeometry(0.15, 0.15, 0.27, 20), material), 0, 0.97, 0);
place = { faceY: 1.64, faceZ: 0.30, faceR: 0.30, headTop: 2.14, shoulderY: 1.40, bodyR: 0.30 };
```
