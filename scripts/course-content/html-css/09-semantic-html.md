## 🧭 Semantic HTML: giving your page meaning

Imagine a building where every room is labelled "room". Confusing! **Semantic HTML** means using tags that describe *what* each part of the page **is**.

### The main page sections

- `<header>` — the top: logo, title, intro
- `<nav>` — the navigation links (menu)
- `<main>` — the main content (use **one** per page)
- `<section>` — a themed group of content
- `<article>` — a self-contained piece, like a blog post
- `<aside>` — side content, like tips or ads
- `<footer>` — the bottom: copyright, contact links

> 📌 **Remember:** Semantic tags: header, nav, main, section, article, footer.

::: check Which tag holds the main navigation links?
+ <nav>
- <main>
- <footer>
= <nav> is for menus.
:::

### Why bother?

You *could* build everything from generic boxes. But semantic tags:

- 🔍 help **Google** understand your page
- ♿ let **screen readers** jump straight to the menu or the main content
- 🧹 make your code **easier to read** — for you and for others

> 📌 **Remember:** Semantic tags help Google, screen readers and you.

::: check Who benefits from semantic HTML?
- Only the author
+ Search engines, screen readers and developers
- Nobody
= Meaningful tags are better for everyone.
:::

### See the structure

```playground Challenge: add a second <section> about your hobbies, and a new link in the <nav>
<header>
  <h1>Ada's Corner</h1>
  <p>Writing about code and cooking.</p>
</header>

<nav>
  <a href="#">Home</a> |
  <a href="#">Blog</a> |
  <a href="#">Contact</a>
</nav>

<main>
  <section>
    <h2>About me</h2>
    <p>I'm learning to build websites, one tag at a time.</p>
  </section>
  <article>
    <h2>My first blog post</h2>
    <p>Today I learned that HTML is not scary.</p>
  </article>
</main>

<footer>
  <p>© 2026 Ada. Made with HTML.</p>
</footer>
```

Right now it looks plain — that's expected! Semantic tags don't change the *look*. Their job is **meaning**. In Module 3 you'll make them beautiful.

> 📌 **Remember:** A typical page: header, nav, main (with sections), footer.

::: check Which tag goes at the very bottom of a page?
- <header>
+ <footer>
- <aside>
= Footers hold copyright and links.
:::

### `<div>` and `<span>`: the neutral boxes

Sometimes there's no meaningful tag for what you need. Then use:

- `<div>` — a generic **block** box (takes the full width)
- `<span>` — a generic **inline** wrapper (sits inside a line of text)

Reach for semantic tags first; use `<div>` and `<span>` when nothing else fits.

> 📌 **You learned:** `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`, and when to use `<div>` and `<span>`.

> 📌 **Remember:** <div> and <span> are neutral boxes with no meaning — use semantic tags first.

::: check When should you use <div>?
- Always
+ When no semantic tag fits
- Never
= Prefer meaningful tags when one exists.
:::
