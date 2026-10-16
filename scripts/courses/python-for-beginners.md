---
key: python-for-beginners
title: Python for Beginners: Write Your First Programs
description: Learn Python from scratch, the friendly way. Understand variables, text, numbers, decisions, loops, lists, dictionaries and functions, predict what code does in quick checks, then write real programs: a quiz game, a budget tracker and an automation script. With a certificate. Uses free online tools, no installation needed.
category: programming | Programming
price: 5000
level: BEGINNER
requirements: A phone or computer with internet; A free Google account to use Google Colab (colab.research.google.com), or Python installed; No programming experience needed
objectives: Run Python code and read its output; Store information in variables and work with text and numbers; Make decisions with if statements; Repeat actions with loops; Organise data with lists and dictionaries; Write and reuse functions; Handle simple errors and read files; Build small programs that automate real tasks
thumb: LEARN | PYTHON | Write your first programs | BEGINNER | FREE TOOLS | 🐍 | #14532d | #2563eb | #facc15
---
# MODULE: Getting Started with Python
=== TEXT: 👋 Welcome to Python | 300 | preview
## 👋 Welcome to Python

Python is one of the world's most popular programming languages. It is **easy to read**, and it is used for websites, data, automation and AI. Many people start programming with it for exactly that reason.

### What you will build

- 🎮 A **number guessing game**
- 💰 A **budget tracker**
- 🤖 A small **automation script**

> 📌 **Remember:** Python reads almost like English, so you can focus on thinking instead of memorising symbols.

::: check Why do many beginners start with Python?
+ It is easy to read and very versatile
- It only runs on old computers
- It cannot do anything useful
= Simple code, big possibilities.
:::

### How to run Python (no installation)

1. Go to **colab.research.google.com** and sign in with a Google account.
2. Click **New notebook**.
3. Type code in a cell and press **Shift + Enter** (or the play button) to run it.

Or install Python from **python.org** if you prefer.

> 💡 **Tip:** write every example yourself in Colab. Typing is how you learn.

::: check How do you run a cell in Google Colab?
- Close the tab
+ Press Shift + Enter or the play button
- Print the page
= Each cell runs separately.
:::

=== TEXT: 🖨️ Your first program | 420 | preview
## 🖨️ Your first program

### print()

`print()` shows something on the screen.

```python
print("Hello, world!")
print("My name is Ada")
```

**Output:**

```text
Hello, world!
My name is Ada
```

> 📌 **Remember:** text goes in quotes. print() shows it.

::: check What does print("Hi") show?
- print("Hi")
+ Hi
- Nothing
= The quotes are not shown, only the text.
:::

### Comments

A line starting with `#` is a **comment**: a note for humans that Python ignores.

```python
# This is a comment
print("Comments are ignored")  # even here
```

### Order matters

Python runs **top to bottom**, one line at a time.

### Errors are normal

If you see a red error, read the last line: it says what and where. Typos are the most common cause.

```python
prnt("Oops")
```

**Output:** `NameError: name 'prnt' is not defined`

> 💡 **Tip:** an error is not failure. It tells you exactly what to fix.

::: check What does # do in Python?
+ Starts a comment Python ignores
- Prints a hash
- Ends the program
= Comments help humans read the code.
:::

=== QUIZ: 🧠 Quick check: getting started | 240
? Which function shows text on the screen?
+ print()
- show()
- say()
= print() is the standard way.
? What does a line starting with # mean?
+ It is a comment
- It is an error
- It runs twice
= Python ignores it.
? In what order does Python run code?
+ Top to bottom
- Bottom to top
- Random
= One line at a time.
? What should you read first in an error message?
+ The last line
- Nothing
- Only the first word
= It names the problem.
? True or false: you must install Python to practise.
- True
+ False
= Google Colab runs Python in your browser for free.
# MODULE: Python Basics
=== TEXT: 📦 Variables and types | 480
## 📦 Variables and types

### Variables

A **variable** is a labelled box that stores a value.

