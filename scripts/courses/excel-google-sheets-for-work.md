---
key: excel-google-sheets-for-work
title: Excel & Google Sheets for Work: From Zero to Confident
description: Learn spreadsheets the practical way: enter and format data, write formulas, use SUM, IF, VLOOKUP and more, sort and filter, make charts, and build a real budget or inventory sheet. Works in both Excel and free Google Sheets. Quick checks in every lesson, two hands-on assignments and a free certificate.
category: office-skills | Office Skills
level: BEGINNER
requirements: A computer or phone with Excel or a free Google account for Google Sheets; Basic maths (adding, percentages); No spreadsheet experience needed
objectives: Enter, format and organise data clearly; Write formulas and understand cell references; Use SUM, AVERAGE, COUNT, MIN, MAX and IF; Look up information with VLOOKUP or XLOOKUP; Sort, filter and clean data; Build charts that tell a story; Create a working budget and an inventory tracker
thumb: MASTER | EXCEL & SHEETS | Spreadsheets for real work | BEGINNER | FREE TOOLS | 📊 | #14532d | #16a34a | #f59e0b
---
# MODULE: Spreadsheet Basics
=== TEXT: 👋 Welcome: why spreadsheets matter | 300 | preview
## 👋 Welcome: why spreadsheets matter

Almost every office, shop and business runs on spreadsheets: budgets, stock lists, sales reports, schedules. Knowing them well makes you **faster, more valuable and easier to hire**.

### What you will learn

- 🧱 Cells, rows, columns and sheets
- 🧮 Formulas and functions
- 🔎 Sorting, filtering and lookups
- 📈 Charts
- 💼 A real budget and inventory tracker

### Excel or Google Sheets?

Both work almost the same. **Google Sheets is free** in your browser, and **Excel** is the standard in many offices. Everything here works in both. Where they differ, we say so.

> 📌 **Remember:** learn the ideas once, and they work in any spreadsheet tool.

::: check Which tool is free and runs in your browser?
- Excel desktop
+ Google Sheets
- Neither
= Google Sheets is free with a Google account.
:::

### Open a practice sheet now

Go to **sheets.google.com**, create a **Blank spreadsheet** and keep it open for the practice tasks. Your work saves automatically.

::: check What should you do with the practice sheet?
- Close it and just read
+ Keep it open and try each example
- Print it
= Spreadsheets are learned by doing.
:::

=== TEXT: 🧱 Cells, rows, columns and formatting | 480 | preview
## 🧱 Cells, rows, columns and formatting

### The grid

A spreadsheet is a grid. **Columns** have letters (A, B, C), **rows** have numbers (1, 2, 3). Where they meet is a **cell**, named by column and row: **B3**.

> 📌 **Remember:** a cell address is the column letter plus the row number, like B3.

::: check Which cell is in column C, row 5?
- 5C
+ C5
- CC5
= Column letter first, then the row number.
:::

### Entering data well

- Put **one kind of thing** in each column (names, dates, amounts).
- Use the **first row for headings.**
- Do not leave **blank rows** in the middle of data.
- Keep **one fact per cell**: put first name and last name in separate columns.

### Formatting that helps

- **Bold** the headings and **freeze** the top row so it stays visible.
- Format **money** as currency and **dates** as dates.
- Use **colour sparingly** to guide the eye.
- Widen columns so nothing is cut off.

::: check Where should you put the headings?
+ In the first row
- In the last row
- Anywhere
= Headings in row 1 make sorting and filtering work.
:::

### Try it

Make a small table in your sheet:

| Item | Price | Quantity |
|---|---|---|
| Rice | 1500 | 4 |
| Beans | 1200 | 3 |
| Oil | 2500 | 2 |

Format the **Price** column as currency and bold the headings.

> 💡 **Tip:** press **Ctrl + Z** to undo anything. You cannot break your sheet.

::: check Why keep first and last name in separate columns?
+ It makes sorting and filtering easier
- It looks nicer only
- It is required
= One fact per cell keeps data usable.
:::

