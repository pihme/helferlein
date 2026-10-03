# Antenna

A satellite dish on a short neck, with the feed on an arm in front of the bowl. The metal is the features color. On the live views the dish turns slowly. The foot stays put.

![Antenna](antenna.png)

View B, the reference android, summoned and idle. Neutral expression. No clothes or tool. Hue 210°, provisional.

Copied from `addExtra` in `prototype/helferlein.prototype.html`.

```javascript
        } else if (name === "Antenna") {
          const metal = paint(look, "features", { metalness: 0.78, roughness: 0.34, clearcoat: 0.05, side: THREE.DoubleSide });
          put(solid(new THREE.CylinderGeometry(0.055 * s, 0.07 * s, 0.028 * s, 14), metal), 0, top + 0.006 * s, 0);
          const antenna = new THREE.Group();
          antenna.name = "antenna";
          antenna.position.set(0, top + 0.10 * s, 0);
          g.add(antenna);
          const neck = solid(new THREE.CylinderGeometry(0.016 * s, 0.022 * s, 0.09 * s, 8), metal);
          neck.position.y = -0.02 * s;
          antenna.add(neck);
          const head = new THREE.Group();
          head.position.y = 0.035 * s;
          head.rotation.x = 0.62;
          antenna.add(head);
          head.add(lathe([
            [0.02 * s, 0.01 * s], [0.08 * s, 0.03 * s], [0.15 * s, 0.075 * s], [0.21 * s, 0.145 * s],
            [0.225 * s, 0.175 * s], [0.20 * s, 0.15 * s], [0.14 * s, 0.085 * s], [0.07 * s, 0.042 * s], [0.02 * s, 0.022 * s]
          ], metal));
          const arm = new THREE.Group();
          arm.position.set(0, 0.11 * s, 0.15 * s);
          arm.rotation.x = -0.95;
          head.add(arm);
          const rod = solid(new THREE.CylinderGeometry(0.007 * s, 0.007 * s, 0.20 * s, 6), metal);
          rod.position.y = 0.09 * s;
          arm.add(rod);
          const lnb = solid(new THREE.CylinderGeometry(0.026 * s, 0.016 * s, 0.05 * s, 8), metal);
          lnb.position.y = 0.20 * s;
          arm.add(lnb);
        }
```