```python
name = "Ada"
age = 21
print(name, "is", age)
```

**Output:** `Ada is 21`

> 📌 **Remember:** one `=` stores a value in a variable.

::: check What does age = 21 do?
+ Stores 21 in a variable named age
- Compares age with 21
- Prints 21
= One equals sign assigns.
:::

### Types

- **str** (string): text, like `"Lagos"`
- **int**: whole numbers, like `42`
- **float**: decimals, like `3.5`
- **bool**: `True` or `False`

```python
print(type("Lagos"))
print(type(42))
print(type(3.5))
print(type(True))
```

::: check What type is 3.5?
- int
+ float
- str
= Numbers with decimals are floats.
:::

### Naming rules

Use lowercase with underscores (**snake_case**): `first_name`, `total_price`. Names cannot start with a number or contain spaces.

::: check Which is a good Python variable name?
- 2nd place
- my score
+ first_name
= snake_case is the Python style.
:::

=== TEXT: ➕ Numbers, text and input | 540
## ➕ Numbers, text and input

### Maths

```python
print(10 + 5)    # 15
print(10 - 3)    # 7
print(4 * 3)     # 12
print(10 / 4)    # 2.5
print(10 // 4)   # 2  (whole part only)
print(10 % 3)    # 1  (remainder)
print(2 ** 3)    # 8  (2 to the power 3)
```

::: check What does 10 % 3 give?
- 3
+ 1
- 3.33
= 3 goes into 10 three times (9), leaving 1.
:::

### Working with text

```python
name = "Ada"
print("Hello, " + name)
print(f"Hello, {name}! You have {2 + 3} messages.")
print(name.upper(), len(name))
```

**Output:**

```text
Hello, Ada
Hello, Ada! You have 5 messages.
ADA 3
```

An **f-string** (`f"..."`) puts values inside text with `{ }`.

> 📌 **Remember:** use f-strings, like f"Hello {name}", to mix text and values.

::: check What does f"Hi {name}" do?
+ Puts the value of name into the text
- Prints the letter f
- Makes an error
= f-strings fill in values.
:::

### Getting input

```python
name = input("What is your name? ")
print("Nice to meet you,", name)
```

`input()` always returns **text**. Convert to a number with `int()` or `float()`:

```python
age = int(input("Your age? "))
print("Next year you will be", age + 1)
```

::: check What type does input() return?
- A number
+ Text (a string)
- A boolean
= Use int() or float() to convert.
:::

=== TEXT: 🔀 Making decisions with if | 480
## 🔀 Making decisions with if

```python
score = 72

if score >= 70:
    print("You passed! 🎉")
else:
    print("Try again")
```

**Output:** `You passed! 🎉`

### Indentation matters

Python uses **indentation** (4 spaces) to show what belongs inside the `if`. Always indent the lines inside, and end the `if` line with a colon `:`.

> 📌 **Remember:** if condition: then an indented block. The colon and the indentation are required.

::: check What is required at the end of an if line?
- A semicolon
+ A colon
- A comma
= if condition: starts the block.
:::

### elif, and, or

```python
score = 55

if score >= 70:
    print("A")
elif score >= 50:
    print("B")
else:
    print("C")
```

**Output:** `B`

- `and` means both must be true
- `or` means at least one
- `not` flips true and false

::: check With score = 55, what prints above?
- A
+ B
- C
= 55 fails the first test, and passes score >= 50.
:::

### Comparing

Use `==` to check equality (two equals), `!=` for not equal, and `>`, `<`, `>=`, `<=`.

> ⚠️ **Watch out:** `=` stores a value; `==` compares two values.

::: check Which compares two values?
- =
+ ==
- =>
= Double equals compares.
:::

=== TEXT: 🔁 Loops | 480
## 🔁 Loops

### for loops

```python
for i in range(1, 6):
    print("Number", i)
```

`range(1, 6)` gives 1, 2, 3, 4, 5. It stops **before** 6.

**Output:**

