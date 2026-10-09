# Clothes

Notes from the visual prototype. The drawing lives in `prototype/helferlein.prototype.html`, in `clothesMap`. These pages record the clothes that stayed. Each page has a screenshot and the code that drew it. The shipped look of each garment is the sheet in `design/locked/clothes`.

Clothes are a texture on the body. They are not a separate mesh. The pattern is shades of the one clothes hue. A second hue is not added.

The pictures are view B, the reference android, summoned and idle. Expression is Neutral. Tool and extra are None. Hue is 210°. Those color numbers are the prototype’s provisional guesses. The stage label is hidden in the crop. The arms stay the body color.

## How a garment is drawn

`wearClothes` builds one canvas and rewrites the body UVs so that canvas fits every shape. `u` 0.5 is the face (+Z). `v` is figure-space height, y from 0.05 to 2.45. The material color is set to white so the canvas shows. Pixels outside the garment are the body color.

```javascript
function writeClothUVs(mesh) {
  const pos = mesh.geometry.attributes.position;
  const yBase = mesh.position.y;
  const sx = mesh.scale.x || 1;
  const sy = mesh.scale.y || 1;
  const sz = mesh.scale.z || 1;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) * sx;
    const y = yBase + pos.getY(i) * sy;
    const z = pos.getZ(i) * sz;
    uv[i * 2] = Math.atan2(x, z) / (Math.PI * 2) + 0.5;
    uv[i * 2 + 1] = (y - 0.05) / 2.4;
  }
  mesh.geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}
```

A box, such as a rocket fin, keeps the plain body color. The sealed resting form does not wear clothes.

Most garments run from `max(0.34, shoulderY - 0.78)` up to a neck just under the visor, `min(faceY - faceR * 0.55, shoulderY + 0.18)`. The suit hangs lower. The turtleneck climbs closer to the face.

If `clothesMap` changes, update the copy on that garment’s page.

## The six

| Clothes | What reads | Note |
| --- | --- | --- |
| Pleated shirt | Vertical pleats, a collar band, buttons down the front. | [pleated-shirt.md](pleated-shirt.md) |
| Blouse | Scooped neck, floral print, a bow. | [blouse.md](blouse.md) |
| T-shirt | A plain torso with a small crew neck. | [t-shirt.md](t-shirt.md) |
| Turtleneck | A ribbed collar up under the face. | [turtleneck.md](turtleneck.md) |
| Striped shirt | Horizontal stripes and a small crew neck. | [striped-shirt.md](striped-shirt.md) |
| Suit | Lapels, a lighter opening, a tie, buttons, and a lower band. | [suit.md](suit.md) |

## Left out

Leave these out.

- Collar, one strap, and scarf are not clothes.
- Cape, apron, vest, and sash were separate meshes. That approach did not stay.
- Sweater and dress were tried as textures and then dropped.
