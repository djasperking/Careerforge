## 🌈 Colors, fonts & text

Colour and typography are what make a page feel *designed*. Let's learn the tools.

### Ways to write a colour

- **Names** — `tomato`, `navy`, `gold` (about 140 of them)
- **Hex codes** — `#ff6347` (a `#` plus six characters)
- **RGB** — `rgb(255, 99, 71)` (red, green, blue, each 0–255)

All three mean the same tomato red. Hex is the most common in real projects.

> 🎯 **Tip:** search "color picker" in your browser to pick a colour and copy its hex code.

> 📌 **Remember:** Colours: names (tomato), hex (#ff6347), rgb().

::: check Which is a hex colour?
- tomato
+ #ff6347
- red-ish
= Hex starts with #.
:::

### Colour properties

- `color` — the **text** colour
- `background-color` — the **background** colour

> 📌 **Remember:** color = text colour, background-color = the background.

::: check Which property changes the text colour?
+ color
- background-color
- font
= Note: just color, not text-color.
:::

### Text properties

- `font-family` — the typeface, e.g. `Arial, sans-serif`
- `font-size` — e.g. `18px` or `1.2rem`
- `font-weight` — `normal` or `bold`
- `text-align` — `left`, `center`, `right`
- `line-height` — space between lines (try `1.6` — it makes text much easier to read)
- `text-decoration` — underline, or `none` to remove link underlines

> 📌 **Remember:** font-size, font-weight, text-align, line-height shape your text.

::: check Which property centres text?
- font-align
+ text-align
- center-text
= text-align: center;
:::

### Play with a colour palette

```playground Challenge: invent your own palette — change all three colours and the font
<style>
  body {
    font-family: Georgia, serif;
    background-color: #fef3c7;
    color: #1f2937;
    line-height: 1.6;
    padding: 24px;
  }
  h1 {
    color: #b45309;
    text-align: center;
    font-size: 36px;
  }
  .quote {
    background-color: #ffffff;
    border-left: 6px solid #f59e0b;
    padding: 12px 16px;
    font-style: italic;
  }
  a { color: #b45309; text-decoration: none; }
  a:hover { text-decoration: underline; }
</style>

<h1>Colour & Type ✨</h1>
<p class="quote">Good design is as little design as possible.</p>
<p>Learn more on <a href="#">this page</a>. Hover over the link!</p>
```

### Fonts: web-safe choices

Fonts only work if they're installed on the visitor's device. Safe choices everywhere: `Arial`, `Verdana`, `Georgia`, `Times New Roman`, `Courier New`. Always give a **fallback** at the end: `sans-serif`, `serif` or `monospace`.

(Later, you can use free **Google Fonts** for fancier typefaces — they just need one extra line in your `<head>`.)

> 📌 **Remember:** Always give a fallback: font-family: Arial, sans-serif;

::: check Why list more than one font?
- To use all of them
+ If the first isn't available, the next is used
- It looks cooler
= Fallbacks keep the page readable.
:::

### Units: `px` vs `rem`

- `px` — pixels, fixed size
- `rem` — relative to the base font size. `1rem` is usually 16px. Great for accessible, scalable design.

> 📌 **You learned:** colour formats, text and background colours, fonts, `line-height`, alignment, and `:hover` on a link.

> 📌 **Remember:** rem scales with the user's font size; px is fixed.

::: check Which unit respects the user's text-size settings?
- px
+ rem
- none
= rem is relative to the base font size.
:::