=== QUIZ: 🧠 Quick check: spreadsheet basics | 240
? What is the address of the cell in column B, row 3?
+ B3
- 3B
- BB3
= Column letter, then row number.
? Where should column headings go?
+ In the first row
- In the last row
- Nowhere
= Row 1 headings make tools work properly.
? Which is better data entry practice?
+ One kind of data per column
- Mixing names and amounts in one column
- Leaving blank rows between records
= Clean structure makes everything easier.
? How can you keep headings visible when scrolling?
+ Freeze the top row
- Delete them
- Colour them red
= Freezing keeps the header row on screen.
? True or false: Google Sheets is free with a Google account.
+ True
- False
= It runs free in your browser.
# MODULE: Formulas and Functions
=== TEXT: 🧮 Your first formulas | 540
## 🧮 Your first formulas

### Every formula starts with =

Type `=` in a cell, then a calculation. The cell shows the **result**, and the formula bar shows the formula.

- `=5+3` gives 8
- `=B2*C2` multiplies the values in B2 and C2

> 📌 **Remember:** a formula always starts with an equals sign.

::: check Which is a formula?
- 5+3
+ =5+3
- add 5 and 3
= Without = the sheet treats it as text.
:::

### Use cell references, not numbers

Instead of typing `=1500*4`, type `=B2*C2`. If the price or quantity changes, the answer **updates automatically**.

For the table above, put this in D2 (a "Total" column): `=B2*C2`. Then drag the small square at the corner of the cell **down** to copy it to the other rows.

::: check Why use =B2*C2 instead of =1500*4?
+ The result updates when the cells change
- It is shorter only
- Spreadsheets cannot use numbers
= Cell references make a sheet live.
:::

### Operators

- `+` add, `-` subtract, `*` multiply, `/` divide, `^` power
- Use **brackets** to control order: `=(B2+B3)*C2`

> ⚠️ **Watch out:** spreadsheets follow normal maths order, so multiplication happens before addition unless you use brackets.

::: check What does =2+3*4 give?
- 20
+ 14
- 24
= Multiplication first: 3*4 = 12, then 2 + 12 = 14.
:::

=== TEXT: ➕ SUM, AVERAGE, COUNT, MIN and MAX | 480
## ➕ SUM, AVERAGE, COUNT, MIN and MAX

A **function** is a ready-made formula. Put a **range** inside the brackets. A range like `D2:D4` means "from D2 to D4".

### The essential five

| Function | What it does | Example |
|---|---|---|
| `SUM` | adds numbers | `=SUM(D2:D4)` |
| `AVERAGE` | the average | `=AVERAGE(B2:B4)` |
| `COUNT` | how many numbers | `=COUNT(B2:B4)` |
| `MIN` | smallest | `=MIN(B2:B4)` |
| `MAX` | largest | `=MAX(B2:B4)` |

> 📌 **Remember:** `=SUM(D2:D10)` adds every number from D2 down to D10.

::: check Which formula adds the numbers from A1 to A10?
- =ADD(A1-A10)
+ =SUM(A1:A10)
- =A1+A10
= A colon makes a range.
:::

### Try it

Using your Items table, calculate in your sheet:

1. The **total** of all item totals.
2. The **average price**.
3. The **most expensive** item price.

::: check Which function finds the largest value in a range?
- BIGGEST
+ MAX
- TOP
= MAX returns the highest number.
:::

### The AutoSum shortcut

Select the cell **below** a column of numbers and press **Alt + =** in Excel, or use the **Σ** button in Google Sheets. It writes `=SUM(...)` for you.

> 💡 **Tip:** click on the cell with the formula and look at the formula bar. This helps you check your work.

=== TEXT: 🔀 Making decisions with IF | 480
## 🔀 Making decisions with IF

`IF` gives one answer when something is true and another when it is false:

```text
=IF(condition, value_if_true, value_if_false)
```

### Example: pass or fail

If the score is in B2: `=IF(B2>=50,"Pass","Fail")`

- Text goes in quotes.
- You can compare with `>`, `<`, `>=`, `<=`, `=` and `<>` (not equal).

> 📌 **Remember:** IF asks a question, then gives one answer for yes and one for no.

::: check What does =IF(B2>=50,"Pass","Fail") show when B2 is 45?
- Pass
+ Fail
- 45
= 45 is not at least 50, so the false result shows.
:::

