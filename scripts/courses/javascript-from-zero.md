---
key: javascript-from-zero
title: JavaScript from Zero: Make Websites Interactive
description: Learn JavaScript step by step and make your web pages come alive. Run real code in every lesson, answer quick checks, build a tip calculator and a to-do app in the built-in editor, then create your own interactive website as your final exam. Free, with a certificate. Best after HTML & CSS from Zero.
category: web-development | Web Development
level: BEGINNER
requirements: Basic HTML and CSS (take HTML & CSS from Zero first); A computer or phone with a web browser; Curiosity — no programming experience needed
objectives: Store and change information with variables; Make decisions with if statements; Repeat actions with loops; Write reusable functions; Work with arrays and objects; Change a web page with JavaScript; React to clicks and typing; Build a small interactive app from scratch
thumb: LEARN | JAVASCRIPT | Make your websites come alive | BEGINNER | LIVE CODE | ⚡ | #1e3a8a | #7c3aed | #f59e0b
---
# MODULE: Getting Started
=== TEXT: 👋 Welcome to JavaScript | 300 | preview
## 👋 Welcome to JavaScript

Hi, I am Daniel. If HTML is the **skeleton** of a website and CSS is its **style**, then **JavaScript is the brain**. It makes things *happen*: buttons that respond, forms that check themselves, games, menus, calculators.

### What you will build

- 🧮 A **tip calculator**
- ✅ A **to-do list app** that adds and removes tasks
- 🚀 Your **own interactive website** as the final exam

> 📌 **Remember:** HTML = structure, CSS = style, JavaScript = behaviour.

::: check Which language makes a web page react when you click a button?
- HTML
- CSS
+ JavaScript
= JavaScript is the behaviour language.
:::

### Run your first line of code

The box below is a real JavaScript editor. Press **▶ Run** and watch the output appear.

```playground-js Challenge: change the name, then press Run
console.log("Hello, world!");
console.log("My name is Daniel");
```

`console.log()` prints a message to the output. Programmers use it all the time to see what their code is doing.

> 💡 **You cannot break anything.** Change, delete, experiment. The **Reset** button restores the starting code.

### How this course works

1. **Read** a short part, then **try the code**.
2. Answer the **quick check** to unlock the next part.
3. Finish the **assignments** in the built-in editor. No software to install.
4. Build your **final website** and earn your certificate.

> 📌 **Remember:** you learn code by writing code. Edit every example!

::: check What does console.log("Hi") do?
- Deletes the page
+ Prints Hi to the output
- Makes text bold
= console.log shows messages so you can see what your code is doing.
:::

=== TEXT: 🌍 What JavaScript is and where it runs | 420 | preview
## 🌍 What JavaScript is and where it runs

JavaScript is a **programming language**: a way to give a computer step-by-step instructions. It was made for browsers, and now it runs almost everywhere: websites, phone apps, servers.

### Code is just instructions, in order

A computer follows your instructions **one line at a time, from top to bottom**. It does exactly what you write, never what you *meant*.

```playground-js Challenge: add a third line that prints your favourite food
console.log("Line 1: wake up");
console.log("Line 2: eat breakfast");
console.log("Line 3: learn JavaScript");
```

> 📌 **Remember:** JavaScript runs top to bottom, one instruction at a time.

::: check In what order does JavaScript run your lines?
- Bottom to top
- Random order
+ Top to bottom, one at a time
= Order matters, so write steps in the order you want them to happen.
:::

### Statements, semicolons and comments

Each instruction is a **statement**. We usually end it with a semicolon `;`. Anything after `//` on a line is a **comment**: a note for humans that the computer ignores.

```playground-js Challenge: write your own comment, then run
// This line is a comment. The computer skips it.
console.log("Comments are ignored"); // this part too
```

::: check What is a comment for?
- Making the code run faster
+ Leaving notes for humans; the computer ignores it
- Printing text on the page
= Use comments to explain why your code does something.
:::

### Errors are normal

Every developer sees errors every day. Read the red message: it usually says what and where. Try it, then fix the typo.

```playground-js Challenge: fix the typo so it prints
console.lg("This has a typo");
```

> 💡 **Tip:** an error is not failure. It is the computer telling you exactly what to fix.

