# Pencil

A short pencil held at the middle, tip down, as if writing in front of the body.

![Pencil](pencil.png)

View B, the reference android, summoned and idle. Neutral expression. No clothes or extra. Hue 210°, provisional.

```javascript
"Pencil": { roll: -1.05, grip: [0, 0.22, 0], arm: [-1.05, 0.25, 0] },
```

Copied from `makeTool`. The grip is on the shaft, between the eraser and the point.

```javascript
} else if (name === "Pencil") {
  add(solid(new THREE.CylinderGeometry(0.02, 0.02, 0.05, 12), dark), 0.045);
  add(solid(new THREE.CylinderGeometry(0.017, 0.017, 0.042, 12), lite), 0.012);
  add(solid(new THREE.CylinderGeometry(0.016, 0.016, 0.3, 6), m), 0.2);
  add(solid(new THREE.ConeGeometry(0.016, 0.09, 8), lite), 0.385);
  add(solid(new THREE.ConeGeometry(0.005, 0.032, 8), dark), 0.44);
}
```