```text
Number 1
Number 2
Number 3
Number 4
Number 5
```

> 📌 **Remember:** range(1, 6) starts at 1 and stops before 6.

::: check How many times does for i in range(3) run?
- 2
+ 3
- 4
= i is 0, 1 and 2.
:::

### while loops

```python
money = 50
while money > 0:
    print("Money left:", money)
    money = money - 20
print("Out of money!")
```

**Output:**

```text
Money left: 50
Money left: 30
Money left: 10
Out of money!
```

> ⚠️ **Watch out:** make sure something inside a while loop changes, or it runs forever.

::: check How many times does that while loop run?
- 2
+ 3
- 5
= 50, 30 and 10 are all above 0.
:::

### break and continue

`break` leaves the loop early. `continue` skips to the next round.

=== QUIZ: 🧠 Python basics checkpoint | 420
? What is the type of "42" (with quotes)?
+ str
- int
- float
= Quotes make it text.
? What does 7 // 2 give?
+ 3
- 3.5
- 4
= // gives the whole-number part.
? What does input() return?
+ A string
- An int
- A boolean
= Convert it with int() or float().
? What is needed after an if condition?
+ A colon and an indented block
- A semicolon
- Nothing
= Python uses colons and indentation.
? What prints for: if 10 > 3: print("A") else: print("B")
+ A
- B
- Both
= The condition is true.
? How many times does range(4) loop?
+ 4
- 3
- 5
= It gives 0, 1, 2, 3.
? Which compares two values?
+ ==
- =
- =>
= A double equals compares.
=== ASSIGNMENT: 🎮 Assignment 1: A number guessing game | 2400
## 🎮 Assignment 1: A number guessing game

Write a small Python program and run it in Google Colab. Then paste your **code** and a sample **output** below.

### Your program must

1. Choose a **secret number** (use a fixed number like `secret = 7`, or `import random` and `secret = random.randint(1, 10)`).
2. Ask the player to **guess** using `input()` and convert it with `int()`.
3. Use **if / elif / else** to say "Too high", "Too low" or "Correct!".
4. Use a **loop** so the player gets **up to 3 tries**.
5. Print a **friendly message** at the end that includes the number of tries (use an f-string).

### Bonus

- Let the player choose the highest number.
- Print "Game over" with the secret number if they run out of tries.

### How to submit

Paste into the box:

1. Your **full code**.
2. A **sample run** (copy what the program printed).
3. **Two sentences** about what was hardest.

Your instructor reviews it and sends feedback.

# MODULE: Organising Data and Reusing Code
=== TEXT: 📋 Lists | 480
## 📋 Lists

A **list** holds many values in order. Counting starts at **0**.

```python
fruits = ["mango", "pawpaw", "banana"]

print(fruits[0])      # mango
print(len(fruits))    # 3
fruits.append("orange")
print(fruits)
```

**Output:**

```text
mango
3
['mango', 'pawpaw', 'banana', 'orange']
```

> 📌 **Remember:** list positions start at 0, so the first item is list[0].

::: check In ["a", "b", "c"], what is at position 1?
- a
+ b
- c
= Positions go 0, 1, 2.
:::

### Looping over a list

```python
prices = [1500, 2300, 800]
total = 0

for price in prices:
    total = total + price

print("Total:", total)
print(sum(prices), max(prices), min(prices))
```

**Output:**

```text
Total: 4600
4600 2300 800
```

::: check Which method adds an item to the end of a list?
- add()
+ append()
- push()
= Python uses append().
:::

### Slicing and checking

- `fruits[1:3]` gives items at positions 1 and 2.
- `"mango" in fruits` is `True` if it is in the list.
- `fruits.sort()` sorts the list.

=== TEXT: 🗂️ Dictionaries | 480
## 🗂️ Dictionaries

A **dictionary** stores **key: value** pairs: labelled information.

```python
student = {
    "name": "Ada",
    "age": 21,
    "city": "Lagos",
}

print(student["name"])
student["age"] = 22
student["email"] = "ada@example.com"
print(student)
```