=== QUIZ: 🧠 Quick check: getting started | 240
? Which language adds behaviour (clicks, calculations) to a page?
+ JavaScript
- CSS
- HTML
= HTML is structure, CSS is style, JavaScript is behaviour.
? Which command prints a message to the output?
+ console.log()
- print.page()
- show()
= console.log() is how we print while learning.
? What does // do in JavaScript?
+ Starts a comment the computer ignores
- Divides two numbers
- Ends the program
= Comments are notes for humans.
? In what order does JavaScript normally run code?
+ Top to bottom
- Bottom to top
- Right to left
= One instruction at a time, from the top.
? A typo like console.lg() will usually...
+ Cause an error you should read and fix
- Run perfectly
- Be fixed automatically
= The error message tells you what went wrong.
# MODULE: JavaScript Basics
=== TEXT: 📦 Variables: storing information | 480
## 📦 Variables: storing information

A **variable** is a labelled box that holds a value. You give the box a name, put something inside, and use it later.

### let and const

- `const` makes a box whose value **never changes**.
- `let` makes a box whose value **can change**.

```playground-js Challenge: change the name and the score
const name = "Ada";
let score = 10;
console.log(name, "has", score, "points");

score = score + 5;
console.log(name, "now has", score, "points");
```

> 📌 **Remember:** use `const` by default, and `let` only when the value must change.

::: check Which keyword makes a variable you can change later?
- const
+ let
- fixed
= let can be reassigned; const cannot.
:::

### Naming rules

- Use letters, numbers and `_`, and do not start with a number.
- Use **camelCase** for multi-word names: `firstName`, `totalPrice`.
- Names are **case-sensitive**: `age` and `Age` are different boxes.

::: check Which is a good variable name?
- 2nd-place
- my score
+ firstName
= camelCase names are easy to read and always valid.
:::

### Types of values

- **String**: text in quotes, like `"Hello"`
- **Number**: like `42` or `3.5`
- **Boolean**: `true` or `false`

```playground-js Challenge: add a variable for your age and print its type
const city = "Lagos";
const year = 2026;
const isLearning = true;
console.log(typeof city, typeof year, typeof isLearning);
```

> 📌 **Remember:** the three basic types are string (text), number and boolean (true or false).

::: check What type is "42" (with quotes)?
+ String
- Number
- Boolean
= Quotes make it text, even if it looks like a number.
:::

=== TEXT: ➕ Numbers, strings and operators | 480
## ➕ Numbers, strings and operators

### Maths with numbers

Use `+ - * /` for maths, and `%` for the **remainder** after dividing.

```playground-js Challenge: calculate 15% of 8000
console.log(10 + 5);
console.log(10 * 3);
console.log(17 % 5);
console.log(8000 * 0.15);
```

::: check What does 17 % 5 give?
- 3
+ 2
- 3.4
= 5 goes into 17 three times (15) with 2 left over.
:::

### Joining strings

With `+` you can join text. **Template strings** use backticks and `${}` to place variables inside text. They are easier to read.

```playground-js Challenge: use your own name and city
const name = "Ada";
const city = "Abuja";
console.log("Hi, I am " + name + " from " + city);
console.log(`Hi, I am ${name} from ${city}`);
console.log(name.length, name.toUpperCase());
```

> 📌 **Remember:** template strings, like `Hi ${name}`, put variables inside text.

::: check Which quotes make a template string?
- "double quotes"
- 'single quotes'
+ `backticks`
= Backticks allow ${variable} inside the text.
:::

### Comparing values

Comparisons give a **boolean**: `>`, `<`, `>=`, `<=`, `===` (equal) and `!==` (not equal). Always use three equals signs `===` to compare.

```playground-js Challenge: change the numbers
console.log(5 > 3);
console.log(10 === 10);
console.log("a" === "b");
console.log(7 !== 8);
```

> ⚠️ **Watch out:** one `=` stores a value. Three `===` compares two values.

::: check Which compares two values?
- =
+ ===
- =>
= === compares; a single = assigns.
:::

=== TEXT: 🔀 Making decisions with if | 480
## 🔀 Making decisions with if

Programs need to choose. An **if statement** runs code only when a condition is true.

### if and else

```playground-js Challenge: change the score and see which message prints
const score = 72;

if (score >= 70) {
  console.log("You passed! 🎉");
} else {
  console.log("Try again");
}
```

