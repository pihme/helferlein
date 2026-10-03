# Watering can

A cylinder with a cone on top and a spout aimed up. A side handle is large enough for the hand, and the hand sits in that loop. The whole can is scaled by 1.5.

![Watering can](watering-can.png)

View B, the reference android, summoned and idle. Neutral expression. No clothes or extra. Hue 210°, provisional.

The cylinder stands upright because its axis is local X, and local +X is screen-down at roll 0. The cone sits on local −X, so it stays on top. The handle’s chord is planted in the cylinder wall.

```javascript
"Watering can": { roll: 0, grip: [0, 0.09, 0], arm: [-0.90, 0.40, 0.90] },
```

Copied from `makeTool`.

```javascript
} else if (name === "Watering can") {
  const can = new THREE.Group();
  const put = (mesh, y, x, z) => { mesh.position.set(x || 0, y || 0, z || 0); can.add(mesh); return mesh; };
  const body = put(solid(new THREE.CylinderGeometry(0.07, 0.07, 0.16, 20), m), 0.18);
  body.rotation.z = Math.PI / 2;
  const top = put(solid(new THREE.ConeGeometry(0.072, 0.12, 20), m), 0.18, -0.13);
  top.rotation.z = Math.PI / 2;
  const spout = new THREE.Group();
  spout.position.set(-0.08, 0.24, 0);
  spout.rotation.z = 1.15;
  const tube = solid(new THREE.CylinderGeometry(0.012, 0.02, 0.14, 8), dark);
  tube.position.y = 0.07;
  spout.add(tube);
  can.add(spout);
  const handle = put(solid(new THREE.TorusGeometry(0.075, 0.012, 6, 16, Math.PI), m), 0.135, 0);
  handle.rotation.z = Math.PI;
  can.scale.setScalar(1.5);
  g.add(can);
}
```
