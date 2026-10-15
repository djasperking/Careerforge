## 🧩 Flexbox: layout made easy

How do you put things **side by side**, centre them, or spread them evenly? In the old days it was a nightmare. Today we have **Flexbox**, and it's wonderful.

### The idea

Put `display: flex;` on a **container**, and its direct children become **flex items** that line up in a row.

```
.row {
  display: flex;
}
```

That one line turns stacked boxes into a row. 🎉

> 📌 **Remember:** display: flex on a parent lines its children up in a row.

::: check Which CSS turns on flexbox?
- layout: flex
+ display: flex
- flex: on
= Put it on the container.
:::

### The controls you'll use constantly

On the **container**:

- `justify-content` — how items spread **along the row**: `flex-start`, `center`, `space-between`, `space-around`
- `align-items` — how items line up **across** the row: `stretch`, `center`, `flex-start`
- `gap` — space *between* items (so much easier than margins)
- `flex-wrap: wrap;` — let items drop to the next line when there isn't room
- `flex-direction: column;` — stack items vertically instead

On an **item**:

- `flex: 1;` — grow to share the leftover space equally

> 📌 **Remember:** justify-content (main axis), align-items (cross axis), gap (spacing).

::: check Which adds space between flex items?
- space
+ gap
- margin-all
= gap is the easiest spacing.
:::

### Build a navigation bar and a row of cards

```playground Challenge: change justify-content to center, then to space-around — then add a 4th card
<style>
  * { box-sizing: border-box; }
  body { font-family: sans-serif; margin: 0; background: #f1f5f9; }

  .nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #1e293b;
    color: white;
    padding: 14px 20px;
  }
  .nav a { color: white; margin-left: 16px; text-decoration: none; }

  .cards {
    display: flex;
    gap: 16px;
    padding: 20px;
  }
  .card {
    flex: 1;
    background: white;
    padding: 16px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    text-align: center;
  }
</style>

<div class="nav">
  <strong>MySite</strong>
  <div><a href="#">Home</a><a href="#">About</a><a href="#">Contact</a></div>
</div>

<div class="cards">
  <div class="card"><h3>🎨 Design</h3><p>Make it pretty.</p></div>
  <div class="card"><h3>⚙️ Build</h3><p>Make it work.</p></div>
  <div class="card"><h3>🚀 Launch</h3><p>Share it.</p></div>
</div>
```

### Centre anything (the famous trick)

Want something perfectly centred, horizontally *and* vertically? Three lines:

```
.parent {
  display: flex;
  justify-content: center;
  align-items: center;
}
```

> 💡 **Remember the two directions:** `justify-content` works along the main direction (a row, by default). `align-items` works across it. Flip `flex-direction` and they swap roles.

> 📌 **You learned:** `display: flex`, `justify-content`, `align-items`, `gap`, `flex-wrap`, `flex-direction` and `flex: 1`.

> 📌 **Remember:** Centre anything: display:flex; justify-content:center; align-items:center;

::: check Which property centres items along the main axis?
+ justify-content
- align-text
- centre
= justify-content: center;
:::