### Example: low stock warning

If stock is in C2: `=IF(C2<10,"Reorder","OK")`

### Combine with AND / OR

- `=IF(AND(B2>=50,C2>=50),"Pass","Fail")` needs both to be true.
- `=IF(OR(B2>=50,C2>=50),"Pass","Fail")` needs just one.

::: check What does AND require?
+ Every condition to be true
- Any one condition
- No conditions
= OR needs just one; AND needs all.
:::

=== TEXT: 🔎 Looking up information | 540
## 🔎 Looking up information

Lookups find a value in a table, like a price from a product code.

### VLOOKUP

```text
=VLOOKUP(what_to_find, table_range, column_number, FALSE)
```

Example: a price list in A2:B10 (Code in A, Price in B). To find the price for the code in E2:

`=VLOOKUP(E2, A2:B10, 2, FALSE)`

- `2` means "give me the value from the 2nd column".
- `FALSE` means "exact match only". Always use this for codes and names.

> 📌 **Remember:** VLOOKUP searches the first column of the table, then returns a value from a column to the right.

::: check In =VLOOKUP(E2, A2:B10, 2, FALSE), what does 2 mean?
+ Return the value from the 2nd column of the table
- Look up the number 2
- Find two matches
= The column number says which column to return.
:::

### XLOOKUP (newer, easier)

In modern Excel and Google Sheets: `=XLOOKUP(E2, A2:A10, B2:B10)` finds E2 in A, returns the match from B. It can look left or right and defaults to exact matches.

### Common errors

- `#N/A` means the value was not found. Check spelling and spaces.
- `#REF!` means a reference is broken, often because a column was deleted.
- `#DIV/0!` means you divided by zero.

::: check What does #N/A mean in a lookup?
- The formula is perfect
+ The value you searched for was not found
- The sheet is full
= Check spelling, extra spaces and the table range.
:::

=== QUIZ: 🧠 Formulas and functions checkpoint | 420
? How does every formula start?
+ With =
- With a number
- With a quote
= The equals sign tells the sheet to calculate.
? Why use cell references instead of typing numbers?
+ The answer updates when the cells change
- They look prettier
- Numbers are not allowed
= Cell references make sheets dynamic.
? What does =SUM(A1:A5) do?
+ Adds the numbers from A1 to A5
- Counts the cells
- Multiplies A1 and A5
= A range lets you add many cells.
? What does =2+3*4 give?
+ 14
- 20
- 24
= Multiplication comes before addition.
? In =IF(B2>=50,"Pass","Fail"), what shows if B2 is 70?
+ Pass
- Fail
- 70
= 70 meets the condition.
? What does FALSE mean at the end of VLOOKUP?
+ Exact match only
- Make the result false
- Delete the result
= Always use exact match for codes and names.
? What does #N/A usually mean?
+ The lookup value was not found
- The sheet is broken forever
- The formula is correct
= Check spelling and ranges.
=== ASSIGNMENT: 🧾 Assignment 1: Build a monthly budget | 2400
## 🧾 Assignment 1: Build a monthly budget

Build a **monthly budget** in Google Sheets or Excel, then describe it below.

### Your sheet should have

1. A column for **Category** (Rent, Food, Transport, Data, Savings, Other), **Planned** amount and **Actual** amount.
2. A **Difference** column that uses a formula: `=Planned - Actual`.
3. A **total** row using `SUM` for Planned, Actual and Difference.
4. A **Status** column using `IF`: show "Over budget" if Actual is more than Planned, otherwise "OK".
5. Formatting: bold headings, currency format, and a frozen top row.

### What to submit

In the box below, write:

1. The **formulas you used** for Difference, Total and Status (exactly as typed).
2. A **screenshot link or description** of your sheet: you can share the Google Sheet link set to "Anyone with the link can view".
3. **Two things** you learned or found difficult.

> 💡 **Share link tip:** in Google Sheets, press **Share**, change access to **Anyone with the link: Viewer**, then copy the link.

Your instructor reviews it and sends feedback.

# MODULE: Organise, Analyse and Present
=== TEXT: 🔃 Sorting, filtering and cleaning data | 480
## 🔃 Sorting, filtering and cleaning data

