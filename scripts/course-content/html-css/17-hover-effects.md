## ✨ Hover effects & transitions (the fun part!)

Static pages are fine. **Pages that react** feel alive. With a few lines of CSS — no JavaScript — you can make buttons grow, colours fade, and cards lift.

### `:hover` — styles that apply when the mouse is over something

```
button:hover {
  background: purple;
}
```

Add `:hover` after any selector. (On phones, a tap triggers it.)

### `transition` — make changes smooth

Without a transition, the change is instant and jerky. With one, it **glides**:

```
button {
  transition: all 0.3s ease;
}
```

"Animate any change over 0.3 seconds, easing in and out."

### `transform` — move, scale and rotate

- `transform: scale(1.1);` — grow 10%
- `transform: translateY(-6px);` — float up 6 pixels
- `transform: rotate(5deg);` — tilt

### Build something satisfying

Hover over the button and the cards — then make them your own!

```playground Challenge: change the hover colour, make the card rotate(-2deg), or add a transition to the heading
<style>
  body {
    font-family: sans-serif;
    background: linear-gradient(135deg, #818cf8, #c084fc);
    min-height: 100vh;
    margin: 0;
    padding: 24px;
    text-align: center;
    color: white;
  }

  .btn {
    background: white;
    color: #6d28d9;
    border: 0;
    padding: 14px 28px;
    font-size: 18px;
    border-radius: 999px;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  .btn:hover {
    background: #fde047;
    color: #1f2937;
    transform: scale(1.1);
  }

  .card {
    display: inline-block;
    background: white;
    color: #1f2937;
    width: 140px;
    padding: 16px;
    margin: 20px 8px;
    border-radius: 14px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .card:hover {
    transform: translateY(-8px);
    box-shadow: 0 14px 24px rgba(0,0,0,0.3);
  }
</style>

<h1>Hover over me 👇</h1>
<button class="btn">Click me!</button>
<br>
<div class="card">🎁<br>Card one</div>
<div class="card">🎈<br>Card two</div>
<div class="card">🎉<br>Card three</div>
```

### Good taste matters

- Keep transitions **short** (0.2–0.4s).
- Use effects to give **feedback** (this is clickable!), not just decoration.
- Don't animate everything. A little goes a long way.

### Bonus: the `cursor` property

`cursor: pointer;` changes the mouse to a hand. Put it on anything clickable so people know it is.

✅ **You learned:** `:hover`, `transition`, `transform` (`scale`, `translate`, `rotate`), and how to make a page feel alive.
