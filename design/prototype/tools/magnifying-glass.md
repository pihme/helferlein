# Magnifying glass

The lens is up beside the face. The hand holds the handle under it. The neck stops in the rim, short of the glass.

![Magnifying glass](magnifying-glass.png)

View B, the reference android, summoned and idle. Neutral expression. No clothes or extra. Hue 210°, provisional.

```javascript
"Magnifying glass": { roll: Math.PI / 2, grip: [0, 0.12, 0], arm: [0.90, 2.35, 0.90] },
```

Copied from `makeTool`.

```javascript
} else if (name === "Magnifying glass") {
  add(solid(new THREE.CylinderGeometry(0.014, 0.016, 0.26, 10), m), 0.13);
  add(solid(new THREE.CylinderGeometry(0.018, 0.015, 0.08, 12), dark), 0.27);
  add(solid(new THREE.TorusGeometry(0.09, 0.015, 8, 24), m), 0.4);
  const lens = add(solid(new THREE.CylinderGeometry(0.074, 0.074, 0.008, 24), lite), 0.4);
  lens.rotation.x = Math.PI / 2;
}
```
