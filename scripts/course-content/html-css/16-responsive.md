## 📱 Responsive design: one site, every screen

More than half of web visitors are on **phones**. A **responsive** website adapts to any screen size — your pages should look great on a small phone *and* a big monitor.

### Step 1: the viewport tag

Every page you build needs this line inside `<head>`. Without it, phones show a tiny zoomed-out desktop page:

```
<meta name="viewport" content="width=device-width, initial-scale=1">
```

### Step 2: use flexible sizes

Avoid fixed pixel widths for big areas. Prefer:

- `max-width: 900px;` — "as wide as needed, but never wider than 900px"
- `width: 100%;` — fill the available space
- `margin: 0 auto;` — centre a fixed-max-width block
- `rem` and `%` units instead of lots of `px`

### Step 3: media queries

A **media query** applies CSS **only** when a condition is true — usually the screen width:

```
@media (max-width: 600px) {
  .cards {
    flex-direction: column;
  }
}
```

Read it: "When the screen is 600px wide **or less**, stack the cards in a column."

### See it respond

This page stacks its cards on narrow screens. The preview box is narrower on a phone — and if you're on a computer, try shrinking your **browser window** to see it flip!

```playground Challenge: change the breakpoint from 500px to 800px and see when the layout switches
<style>
  * { box-sizing: border-box; }
  body { font-family: sans-serif; margin: 0; padding: 16px; background: #ecfdf5; }
  h1 { text-align: center; color: #047857; }

  .cards { display: flex; gap: 12px; flex-wrap: wrap; }
  .card {
    flex: 1 1 140px;
    background: white;
    padding: 16px;
    border-radius: 12px;
    text-align: center;
    border: 2px solid #34d399;
  }

  @media (max-width: 500px) {
    h1 { font-size: 20px; }
    .card { flex: 1 1 100%; background: #d1fae5; }
  }
</style>

<h1>Responsive cards 📱💻</h1>
<div class="cards">
  <div class="card">🍎 One</div>
  <div class="card">🍌 Two</div>
  <div class="card">🍇 Three</div>
</div>
```

### Mobile-first thinking

Many developers design for **phones first**, then add media queries (`min-width`) for bigger screens. It forces you to keep things simple, and it matches how most people browse.

### Test on a real phone

Open your page on your phone, or press **F12** in Chrome and click the little phone/tablet icon to simulate different devices.

✅ **You learned:** the viewport tag, flexible units, `max-width`, `@media` queries, and designing for phones.
