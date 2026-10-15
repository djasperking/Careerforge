## ✍️ Headings, paragraphs & text

Most of the web is **text**, so let's learn how to structure it well.

### Headings: `<h1>` to `<h6>`

Headings are the titles and subtitles of your page. `<h1>` is the biggest and most important; `<h6>` is the smallest.

> 📌 **Rule of thumb:** use **one `<h1>` per page** (the main title), then `<h2>` for sections, `<h3>` for sub-sections. It helps Google and screen readers understand your page.

> 📌 **Remember:** Use one <h1> per page, then <h2> and <h3> for sections.

::: check How many <h1> should a page normally have?
- As many as possible
+ One
- None
= One main title per page helps Google and screen readers.
:::

### Paragraphs, line breaks and lines

- `<p>` — a paragraph. The browser adds space around it.
- `<br>` — a line break (no closing tag!).
- `<hr>` — a horizontal line to separate sections.

> 📌 **Remember:** <p> is a paragraph, <br> a line break, <hr> a divider line.

::: check Which tag starts a new paragraph?
+ <p>
- <hr>
- <br>
= <p> wraps a paragraph of text.
:::

### Making words stand out

- `<strong>` — **important** text (bold)
- `<em>` — *emphasised* text (italic)
- `<mark>` — highlighted text

Put it all together and experiment:

```playground Challenge: add an <h3> and <mark> around your favourite word
<h1>My Favourite Food 🍲</h1>
<h2>Jollof Rice</h2>
<p>Jollof rice is <strong>the best</strong> party food. Some people say it is <em>just rice</em> — those people are wrong.</p>
<hr>
<h2>Why I love it</h2>
<p>It's smoky,<br>it's spicy,<br>and it's always gone first.</p>
```

> 📌 **Remember:** <strong> means important, <em> means emphasis.

::: check Which tag marks text as important?
- <em>
+ <strong>
- <small>
= <strong> shows importance (usually bold).
:::

### Headings are for meaning, not size

Beginners often use `<h1>` just because they want big text. Don't! Choose a heading by **importance**, then use CSS (Module 3) to change how big it looks. HTML = meaning, CSS = looks.

> 📌 **Remember:** Pick headings for meaning, not for their size — CSS controls size.

::: check Why shouldn't you use <h1> just to get big text?
- It is slower
+ Headings describe structure; CSS handles size
- It breaks the browser
= Use CSS for size, headings for structure.
:::

### Comments: notes to yourself

```
<!-- This is a comment. The browser ignores it. -->
```

Use comments to explain your code or temporarily switch something off.

> 📌 **You learned:** headings, paragraphs, line breaks, bold/italic/highlight, and comments.

> 📌 **Remember:** Comments are notes the browser ignores: <!-- like this -->

::: check What does the browser do with a comment?
- Shows it in red
+ Ignores it
- Reads it aloud
= Comments are only for humans.
:::