> 📌 **Remember:** `if (condition) { ... } else { ... }` runs one block or the other.

::: check When does the code inside if (age > 17) { ... } run?
- Always
+ Only when age is greater than 17
- Never
= The block runs only if the condition is true.
:::

### More than two choices

Add `else if` for extra options. JavaScript checks from top to bottom and stops at the first match.

```playground-js Challenge: change the score to get each grade
const score = 55;

if (score >= 70) {
  console.log("A");
} else if (score >= 50) {
  console.log("B");
} else {
  console.log("C");
}
```

::: check With score = 55, which grade prints?
- A
+ B
- C
= 55 fails the first check but passes score >= 50.
:::

### Combining conditions

- `&&` means **and** (both must be true)
- `||` means **or** (at least one must be true)
- `!` means **not**

```playground-js Challenge: change age and hasTicket
const age = 20;
const hasTicket = true;

if (age >= 18 && hasTicket) {
  console.log("Welcome in");
} else {
  console.log("Sorry, no entry");
}
```

> 📌 **Remember:** && means both must be true; || means at least one.

::: check With && , when does the whole condition pass?
+ Only if both sides are true
- If either side is true
- Never
= && needs both; || needs only one.
:::

=== TEXT: 🔁 Loops: repeating things | 480
## 🔁 Loops: repeating things

Instead of writing the same line 100 times, use a **loop**.

### The for loop

```playground-js Challenge: make it count to 10
for (let i = 1; i <= 5; i++) {
  console.log("Number", i);
}
```

A for loop has three parts: **start** (`let i = 1`), **keep going while** (`i <= 5`) and **step** (`i++` adds 1 each time).

> 📌 **Remember:** for (start; condition; step) repeats the block until the condition is false.

::: check How many times does for (let i = 1; i <= 3; i++) run?
- 2
+ 3
- 4
= i is 1, 2 and 3, so three times.
:::

### The while loop

A while loop repeats **as long as** a condition is true. Be careful: if the condition never becomes false, it never stops.

```playground-js Challenge: change the starting money
let money = 50;
while (money > 0) {
  console.log("Money left:", money);
  money = money - 20;
}
console.log("Out of money!");
```

> ⚠️ **Watch out:** make sure something inside the loop changes, or it runs forever.

::: check What does a while loop do?
- Runs exactly once
+ Repeats while its condition is true
- Runs only on Fridays
= It keeps going until the condition becomes false.
:::

### Loop practice: the times table

```playground-js Challenge: change the table from 7 to 12
const n = 7;
for (let i = 1; i <= 10; i++) {
  console.log(`${n} x ${i} = ${n * i}`);
}
```

=== TEXT: 🧰 Functions: reusable code | 540
## 🧰 Functions: reusable code

A **function** is a named recipe you can use again and again.

### Writing and calling a function

```playground-js Challenge: call greet with your own name
function greet(name) {
  console.log("Hello, " + name + "!");
}

greet("Ada");
greet("Tunde");
```

`name` is a **parameter**: a placeholder. When you call `greet("Ada")`, the value `"Ada"` is the **argument**.

> 📌 **Remember:** define a function once, then call it as many times as you like.

::: check How do you run (call) a function named greet?
- run greet
+ greet()
- call.greet
= Write the name followed by parentheses.
:::

### Returning a value

A function can **return** an answer, which you can store or print.

```playground-js Challenge: write a function that doubles a number
function add(a, b) {
  return a + b;
}

const total = add(5, 7);
console.log(total);
console.log(add(100, 250));
```

> 📌 **Remember:** `return` sends a value back to whoever called the function.

::: check What does return do?
- Prints the value
+ Sends a value back to the caller
- Restarts the function
= The returned value can be stored in a variable.
:::

### Arrow functions

A shorter way to write functions:

```playground-js Challenge: make a function that adds 7.5% VAT to a price
const square = (x) => x * x;
const hello = (name) => `Hello ${name}`;

console.log(square(9));
console.log(hello("Chioma"));
```

::: check What does the => in (x) => x * x mean?
+ It is an arrow function: input on the left, result on the right
- Greater than or equal to
- An error
= Arrow functions are a compact way to write functions.
:::

=== TEXT: 🗂️ Arrays and objects | 540
## 🗂️ Arrays and objects

### Arrays: lists of things

An **array** holds many values in order. Counting starts at **0**, not 1.