**Output:**

```text
Ada
{'name': 'Ada', 'age': 22, 'city': 'Lagos', 'email': 'ada@example.com'}
```

> 📌 **Remember:** lists are ordered collections, dictionaries are labelled data.

::: check How do you read the city from the student dictionary?
- student.city()
+ student["city"]
- student->city
= Square brackets with the key.
:::

### Looping over a dictionary

```python
for key, value in student.items():
    print(key, "=", value)
```

### A list of dictionaries

This is how real data usually looks:

```python
expenses = [
    {"item": "Rent", "amount": 50000},
    {"item": "Food", "amount": 20000},
]

total = 0
for e in expenses:
    total += e["amount"]
print("Total spent:", total)
```

**Output:** `Total spent: 70000`

::: check What is expenses[0]["item"] above?
+ Rent
- 50000
- Food
= The first dictionary's item is "Rent".
:::

=== TEXT: 🧰 Functions | 540
## 🧰 Functions

A **function** is a named, reusable block of code.

```python
def greet(name):
    print("Hello,", name)

greet("Ada")
greet("Tunde")
```

**Output:**

```text
Hello, Ada
Hello, Tunde
```

`name` is a **parameter**: a placeholder.

### Returning a value

```python
def add(a, b):
    return a + b

total = add(5, 7)
print(total)           # 12
print(add(100, 250))   # 350
```

> 📌 **Remember:** return sends a value back; print only shows it.

::: check What does return do?
+ Sends a value back to the caller
- Prints the value
- Stops Python
= The caller can store or use the result.
:::

### Default values

```python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print(greet("Ada"))
print(greet("Ada", "Welcome"))
```

**Output:**

```text
Hello, Ada!
Welcome, Ada!
```

::: check What does greet("Ada") return above?
+ Hello, Ada!
- Welcome, Ada!
- An error
= The default greeting is Hello.
:::

### Why functions matter

They stop repetition, make code easier to test, and let you give clear names to ideas.

=== TEXT: 🛟 Errors and reading files | 480
## 🛟 Errors and reading files

### try / except

Handle errors without crashing:

```python
try:
    age = int(input("Age: "))
    print("Next year:", age + 1)
except ValueError:
    print("Please type a number.")
```

If the user types "abc", `int()` fails with a `ValueError`, and the program prints a friendly message instead of crashing.

> 📌 **Remember:** use try and except around code that can fail, like converting user input.

::: check What does except do?
+ Runs when an error happens in the try block
- Ends the program
- Repeats the code
= It handles the error politely.
:::

### Reading and writing files

```python
with open("notes.txt", "w") as f:
    f.write("Learn Python\n")
    f.write("Build projects\n")

with open("notes.txt") as f:
    for line in f:
        print(line.strip())
```

`"w"` writes (it replaces the file), `"a"` appends, and the default reads. `with` closes the file for you.

::: check What does the "w" in open("notes.txt", "w") mean?
- Wait
+ Write
- Walk
= "w" opens the file for writing.
:::

### Modules

Python has helpful built-in modules:

```python
import random
import datetime

print(random.randint(1, 10))
print(datetime.date.today())
```

=== QUIZ: 🧠 Data and functions checkpoint | 420
? Which is the first position in a list?
+ 0
- 1
- -1
= Lists start at 0.
? How do you add an item to a list?
+ list.append(item)
- list.add(item)
- list.push(item)
= Python uses append().
? How do you read a dictionary value?
+ my_dict["key"]
- my_dict.key
- my_dict(key)
= Square brackets with the key.
? What does return do?
+ Sends a value back to the caller
- Prints it
- Deletes it
= The result can be stored or used.
? What happens in the except block?
+ It handles an error from the try block
- It starts a loop
- It prints a list
= It prevents a crash.
? What does open("a.txt", "w") do?
+ Opens a file for writing
- Deletes a file
- Reads a file
= "w" replaces and writes.
=== ASSIGNMENT: 💰 Assignment 2: A budget tracker | 3000
## 💰 Assignment 2: A budget tracker