### Sort

Select your data (including headings) and use **Data → Sort**. Sort by **price (high to low)** or **name (A to Z)**.

> ⚠️ **Watch out:** select **all** columns before sorting, or the rows will no longer match.

::: check What can go wrong if you sort only one column?
+ The rows no longer match across columns
- Nothing
- The sheet closes
= Always sort the whole table together.
:::

### Filter

Turn on **Filter** (Data → Create a filter) to show only some rows, like "only Lagos customers" or "stock below 10".

### Cleaning messy data

- **Remove duplicates** (Data → Remove duplicates).
- **TRIM:** `=TRIM(A2)` removes extra spaces.
- **UPPER / LOWER / PROPER:** fix capitalisation: `=PROPER(A2)`.
- **Text to columns / SPLIT:** separate "Ada Obi" into first and last name.

::: check Which function removes extra spaces?
- CLEAN SPACES
+ TRIM
- DELETE
= TRIM removes leading, trailing and doubled spaces.
:::

### Conditional formatting

Colour cells automatically: for example, stock below 10 turns red. Select the range, then Format → Conditional formatting.

> 💡 **Tip:** use colour to highlight problems, not to decorate.

=== TEXT: 📈 Charts that tell a story | 480
## 📈 Charts that tell a story

### Choosing a chart

- **Column or bar:** compare categories (sales by product).
- **Line:** show change over time (monthly income).
- **Pie:** parts of a whole, only with a few slices.

> 📌 **Remember:** pick the chart that answers the question. Time means a line; comparison means columns.

::: check Which chart is best for monthly sales over a year?
- Pie
+ Line
- None
= Lines show trends over time.
:::

### Make a chart

1. Select the data, including headings.
2. Insert → Chart.
3. Choose the chart type.
4. Add a **clear title**, label the axes, and remove clutter.

### Good chart habits

- Start bar charts at **zero** so they do not mislead.
- Use **few colours** and label directly where you can.
- A title should state the **message**: "Rent is 40% of spending".

::: check Why should bar charts start at zero?
+ Otherwise differences look bigger than they are
- It is the default only
- Zero is lucky
= Truncated axes mislead the reader.
:::

=== TEXT: 📦 Pivot tables and summaries | 540
## 📦 Pivot tables and summaries

A **pivot table** summarises lots of rows in seconds, for example "total sales per product".

### Create one

1. Click inside your data (with headings).
2. **Insert → Pivot table**.
3. Choose **Rows** (the categories), **Values** (the numbers to add up).

You can drag fields to group by product, month or salesperson.

> 📌 **Remember:** pivot tables turn long lists into short summaries without writing formulas.

::: check What is a pivot table for?
+ Summarising many rows quickly
- Printing the page
- Deleting duplicates
= They group and total data for you.
:::

### Quick summaries with formulas

- `=SUMIF(A2:A100,"Rice",C2:C100)` adds the amounts where the product is Rice.
- `=COUNTIF(A2:A100,"Rice")` counts how many times Rice appears.

::: check What does SUMIF do?
+ Adds only the cells that meet a condition
- Adds everything
- Sorts the sheet
= SUMIF totals matching rows.
:::

=== QUIZ: 🧠 Analyse and present checkpoint | 360
? What must you select before sorting a table?
+ All the columns of the table
- Only one column
- Nothing
= Otherwise rows can get mixed up.
? Which function removes extra spaces?
+ TRIM
- CUT
- SPACE
= TRIM tidies text.
? Which chart is best for change over time?
+ Line chart
- Pie chart
- No chart
= Lines show trends.
? Why start a bar chart at zero?
+ To avoid misleading differences
- It is required by law
- It looks darker
= Honest charts start at zero.
? What does a pivot table do?
+ Summarises large data quickly
- Prints the sheet
- Removes formatting
= Group and total in seconds.
? What does SUMIF do?
+ Adds values that meet a condition
- Adds everything
- Counts blanks
= Useful for totals per category.
=== ASSIGNMENT: 📦 Assignment 2: Build an inventory tracker | 3000
## 📦 Assignment 2: Build an inventory tracker

