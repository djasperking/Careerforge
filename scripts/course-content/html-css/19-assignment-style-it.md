## 🎨 Assignment 2: Style your About Me page

[[workspace checks=css]]

Your page has its **structure**. Now give it **personality**. The editor below has two files: `index.html` (a plain page, already linked to your stylesheet) and `style.css` (nearly empty — that's where you work). Switch between them with the tabs.

### Your mission

Write CSS in `style.css` so your page includes **all** of these (the checker will tick them off):

1. ✅ A **colour scheme** you chose on purpose: text colour and a background colour
2. ✅ A custom **`font-family`** with a fallback
3. ✅ **Padding** and **margin** used to give things room
4. ✅ **Element selectors** (`body`, `h1`…) and at least one **class** (add `class="card"` in the HTML, then style `.card`)
5. ✅ Sections turned into **cards**: `border-radius` and/or `box-shadow`
6. ✅ Your `<nav>` laid out with **Flexbox** (`display: flex`)
7. ✅ A **hover effect** with a smooth **transition**
8. ✅ A **media query** that changes something on small screens

> 💡 **Change one thing at a time.** Type a little, glance at the preview, repeat. If something looks wrong, check for a missing `;` or `}` — the two most common CSS typos.

### 🌟 Bonus

- `box-sizing: border-box` on everything
- A gradient background with `linear-gradient`

### Submit it

Press **Submit my website** when you're happy. Your instructor reviews your styling and code, and you can resubmit after feedback.

Make it yours. Make it beautiful. 💜

```file:index.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>About Ada</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <h1>Ada Obi</h1>
    <p>Learning to build websites, one tag at a time.</p>
    <nav>
      <a href="#about">About</a>
      <a href="#hobbies">Hobbies</a>
      <a href="#contact">Contact</a>
    </nav>
  </header>

  <main>
    <section id="about">
      <h2>About me</h2>
      <p>I love good food, good music and learning new skills.</p>
    </section>

    <section id="hobbies">
      <h2>My hobbies</h2>
      <ul>
        <li>Cooking jollof</li>
        <li>Football</li>
        <li>Coding</li>
      </ul>
    </section>
  </main>

  <footer>
    <p>&copy; 2026 Ada Obi</p>
  </footer>
</body>
</html>
```

```file:style.css
/* Write your CSS here. Start with the body! */
body {

}
```
