## 🧰 Your HTML & CSS cheat sheet

Bookmark this lesson. Even experienced developers look things up — this is your quick reference.

### HTML essentials

**The page skeleton**

```
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Page title</title>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    ...visible content...
  </body>
</html>
```

**Text**
- `<h1>`–`<h6>` headings · `<p>` paragraph · `<br>` line break · `<hr>` divider
- `<strong>` important · `<em>` emphasis · `<mark>` highlight

**Links and images**
- `<a href="url">text</a>` · `<img src="file" alt="description">`

**Lists and tables**
- `<ul>` bullets · `<ol>` numbers · `<li>` item
- `<table>` · `<tr>` row · `<th>` header cell · `<td>` data cell

**Forms**
- `<form>` · `<label for="id">` · `<input type="text|email|password|number|checkbox|date">`
- `<textarea>` · `<select><option>` · `<button type="submit">`

**Page structure**
- `<header>` · `<nav>` · `<main>` · `<section>` · `<article>` · `<aside>` · `<footer>`
- `<div>` block box · `<span>` inline wrapper

### CSS essentials

**A rule**

```
selector {
  property: value;
}
```

**Selectors**
- `p` element · `.card` class · `#hero` ID · `a:hover` when hovered

**Text and colour**
- `color` · `background-color` · `font-family` · `font-size` · `font-weight`
- `text-align` · `line-height` · `text-decoration`

**The box model**
- `margin` outside · `border` edge · `padding` inside · `width` / `height`
- `border-radius` · `box-shadow` · `box-sizing: border-box`

**Flexbox**
- Container: `display: flex` · `justify-content` · `align-items` · `gap` · `flex-wrap` · `flex-direction`
- Item: `flex: 1`

**Responsive**
- `max-width` · `width: 100%` · `margin: 0 auto`
- `@media (max-width: 600px) { ... }`

**Effects**
- `:hover` · `transition: all 0.3s ease` · `transform: scale(1.1)` · `cursor: pointer`

### Debugging checklist 🔍

When something doesn't work, check in this order:

1. Did you **save** the file and **refresh** the browser?
2. Is every tag **closed** (`</p>`)?
3. Does every CSS declaration end with a **`;`** and every rule with **`}`**?
4. Did you spell the property and class name **exactly** the same in HTML and CSS?
5. Open the browser's tools (**F12**) and click the arrow icon to inspect the element — it shows you exactly which CSS applies.

> 💡 **The best habit in web development:** change one thing, check the result, repeat.

✅ Keep this page handy — you'll use it on your final project.
