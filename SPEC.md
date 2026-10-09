# Helferlein

An animated 3D avatar that a page can use as a visible helper. Status: implemented. The figure is in `src/`, the included demo (section 13) in `demo/`, and the tests in `test/`. What is still open is in section 10.

## 1. Name

**Helferlein** is everyday German for “little helper.”

- Nearby, not this product: Gyro Gearloose’s Little Helper is called Helferlein in German, including a 3D-print figure. Many small tools use the word. One of them is an accounting GUI. HelferAI is a company.
- License: [PolyForm Noncommercial 1.0.0](LICENSE).

## 2. Problem

A helper that only exists as text has no visible state. The person watching cannot tell idle from working, or working from “the result is on the page,” without reading status lines.

## 3. What it is

A 3D character with a head, a face, a torso, and arms. No legs. It floats.

A host summons it. It swoops in from a small resting form, then plays a motion for what is going on. When the host dismisses it, it folds back into that resting form.

The host owns whatever UI sits around it. The avatar does not draw that UI and does not own the conversation.

## 4. What it is not

- Not a chat application, and not a particular surrounding UI.
- Not a general character creator the person operates. The host rolls a new look. The person does not pick the parts.
- Not one fixed costume that means “done.” Each time the page shows finished work, the look changes.
- Not a copy of any existing character. The shipped drawing is the catalog in section 8, and each part’s look is its locked sheet (section 9). Earlier sketches, kept as concept art: [sheet](assets/helferlein-poses.svg), [resting](assets/helferlein-lamp.svg), [idle](assets/helferlein-idle.svg), [thinking](assets/helferlein-thinking.svg), [applied](assets/helferlein-applied.svg). The resting sketch is the sealed form. Those sketches are concept art for the shape of the objects. They are not a reference for how a tool is held.

## 5. Vocabulary

| Term | Meaning |
| --- | --- |
| Resting form | The small sealed figure. Where it sits when dismissed. |
| Roll | One new combination of attributes, like Randomize in a character creator. |
| Applied | The host says the finished work is now visible. This is the only event that rolls a new look. |
| Host | The page that embeds the avatar and sends the events. |

## 6. Host contract

The host drives every motion. The avatar does not watch files, processes, or network calls.

| Host says | Avatar does |
| --- | --- |
| Summon | Swoops out of the resting form, then idle. |
| Working | Thinking motion. The face pulses between focused and determined. The look stays. |
| Idle | Idle motion, on the rolled expression. A finished turn that was not applied ends here. |
| Applied | Spins. The new roll appears while the back faces the viewer. Then idle. |
| Dismiss | Folds back into the resting form. The face is resting. |

Applied means the host has reloaded the page so the finished work is what the person sees. A successful internal load, with no reload, is not applied.

One showing runs summoned, then idle, then working, then applied, then dismissed. Summoned is only the swoop. Idle and working are the poses it holds. Applied is the only roll. Dismissed is the resting form.

A roll changes the hue, and it changes one or two of the body, the expression, the clothes, the tool, and the extra. It does not change all of them. The hue and at least one other attribute change every time. A draw that would move only the hue is drawn again. The new hue sits at least a quarter turn of the wheel away from the old one, so the color reads as different. When the body or the expression is drawn, it becomes a different one from its list. Slots that are not drawn stay as they were.

A field that changed on the previous roll sits out the next one. The hue is not one of those fields.

From nothing, clothes become a garment one time in three, a tool appears one time in two, and an extra appears one time in ten. That chance is flipped once in the roll. Further redraws keep the miss. Clothes that have been absent for four rolls appear on the next draw of that slot. A tool that has been absent for three rolls does too. An extra does not get that push. Each roll that ends with a slot still absent adds one to its streak. A gain clears the streak.

Gaining a piece from nothing locks that same piece. A new tool stays for the next roll, new clothes for the next two, and a new extra for the next six. That span already includes the one-roll sit-out. A locked piece is not drawn. The body and the expression have the sit-out only. When a lock has ended, a draw swaps the piece for a different one of the same kind. A swap does not start a new lock. Clearing the piece is the uncommon result: clothes one time in six, a tool one time in four, an extra one time in eight.

If the sit-out and the locks leave nothing that can change, the sit-out gives way. A locked piece stays. If nothing drawn has changed, the roll changes the first free field among the body, the expression, the clothes, and the tool, and then an extra that is already on. An empty slot fills. A piece already on is swapped. When the only free field would be an absent extra, the roll changes the body instead.

The first look, before any roll, is the android body, no clothes, no tool, and no extra. Its streaks start at zero.

Expressions a roll may choose are neutral, curious, pleased, surprised, and wink. Resting is the dismissed face. Focused and determined are the working pulse, not a roll.

Summon, dismiss, and the working flag are the host’s. The avatar does not invent them from the words in a message.

One integration: the resting form is a button, and summon opens a panel the host draws. The figure then hovers on that panel’s top edge. Dismiss is the host closing the panel. That is a way to use the events above. It is not a part of the avatar.

