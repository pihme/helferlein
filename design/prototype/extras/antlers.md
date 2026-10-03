# Antlers

A beam out and up on each side, with branches forward, back, outward, and up. Grown, so they take the features color.

![Antlers](antlers.png)

View B, the reference android, summoned and idle. Neutral expression. No clothes or tool. Hue 210°, provisional.

Copied from `addExtra` in `prototype/helferlein.prototype.html`.

```javascript
        } else if (name === "Antlers") {
          [-1, 1].forEach(side => {
            const beam = new THREE.Group();
            beam.position.set(side * 0.14 * s, top - 0.02 * s, 0);
            beam.rotation.z = side * -0.72;
            g.add(beam);
            beam.add(solid(new THREE.CylinderGeometry(0.028 * s, 0.046 * s, 0.36 * s, 7), m));
            const branch = (along, len, rx, rz, radius) => {
              const joint = new THREE.Group();
              joint.position.y = along;
              joint.rotation.x = rx;
              joint.rotation.z = rz;
              const part = solid(new THREE.CylinderGeometry(radius * 0.5, radius, len, 6), m);
              part.position.y = len * 0.5;
              joint.add(part);
              beam.add(joint);
            };
            branch(-0.10 * s, 0.20 * s, 1.2, side * 0.25, 0.028 * s);
            branch(-0.01 * s, 0.18 * s, 0, side * -0.62, 0.024 * s);
            branch(0.03 * s, 0.18 * s, -1.2, side * 0.2, 0.024 * s);
            branch(0.12 * s, 0.16 * s, 0.15, side * 0.38, 0.022 * s);
          });
        }
```
