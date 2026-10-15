## 🎨 Meet CSS: selectors & properties

HTML built the house. Now it's time to **paint it**. 🖌️

CSS stands for **Cascading Style Sheets**. It's a list of instructions saying "make *this* look like *that*".

### Anatomy of a CSS rule

```
h1 {
  color: tomato;
  font-size: 40px;
}
```

- `h1` — the **selector**: *which* elements to style
- `color`, `font-size` — **properties**: *what* to change
- `tomato`, `40px` — **values**: *what to change it to*
- Each declaration ends with a **semicolon** `;`

Read it aloud: "For every `h1`, make the colour tomato and the font size 40 pixels."

> 📌 **Remember:** A rule = selector + { property: value; }

::: check In h1 { color: red; }, what is h1?
+ the selector
- the value
- the property
= The selector picks which elements to style.
:::

### Three ways to add CSS

1. **Inline** — inside a tag: `<p style="color: red;">` (quick, but messy)
2. **Internal** — in a `<style>` block inside `<head>`
3. **External** — in a separate `.css` file linked with `<link rel="stylesheet" href="style.css">` (the professional way)

In the practice boxes we use a `<style>` block so you can see everything in one place.

> 📌 **Remember:** Best practice: put CSS in its own .css file and link it.

::: check Which way is cleanest for real sites?
- Inline styles everywhere
+ A separate .css file
- Writing it on paper
= One file can style every page.
:::

### Three kinds of selectors

- **Element** — targets every tag of that type: `p { ... }`
- **Class** — targets elements with `class="name"`; write it with a dot: `.name { ... }`. Reusable!
- **ID** — targets *one* element with `id="name"`; write it with a hash: `#name { ... }`. Must be unique.

```playground Challenge: make the .highlight class yellow-on-black, then add class="highlight" to another paragraph
<style>
  body { font-family: sans-serif; padding: 20px; }
  h1 { color: tomato; }
  p { font-size: 18px; }
  .highlight { background: yellow; padding: 4px; }
  #special { color: seagreen; font-weight: bold; }
</style>

<h1>Selectors in action</h1>
<p>This is a normal paragraph.</p>
<p class="highlight">This paragraph uses a class.</p>
<p id="special">This one uses an ID.</p>
```

> 📌 **Remember:** Element selectors (p), class selectors (.card), ID selectors (#top).

::: check Which selector starts with a dot?
+ class
- element
- id
= .card targets class="card".
:::

### The "cascade" in one sentence

When two rules disagree, CSS picks the more **specific** one, and if they're equally specific, the **later** one wins. (That's the "cascading" part.) You'll feel this naturally as you practise.

> 💡 **Use classes for almost everything.** Classes are flexible and reusable — the standard choice for professional developers.

> 📌 **You learned:** selectors, properties, values, the three ways to add CSS, and the difference between element, class and ID selectors.

> 📌 **Remember:** When rules clash, the more specific (or later) rule wins.

::: check Two rules clash with equal specificity. Which wins?
- The first
+ The one written later
- Neither
= Later rules override earlier ones.
:::
