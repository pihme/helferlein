# Clipboard

An upright board in front of the chest, clip at the top, paper facing the camera. The hand holds the right edge. The board is half again the size of the first clipboard.

![Clipboard](clipboard.png)

View B, the reference android, summoned and idle. Neutral expression. No clothes or extra. Hue 210°, provisional.

```javascript
"Clipboard": { roll: Math.PI / 2, grip: [0.12, 0.22, 0], arm: [-1.35, 0.10, 0] },
```

Copied from `makeTool`. `board.scale` is the extra half.

```javascript
} else if (name === "Clipboard") {
  const board = new THREE.Group();
  const put = (mesh, y, x, z) => { mesh.position.set(x || 0, y || 0, z || 0); board.add(mesh); return mesh; };
  put(solid(new THREE.BoxGeometry(0.18, 0.26, 0.014), m), 0.15);
  put(solid(new THREE.BoxGeometry(0.15, 0.2, 0.006), lite), 0.14, 0, 0.009);
  put(solid(new THREE.BoxGeometry(0.09, 0.04, 0.018), dark), 0.27, 0, 0.012);
  put(solid(new THREE.BoxGeometry(0.05, 0.012, 0.02), m), 0.292, 0, 0.016);
  board.scale.setScalar(1.5);
  g.add(board);
}
```
