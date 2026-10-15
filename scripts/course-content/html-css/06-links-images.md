## 🔗 Links & images

The web is called a *web* because pages are **linked** together. Let's learn to make links and add pictures.

### Links with `<a>`

The `<a>` ("anchor") tag creates a clickable link. The `href` attribute says where it goes:

```
<a href="https://careerforge.com.ng">Visit Career Forge</a>
```

- The text between the tags is what people **click**.
- `href` is the **destination**.

> 💡 Write link text that makes sense on its own. "Read our refund policy" is better than "click here".

> 📌 **Remember:** Links use <a href="..."> — the text between the tags is what people click.

::: check Which attribute holds the link's address?
- src
+ href
- link
= href is the destination.
:::

### Linking to your own pages

If you have two files in the same folder, link to the other file by name:

```
<a href="about.html">About me</a>
```

That's a **relative link**. A full web address like `https://...` is an **absolute link**.

> 📌 **Remember:** A relative link like about.html points to a file in your own site.

::: check Which is a relative link?
+ about.html
- https://google.com
- www
= No https:// means it's inside your own site.
:::

### Images with `<img>`

Images use the `<img>` tag. It has **no closing tag**, and two key attributes:

- `src` — where the image file is
- `alt` — a short description (read aloud by screen readers, and shown if the image fails to load)

```
<img src="photo.jpg" alt="Me smiling at the beach">
```

> ♿ **Never skip `alt`.** It makes your site usable for people who can't see the image — and it helps Google too.

> 📌 **Remember:** <img> needs src (the file) and alt (a description).

::: check Which attribute describes an image for people who can't see it?
- src
+ alt
- title
= alt is essential for accessibility and Google.
:::

### Try it: a link and an image

This box uses a tiny built-in picture so it works without internet. (The preview blocks real navigation, so links won't open here — in your own file they will!)

```playground Challenge: change the alt text, the link text, and try width="200"
<h2>My Travel Page ✈️</h2>
<img
  width="120"
  alt="A smiling sun"
  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' fill='%23facc15'/%3E%3Ccircle cx='37' cy='42' r='5'/%3E%3Ccircle cx='63' cy='42' r='5'/%3E%3Cpath d='M32 60 Q50 80 68 60' stroke='black' stroke-width='5' fill='none'/%3E%3C/svg%3E">
<p>Planning my next trip? Check the <a href="https://example.com">travel guide</a>.</p>
```

> 📌 **Remember:** Images are self-closing: <img> has no closing tag.

::: check Does <img> need a closing tag?
- Yes, </img>
+ No
- Only on Fridays
= <img> is a self-closing element.
:::

### Open a link in a new tab

Add `target="_blank"` to open the link in a new tab:

```
<a href="https://example.com" target="_blank" rel="noopener">Open in a new tab</a>
```

(`rel="noopener"` is a safety habit — always add it with `_blank`.)

> 📌 **You learned:** links (`<a href>`), images (`<img src alt>`), relative vs absolute links, and why `alt` matters.

> 📌 **Remember:** target="_blank" opens a link in a new tab.

::: check Which attribute opens a link in a new tab?
- new="tab"
+ target="_blank"
- open="yes"
= Add rel="noopener" too for safety.
:::
