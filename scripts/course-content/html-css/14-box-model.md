## 📦 The box model

Here's the single most important idea in CSS layout:

> **Every element on a web page is a rectangular box.**

Headings, paragraphs, images, buttons — all boxes. Once you see the boxes, layout stops being mysterious.

### The four layers of a box

From the inside out (like a gift box 🎁):

1. **Content** — your text or image
2. **Padding** — breathing space *inside* the box, around the content
3. **Border** — the box's edge line
4. **Margin** — empty space *outside* the box, pushing neighbours away

### The properties

- `padding: 16px;` — space inside
- `border: 3px solid navy;` — width, style, colour
- `margin: 24px;` — space outside
- `width` and `height` — the content size
- `border-radius: 12px;` — rounded corners (try `50%` on a square for a circle!)
- `box-shadow: 0 4px 12px rgba(0,0,0,0.2);` — a soft shadow

> 💡 **Padding vs margin:** padding is *inside* the border (it's part of the box). Margin is *outside* (it keeps other boxes at a distance).

### Meet the box: change the numbers!

```playground Challenge: set padding to 40px, then margin to 0, and watch the box change
<style>
  body { font-family: sans-serif; background: #e0f2fe; padding: 20px; }
  .card {
    background: white;
    padding: 20px;
    border: 4px solid #0284c7;
    border-radius: 16px;
    margin: 20px;
    box-shadow: 0 6px 16px rgba(0,0,0,0.15);
  }
  .circle {
    width: 100px;
    height: 100px;
    background: #f97316;
    border-radius: 50%;
    margin: 20px;
  }
</style>

<div class="card">
  <h2>I am a box 📦</h2>
  <p>Padding is the space inside me. Margin is the space around me.</p>
</div>
<div class="circle"></div>
```

### A lifesaver: `box-sizing`

By default, padding and border get **added** to the width, which makes sizes confusing. Almost every developer starts a stylesheet with this fix:

```
* {
  box-sizing: border-box;
}
```

Now `width: 300px` means the *whole box* is 300px, padding and border included. Much more predictable.

### Shorthand: top, right, bottom, left

- `padding: 10px;` — all four sides
- `padding: 10px 20px;` — top & bottom 10px, left & right 20px
- `padding: 5px 10px 15px 20px;` — top, right, bottom, left (clockwise, like a clock)

✅ **You learned:** content, padding, border and margin; `border-radius`, `box-shadow`, `box-sizing`, and the shorthand order.
