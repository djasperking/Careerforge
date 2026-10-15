## 📋 Lists & tables

Lists and tables help you organise information so it's easy to scan.

### Unordered lists (bullets)

Use `<ul>` ("unordered list") for items where the order doesn't matter. Each item is an `<li>` ("list item"):

```
<ul>
  <li>Eggs</li>
  <li>Bread</li>
</ul>
```

> 📌 **Remember:** <ul> makes bullets; every item is an <li>.

::: check Which tag wraps each item in a list?
- <item>
+ <li>
- <p>
= <li> = list item.
:::

### Ordered lists (numbers)

Use `<ol>` when the order **does** matter — like steps in a recipe:

```
<ol>
  <li>Boil the water</li>
  <li>Add the noodles</li>
</ol>
```

> 📌 **Remember:** <ol> makes a numbered list.

::: check Which tag makes a numbered list?
- <ul>
+ <ol>
- <num>
= ol = ordered list.
:::

### Tables

Tables show data in rows and columns. They use four tags:

- `<table>` — the whole table
- `<tr>` — a table **row**
- `<th>` — a header cell (bold, centred)
- `<td>` — a normal data cell

```playground Challenge: add a new row for your own favourite meal, and a third list item
<h2>My Weekly Plan 🗓️</h2>

<h3>Shopping list</h3>
<ul>
  <li>Rice</li>
  <li>Tomatoes</li>
</ul>

<h3>How to make tea</h3>
<ol>
  <li>Boil water</li>
  <li>Add tea bag</li>
  <li>Wait. Be patient.</li>
</ol>

<h3>Meals</h3>
<table border="1" cellpadding="8">
  <tr><th>Day</th><th>Meal</th></tr>
  <tr><td>Monday</td><td>Jollof rice</td></tr>
  <tr><td>Tuesday</td><td>Beans &amp; plantain</td></tr>
</table>
```

> 📝 In the example `border="1"` just makes the table lines visible. In Module 3 you'll style tables properly with CSS.

> 📌 **Remember:** Tables: <table> > <tr> rows > <td> cells (<th> for headings).

::: check What does <tr> stand for?
+ table row
- text region
- top right
= Each <tr> is one row of the table.
:::

### Lists inside lists

You can put a list **inside** an `<li>` to make sub-points. Try it: put a `<ul>` inside one of the shopping-list items above.

> 📌 **Remember:** You can nest a list inside an <li> to make sub-lists.

::: check Where does a nested list go?
- After </body>
+ Inside an <li>
- In <head>
= Nested lists live inside a list item.
:::

### Tables are for data — not layout

Only use tables for real tabular data (schedules, prices, scores). For arranging your page, we use CSS Flexbox in Module 3.

> 📌 **You learned:** `<ul>`, `<ol>`, `<li>`, and building tables with `<table>`, `<tr>`, `<th>`, `<td>`.

> 📌 **Remember:** Use tables for data, never for page layout.

::: check What are tables for?
- Page layout
+ Data in rows and columns
- Decoration
= Layout is CSS's job.
:::