Build a **stock tracker** for a small shop in Google Sheets or Excel.

### Your sheet should have

1. Columns: **Item, Category, Unit price, Quantity in stock, Stock value, Reorder level, Status**.
2. At least **10 items**.
3. **Stock value** formula: `=Unit price * Quantity`.
4. **Status** formula using IF: "Reorder" if Quantity is below Reorder level, else "OK".
5. A **total stock value** using SUM.
6. A **filter** and a **conditional format** that highlights "Reorder" rows.
7. **One chart** (for example stock value by category) with a clear title.

### What to submit

In the box below:

1. Paste your **sheet link** (Anyone with the link: Viewer).
2. Write the **formulas** you used for Stock value, Status and the total.
3. Explain in **2 to 3 sentences** what your chart shows and why you chose that chart type.

Your instructor reviews it and sends feedback.

# MODULE: Final Exam: Real-World Spreadsheet
=== TEXT: 🧰 Spreadsheet cheat sheet | 300
## 🧰 Spreadsheet cheat sheet

### Formulas to remember

```text
=SUM(A1:A10)               add a range
=AVERAGE(A1:A10)           average
=IF(B2>=50,"Pass","Fail")  decide
=VLOOKUP(E2,A2:B10,2,FALSE) look up a price
=SUMIF(A:A,"Rice",C:C)     total by condition
=TRIM(A2)                  remove extra spaces
```

> 📌 **Remember:** start with =, use cell references, and always use FALSE for exact lookups.

### Good habits

- One kind of data per column; headings in row 1.
- Never type totals by hand. Use formulas.
- Check your formulas by clicking the cell.
- Keep a **backup copy** of important sheets.

=== ASSIGNMENT: 🏁 FINAL EXAM: Sales report for a small business | 5400
## 🏁 FINAL EXAM: Sales report for a small business

Pretend you work for a small shop. Build a **sales workbook** that the owner can use. It is **free**, with **no timer**.

### Part 1: Data (Sheet "Sales")

Create at least **20 rows** with these columns: **Date, Product, Category, Unit price, Quantity, Total, Salesperson**.

### Part 2: Calculations

1. **Total** column with a formula for each row.
2. A **grand total** of all sales (SUM).
3. The **average sale**, the **largest sale** and the **number of sales** (AVERAGE, MAX, COUNT).
4. A column **"Size"** using IF: "Big sale" when Total is 10,000 or more, otherwise "Normal".
5. A **summary table** using SUMIF for total sales **per category**.
6. A **price lookup**: a second sheet "Prices" with product and price; use **VLOOKUP or XLOOKUP** to fill Unit price in Sales.

### Part 3: Presentation

7. **Formatting:** bold headings, frozen top row, currency format.
8. A **filter** on the Sales table.
9. **One chart** with a title that states the message (for example "Groceries bring in most sales").
10. A short **"Summary" sheet** with 3 key findings written in plain English.

### What to submit

In the box below:

1. Your **sheet link** (Anyone with the link: Viewer).
2. The **formulas** you used for items 1 to 6.
3. Your **3 key findings** from the summary sheet.
4. One thing you would improve with more time.

> 🏆 Finish this and every other lesson to earn your **Career Forge certificate**, with a public link for your CV.

=== TEXT: 🎓 You did it! Certificate and what is next | 240
## 🎓 You did it! Certificate and what is next

You can now build, calculate, analyse and present data. This is one of the most useful office skills there is.

### Your certificate 🏅

When you have finished **every lesson**, including the sales report, your **certificate** is issued automatically with a public link for your CV and LinkedIn.

> 📌 **Remember:** list "Excel / Google Sheets: formulas, lookups, pivot tables, charts" on your CV, and keep your assignment sheets as proof.

### Next steps

1. Use your tracker for a real shop, family budget or club.
2. Learn **Virtual Assistant** skills, **Freelancing 101** and **Customer Support** on Career Forge.
3. Explore **Power Query**, **Google Apps Script** or **Python** to automate spreadsheets.
4. Add the skill to your **CV Builder** profile and apply on the **Jobs** board.

Thank you for learning with me. Keep practising!

Daniel
