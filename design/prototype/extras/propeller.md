# Propeller

Three blades on a hub. The hub is a darker shade of the features color. On the live views the blades turn.

![Propeller](propeller.png)

View B, the reference android, summoned and idle. Neutral expression. No clothes or tool. Hue 210°, provisional.

Copied from `addExtra` in `prototype/helferlein.prototype.html`.

```javascript
        } else if (name === "Propeller") {
          const hub = new THREE.Group();
          hub.name = "propeller";
          hub.position.set(0, top + 0.04 * s, 0);
          g.add(hub);
          hub.add(solid(new THREE.CylinderGeometry(0.05 * s, 0.05 * s, 0.04 * s, 14), band));
          for (let i = 0; i < 3; i++) {
            const arm = new THREE.Group();
            arm.rotation.y = i * (Math.PI * 2 / 3);
            const blade = solid(new THREE.BoxGeometry(0.30 * s, 0.018 * s, 0.075 * s), m);
            blade.position.x = 0.19 * s;
            blade.rotation.z = -0.42;
            arm.add(blade);
            hub.add(arm);
          }
        }
```
