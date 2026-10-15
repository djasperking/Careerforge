## 🏗️ Your first web page

Time to write HTML properly. Good news: HTML is mostly one simple idea repeated.

### Tags and elements

HTML is made of **elements**. Most elements have an **opening tag**, some **content**, and a **closing tag**:

```
<p>This is a paragraph.</p>
```

- `<p>` — the opening tag (it says "a paragraph starts here")
- `This is a paragraph.` — the content
- `</p>` — the closing tag (note the **slash**)

Tags are like labels on boxes: they tell the browser *what kind of thing* is inside.

> 📌 **Remember:** Most elements: an opening tag, content, and a closing tag with a slash.

::: check Which is the correct closing tag for a paragraph?
- <p>
+ </p>
- <end>
= Closing tags start with a slash.
:::

### Attributes: extra settings

Tags can carry extra information called **attributes**, written inside the opening tag:

```
<a href="https://careerforge.com.ng">Visit Career Forge</a>
```

Here `href` is the attribute name and the web address is its value.

> 📌 **Remember:** Attributes live in the opening tag, like href in a link.

::: check In <a href="https://x.com">, what is href?
- the content
+ an attribute
- a closing tag
= Attributes give a tag extra information.
:::

### The skeleton every page needs

Every HTML page follows this same skeleton. Memorise the shape — you'll use it forever:

```playground Challenge: change the <title> text and the heading, then spot the difference
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>My First Page</title>
  </head>
  <body>
    <h1>Hello from my first page!</h1>
    <p>Everything you can SEE goes inside the body.</p>
  </body>
</html>
```

Let's read it like a map:

1. `<!DOCTYPE html>` — tells the browser "this is modern HTML".
2. `<html>` — wraps the entire page.
3. `<head>` — **invisible** information: the page title (shown on the browser tab), the character set, links to CSS.
4. `<body>` — everything **visible**: text, images, buttons.

> 💡 **Indentation** (the spaces at the start of lines) is just to keep things readable. Browsers ignore it. Use it so *you* can see which tags are inside which.

> 📌 **Remember:** Visible stuff goes inside <body>; page info goes inside <head>.

::: check Where does everything you can SEE on the page go?
- <head>
+ <body>
- <title>
= The body holds the visible page.
:::

### Saving your first file

1. Open your text editor and paste the skeleton above.
2. Save it as `index.html` (make sure it doesn't end in `.txt`!).
3. Double-click the file. Your browser opens it. 🎉

> 📌 **You learned:** tags, elements, attributes, and the five-part page skeleton.

> 📌 **Remember:** Save as index.html (not .txt) and double-click to open it.

::: check What should the file name end with?
- .txt
+ .html
- .page
= The .html ending tells the browser it is a web page.
:::