Write a program that tracks expenses, and run it in Google Colab.

### Your program must

1. Store expenses as a **list of dictionaries** with `item` and `amount`.
2. Have a **function** `add_expense(expenses, item, amount)` that adds one.
3. Have a **function** `total(expenses)` that **returns** the total.
4. Use a **loop** to print each expense, then the total.
5. Use **if / else** to print "Over budget!" if the total is above a budget you set (for example 100000), otherwise "Within budget".
6. Use **try / except** around a number the user types (for example with `input()`), and show a friendly message if it is not a number.

### Bonus

- Save the expenses to a file.
- Show the **largest** expense.

### How to submit

Paste into the box:

1. Your **full code**.
2. A **sample run**.
3. **Two sentences** about how a function made your code simpler.

Your instructor reviews it and sends feedback.

# MODULE: Final Exam: Build a Useful Program
=== TEXT: 🧰 Python cheat sheet | 300
## 🧰 Python cheat sheet

```python
name = "Ada"                 # variable
age = int(input("Age? "))    # input + convert
print(f"{name} is {age}")    # f-string

if age >= 18:
    print("Adult")
else:
    print("Minor")

for i in range(3):
    print(i)

items = [1, 2, 3]
items.append(4)
person = {"name": "Ada"}
print(person["name"])

def add(a, b):
    return a + b
```

> 📌 **Remember:** `=` stores, `==` compares, indentation matters, and return sends a value back.

### When something does not work

1. Read the last line of the error.
2. Print your values to check them.
3. Check indentation, colons and spelling.
4. Test after every small change.

=== ASSIGNMENT: 🏁 FINAL EXAM: Build your own useful program | 5400
## 🏁 FINAL EXAM: Build your own useful program

Choose **one** idea (or invent your own) and build it in Python. There is **no timer**.

- 📇 A **contact book**: add, search and show contacts
- 🧾 A **shop till**: items, prices, total and change
- 📝 A **quiz**: questions in a list, score at the end
- 📊 A **grade calculator**: marks in, average and grade out
- 🔐 A **password strength checker**

### Your program must use

1. **Variables** and **f-strings**.
2. **input()** with **int()** or **float()** conversion.
3. **if / elif / else**.
4. A **loop** (for or while).
5. A **list** or a **dictionary** (or a list of dictionaries).
6. At least **two functions**, with at least one that **returns** a value.
7. **try / except** to handle bad input.
8. **Comments** explaining the main parts.

### Stretch goals

- Save and load data from a file.
- Use the `random` or `datetime` module.

### How to submit

Paste into the box:

1. A **title and a 2-line description** of your program.
2. Your **full code**.
3. A **sample run** (copy the output, including what the user typed).
4. **Three sentences**: what you learned, what was hardest, and what you would add next.

Your instructor reviews it and sends feedback, and you can improve and resubmit.

> 🏆 Finish this and every other lesson to earn your **Career Forge certificate**, with a public link for your CV.

=== TEXT: 🎓 You did it! Certificate and what is next | 240
## 🎓 You did it! Certificate and what is next

You can now read and write Python, and you have built real programs. That is a real foundation for data, automation and AI.

### Your certificate 🏅

When you have finished **every lesson**, including your final program, your **certificate** is issued automatically with a public link for your CV and LinkedIn.

> 📌 **Remember:** keep your programs. A small portfolio of working code is proof of skill.

### Next steps

1. Build **one small project a week**: automate something you do by hand.
2. Learn **Git and GitHub** to save and share your code.
3. Try **pandas** (data), **Flask** (websites) or **automation** with files and spreadsheets.
4. Take **JavaScript from Zero** on Career Forge to build interactive websites, and **Excel and Google Sheets** for data.
5. Add your certificate and projects to your **CV Builder** profile and apply on the **Jobs** board.

Thank you for learning with me. Keep building!

The Career Forge team
