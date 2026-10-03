function svg(body) {
  return `<svg viewBox="0 0 32 32" aria-hidden="true">${body}</svg>`;
}

const ICONS = {
  None: svg(`<circle cx="16" cy="16" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 23 L23 9" stroke="currentColor" stroke-width="2"/>`),
  Android: svg(`<path d="M16 3 C11 3 9 8 9 12 C9 15 11 16 11 18 L10 27 L22 27 L21 18 C21 16 23 15 23 12 C23 8 21 3 16 3Z" fill="currentColor"/>`),
  Peanut: svg(`<path d="M16 3 C11 3 10 8 12 11 C9 13 9 18 12 21 C10 24 11 29 16 29 C21 29 22 24 20 21 C23 18 23 13 20 11 C22 8 21 3 16 3Z" fill="currentColor"/>`),
  Pear: svg(`<path d="M16 4 C12 6 11 10 13 13 C9 16 8 22 11 27 C14 30 18 30 21 27 C24 22 23 16 19 13 C21 10 20 6 16 4Z" fill="currentColor"/>`),
  Egg: svg(`<ellipse cx="16" cy="17" rx="8" ry="11" fill="currentColor"/>`),
  Teardrop: svg(`<path d="M16 3 C16 3 8 14 8 20 C8 25 11 29 16 29 C21 29 24 25 24 20 C24 14 16 3 16 3Z" fill="currentColor"/>`),
  Snowman: svg(`<circle cx="16" cy="8" r="4" fill="currentColor"/><circle cx="16" cy="16" r="5.5" fill="currentColor"/><circle cx="16" cy="25" r="6.5" fill="currentColor"/>`),
  Lightbulb: svg(`<path d="M16 3 C11 3 8 8 8 12 C8 16 11 17 12 20 L20 20 C21 17 24 16 24 12 C24 8 21 3 16 3Z" fill="currentColor"/><rect x="12" y="21" width="8" height="3" fill="currentColor"/><rect x="13" y="25" width="6" height="3" rx="1" fill="currentColor"/>`),
  Rocket: svg(`<path d="M16 2 L20 12 L20 24 L12 24 L12 12 Z" fill="currentColor"/><path d="M12 18 L7 26 L12 24 Z M20 18 L25 26 L20 24 Z" fill="currentColor"/>`),
  Neutral: svg(`<circle cx="11" cy="13" r="2" fill="currentColor"/><circle cx="21" cy="13" r="2" fill="currentColor"/><path d="M11 21 H21" stroke="currentColor" stroke-width="2" fill="none"/>`),
  Curious: svg(`<path d="M7 12 Q11 8 15 12" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="11" cy="15" r="2" fill="currentColor"/><circle cx="21" cy="14" r="2" fill="currentColor"/><circle cx="16" cy="22" r="2" fill="none" stroke="currentColor" stroke-width="2"/>`),
  Pleased: svg(`<path d="M7 14 Q11 11 15 14" stroke="currentColor" stroke-width="2" fill="none"/><path d="M17 14 Q21 11 25 14" stroke="currentColor" stroke-width="2" fill="none"/><path d="M10 20 Q16 26 22 20" stroke="currentColor" stroke-width="2" fill="none"/>`),
  Surprised: svg(`<circle cx="11" cy="13" r="2.4" fill="currentColor"/><circle cx="21" cy="13" r="2.4" fill="currentColor"/><circle cx="16" cy="22" r="3" fill="none" stroke="currentColor" stroke-width="2"/>`),
  Wink: svg(`<path d="M7 14 H15" stroke="currentColor" stroke-width="2"/><circle cx="21" cy="14" r="2" fill="currentColor"/><path d="M11 21 Q16 25 21 21" stroke="currentColor" stroke-width="2" fill="none"/>`),
  "Pleated shirt": svg(`<path d="M6 8 L11 8 L16 13 L21 8 L26 8 L28 14 L23 16 L23 28 L9 28 L9 16 L4 14 Z" fill="currentColor"/>`),
  Blouse: svg(`<path d="M8 10 L13 8 L16 12 L19 8 L24 10 L26 16 L22 17 V27 H10 V17 L6 16 Z" fill="currentColor"/><circle cx="16" cy="11" r="2" fill="none" stroke="currentColor" stroke-width="1.5"/>`),
  "T-shirt": svg(`<path d="M8 8 L13 8 L16 12 L19 8 L24 8 L28 14 L23 16 V27 H9 V16 L4 14 Z" fill="currentColor"/>`),
  Turtleneck: svg(`<path d="M11 6 H21 V11 L24 13 L27 18 L22 20 V28 H10 V20 L5 18 L8 13 L11 11 Z" fill="currentColor"/>`),
  "Striped shirt": svg(`<path d="M8 8 L13 8 L16 12 L19 8 L24 8 L28 14 L23 16 V27 H9 V16 L4 14 Z" fill="currentColor"/><path d="M10 18 H22 M10 22 H22 M10 26 H22" stroke="#1a1d27" stroke-width="1.5"/>`),
  Suit: svg(`<path d="M7 8 L12 8 L16 14 L20 8 L25 8 L28 15 L23 17 V28 H9 V17 L4 15 Z" fill="currentColor"/><path d="M16 14 L13 28 H19 L16 14" fill="#1a1d27"/>`),
  Wrench: svg(`<path d="M8 22 L18 12" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M18 8 H26 V12 H22 V16 H18 Z" fill="currentColor"/>`),
  Pencil: svg(`<path d="M8 24 L20 12 L23 15 L11 27 Z" fill="currentColor"/><path d="M20 12 L24 8 L27 11 L23 15 Z" fill="currentColor"/><path d="M8 24 L6 28 L10 26 Z" fill="currentColor"/>`),
  "Magnifying glass": svg(`<circle cx="14" cy="14" r="7" fill="none" stroke="currentColor" stroke-width="3"/><path d="M19 19 L27 27" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`),
  Brush: svg(`<path d="M8 26 L18 16" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M18 16 L22 8 L26 12 L20 18 Z" fill="currentColor"/>`),
  Clipboard: svg(`<rect x="8" y="6" width="16" height="22" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><rect x="12" y="4" width="8" height="4" rx="1" fill="currentColor"/>`),
  "Watering can": svg(`<path d="M8 14 H20 V24 H8 Z" fill="currentColor"/><path d="M20 16 H26 L28 22 H22" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 14 V10 H16 V14" fill="none" stroke="currentColor" stroke-width="2"/>`),
  Telescope: svg(`<path d="M6 20 L22 12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M20 10 L28 7 L26 14 Z" fill="currentColor"/>`),
  Hammer: svg(`<path d="M16 14 V28" stroke="currentColor" stroke-width="3"/><rect x="8" y="8" width="16" height="6" rx="1" fill="currentColor"/>`),
  Saw: svg(`<path d="M6 12 H24 L22 16 H8 Z" fill="currentColor"/><path d="M8 16 L10 20 L12 16 L14 20 L16 16 L18 20 L20 16" stroke="currentColor" stroke-width="1.4" fill="none"/><circle cx="24" cy="18" r="4" fill="none" stroke="currentColor" stroke-width="2"/>`),
  "Fairy wand": svg(`<path d="M6 26 L20 12" stroke="currentColor" stroke-width="2"/><path d="M22 4 L24 10 L30 12 L24 14 L22 20 L20 14 L14 12 L20 10 Z" fill="currentColor"/>`),
  Scissors: svg(`<circle cx="10" cy="22" r="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="16" cy="22" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 20 L22 8 M14 20 L24 12" stroke="currentColor" stroke-width="2"/>`),
  Tongs: svg(`<path d="M12 6 Q10 16 12 28 M20 6 Q22 16 20 28" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 8 H20" stroke="currentColor" stroke-width="2"/>`),
  "Top hat": svg(`<rect x="11" y="6" width="10" height="12" fill="currentColor"/><rect x="6" y="18" width="20" height="4" rx="1" fill="currentColor"/>`),
  Beret: svg(`<ellipse cx="16" cy="18" rx="12" ry="6" fill="currentColor"/><circle cx="22" cy="14" r="2" fill="currentColor"/>`),
  Sombrero: svg(`<ellipse cx="16" cy="20" rx="13" ry="4" fill="currentColor"/><path d="M11 20 C11 12 21 12 21 20" fill="currentColor"/>`),
  "Pointed hat": svg(`<path d="M16 3 L24 22 L8 22 Z" fill="currentColor"/><rect x="6" y="22" width="20" height="3" fill="currentColor"/>`),
  "Chef's hat": svg(`<rect x="10" y="16" width="12" height="8" fill="currentColor"/><circle cx="11" cy="14" r="5" fill="currentColor"/><circle cx="21" cy="14" r="5" fill="currentColor"/><circle cx="16" cy="11" r="5" fill="currentColor"/>`),
  Crown: svg(`<path d="M6 22 L8 12 L13 17 L16 8 L19 17 L24 12 L26 22 Z" fill="currentColor"/>`),
  "Bunny ears": svg(`<ellipse cx="11" cy="14" rx="3" ry="10" fill="currentColor"/><ellipse cx="21" cy="14" rx="3" ry="10" fill="currentColor"/>`),
  "Cat ears": svg(`<path d="M6 24 L10 8 L16 20 Z M26 24 L22 8 L16 20 Z" fill="currentColor"/>`),
  "Dog ears": svg(`<path d="M8 8 C4 16 6 26 12 26 C10 16 12 10 8 8Z" fill="currentColor"/><path d="M24 8 C28 16 26 26 20 26 C22 16 20 10 24 8Z" fill="currentColor"/>`),
  Antenna: svg(`<path d="M16 28 V16" stroke="currentColor" stroke-width="2"/><path d="M8 16 Q16 6 24 16" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="16" cy="28" r="2" fill="currentColor"/>`),
  Halo: svg(`<ellipse cx="16" cy="18" rx="10" ry="4" fill="none" stroke="currentColor" stroke-width="3"/>`),
  "Small wings": svg(`<path d="M16 16 C8 10 4 16 6 22 C10 18 14 18 16 16Z" fill="currentColor"/><path d="M16 16 C24 10 28 16 26 22 C22 18 18 18 16 16Z" fill="currentColor"/>`),
  Antlers: svg(`<path d="M12 28 L10 14 L6 8 M10 16 L6 14 M20 28 L22 14 L26 8 M22 16 L26 14" stroke="currentColor" stroke-width="2" fill="none"/>`),
  Propeller: svg(`<circle cx="16" cy="16" r="3" fill="currentColor"/><ellipse cx="16" cy="7" rx="3" ry="6" fill="currentColor"/><ellipse cx="16" cy="25" rx="3" ry="6" fill="currentColor"/><ellipse cx="7" cy="16" rx="6" ry="3" fill="currentColor"/>`)
};

function icon(name) {
  return ICONS[name] || ICONS.None;
}

export { icon };
