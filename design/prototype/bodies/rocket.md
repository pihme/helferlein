# Rocket

Pointed nose, small side fins, visor high on the upper hull. The fins break the symmetry. The shape stayed.

![Rocket](rocket.png)

View B, summoned, idle. Neutral expression. No clothes, tool, or extra. Hue 32°, provisional.

The shoulder is a hard edge. The body and the nose are separate meshes that overlap, and the cone is open at the base so its cap does not fight the cylinder. The cylinder (top radius 0.26, bottom radius 0.30, height 0.83, center y 1.285) runs from y 0.87 to y 1.70. The cone (radius 0.268, height 0.46, center y 1.91) has its base at y 1.68 and its apex at y 2.14. A single lathe closed an earlier gap and rounded the corner, because a lathe averages normals across a change of slope. That drawing was set aside. The fins are the three boxes below, left as they were. No decals.

The visor is on the upper hull, under the nose: `faceY` 1.60, `faceR` 0.26.

Copied from `shapeBody` in `prototype/helferlein.prototype.html`.

```javascript
add(solid(new THREE.CylinderGeometry(0.26, 0.30, 0.83, 32), material), 0, 1.285, 0);
const nose = solid(new THREE.ConeGeometry(0.268, 0.46, 32, 1, true), material);
nose.position.y = 1.91;
g.add(nose);
for (const a of [0.3, 2.4, 4.5]) {
  const fin = solid(new THREE.BoxGeometry(0.2, 0.24, 0.04), material);
  fin.position.set(Math.cos(a) * 0.4, 0.98, Math.sin(a) * 0.4);
  fin.rotation.y = Math.PI / 2 - a;
  g.add(fin);
}
place = { faceY: 1.60, faceZ: 0.26, faceR: 0.26, headTop: 2.14, shoulderY: 1.18, bodyR: 0.32 };
```
