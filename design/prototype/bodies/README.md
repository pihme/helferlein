# Body shapes

Notes from the visual prototype. The drawing lives in `prototype/helferlein.prototype.html`, in `shapeBody`. These pages record the eight shapes that stayed. Each page has a screenshot and the code that drew it. The shipped look of each shape is the sheet in `design/locked/bodies`.

The silhouette is the whole figure: head, torso, and arms, no legs. Rotationally symmetrical shapes work best.

The pictures are view B, summoned and idle. Expression is Neutral. Clothes, tool, and extra are None. Hue is 32°. Those color numbers are the prototype’s provisional guesses. The stage label is hidden in the crop. Arms are still there, because every figure has them.

## How a shape is drawn

A lathe is a profile of `[radius, y]` pairs, spun around Y, 52 segments, bottom to top. A profile that starts and ends near radius 0 reads as a solid.

```javascript
function lathe(pairs, material) {
  return solid(new THREE.LatheGeometry(pairs.map(([x, y]) => new THREE.Vector2(x, y)), 52), material);
}
```

`place` tells the rest of the figure where to sit.

| Field | Use |
| --- | --- |
| `faceY`, `faceZ`, `faceR` | Visor center and size |
| `headTop` | Hats |
| `shoulderY`, `bodyR` | Arms |

The visor is a flattened sphere. Its depth is `faceR * 0.24`, so `faceZ` has to sit near the front surface or the face sinks into the body.

If `shapeBody` changes, update the copy on that shape’s page.

## The eight

| Shape | Silhouette | Note |
| --- | --- | --- |
| Android | Tall head, small torso. The reference body, and what view A always draws. | [android.md](android.md) |
| Peanut | Two rounded lobes, pinched in the middle. | [peanut.md](peanut.md) |
| Pear | Small head, wide torso. No stem and no leaf. | [pear.md](pear.md) |
| Egg | One rounded capsule. | [egg.md](egg.md) |
| Teardrop | Narrow top, round base. | [teardrop.md](teardrop.md) |
| Snowman | Three spheres. The lowest is the largest. Visor on the front of the head. | [snowman.md](snowman.md) |
| Lightbulb | Elongated glass, straight cylindrical socket, filament inside the glass. | [lightbulb.md](lightbulb.md) |
| Rocket | Pointed nose, hard shoulder, small side fins. Visor high on the upper hull. | [rocket.md](rocket.md) |

Earlier names: the tall reference was egg, the pinched body was round, and the capsule was bean. They are Android, Peanut, and Egg.

## Left out

These were in the prototype and then removed. Leave them out.

- Block and spool did not work as a figure.
- Ghost never read as a particular thing.
- Donut, mushroom, and bell still failed after the silhouette was adjusted.
- Heart and star break rotational symmetry and did not read.
