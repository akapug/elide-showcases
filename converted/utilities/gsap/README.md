# GSAP - Professional Animation Library

GreenSock Animation Platform - professional-grade animation for the web.

**POLYGLOT SHOWCASE**: Smooth 60fps animations in ANY language on Elide!

## Quick Start

```typescript
import gsap from './elide-gsap.ts';

// Basic tween
gsap.to(obj, { duration: 1, x: 100, y: 50 });

// Timeline
const tl = gsap.timeline();
tl.to(box1, { duration: 1, x: 100 })
  .to(box2, { duration: 1, x: 200 })
  .to(box3, { duration: 1, x: 300 });
```

## Features

- **Tween Any Property** - Animate anything
- **Timelines** - Sequence animations
- **Easing** - Professional easing functions
- **Callbacks** - onStart, onUpdate, onComplete
- **Precise Control** - Frame-accurate timing

## Use Cases

- UI animations
- Game animations
- Data visualization transitions
- SVG animations
- Interactive experiences

## Stats

- **500K+ downloads/week** on npm
- Industry standard since 2008
- Production-ready
