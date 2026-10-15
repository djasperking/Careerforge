## 📝 Forms: collecting information

Every sign-up page, search bar and contact box is a **form**. Let's build one.

### The building blocks

- `<form>` — wraps the whole form
- `<label>` — a caption for an input (click it and the input is selected!)
- `<input>` — a one-line field. Its `type` changes what it does
- `<textarea>` — a big multi-line box
- `<select>` and `<option>` — a dropdown menu
- `<button>` — a button to submit the form

> 📌 **Remember:** A form is <form>, <label>, <input> and a <button>.

::: check Which tag collects what the user types?
- <label>
+ <input>
- <form>
= <input> is the field itself.
:::

### Input types you'll use all the time

- `type="text"` — plain text
- `type="email"` — an email address (the browser checks it looks right)
- `type="password"` — hides what you type
- `type="number"` — numbers only
- `type="checkbox"` — tick box
- `type="date"` — a date picker

> 📌 **Remember:** type="email", "password", "checkbox"… change how an input behaves.

::: check Which type hides what you type?
- text
+ password
- email
= Passwords are shown as dots.
:::

### Labels matter

Connect a label to its input with matching `for` and `id` values. Now clicking the label focuses the input, and screen readers can announce it properly.

```playground Challenge: add a "Phone number" field using type="tel", and make the name required
<h2>Join my newsletter ✉️</h2>

<form>
  <p>
    <label for="name">Your name</label><br>
    <input type="text" id="name" name="name" placeholder="Ada Lovelace">
  </p>
  <p>
    <label for="email">Email</label><br>
    <input type="email" id="email" name="email" placeholder="you@example.com" required>
  </p>
  <p>
    <label for="topic">Favourite topic</label><br>
    <select id="topic" name="topic">
      <option>Web design</option>
      <option>Data</option>
      <option>Remote jobs</option>
    </select>
  </p>
  <p>
    <label><input type="checkbox"> Send me weekly tips</label>
  </p>
  <p>
    <label for="msg">Message</label><br>
    <textarea id="msg" rows="3" cols="30"></textarea>
  </p>
  <button type="submit">Sign me up</button>
</form>
```

> 🔒 In this practice box the form can't actually send anything — sending needs a server (a later topic). What you're learning here is how to **build the form itself**.

> 📌 **Remember:** Every input needs a <label> linked with for/id.

::: check Why use a <label>?
- It makes the box bigger
+ It tells people (and screen readers) what to type
- It's required to compile
= Clicking a label also focuses its input.
:::

### Handy attributes

- `placeholder` — grey hint text inside the box
- `required` — the browser won't submit until it's filled
- `name` — the label the data is sent under (essential when you build real forms)

> 📌 **You learned:** `<form>`, `<label>`, `<input>` types, `<textarea>`, `<select>`, `<button>`, and attributes like `required` and `placeholder`.

> 📌 **Remember:** required and placeholder make forms friendlier.

::: check Which attribute stops a form being sent while a field is empty?
- placeholder
+ required
- empty
= required blocks submission until filled.
:::
