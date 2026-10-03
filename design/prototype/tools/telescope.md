# Telescope

Stepped tubes, held up to the cheek. The small end points toward the face and the wide end points out, so the steps read from the side.

![Telescope](telescope.png)

View B, the reference android, summoned and idle. Neutral expression. No clothes or extra. Hue 210°, provisional.

```javascript
"Telescope": { roll: 0.2, grip: [0, 0.16, 0], arm: [0.40, 2.80, 0] },
```

Copied from `makeTool`.

```javascript
} else if (name === "Telescope") {
  add(solid(new THREE.CylinderGeometry(0.016, 0.02, 0.07, 12), dark), 0.04);
  add(solid(new THREE.CylinderGeometry(0.03, 0.03, 0.15, 14), m), 0.15);
  add(solid(new THREE.CylinderGeometry(0.024, 0.024, 0.018, 12), dark), 0.1);
  add(solid(new THREE.CylinderGeometry(0.046, 0.032, 0.13, 14), m), 0.28);
  add(solid(new THREE.CylinderGeometry(0.054, 0.054, 0.026, 14), dark), 0.35);
}
```
