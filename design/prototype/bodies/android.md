# Android

Tall head, small torso. This is the reference body. View A always draws it, and strips clothes, tool, and extra.

![Android](android.png)

View B, summoned, idle. Neutral expression. No clothes, tool, or extra. Hue 32°, provisional.

The Android branch is the `else` in `shapeBody`. Copied from `prototype/helferlein.prototype.html`.

```javascript
g.add(lathe([
  [0.01, 0.42], [0.20, 0.50], [0.34, 0.68], [0.40, 0.92], [0.36, 1.14], [0.34, 1.32],
  [0.40, 1.52], [0.46, 1.74], [0.44, 1.96], [0.32, 2.16], [0.14, 2.30], [0.01, 2.36]
], material));
place = { faceY: 1.74, faceZ: 0.4, faceR: 0.44, headTop: 2.32, shoulderY: 1.16, bodyR: 0.4 };
```