```playground-js Challenge: add your favourite fruit to the array
const fruits = ["mango", "pawpaw", "banana"];

console.log(fruits[0]);
console.log(fruits.length);

fruits.push("orange");
console.log(fruits);
```

> 📌 **Remember:** array positions start at 0, so the first item is fruits[0].

::: check In ["a", "b", "c"], what is at position 1?
- a
+ b
- c
= Positions start at 0: a is 0, b is 1, c is 2.
:::

### Looping over an array

```playground-js Challenge: add two more prices
const prices = [1500, 2300, 800];
let total = 0;

for (const price of prices) {
  total = total + price;
}

console.log("Total:", total);
console.log(prices.map((p) => p * 2));
```

::: check Which method adds an item to the end of an array?
- add()
+ push()
- append.end()
= push adds to the end of the array.
:::

### Objects: labelled information

An **object** groups related data with names (called keys).

```playground-js Challenge: add an email key to the object
const student = {
  name: "Ada",
  age: 21,
  city: "Lagos",
};

console.log(student.name);
student.age = 22;
console.log(student);
```

> 📌 **Remember:** arrays are lists; objects are labelled groups of information.

::: check How do you read the city of the student object?
- student(city)
+ student.city
- student->city
= Use dot notation: object.key.
:::

=== QUIZ: 🧠 JavaScript basics checkpoint | 420
? Which keyword creates a variable that cannot be reassigned?
+ const
- let
- var
= const stays fixed.
? What does "5" + 3 produce in JavaScript?
+ "53" (text)
- 8
- An error
= Joining a string with a number makes a string.
? Which operator checks that two values are equal?
+ ===
- =
- =>
= Use === to compare.
? What prints for: if (10 > 3) { console.log("A") } else { console.log("B") }
+ A
- B
- Both
= 10 > 3 is true, so the if block runs.
? How many times does for (let i = 0; i < 4; i++) run?
+ 4
- 3
- 5
= i is 0, 1, 2 and 3.
? What does a function return?
+ A value sent back to the caller
- Nothing, ever
- The function's name
= return gives an answer back.
? What is the index of the first item in an array?
+ 0
- 1
- -1
= Arrays start counting from 0.
? How do you read the name of the object user = { name: "Ada" }?
+ user.name
- user[name()]
- name.user
= Dot notation reads a key.
=== ASSIGNMENT: 🧮 Assignment 1: Build a tip calculator | 2400
## 🧮 Assignment 1: Build a tip calculator

[[workspace checks=js]]

Time to build your first real program, right here in the editor. The page already has an input and a button. **Your job is to write the JavaScript** in `script.js`.

### Your mission

Make the page work like this: the user types a bill amount and chooses a tip percentage, presses **Calculate**, and sees the tip and the total.

Your code must include:

1. ✅ **Variables** (`const` or `let`) for the bill and the tip
2. ✅ A **function** that calculates the tip and total
3. ✅ An **if statement** that shows a message if the bill is empty or not a number
4. ✅ Code that **finds elements** on the page (`document.querySelector`)
5. ✅ An **event listener** so the button reacts to a click
6. ✅ Code that **updates the page** with the result (`textContent`)

> 💡 **Hint:** the maths is `tip = bill * percent / 100` and `total = bill + tip`.

### Bonus

- Round the answers with `.toFixed(2)`
- Add a loop that shows the tip for 5%, 10% and 15%

### Submit it

Press **Submit my website** when it works. The live preview shows your calculator, so try it before you send it.

```file:index.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Tip Calculator</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 360px; margin: 30px auto; padding: 0 16px; }
    input, select, button { width: 100%; padding: 10px; margin: 6px 0; font-size: 16px; box-sizing: border-box; }
    button { background: #7c3aed; color: white; border: 0; border-radius: 8px; cursor: pointer; }
    #result { margin-top: 14px; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Tip Calculator</h1>
  <label for="bill">Bill amount</label>
  <input id="bill" type="number" placeholder="e.g. 5000">
  <label for="tip">Tip</label>
  <select id="tip">
    <option value="5">5%</option>
    <option value="10" selected>10%</option>
    <option value="15">15%</option>
  </select>
  <button id="calc">Calculate</button>
  <p id="result"></p>
  <script src="script.js"></script>
</body>
</html>
```

