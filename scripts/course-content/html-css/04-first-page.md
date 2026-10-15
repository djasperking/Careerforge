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

### Attributes: extra settings

Tags can carry extra information called **attributes**, written inside the opening tag:

```
<a href="https://careerforge.com.ng">Visit Career Forge</a>
```

Here `href` is the attribute name and the web address is its value.

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

### Saving your first file

1. Open your text editor and paste the skeleton above.
2. Save it as `index.html` (make sure it doesn't end in `.txt`!).
3. Double-click the file. Your browser opens it. 🎉

✅ **You learned:** tags, elements, attributes, and the five-part page skeleton.
