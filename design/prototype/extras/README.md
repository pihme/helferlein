# Extras

Notes from the visual prototype. The drawing lives in `prototype/helferlein.prototype.html`, in `addExtra`. These pages record the extras that stayed. Each page has a screenshot and the code that drew it. The shipped look of each extra is the sheet in `design/locked/extras`.

One roll picks one extra. A worn extra uses the accessories color. A grown extra uses the features color. Hats and the crown are worn. Ears, the antenna, the halo, the wings, the antlers, and the propeller are grown. The antenna is drawn as a satellite dish. Nothing here adds a second hue. A darker band or a lighter shade is a lightness shift of that same hue.

The pictures are view B, the reference android, summoned and idle. Expression is Neutral. Clothes and tool are None. Hue is 210°. Those color numbers are the prototype’s provisional guesses. The stage label is hidden. A still is one frame, so the wings, ears, dish, and propeller are caught mid-move.

## How an extra is drawn

`s` scales the piece with the head. `top` is `headTop`. The sealed resting form does not wear an extra.

```javascript
        const name = look.extra;
        if (!name || name === "None") return;
        const wornNames = { "Top hat": 1, "Beret": 1, "Sombrero": 1, "Pointed hat": 1, "Chef's hat": 1, "Crown": 1 };
        const role = wornNames[name] ? "accessories" : "features";
        const m = paint(look, role, role === "accessories" ? { side: THREE.DoubleSide } : null);
        const band = paint(look, role, { color: shadeColor(look, role, -0.16), side: THREE.DoubleSide });
        const lite = paint(look, role, { color: shadeColor(look, role, 0.14), side: THREE.DoubleSide });
        const faceMat = paint(look, "face");
        const hot = paint(look, "features", { emissive: colorOf(look, "features"), emissiveIntensity: 0.7 });
        const s = Math.max(0.65, place.faceR / 0.42);
        const put = (mesh, x, y, z) => { mesh.position.set(x, y, z); g.add(mesh); return mesh; };
        const top = place.headTop;
        const y = place.faceY;
        const r = place.faceR;
```

## What moves

The catalog sheet draws once, so those cells stay still. The three live views move four extras. Each wing is hinged at the end that meets the body and beats around the vertical axis. The wings stay spread out to the sides, a little behind the back, and the tips do not come forward. Each ear is hinged where it meets the head. One ear gives a short double snap, then both rest for about ten seconds. Which ear snaps, and whether the rest is a little shorter or longer, is chosen at random. The dish turns slowly, and its foot stays put. The propeller spins.

```javascript
      function earFlick(local) {
        const burst = (start, dur) => {
          if (local < start || local >= start + dur) return 0;
          const k = (local - start) / dur;
          const s = Math.sin(Math.PI * k);
          return s * s;
        };
        return burst(0, 0.18) + burst(0.24, 0.12) * 0.65;
      }
```

```javascript
        if (!earPlan) earPlan = { t0: t - 1, side: Math.random() < 0.5 ? -1 : 1, gap: 6 + Math.random() * 8 };
        if (t >= earPlan.t0 + earPlan.gap) {
          earPlan.t0 = t;
          earPlan.side = Math.random() < 0.5 ? -1 : 1;
          earPlan.gap = 6 + Math.random() * 8;
        }
        const earKick = earFlick(t - earPlan.t0);
        const beat = Math.sin(t * 2.8);
        view.inner.traverse(obj => {
          if (obj.name === "propeller") obj.rotation.y += dt * 8;
          if (obj.name === "antenna") obj.rotation.y += dt * 0.45;
          if (obj.name === "wing") obj.rotation.y = obj.userData.back + beat * obj.userData.flap;
          if (obj.name === "ear") obj.rotation.z = obj.userData.base + (obj.userData.side === earPlan.side ? earKick : 0) * obj.userData.amp;
        });
```

`wing` stores `back` and `flap`, and the live view sets `rotation.y` from both. `back` holds the wing a little behind straight out to the side. `flap` is the small sweep either side of that, so the tips stay behind the back. The sign keeps the left and the right mirrored. `ear` keeps its rest lean in `base`. `earKick` is the snap, and only the ear whose `side` was picked uses it. The gap runs from 6 to 14 seconds. `antenna` and `propeller` yaw. The propeller is the fast one.

If `addExtra` or this loop changes, update the copy on that page.

## The fourteen

| Extra | What reads | Note |
| --- | --- | --- |
| Top hat | Flat brim, tall crown, darker band. | [top-hat.md](top-hat.md) |
| Beret | Soft disk tilted over the forehead. | [beret.md](beret.md) |
| Sombrero | Wide brim turned up, rounded crown. | [sombrero.md](sombrero.md) |
| Pointed hat | Wide brim, leaning cone. | [pointed-hat.md](pointed-hat.md) |
| Chef's hat | Band, tall puff, flattened top. | [chefs-hat.md](chefs-hat.md) |
| Crown | Metal band with five points. The head shows through. | [crown.md](crown.md) |
| Bunny ears | Long ears, hinged at the head. They twitch. | [bunny-ears.md](bunny-ears.md) |
| Cat ears | Pointed ears, hinged at the head. They twitch. | [cat-ears.md](cat-ears.md) |
| Dog ears | Large ears beside the cheeks, hinged at the head. They twitch. | [dog-ears.md](dog-ears.md) |
| Antenna | A satellite dish on a neck. It turns slowly. | [antenna.md](antenna.md) |
| Halo | Thin glowing ring above the head. | [halo.md](halo.md) |
| Small wings | Upper pair and lower pair, hinged at the body. They stay spread, a little behind the back. | [small-wings.md](small-wings.md) |
| Antlers | Branches forward, back, outward, and up. | [antlers.md](antlers.md) |
| Propeller | Three blades. They turn. | [propeller.md](propeller.md) |

## Left out

Leave these out.

Flower, mask, beanie, party hat, cap, bow, bow tie, hair ribbons, glasses, eye patch, monocle, headphones, feather, necklace, earmuffs, bandana, medal, veil, elf ears, cheek marks, one small horn, fin on the head, whiskers, beak, snout, carrot nose, buttons, sprinkles, flame, tusks, fangs, a tail, spikes, a mane, a tuft of hair, a trunk, gills, spots, a third eye, and stripes. Fox ears and mouse ears stay out. The cowboy hat became the sombrero.