The stored roll is the look plus its memory: the fields that just changed, the rolls left on each lock, and the absent streaks for clothes, the tool, and the extra. The avatar hands the host that blob and restores the blob the host gives back. The host chooses where to keep it. The new look and that memory take effect while the figure spins, when its back faces the viewer. A dismiss before that moment keeps the previous look and the previous memory. After that, the roll stays until the next applied event, including across the reload that played the spin.

## 7. Motions

| Motion | When |
| --- | --- |
| Swoop in | Summon. |
| Idle | Present, nothing in flight. |
| Thinking. The face pulses between focused and determined | Working. |
| Spin. The new look appears while the back faces the viewer | Applied. |
| Back into the resting form | Dismiss. |

**Reduced motion.** When the reader asks for reduced motion (`prefers-reduced-motion: reduce`), or the host sets it, nothing floats, sways, or flaps, the swoop and the fold are cuts, the working face holds on focused, and an applied roll shows the new look at once instead of spinning. The host events and the stored roll stay the same.

**No WebGL.** When the browser gives no WebGL context, the figure is a still silhouette in the look’s colors. It takes the same events and keeps the same stored roll; an applied roll changes the colors at once. Mounting does not throw.

## 8. A new look

One applied event, one roll. The hue changes, and at least one other attribute changes. One or two of the other attributes are drawn, not all of them. The sit-out, the locks, and the chances are in section 6. A roll draws from:

- color
- body shape
- facial expression
- clothes
- a tool in hand
- one extra, such as bunny ears or a hat

Color is per part. A roll may recolor the body, the face, the extra, the tool, and the clothes. A grown extra (ears, the antenna, the halo, the wings, the antlers, the propeller) uses the features role. A worn extra (a hat or the crown) uses the accessories role. Those colors are calculated from one hue when the roll happens. No stored palette list, and no model.

The function takes that hue and assigns each part a fixed role. Lightness is perceptual (OKLCH or a space like it), so the order below is real to the eye and not an accident of RGB.

| Part | Lightness | Chroma | Hue |
| --- | --- | --- | --- |
| Body | high | low | the roll’s hue |
| Face | very low | low | the same hue, or neutral black |
| Features | high | high | the same hue |
| Clothes | middle | middle | the same hue |
| Accessories | middle | middle | the same hue |
| Tool | middle | low | the same hue, so it reads as a material |

Rules the function must keep:

- One hue per roll. Nothing adds a second hue, so adjacent parts are never complements.
- Warm stays warm and cool stays cool. Warm is red through yellow. Cool is cyan through blue.
- A neutral shell is the same function with body, clothes, and accessories chroma near zero. The features keep the accent hue.
- After the colors are computed, the face is darker than the body and the features are lighter than the face. If a hue fails that, nudge its lightness and compute again.

**Body shape.** Head, torso, and arms. No legs. The silhouette is the whole figure. Rotationally symmetrical shapes work best. The arms are the two-bone rig in section 11. The prototype arm capsules are not that rig.

- Android: tall head, small torso
- Peanut: two rounded lobes, pinched in the middle
- Pear: small head, wide torso
- Egg: one rounded capsule
- Teardrop: narrow top, round base
- Snowman: three stacked spheres, the lowest the largest
- Lightbulb: a glass bulb over a straight socket with a screw thread, and a filament coil inside the glass
- Rocket: a pointed nose on a hard shoulder, and three side fins

**Facial expression.** A roll may choose neutral, curious, pleased, surprised, or wink. Resting (eyes shut) is the dismissed face. Focused and determined are the working pulse.

**Clothes.** None, pleated shirt, blouse, t-shirt, turtleneck, striped shirt, suit. Clothes are a texture on the body, not a separate shape. The blouse is a floral print. Cape, apron, vest, sash, collar, one strap, scarf, sweater, and dress were dropped.

**Tool in hand.** None, wrench, pencil, magnifying glass, brush, clipboard, watering can, telescope, hammer, saw, fairy wand, scissors, tongs. Lamp, screwdriver, flute, net, camera, compass, trowel, whisk, stethoscope, tape measure, cooking spoon, spatula, and hook were dropped. The magic wand became the fairy wand. The right hand holds the tool. The grip is the ordinary way a person holds that object in one fist. Those grips are recorded in `design/holds.md`. The pose sketches are not a hold reference. The prototype hold angles are not the implementation. The brush comes to a sharp tip and stays narrower than its ferrule, full beside the ferrule and hollowed into the point. The telescope is two tubes, with the corner between them smoothed.

