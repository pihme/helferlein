# T-shirt

A plain clothes-colored torso with a small crew neck. There is no extra pattern.

![T-shirt](t-shirt.png)

View B, the reference android, summoned and idle. Neutral expression. No tool or extra. Hue 210°, provisional.

The neck dips a little at the front. The hem and the neckline get the same dark edge as the other shirts. The arms stay the body color, so the shirt has no sleeves.

Copied from `topAt` in `clothesMap`. The pixel fill is the default clothes color.

```javascript
if (name === "T-shirt" || name === "Striped shirt") return neck - scoop * 0.09;
```
