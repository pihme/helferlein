# Cat ears

Pointed ears that lean out, with a darker inner ear. Grown, so they take the features color. Each ear is hinged at its base on the head. On the live views one ear gives a short double snap, then both rest for about ten seconds. Which ear, and the exact rest, is chosen at random. The inner ear moves with the outer one.

![Cat ears](cat-ears.png)

View B, the reference android, summoned and idle. Neutral expression. No clothes or tool. Hue 210°, provisional.

Copied from `addExtra` in `prototype/helferlein.prototype.html`.

```javascript
        } else if (name === "Cat ears") {
          [-1, 1].forEach(side => {
            const lean = side * -0.2;
            const H = 0.15 * s;
            const rig = new THREE.Group();
            rig.name = "ear";
            rig.position.set(side * 0.16 * s + Math.sin(lean) * H, top + 0.02 * s - Math.cos(lean) * H, 0);
            rig.rotation.y = 0.55;
            rig.rotation.z = rig.userData.base = lean;
            rig.userData.amp = side * -0.45;
            rig.userData.side = side;
            g.add(rig);
            const ear = solid(new THREE.ConeGeometry(0.10 * s, 0.30 * s, 4), m);
            ear.position.y = H;
            rig.add(ear);
            const inner = solid(new THREE.ConeGeometry(0.05 * s, 0.16 * s, 4), faceMat);
            inner.position.set(0, 0.015 * s, 0.04 * s);
            ear.add(inner);
          });
        }
```
