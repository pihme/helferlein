# Bunny ears

Long ears that lean out, with a darker inner ear. Grown, so they take the features color. Each ear is hinged where it meets the head, so a twitch moves the tip and the base stays put. On the live views one ear gives a short double snap, then both rest for about ten seconds. Which ear, and the exact rest, is chosen at random. The inner ear moves with the outer one.

![Bunny ears](bunny-ears.png)

View B, the reference android, summoned and idle. Neutral expression. No clothes or tool. Hue 210°, provisional.

Copied from `addExtra` in `prototype/helferlein.prototype.html`.

```javascript
        } else if (name === "Bunny ears") {
          [-1, 1].forEach(side => {
            const lean = side * -0.22;
            const H = 0.078 * s * 2.55;
            const rig = new THREE.Group();
            rig.name = "ear";
            rig.position.set(side * 0.18 * s + Math.sin(lean) * H, top + 0.14 * s - Math.cos(lean) * H, 0);
            rig.rotation.z = rig.userData.base = lean;
            rig.userData.amp = side * -0.5;
            rig.userData.side = side;
            g.add(rig);
            const ear = sphere(0.078 * s, m, 16);
            ear.scale.set(0.55, 2.55, 0.42);
            ear.position.y = H;
            rig.add(ear);
            const inner = sphere(0.044 * s, faceMat, 12);
            inner.scale.set(0.36, 1.75, 0.2);
            const px = side * 0.01 * s, py = 0.02 * s, c = Math.cos(lean), sn = Math.sin(lean);
            inner.position.set(px * c + py * sn, H - px * sn + py * c, 0.016 * s);
            rig.add(inner);
          });
        }
```