```file:script.js
// Write your JavaScript here.
// 1. Find the elements: const billInput = document.querySelector("#bill");
// 2. Write a function that works out the tip and total.
// 3. Listen for a click on the button and show the result in #result.

```

# MODULE: JavaScript in the Browser
=== TEXT: 🌐 The DOM: changing the page | 540
## 🌐 The DOM: changing the page

When a browser loads your HTML it builds a live model of the page called the **DOM**. JavaScript can find any element in it and change it.

### Finding an element

Use `document.querySelector()` with a CSS selector: `"h1"`, `".card"` or `"#title"`.

```playground Challenge: change the heading text, then press Run
<h1 id="title">Hello</h1>
<p class="note">I am a paragraph.</p>

<script>
  const title = document.querySelector("#title");
  title.textContent = "Hello, JavaScript! 🎉";
</script>
```

> 📌 **Remember:** `document.querySelector("#id")` finds an element; `.textContent` changes its text.

::: check Which finds the element with id="box"?
- document.find("box")
+ document.querySelector("#box")
- document.box
= querySelector takes a CSS selector, and # means id.
:::

### Changing styles and classes

```playground Challenge: change the colour and size
<h1 id="title">Style me</h1>

<script>
  const title = document.querySelector("#title");
  title.style.color = "tomato";
  title.style.fontSize = "48px";
  title.classList.add("big");
</script>
```

::: check Which property changes the text inside an element?
- .text
+ .textContent
- .words
= textContent reads or sets an element's text.
:::

### Creating new elements

```playground Challenge: add three more list items
<ul id="list"></ul>

<script>
  const list = document.querySelector("#list");
  const names = ["Ada", "Tunde", "Chioma"];

  for (const name of names) {
    const li = document.createElement("li");
    li.textContent = name;
    list.appendChild(li);
  }
</script>
```

> 📌 **Remember:** `createElement` makes a new element, `appendChild` puts it on the page.

::: check Which adds a new element to the page?
- list.add(li)
+ list.appendChild(li)
- list.write(li)
= appendChild attaches an element inside another.
:::

=== TEXT: 🖱️ Events: reacting to clicks | 540
## 🖱️ Events: reacting to clicks

An **event** is something that happens: a click, a key press, typing. With `addEventListener` your code waits for it and reacts.

### Click events

```playground Challenge: change the message and the number added each click
<button id="btn">Click me</button>
<p id="out">Clicks: 0</p>

<script>
  let count = 0;
  const btn = document.querySelector("#btn");
  const out = document.querySelector("#out");

  btn.addEventListener("click", () => {
    count = count + 1;
    out.textContent = "Clicks: " + count;
  });
</script>
```

> 📌 **Remember:** `element.addEventListener("click", function)` runs your function on every click.

::: check What does addEventListener("click", ...) do?
- Clicks the button for you
+ Runs your code whenever the element is clicked
- Deletes the element
= It waits for the event, then calls your function.
:::

### Reading what the user types

An input's `.value` holds what the user typed. It is always a **string**, so convert it with `Number()` for maths.

```playground Challenge: make it greet with "Welcome," instead
<input id="name" placeholder="Your name">
<button id="go">Greet me</button>
<p id="msg"></p>

<script>
  const input = document.querySelector("#name");
  const msg = document.querySelector("#msg");

  document.querySelector("#go").addEventListener("click", () => {
    msg.textContent = "Hello, " + input.value + "!";
  });
</script>
```

::: check An input's value is always what type?
- A number
+ A string
- A boolean
= Use Number(input.value) when you need to do maths.
:::

### Toggling a class

```playground Challenge: change the colours in the style
<style>
  .dark { background: #111; color: white; }
  body { padding: 20px; transition: 0.3s; }
</style>
<button id="mode">Toggle dark mode</button>
<p>Press the button to switch the theme.</p>

<script>
  document.querySelector("#mode").addEventListener("click", () => {
    document.body.classList.toggle("dark");
  });
</script>
```

> 💡 **Tip:** toggling a CSS class is the cleanest way to change how things look. JavaScript flips the class, CSS does the styling.

=== TEXT: ✅ Building a mini app: step by step | 600
## ✅ Building a mini app: step by step

Let us put it all together by building a small to-do app, one piece at a time.

### Step 1: add a task

