// Types for the public entry of Helferlein (`import { mount } from "helferlein"`).
// The same API is on `window.Helferlein` when dist/helferlein.min.js is loaded with a script tag.

export type Shape = "Android" | "Peanut" | "Pear" | "Egg" | "Teardrop" | "Snowman" | "Lightbulb" | "Rocket";
/** Expressions a roll may choose. Resting, focused and determined are shown by the motions, never rolled. */
export type Expression = "Neutral" | "Curious" | "Pleased" | "Surprised" | "Wink";
export type Clothes = "None" | "Pleated shirt" | "Blouse" | "T-shirt" | "Turtleneck" | "Striped shirt" | "Suit";
export type Tool =
  | "None" | "Wrench" | "Pencil" | "Magnifying glass" | "Brush" | "Clipboard" | "Watering can"
  | "Telescope" | "Hammer" | "Saw" | "Fairy wand" | "Scissors" | "Tongs";
export type Extra =
  | "None" | "Top hat" | "Beret" | "Sombrero" | "Pointed hat" | "Chef's hat" | "Crown"
  | "Bunny ears" | "Cat ears" | "Dog ears" | "Antenna" | "Halo" | "Small wings" | "Antlers" | "Propeller";

/** One look: the hue (degrees), the parts, and per color role a saturation and lightness (0..1). */
export interface Look {
  /** Whole degrees, 0..359. Other finite numbers are rounded and wrapped around the wheel; a non-number is rejected. */
  hue: number;
  shape: Shape;
  expression: Expression;
  clothes: Clothes;
  tool: Tool;
  extra: Extra;
  bodyS: number;
  bodyL: number;
  faceS: number;
  faceL: number;
  featuresS: number;
  featuresL: number;
  clothesS: number;
  clothesL: number;
  accessoriesS: number;
  accessoriesL: number;
  toolS: number;
  toolL: number;
}

/** What the next roll remembers: fields that sit out, rolls left on each lock, absent streaks. */
export interface Memory {
  cooled: Array<"shape" | "expression" | "clothes" | "tool" | "extra">;
  hold: { clothes: number; tool: number; extra: number };
  absent: { clothes: number; tool: number; extra: number };
}

/** The stored roll. Plain JSON; the host decides where to keep it. */
export interface LookBlob {
  look: Look;
  memory: Memory;
}

export interface MountOptions {
  /**
   * `true`: no swoop, no floating, a steady working face, and the new look appears at once instead of
   * after a spin. `false`: always animate. Left out: follow the reader's `prefers-reduced-motion`
   * setting, also when it changes while the page is open.
   */
  reducedMotion?: boolean;
  /**
   * Back the stage camera up along the same view until the figure fits,
   * including when it is turned. Left out, the camera stays at the stage view.
   */
  frame?: boolean;
}

export interface Figure {
  /** `false` when the browser gave no WebGL context: the figure is then a still silhouette. */
  readonly webgl: boolean;
  /** Only on the fallback: why WebGL failed (for example, no WebGL 2 context). */
  readonly error?: unknown;
  /** Whether the figure currently runs calm (reduced motion). */
  readonly reducedMotion: boolean;

  /** Swoop out of the resting form, then idle. */
  summon(): void;
  /** Working pose; the face pulses between focused and determined. Only while summoned; before `summon()` it warns and does nothing. */
  working(): void;
  /** Back to idle from working; the look stays. Before `summon()` it warns and does nothing. */
  idle(): void;
  /**
   * The finished work is on the page. Without an argument: only after `working()`, rolls a new look;
   * otherwise it warns and resolves without a new look.
   * With a blob: shows that roll. The look changes while the back faces the viewer.
   * Resolves when the spin has ended (at once with reduced motion or without WebGL).
   */
  applied(blob?: LookBlob): Promise<void>;
  /** Fold back into the resting form. Before the reveal, the previous look is kept. Warns when not summoned. */
  dismiss(): void;

  /** Call `fn` once, when the new look appears during the next spin. */
  watchReveal(fn: () => void): void;
  /** After a reload in the middle of a spin: start facing away and turn back to the viewer. */
  returnFromBack(): Promise<void>;

  /** The current look and its memory. */
  getBlob(): LookBlob;
  /** Restore a stored roll without a spin. Throws on unknown or missing fields. */
  setBlob(blob: LookBlob): void;
  /** Set parts of the look directly, without a spin. The memory is kept. Checked like `setBlob`. */
  setLook(partial: Partial<Look>): void;
  /** Rotate the figure by these radians (yaw, then pitch, which stops at 70 degrees). Non-finite values are ignored with a warning. */
  turn(yaw: number, pitch?: number): void;
  /** Stop the animation loop, free the renderer, and remove what `mount` added. Afterwards every call except `getBlob` warns and does nothing. */
  dispose(): void;
}

/**
 * Draw the figure into `element` (a sized container, or a canvas). It starts in the resting form.
 * Without WebGL it returns a still fallback (`webgl: false`) instead of throwing.
 * A second mount on the same element disposes the first figure, with a warning. An element without a size gets a warning.
 */
export function mount(element: HTMLElement, options?: MountOptions): Figure;

/** One roll from a look and its memory, as `applied()` does. Checks the look like `setBlob`; throws without one. */
export function rollFrom(look: Look, memory?: Memory): LookBlob;
/** The first look: the android, no clothes, no tool, no extra. */
export function defaultLook(): Look;
/** The memory before the first roll. */
export function blankMemory(): Memory;

export const SHAPES: readonly Shape[];
export const ROLL_EXPRESSIONS: readonly Expression[];
export const CLOTHES: readonly Clothes[];
export const TOOLS: readonly Tool[];
export const EXTRAS: readonly Extra[];
