# Brush

Bristles down, like a stroke. The bristles are one cone, joined to the ferrule.

![Brush](brush.png)

View B, the reference android, summoned and idle. Neutral expression. No clothes or extra. Hue 210°, provisional.

```javascript
"Brush": { roll: -1.15, grip: [0, 0.12, 0], arm: [-1.20, 0.85, -0.75] },
```

Copied from `makeTool`.

```javascript
} else if (name === "Brush") {
  add(solid(new THREE.CylinderGeometry(0.012, 0.016, 0.26, 10), m), 0.13);
  add(solid(new THREE.CylinderGeometry(0.03, 0.02, 0.06, 12), dark), 0.25);
  const bristles = add(solid(new THREE.ConeGeometry(0.042, 0.14, 10), dark), 0.35);
  bristles.scale.x = 1.4;
}
```