**Extra.** None, top hat, beret, sombrero, pointed hat, chef's hat, crown, bunny ears, cat ears, dog ears, antenna, halo, small wings, antlers, propeller. A gain or a swap picks one of these. Section 6 says when. The cowboy hat became the sombrero. Flower, mask, beanie, party hat, cap, bow, bow tie, hair ribbons, glasses, eye patch, monocle, headphones, feather, necklace, earmuffs, bandana, medal, veil, elf ears, cheek marks, one small horn, fin on the head, whiskers, beak, snout, carrot nose, buttons, sprinkles, flame, tusks, fangs, a tail, spikes, a mane, a tuft of hair, a trunk, gills, spots, a third eye, and stripes were dropped. Animal ears are only the three that read apart: long bunny ears, pointed cat ears on the front of the head, and floppy dog ears as a rounded paddle on each cheek. Fox ears and mouse ears are not in the list. The beret is a soft cap tilted over the forehead. The pointed hat’s tip points back. The antenna is one dish on a neck, with one arm, and the wide face of the feed toward the dish. The antlers branch into tines that fan apart. The crown is a band with points, open so the head shows through.

## 9. The locked look

Every body, garment, tool, and extra in section 8 has a finished look. The sheet is `design/locked/bodies`, `design/locked/clothes`, `design/locked/tools`, or `design/locked/extras`, named with the prototype picture’s slug. Each sheet is four panels: Front, Side, Top, and Context. That sheet is the look, and the item stays as the sheet. Where a sheet and an older note disagree, the sheet wins.

`design/prototype/bodies`, `design/prototype/clothes`, `design/prototype/tools`, and `design/prototype/extras` record the earlier pass, with their screenshots and the code that drew them.

The color rules in section 8 are rules. The lightness and chroma numbers, and the warm/cool cut in the green band, are still open. The grip notes in `design/holds.md` are still the reference for how a tool is held. The locked sheet shows the grip the figure uses today.

## 10. Open

- The lightness and chroma numbers for each color role.
- Where the warm/cool cut sits in the green band.
- Whether each tool’s grip matches `design/holds.md`.

## 11. The rig

Every body publishes the same named points, in that body's own proportions: the top of the head, the two ear hinges, the back, the two shoulders, and the two hands.

A tool hangs on the hand point. An extra hangs on one point, or on a left and right pair. It does not reuse a measurement taken from the android. Clothes are drawn on the body that is wearing them. An extra that sits wrong on one body is fitted on that body's points, not by moving every body.

Each arm is two bones, from the shoulder point to the hand point. The prototype arm capsules are not this rig.

The meshes are smooth enough to read as a solid figure. The shipped meshes are the locked looks in section 9. The prototype meshes were the starting catalog.

## 12. Adding a part

A new body, a new set of clothes, a new tool, or a new extra can be added without changing the others.

A body supplies its mesh and the points in section 11. Clothes supply a drawing on the body. A tool supplies its mesh, the place the fist closes, and which way the working end points. An extra supplies its mesh and which point it hangs on. The shipped set is the catalog in section 8.

The figure is what a page embeds. It is one library with Three.js as a peer dependency, and no UI framework. It ships as an ES module that imports `three`, and as one script-tag file with Three.js bundled. The page mounts the figure and sends the events in section 6. The page draws its own chat, its own navigation, and its own background.

## 13. The included demo

The demo is a host for the figure. It is not inside the figure.

It has two pages and one navigation bar on both. The items are Demo and Wardrobe.

The demo page explains what the avatar is and what it does. Before the chat opens, and after it closes, the figure sits in the bottom right. A callout on that figure says "Click here to activate me". Clicking it, or the figure, summons the figure and opens the chat in the lower right, inset from the right and bottom edges. While the chat is open the figure is centered above that window, close to its top edge. The first line greets the person and says to type a message to see the figure work. The chat's close control dismisses the figure back to the corner.

A message switches the figure to working. The chat explains that the wait is the working pose. A later line says the page will change while the figure faces away, and that line stays up longer than the first one. Then the chat gives a fixed sample answer that only says this is not a live model, and the figure starts to turn. When its back faces the viewer, the demo stores the next roll and the new page background and reloads. That reload is the applied event. The loaded page already has the new background and the new look, and the figure turns back to face the viewer. Then the figure idles and the input works again. Another message runs the same cycle. No model is called.

Wardrobe has no chat. The figure stands in the center. Its camera starts at the stage view and backs up along that view until the figure fits, including while it is turned. The demo page keeps the stage view. Body, face, and color are one sheet on the left, at most 30% of the width, with Idle, Working, and Dismissed above them. Clothes, tool, and extra are one sheet on the right, also at most 30%. Neither sheet uses tabs. The choices wrap in a grid. A button under the figure runs one roll, the same roll the demo uses. Choosing a body, a face, a hue swatch, clothes, a tool, or an extra sets that choice. The roll and those choices play the spin, and the new look appears while the back faces the viewer. The hue slider updates the color immediately and does not spin. Idle, Working, and Dismissed set the pose and do not spin. Dragging the figure turns it, and also tips it up or down around its center by at most 70 degrees. The spin plays from that angle.

Both pages share the stored roll. The demo keeps that blob in the browser's local storage. Wardrobe does not open or close the chat. Demo remembers whether the chat was open.
