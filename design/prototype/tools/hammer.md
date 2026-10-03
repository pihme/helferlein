# Hammer

A plain block head on a handle. The head is up and the hand is low on the handle.

![Hammer](hammer.png)

View B, the reference android, summoned and idle. Neutral expression. No clothes or extra. Hue 210°, provisional.

```javascript
"Hammer": { roll: 1.25, grip: [0, 0.08, 0], arm: [-1.35, 1.30, -1.20] },
```

Copied from `makeTool`. The head meets the handle with no gap.

```javascript
} else if (name === "Hammer") {
  add(solid(new THREE.CylinderGeometry(0.015, 0.02, 0.4, 10), m), 0.18);
  add(solid(new THREE.BoxGeometry(0.16, 0.055, 0.04), m), 0.36);
}
```