```playground Challenge: type a task and click Add
<input id="task" placeholder="New task">
<button id="add">Add</button>
<ul id="list"></ul>

<script>
  const input = document.querySelector("#task");
  const list = document.querySelector("#list");

  document.querySelector("#add").addEventListener("click", () => {
    if (input.value.trim() === "") return;
    const li = document.createElement("li");
    li.textContent = input.value;
    list.appendChild(li);
    input.value = "";
  });
</script>
```

::: check Why does the code check input.value.trim() === ""?
+ To stop empty tasks being added
- To make the button bigger
- To delete spaces from the page
= Always validate what users type.
:::

### Step 2: complete a task

Clicking a task toggles a line through it.

```playground Challenge: add a task, then click it
<style>.done { text-decoration: line-through; opacity: 0.5; }</style>
<input id="task" placeholder="New task">
<button id="add">Add</button>
<ul id="list"></ul>

<script>
  const input = document.querySelector("#task");
  const list = document.querySelector("#list");

  document.querySelector("#add").addEventListener("click", () => {
    if (input.value.trim() === "") return;
    const li = document.createElement("li");
    li.textContent = input.value;
    li.addEventListener("click", () => li.classList.toggle("done"));
    list.appendChild(li);
    input.value = "";
  });
</script>
```

> 📌 **Remember:** build apps in small steps: add, then complete, then delete. Test after each step.

::: check What is the best way to build a bigger app?
- Write everything at once
+ In small steps, testing after each one
- Copy it without reading
= Small tested steps make problems easy to find.
:::

### Step 3: your turn

For Assignment 2 you will add a **delete button** and a **task counter**. Think about which pieces you need:

- A button created with `createElement("button")`
- `li.remove()` to delete a task
- A variable or `list.children.length` to count

=== QUIZ: 🧠 Browser JavaScript checkpoint | 360
? What does the DOM stand for?
+ Document Object Model, a live model of the page
- Data Output Method
- Digital Online Menu
= JavaScript uses the DOM to change what you see.
? Which finds an element with class "card"?
+ document.querySelector(".card")
- document.find("card")
- document.card()
= Use a CSS selector inside querySelector.
? Which changes an element's text?
+ element.textContent = "Hi"
- element.write("Hi")
- element.say = "Hi"
= textContent sets the text.
? Which runs code when a button is clicked?
+ button.addEventListener("click", ...)
- button.onlyClick()
- button.run()
= addEventListener waits for the event.
? What type is input.value?
+ String
- Number
- Boolean
= Convert with Number(input.value) for maths.
? Which removes a list item stored in the variable li?
+ li.remove()
- li.delete.page()
- remove(li.list)
= element.remove() deletes it from the page.
=== ASSIGNMENT: 📝 Assignment 2: Build a to-do app | 3000
## 📝 Assignment 2: Build a to-do app

[[workspace checks=js]]

Build the to-do app that lists tasks, lets you complete them and delete them. The HTML and CSS are ready, and you write the JavaScript in `script.js`.

### Your mission

The app must:

1. ✅ **Add** a task when the user types and clicks **Add** (and ignore empty tasks)
2. ✅ Use **variables** and at least one **function**
3. ✅ Use `document.querySelector` to find elements
4. ✅ Use an **event listener** for the button
5. ✅ Create list items with `createElement` and **update the page**
6. ✅ Let the user **delete** a task (a button inside each item)
7. ✅ Show a **counter**: "3 tasks left"

### Bonus

- Click a task to mark it done (toggle a class)
- Press **Enter** to add a task (`keydown` event)
- Keep the tasks in an **array**

### Submit it

Test every feature in the preview, then press **Submit my website**.

```file:index.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>To-Do App</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 420px; margin: 30px auto; padding: 0 16px; }
    .row { display: flex; gap: 8px; }
    input { flex: 1; padding: 10px; font-size: 16px; }
    button { padding: 10px 14px; border: 0; border-radius: 8px; background: #7c3aed; color: white; cursor: pointer; }
    ul { list-style: none; padding: 0; }
    li { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #ddd; }
    .done { text-decoration: line-through; opacity: 0.5; }
  </style>
</head>
<body>
  <h1>My Tasks</h1>
  <div class="row">
    <input id="task" placeholder="What needs doing?">
    <button id="add">Add</button>
  </div>
  <p id="count">0 tasks left</p>
  <ul id="list"></ul>
  <script src="script.js"></script>
</body>
</html>
```

