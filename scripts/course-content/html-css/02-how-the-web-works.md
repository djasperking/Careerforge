## 🌍 How websites work: HTML, CSS & the browser

Every website you've ever visited — Google, Instagram, your bank — is built from the same three ingredients. Think of building a **house**:

- 🧱 **HTML** is the *structure* — the walls, doors and rooms. It says **what is on the page**.
- 🎨 **CSS** is the *style* — paint, furniture, lighting. It says **how it looks**.
- ⚡ **JavaScript** is the *behaviour* — lights that switch on, doors that open. It says **what it does**. (That's a later course!)

In this course we master the first two. They're the foundation of everything on the web.

### What happens when you open a website?

1. You type a web address, or tap a link.
2. Your browser asks a computer called a **server** for the page.
3. The server sends back files — mostly **HTML** and **CSS**.
4. Your browser **reads** them and **draws** the page on your screen.

That's it. The browser is a translator: it turns text files into the page you see.

### HTML alone vs HTML + CSS

Here is the *same* page twice. First the plain HTML. Then try deleting the `<style>` part and see what CSS was doing for you.

```playground Challenge: delete the whole <style> block and see what changes
<style>
  body { font-family: sans-serif; background: #fff7ed; text-align: center; padding: 24px; }
  h1 { color: #c2410c; }
  button { background: #ea580c; color: white; border: 0; padding: 10px 18px; border-radius: 999px; font-size: 16px; }
</style>

<h1>Fresh Mango Juice 🥭</h1>
<p>Cold, sweet and made today.</p>
<button>Order now</button>
```

Without CSS the page still **works** — it's just plain. HTML gives it meaning; CSS gives it personality.

### Where do you write code?

You write HTML in a plain **text file** that ends in `.html`, for example `index.html`. Double-click it and your browser opens it — no internet needed.

> 💡 **Tip:** `index.html` is the traditional name for a website's front page. Browsers look for it first.

### Quick vocabulary

- **Browser** – the app that shows websites (Chrome, Safari…)
- **Server** – a computer that stores websites and sends them to you
- **HTML** – the language of structure
- **CSS** – the language of style
- **Tag** – a label in HTML, like `<p>` (you'll meet these next module)

✅ **You learned:** HTML is structure, CSS is style, and the browser turns both into the page you see.
