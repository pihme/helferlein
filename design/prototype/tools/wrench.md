# Wrench

An open jaw on a handle. The jaw is turned 45° clockwise from pointing straight out, so the opening faces down and to the right. The hand holds the handle and the jaw reaches out.

![Wrench](wrench.png)

View B, the reference android, summoned and idle. Neutral expression. No clothes or extra. Hue 210°, provisional.

```javascript
"Wrench": { roll: -0.45, grip: [0, 0.10, 0], arm: [-1.20, 1.00, -0.75] },
```

Copied from `makeTool`.

```javascript
if (name === "Wrench") {
  add(solid(new THREE.CylinderGeometry(0.016, 0.022, 0.28, 12), m), 0.14);
  add(solid(new THREE.CylinderGeometry(0.028, 0.02, 0.04, 12), m), 0.3);
  const jaw = add(solid(new THREE.TorusGeometry(0.058, 0.016, 8, 20, Math.PI * 1.45), m), 0.4);
  jaw.rotation.z = 2.43 - Math.PI / 4;
}
```
