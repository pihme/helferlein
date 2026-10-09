# Tools

Notes from the visual prototype. The drawing lives in `prototype/helferlein.prototype.html`, in `makeTool` and `HOLDS`. These pages record the tools that stayed. Each page has a screenshot and the code that drew it. The shipped look of each tool is the sheet in `design/locked/tools`.

A tool is a mesh in the right hand. The mesh is built flat in local XY. Local +Y runs toward the working end. Local +X is the belly, which is screen-down when the hold roll is 0.

## How a tool is positioned

`makeTool` draws the mesh. `HOLDS` places it. The placement is a first pass so the tool reads in use from the front. The product grips are in `../../holds.md`, from how a person holds the object. These angles are not that grip. The arms are still the placeholder capsules.

Each hold has three fields.

| Field | Meaning |
| --- | --- |
| `roll` | Radians in the camera plane. 0 points +Y to screen-right. Positive roll lifts the working end toward screen-up. |
| `grip` | `[x, y, z]` on the tool, the point that sits in the hand. A negative z puts the hand behind the drawing, so the silhouette stays in front. |
| `arm` | `[upper rotation.x, upper rotation.z, elbow rotation.z]` on the right arm. The arm extends in local −Y from the shoulder. These three bends put the hand where the tool is used. |

The right hand is the one the camera sees, so every tool uses it. The other arm keeps the resting hang: `rotation.z = side * 0.62`, `rotation.x = 0.18`, `elbow.rotation.z = side * -0.85`. While a tool is held, the right arm keeps the hold through working, so the reach does not swing the tool into the body. With no tool, working still lifts the right arm (`rotation.z` 1.15, `rotation.x` −0.7, `elbow.rotation.z` −0.95). The held mesh is scaled by 0.92.

`aimHeldTool` reads the stage camera. Screen-right and screen-up are the camera’s first two matrix columns. The face points back at the camera. The shaft is screen-right rotated by `roll` toward screen-up, with the view component removed so the length stays on the screen. That basis becomes the tool’s quaternion in the elbow’s local space. The tool is then shifted so `grip` lands on the hand.

```javascript
const shaft = right.clone().multiplyScalar(Math.cos(pose.roll)).addScaledVector(up, Math.sin(pose.roll));
shaft.addScaledVector(toward, -shaft.dot(toward)).normalize();
const face = toward.clone().addScaledVector(shaft, -toward.dot(shaft)).normalize();
const xAxis = new THREE.Vector3().crossVectors(shaft, face).normalize();
const worldQ = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, shaft, face));
const parentQ = elbow.getWorldQuaternion(new THREE.Quaternion());
tool.quaternion.copy(parentQ).invert().multiply(worldQ);
const grip = new THREE.Vector3(pose.grip[0], pose.grip[1], pose.grip[2]).multiplyScalar(tool.scale.x);
grip.applyQuaternion(tool.quaternion);
tool.position.set(0, handY, 0).sub(grip);
```

Copied from `aimHeldTool`. The current holds, copied from `HOLDS`:

```javascript
const HOLDS = {
  "Wrench": { roll: -0.45, grip: [0, 0.10, 0], arm: [-1.20, 1.00, -0.75] },
  "Pencil": { roll: -1.05, grip: [0, 0.22, 0], arm: [-1.05, 0.25, 0] },
  "Magnifying glass": { roll: Math.PI / 2, grip: [0, 0.12, 0], arm: [0.90, 2.35, 0.90] },
  "Brush": { roll: -1.15, grip: [0, 0.12, 0], arm: [-1.20, 0.85, -0.75] },
  "Clipboard": { roll: Math.PI / 2, grip: [0.12, 0.22, 0], arm: [-1.35, 0.10, 0] },
  "Watering can": { roll: 0, grip: [0, 0.09, 0], arm: [-0.90, 0.40, 0.90] },
  "Telescope": { roll: 0.2, grip: [0, 0.16, 0], arm: [0.40, 2.80, 0] },
  "Hammer": { roll: 1.25, grip: [0, 0.08, 0], arm: [-1.35, 1.30, -1.20] },
  "Saw": { roll: -0.25, grip: [0, 0.02, 0], arm: [-1.35, 0.55, -0.45] },
  "Fairy wand": { roll: 1.2, grip: [0, 0.10, 0], arm: [0.75, 2.80, 0] },
  "Scissors": { roll: -0.35, grip: [0, 0.055, -0.05], arm: [-1.50, 0.10, 0.90] },
  "Tongs": { roll: -Math.PI / 2, grip: [0, 0.04, 0], arm: [-1.20, 0.55, -0.30] }
};
```

The pictures are view B, the reference android, summoned and idle. Expression is Neutral. Clothes and extra are None. Hue is 210°. Those color numbers are the prototype’s provisional guesses. The stage label is hidden in the crop.

Shades are lightness shifts of the one tool hue. The fairy-wand star uses the features accent.

If `makeTool` or `HOLDS` changes, update the copy on that tool’s page.

## The twelve

| Tool | What reads | Note |
| --- | --- | --- |
| Wrench | Open jaw on a handle, turned clockwise. | [wrench.md](wrench.md) |
| Pencil | Point down, held at the middle. | [pencil.md](pencil.md) |
| Magnifying glass | Lens up beside the face. | [magnifying-glass.md](magnifying-glass.md) |
| Brush | Bristles down. | [brush.md](brush.md) |
| Clipboard | Upright board in front of the chest, clip on top. | [clipboard.md](clipboard.md) |
| Watering can | Upright can, cone and spout up, hand in the side handle. Half again as large as the earlier can. | [watering-can.md](watering-can.md) |
| Telescope | Tube in profile, raised to the cheek. | [telescope.md](telescope.md) |
| Hammer | Head up, hand low on the handle. | [hammer.md](hammer.md) |
| Saw | Hand through the round handle, teeth down. | [saw.md](saw.md) |
| Fairy wand | Star up. | [fairy-wand.md](fairy-wand.md) |
| Scissors | Open blades, bows just in front of the hand. | [scissors.md](scissors.md) |
| Tongs | Tips down. | [tongs.md](tongs.md) |

## Left out

Leave these out.

- Lamp, screwdriver, flute, net, camera, compass, trowel, whisk, stethoscope, and tape measure.
- Cooking spoon, spatula, and hook.
- The magic wand became the fairy wand.
