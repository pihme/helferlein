# AGENTS.md

This file is for the coding agent working in this repo. Read it at the start of a session.

## What this repo is

**Helferlein** is an animated 3D avatar. Spec: `SPEC.md`. Everyday German for “little helper.”

This tree is the product. README and SPEC stay standalone: do not name a host application, a habitat, or an idea garden. The host contract in SPEC.md is how a page uses the avatar. Do not special-case one host inside the avatar.

Implementation follows `design/implementation.md`. Start at its `Next` stop. License is PolyForm Noncommercial 1.0.0 (`LICENSE`). Do not change it.

## How to work here

- README.md is the public face. SPEC.md is the product. This file is for the agent.
- The avatar is a figure a host summons, not a control for one kind of UI. It does not implement a panel or a chat. A host may use the resting form as a button that opens a panel; that is one integration, not the product. The included demo is a host, specified in SPEC.md section 13. Do not build the chat into the figure.
- Motions run summoned (the swoop into idle), idle, working, applied, dismissed. Working pulses the face between focused and determined. Dismissed uses the resting face. Applied spins; the new look appears while the back faces the viewer. A roll changes the hue and one or two of body, expression, clothes, tool, and extra. The sit-out, the locks, the absent streaks, and the chances are SPEC.md section 6. Follow that section. The first look is the android with no clothes, no tool, and no extra. Rollable expressions are neutral, curious, pleased, surprised, and wink.
- That “page now shows the finished work” signal is a host event. It is not “a plugin loaded” and not “a task object became active.”
- A new look is one randomize roll. Color is calculated from one hue, with the role table in SPEC.md. Do not store a palette list.
- The roll survives the host reloading the page, and it stays until the next such signal.
- Prefer small, reversible files.

## Do not invent

- A drawing or a runtime beyond SPEC.md sections 11 and 12. The figure embeds as one vendored Three.js build and no UI framework. Every body publishes the same named points. A new body, clothes, tool, or extra is added on its own, without editing the others. The attribute lists in SPEC.md are ideas. Ship the entries only as far as the prototype notes record them, and add a catalog entry only when asked. Body shapes are in `design/prototype/bodies`. Clothes are in `design/prototype/clothes`. Tools are in `design/prototype/tools`. Product grips are in `design/holds.md`, from how a person holds the object. The pose sketches are shape concept art, not hold references. Do not copy the prototype `HOLDS` angles into the implementation. Extras are in `design/prototype/extras`. The prototype pass is done.
- Lightness or chroma numbers for the color roles, or a warm/cool cut in the green band, until those are chosen. The shape of the function is in SPEC.md.
- A second product name, or a shortened CLI name
- Host-specific words in README.md or SPEC.md