```file:script.js
// Your JavaScript goes here.
// Plan:
// 1. Find #task, #add, #list and #count.
// 2. When #add is clicked: ignore empty text, create an <li>, add a Delete button, append it.
// 3. Update the counter after every add or delete.

```

# MODULE: Final Exam: Build Your Own Interactive Website
=== TEXT: 🧰 JavaScript cheat sheet | 300
## 🧰 JavaScript cheat sheet

Keep this open while you build your final website.

### Core ideas

```
const x = 5;            // fixed value
let y = 10;             // can change
if (y > 5) { ... } else { ... }
for (let i = 0; i < 5; i++) { ... }
function add(a, b) { return a + b; }
const nums = [1, 2, 3];  nums.push(4);
const user = { name: "Ada" };  user.name
```

> 📌 **Remember:** `const` for fixed values, `let` for changing ones, and `===` to compare.

### Working with the page

```
const el = document.querySelector("#id");
el.textContent = "New text";
el.addEventListener("click", () => { ... });
el.classList.toggle("active");
const li = document.createElement("li");
list.appendChild(li);   li.remove();
```

### When something does not work

1. Read the error message, because it says what and where.
2. Add `console.log()` to see your values.
3. Check spelling and capital letters (JavaScript is case-sensitive).
4. Test after every small change.

=== ASSIGNMENT: 🏁 FINAL EXAM: Build your own interactive website | 5400
## 🏁 FINAL EXAM: Build your own interactive website

[[workspace checks=html,css,js]]

No multiple choice. For your final exam you build a **small interactive website** that uses what you learned. It is **free**, with **no timer**.

### Pick an idea (or invent your own)

- 🎲 A **guessing game** (guess the number)
- 🧠 A **quiz** with a score
- 💱 A **converter** (naira to dollars, kg to pounds…)
- 🕹️ A **click counter / reaction game**
- 📝 A **notes or shopping list** app

### What it must have

**HTML and CSS**
1. ✅ A proper page: doctype, `lang`, title, viewport
2. ✅ A `<header>`, `<main>` with sections, and a `<footer>`
3. ✅ A heading, paragraphs and a **form or input with a label and button**
4. ✅ Your own **colours, fonts, padding and rounded corners**

**JavaScript**
5. ✅ **Variables** and at least one **function**
6. ✅ An **if statement** that makes a decision
7. ✅ An **array** and a **loop** (or array method)
8. ✅ **Finds elements** with `document.querySelector`
9. ✅ An **event listener** that reacts to a click
10. ✅ **Updates the page** (`textContent`, classes or styles)

### Stretch goals

- Save progress with `localStorage`
- Add a hover effect with a CSS transition
- Make it work well on a phone

### How you will be graded

Your instructor opens your live site and reads your code: **works as described**, **requirements met**, **tidy code**, **good design**. You get written feedback and can resubmit.

> 🏆 Finish this and every other lesson to earn your **Career Forge certificate**, with a public link for your CV.

```file:index.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>My Interactive Site</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>

  <!-- header, main (with your app) and footer go here -->

  <script src="script.js"></script>
</body>
</html>
```

```file:style.css
/* Style your site here. */
body {

}
```

```file:script.js
// Your JavaScript goes here.

```

=== TEXT: 🎓 You did it! Certificate and what is next | 240
## 🎓 You did it! Certificate and what is next

You can now write JavaScript, change web pages, react to users and build interactive apps. That is a real, hireable skill.

### Your certificate 🏅

When you have finished **every lesson**, including the final website, your **certificate** is issued automatically, with a public link you can add to your CV and LinkedIn.

> 📌 **Remember:** your final website is proof of what you can build. Keep improving it.

### What to learn next

1. **More JavaScript:** arrays and objects in depth, `fetch` and APIs, `localStorage`.
2. **A framework:** React is the most popular, and is the next big step.
3. **Projects:** a weather app, a quiz game, a budget tracker.
4. **Git and GitHub** to save and show your work.

### Use your skills

- Add your best project link to your **Career Forge CV**.
- Browse the **Jobs** board for junior developer and web roles.
- Offer a small interactive page to a local business.

Thank you for learning with me. I am proud of you. Now go build something amazing!

Daniel
