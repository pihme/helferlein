# Suit

A jacket with lapels, a lighter opening, a tie, and three buttons. Below the jacket hem the body is a darker band with a center crease. The figure has no legs, so that band is the trouser.

![Suit](suit.png)

View B, the reference android, summoned and idle. Neutral expression. No tool or extra. Hue 210°, provisional.

The suit hangs lower than the shirts: the hem is `max(0.16, shoulderY - 1.05)`. The jacket hem sits partway up. The opening is widest at the neck and closes toward the buttons. Shirt, tie, jacket, and trousers are lightness shifts of the clothes hue. The buttons sit just off center, at `u` 0.535, so they land on the jacket.

Copied from `clothesMap` in `prototype/helferlein.prototype.html`.

```javascript
if (name === "Suit") hem = Math.max(0.16, place.shoulderY - 1.05);
```

```javascript
} else if (name === "Suit") {
  const du = Math.abs(u - 0.5);
  const open = Math.max(0, (fig - (jacketHem + 0.06)) / Math.max(0.2, neck - jacketHem - 0.06));
  const half = 0.016 + open * 0.08;
  const tieT = Math.max(0, Math.min(1, (neck - 0.04 - fig) / 0.28));
  if (fig < jacketHem) px = du < 0.01 ? edgePx : trouserPx;
  else if (du < 0.012 + tieT * 0.014 && fig < neck - 0.03 && fig > jacketHem + 0.08) px = tiePx;
  else if (open > 0 && du < half) px = shirtPx;
  else if (open > 0 && Math.abs(du - half) < 0.012) px = edgePx;
  else if (fig > neck - 0.05) px = ribPx;
  else px = clothPx;
  if (Math.abs(fig - jacketHem) < 0.018) px = edgePx;
}
```

```javascript
for (let i = 0; i < 3; i++) {
  const fig = jacketHem + 0.08 + i * 0.09;
  const cy = (1 - (fig - y0) / span) * (h - 1);
  ctx.beginPath();
  ctx.arc(w * 0.535, cy, 4.2, 0, Math.PI * 2);
  ctx.fill();
}
```
