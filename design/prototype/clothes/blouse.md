# Blouse

A scooped neck, a floral print, and a bow at the throat. The torso fill is the plain clothes color. The flowers and the bow are drawn on top.

![Blouse](blouse.png)

View B, the reference android, summoned and idle. Neutral expression. No tool or extra. Hue 210°, provisional.

Each flower is five petals and a darker center, in lighter and darker shades of the clothes hue. They sit in a staggered grid, six across and four down, and they stop short of the neckline. An earlier version used vertical gathers, and those read as stripes. The bow stays.

The scoop is `neck - scoop * 0.2`, deepest at the front (`u` 0.5).

Copied from `clothesMap` in `prototype/helferlein.prototype.html`.

```javascript
const bloom = (cx, cy, r) => {
  ctx.fillStyle = petalCss;
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + i * Math.PI * 2 / 5;
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * r * 0.52, cy + Math.sin(a) * r * 0.52, r * 0.5, r * 0.32, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = heartCss;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.24, 0, Math.PI * 2);
  ctx.fill();
};
const cols = 6;
const rows = 4;
for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    const u = ((col + (row % 2 ? 0.5 : 0)) / cols) % 1;
    const fig = hem + 0.1 + (row + 0.45) * (neck - hem - 0.18) / rows;
    if (fig > topAt(u) - 0.05 || fig < hem + 0.05) continue;
    const cx = u * w;
    const cy = (1 - (fig - y0) / span) * (h - 1);
    bloom(cx, cy, row % 2 ? 13 : 17);
  }
}
```
