# Small wings

An upper pair and a lower pair on the upper back. Grown, so they take the features color. The lower pair is a lighter shade of that same hue. Each wing is hinged at the end that meets the body. On the live views that hinge is the vertical axis. The wings stay spread out to the sides, a little behind the back, and the beat carries them a bit further back. The tips do not come forward.

![Small wings](small-wings.png)

The picture is an earlier wing angle. The drawing below is the current one: spread out to the sides, a little behind the back.

View B, the reference android, summoned and idle. Neutral expression. No clothes or tool. Hue 210°, provisional.

Copied from `addExtra` in `prototype/helferlein.prototype.html`.

```javascript
        } else if (name === "Small wings") {
          const hingeZ = -0.06;
          const addWing = (radius, segs, scale, cx, cy, rz, mat) => {
            const H = radius * scale[1];
            const xAt = yl => cx - yl * Math.sin(rz);
            const rootY = Math.abs(xAt(H)) <= Math.abs(xAt(-H)) ? H : -H;
            const hinge = new THREE.Group();
            hinge.name = "wing";
            hinge.position.set(cx - rootY * Math.sin(rz), cy + rootY * Math.cos(rz), hingeZ);
            const rearward = Math.sign(cx);
            hinge.userData.back = rearward * 0.45;
            hinge.userData.flap = rearward * 0.28;
            hinge.rotation.y = hinge.userData.back;
            g.add(hinge);
            const posed = new THREE.Group();
            posed.rotation.z = rz;
            hinge.add(posed);
            const mesh = sphere(radius, mat, segs);
            mesh.scale.set(scale[0], scale[1], scale[2]);
            mesh.position.y = -rootY;
            posed.add(mesh);
          };
          [-1, 1].forEach(side => {
            const hingeX = side * place.bodyR * 0.45;
            addWing(0.24 * s, 16, [0.62, 1.45, 0.12], hingeX + side * 0.22 * s, place.shoulderY + 0.46, side * -0.48, m);
            addWing(0.19 * s, 14, [0.58, 1.2, 0.11], hingeX + side * 0.24 * s, place.shoulderY - 0.14, side * -2.15, lite);
          });
        }
```
