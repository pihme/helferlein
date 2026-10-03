// Public entry: `import { mount } from "helferlein"`. Three.js is a peer dependency.
import { THREE } from "./three.js";
import { mountWith } from "./figure.js";
import { CLOTHES, EXTRAS, ROLL_EXPRESSIONS, SHAPES, TOOLS, blankMemory, defaultLook, rollFrom } from "./roll.js";

function mount(element, options = {}) {
  return mountWith(element, THREE, options);
}

export { CLOTHES, EXTRAS, ROLL_EXPRESSIONS, SHAPES, TOOLS, blankMemory, defaultLook, mount, rollFrom };
