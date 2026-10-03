// Compile-only check of types/index.d.ts (npm run typecheck). Not shipped.
import { blankMemory, defaultLook, mount, rollFrom, SHAPES, type LookBlob, type Figure } from "../types/index.js";

declare const element: HTMLElement;
const figure: Figure = mount(element, { reducedMotion: true });
figure.summon();
figure.working();
const done: Promise<void> = figure.applied();
const blob: LookBlob = rollFrom(defaultLook(), blankMemory());
void figure.applied(blob);
figure.setLook({ hue: 30, extra: "Bunny ears" });
figure.setBlob(figure.getBlob());
figure.watchReveal(() => {});
const shape: string = SHAPES[0];
if (!figure.webgl) console.log(figure.error);
void done;
void shape;
// @ts-expect-error: not a host event
figure.explode();
// @ts-expect-error: not in the catalog
figure.setLook({ extra: "Jetpack" });
