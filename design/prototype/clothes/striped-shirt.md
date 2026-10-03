# Striped shirt

Horizontal stripes and the same small crew neck as the t-shirt. The top band, just under the neck, is a solid clothes color.

![Striped shirt](striped-shirt.png)

View B, the reference android, summoned and idle. Neutral expression. No tool or extra. Hue 210°, provisional.

Stripes are 0.075 tall and alternate the lighter and darker clothes shades.

Copied from `clothesMap` in `prototype/helferlein.prototype.html`.

```javascript
} else if (name === "Striped shirt") {
  px = Math.floor((fig - hem) / 0.075) % 2 ? pleatHi : pleatLo;
  if (top - fig < 0.05) px = clothPx;
}
```
