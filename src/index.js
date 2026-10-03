// Public entry: `import { mount } from "helferlein"`. Three.js is a peer dependency.
import { THREE } from "./three.js";
import { mountWith } from "./figure.js";
import { writeBlob } from "./blob.js";
import { CLOTHES, EXTRAS, ROLL_EXPRESSIONS, SHAPES, TOOLS, blankMemory, defaultLook, rollFrom as rollLook } from "./roll.js";

function mount(element, options = {}) {
  return mountWith(element, THREE, options);
}

// The public roll checks its input like setBlob does, so a wrong call names what is wrong.
function rollFrom(look, memory) {
  if (look === undefined || look === null) {
    throw new TypeError("Helferlein: rollFrom(look, memory) needs a look, for example defaultLook()");
  }
  const blob = writeBlob(look, memory == null ? blankMemory() : memory);
  return rollLook(blob.look, blob.memory);
}

export { CLOTHES, EXTRAS, ROLL_EXPRESSIONS, SHAPES, TOOLS, blankMemory, defaultLook, mount, rollFrom };
