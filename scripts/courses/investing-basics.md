---
key: investing-basics
title: Investing Basics for Beginners: Grow Your Money Wisely
description: Understand how investing works before you risk a naira. Run live calculators for inflation, compounding and fees, compare savings, treasury bills, bonds, funds, shares and property, study how Ponzi schemes really unfold, practise decisions in market-fall scenarios, and finish with a practical Investing Lab workbook. Education only, not financial advice.
category: finance | Finance
price: 5000
level: BEGINNER
requirements: Basic maths (percentages); A free Google Sheets or Excel file for the practical work; A budget and emergency fund help (see Personal Money Basics)
objectives: Explain saving versus investing, risk and return; Use calculators to see inflation, compounding and fees at work; Describe treasury bills, fixed deposits, bonds, funds, shares and property; Understand diversification and time horizon; Stay calm in market falls using a written plan; Take apart a Ponzi scheme and score an offer with a due-diligence checklist; Build a simple investment policy and a practical Investing Lab workbook
thumb: LEARN | INVESTING | Grow your money wisely | BEGINNER | NO HYPE | 📈 | #1e3a8a | #0369a1 | #22c55e
---
# MODULE: Investing Foundations
=== TEXT: 👋 Welcome: investing without the hype | 360 | preview
## 👋 Welcome: investing without the hype

Investing means putting money to work so it **may** grow over time. It is not gambling and it is not a shortcut to riches. It is a way to protect and grow money for goals that are **years away**.

### What you will do in this course

- ⚖️ Learn risk and return, and why they travel together
- 🧮 Use **live calculators** to see inflation, compounding and fees
- 🧰 Learn the main investment types in plain language
- 🧠 Practise **decisions** in realistic scenarios, such as a market fall
- 🔍 Take apart a **Ponzi scheme** step by step and learn to score any offer
- 🧪 Build a practical **Investing Lab** workbook as your final exam

> ⚠️ **Important:** this course is **education, not financial advice**. It does not tell you what to buy. Nobody can guarantee returns, and **you can lose money**. Only invest money you will not need soon, and never borrow to invest.

::: check Can anyone honestly guarantee investment returns?
- Yes, if they are experienced
+ No. All investing carries risk
- Yes, for a small fee
= Returns are never guaranteed.
:::

### Before you invest: the foundation

Do these first: a **budget**, an **emergency fund** of three to six months of essentials, and **no high-interest debt**. If not, start with **Personal Money Basics** (free). The old Babylonian advice still holds: save first, and **guard what you have before you chase more**.

::: check What should come before investing?
+ An emergency fund and a budget
- Borrowing to invest more
- A guaranteed tip
= A safety net keeps you from selling in a panic.
:::

=== TEXT: ⚖️ Saving vs investing, risk vs return | 540 | preview
## ⚖️ Saving vs investing, risk vs return

### Different jobs for different money

- **Saving:** keeps money **safe and available** for emergencies and near goals. It earns little, but you do not expect to lose it.
- **Investing:** aims for **growth over years**, and accepts that value can go up and down.

> 📌 **Remember:** money you need within about three years belongs in savings. Long-term goals can use investments.

::: check Where should money for an emergency next month be kept?
+ In savings you can reach quickly
- In a risky investment
- Lent to a friend
= Emergency money must be safe and available.
:::

### Risk and return go together

**Higher possible return usually means higher risk.** An offer of **high returns with no risk** is a red flag.

| Type | Typical risk | Return potential |
|---|---|---|
| Savings account | Very low | Low |
| Government treasury bills | Low | Low to moderate |
| Bonds and money market funds | Low to moderate | Moderate |
| Shares (stocks) | High, with big ups and downs | Higher over the long term |
| New or unregulated schemes | Very high, often fraud | "Promised", unreliable |

> ⚠️ **Watch out:** the table shows general ideas. Actual rates and risks change, so always check current information.

### Types of risk

- **Market risk:** prices fall.
- **Inflation risk:** your money buys less.
- **Credit risk:** a borrower cannot repay.
- **Liquidity risk:** you cannot sell quickly.
- **Fraud risk:** the offer itself is a scam.
- **Concentration risk:** everything is in one place.

::: check Which statement is true?
+ Higher possible returns usually come with higher risk
- High returns with zero risk are normal
- Risk disappears after a year
= Risk and return are linked.
:::

### Scenario: your risk comfort

You invest 200,000. A year later it shows 150,000 on paper. How do you feel?

- **Calm, it is long-term:** you may have higher risk comfort.
- **Anxious, I need that money soon:** you likely invested too aggressively, or the money should not have been invested.

::: check If a 25% fall would force you to sell because you need the money, what does that suggest?
+ That money should not have been invested for the short term
- That investing is easy
- That you should borrow more
= Match the investment to the time you can wait.
:::

=== TEXT: 💸 Inflation: the quiet thief | 480
## 💸 Inflation: the quiet thief

**Inflation** means prices rise over time, so the same money buys less.

### Run the numbers

The box below shows what **100,000** can buy after several years if prices rise by a steady yearly rate. These are **example numbers**, not a forecast. Change the rate and the years, then press **Run**.

```playground-js Challenge: change the rate to 8, then to 20. What happens to buying power?
const money = 100000;
const inflation = 15;   // percent per year (example)
const years = 5;

let power = money;
for (let y = 1; y <= years; y++) {
  power = power / (1 + inflation / 100);
  console.log(`After year ${y}: ${Math.round(power).toLocaleString()} of today's buying power`);
}
```

> 📌 **Remember:** if your money earns less than inflation, you are slowly losing buying power, even though the number stays the same.

::: check If prices rise 15% a year, will 100,000 buy more or less in two years?
+ Less, about 75,000 worth of today's goods
- More
- The same
= 100,000 / 1.15 / 1.15 is about 75,600.
:::

### What this means

- Cash under a mattress loses buying power in times of high inflation.
- A **savings rate below inflation** also loses buying power.
- That is one reason people invest for the **long term**.
- It is **not a promise** that investing beats inflation every year.

::: check Which best describes inflation?
+ A general rise in prices, so each naira buys less
- A fall in prices
- A bank fee
= Money's buying power falls when prices rise.
:::

=== TEXT: 📈 Compounding: growth on growth | 540
## 📈 Compounding: growth on growth

### Simple versus compound

- **Simple interest:** earned on the **original amount** only.
- **Compound interest:** earned on the **original amount plus past interest**.

> **Example:** 100,000 at 10% a year. Simple: 10,000 every year. Compound: 10,000, then 11,000, then 12,100 and so on.

### Try the calculator

```playground-js Challenge: change the years from 10 to 25, and see how the growth speeds up
const start = 100000;
const rate = 10;   // percent per year (an example, not a promise)
const years = 10;

let value = start;
for (let y = 1; y <= years; y++) {
  value = value * (1 + rate / 100);
  console.log(`Year ${y}: ${Math.round(value).toLocaleString()}`);
}
console.log("Growth:", Math.round(value - start).toLocaleString());
```

> 📌 **Remember:** compounding rewards **time**. The later years add far more than the early years.

::: check 100,000 at 10% compounded yearly is how much after 2 years?
- 120,000
+ 121,000
- 110,000
= Year 1: 110,000. Year 2: 121,000.
:::

### The rule of 72

Divide **72 by the yearly return** to estimate years to **double**.

```playground-js Challenge: try 4, 6, 12 and 18 as the rate
const rate = 8;
console.log("About", (72 / rate).toFixed(1), "years to double at", rate + "% a year");
```

::: check Using the rule of 72, about how long to double money at 6% a year?
- 6 years
+ 12 years
- 20 years
= 72 divided by 6 is 12.
:::

### Real returns are not smooth

The examples use a steady rate. **Real investments go up and down.** A good long-term average can include bad years, and some investments lose value permanently.

=== TEXT: ⏳ The cost of waiting: Ada and Tunde | 480
## ⏳ The cost of waiting: Ada and Tunde

This is a famous way of teaching why **starting early** matters. The numbers are **examples** using a steady assumed return, not a prediction.

### The story

- **Ada** invests 10,000 a month for **10 years**, then **stops** and leaves the money to grow.
- **Tunde** waits 10 years, then invests 10,000 a month for **10 years**, and also stops.

They put in the same total (1,200,000). Who ends up with more after 30 years?

```playground-js Challenge: change the rate to 6 and then 12. Who wins each time, and by how much?
function growMonthly(monthly, annualRate, yearsInvesting, totalYears) {
  const r = annualRate / 100 / 12;
  let value = 0;
  for (let m = 1; m <= totalYears * 12; m++) {
    value = value * (1 + r);
    if (m <= yearsInvesting * 12) value += monthly;
  }
  return value;
}

const rate = 10; // example only
const ada = growMonthly(10000, rate, 10, 30);

// Tunde starts 10 years later: only 20 years of growth remain.
const tunde = growMonthly(10000, rate, 10, 20);

console.log("Ada   :", Math.round(ada).toLocaleString());
console.log("Tunde :", Math.round(tunde).toLocaleString());
```

> 📌 **Remember:** the lesson is **time**. Ten extra years of growth can matter more than the amount you put in. It does not mean growth is guaranteed.

::: check Why does Ada end up ahead in this example?
+ Her money had ten more years to compound
- She invested more money
- She got lucky only
= Same deposits, more time.
:::

### What to take from it

1. **Start early**, even with small amounts.
2. **Stay invested** through the ups and downs, if the money is for the long term.
3. **Do not wait for the perfect moment.**

> ⚠️ **But:** do this only **after** your emergency fund and with money you will not need soon.

::: check What must come before investing for the long term?
+ A safety net and a budget
- Borrowed money
- A hot tip
= Protect your basics first.
:::

=== QUIZ: 🧠 Quick check: investing foundations | 420
? What is the main purpose of an emergency fund?
+ To cover unexpected needs so you do not sell investments in a panic
- To buy shares
- To lend out
= Keep it safe and available.
? Which usually comes with higher potential returns?
+ Higher risk
- Zero risk
- No effort
= Risk and return are linked.
? What is compound interest?
+ Interest earned on the original amount plus past interest
- Interest only on the first amount
- A bank fee
= It makes growth speed up over time.
? Using the rule of 72, how long to double money at 9% a year?
+ About 8 years
- About 2 years
- About 20 years
= 72 divided by 9 is 8.
? If prices rise steadily, what happens to the buying power of cash?
+ It falls
- It rises
- It stays the same
= Each naira buys less.
? What does the Ada and Tunde example teach?
+ Starting early gives money more time to compound
- Investing is always safe
- Timing the market is easy
= Time is powerful, not guaranteed.
? True or false: this course is financial advice for your personal situation.
- True
+ False
= It is education only.
# MODULE: What You Can Invest In
=== TEXT: 🏦 Savings, fixed deposits and treasury bills | 540
## 🏦 Savings, fixed deposits and treasury bills

These are **lower-risk, lower-return** options for money you will need within months to a few years.

### Savings accounts

Easy access, little growth. Good for emergencies and short goals. Check that your bank is **licensed**, and that deposits are covered by the national **deposit insurance** scheme. The limits are set by the regulator, so **check the current ones**.

### Fixed deposits

You lock money for a **set period** at an agreed rate. Taking it out early may cost you interest.

### Treasury bills (T-bills)

Short-term loans to the government, sold at a **discount** and repaid at **face value**.

```playground-js Challenge: change the price paid, then the days. What is the yearly return?
const pay = 95000;      // what you pay today
const faceValue = 100000; // what you receive at maturity
const days = 364;

const gain = faceValue - pay;
const periodReturn = gain / pay * 100;
const yearly = periodReturn * (365 / days);

console.log("Gain:", gain.toLocaleString());
console.log("Return over the period:", periodReturn.toFixed(2) + "%");
console.log("Roughly per year:", yearly.toFixed(2) + "%");
```

> 📌 **Remember:** "safer" does not mean "risk-free". Check rates, fees, lock-in periods, and whether the provider is **properly licensed**.

::: check A treasury bill is sold for 95,000 and pays 100,000 at maturity. What is the return in naira?
- 95,000
+ 5,000
- 100,000
= 100,000 minus 95,000 is 5,000.
:::

### Questions to ask any lower-risk product

1. Who **issues** it, and are they **licensed**?
2. What is the **rate**, and is it **fixed**?
3. What are the **fees and lock-in rules**?
4. What happens if I need the money **early**?

::: check In a fixed deposit, what is the main trade-off?
+ Your money is locked for a period, in return for an agreed rate
- You can withdraw anytime with no limits
- There is no agreement
= Access versus return.
:::

=== TEXT: 🏛️ Bonds and mutual funds | 540
## 🏛️ Bonds and mutual funds

### Bonds

A bond is a **loan** to a government or company. It pays **interest** (the coupon) and returns your money at the end, **if the borrower can pay**. Company bonds carry **more credit risk** than government ones.

### Mutual funds and money market funds

A **fund** pools money from **many people**, and **professional managers** invest it in a mix of assets. You own **units** of the fund.

- **Money market fund:** invests in short-term, lower-risk instruments.
- **Bond fund:** invests mostly in bonds.
- **Equity fund:** invests in company shares (higher risk).

> 📌 **Remember:** funds give you **instant diversification** and professional management, but they have **fees**, and values can fall.

::: check What is a mutual fund?
+ A pool of many investors' money managed by professionals
- A savings account
- A loan from a friend
= Investors share the fund's results.
:::

### Questions to ask about any fund

1. Is the **manager registered** with the regulator (the SEC in Nigeria)?
2. What are the **fees**?
3. What does it **invest in**?
4. How has it performed in **bad years**, not just good ones?
5. How easily can I **withdraw**, and how long does it take?

> ⚠️ **Watch out:** past performance does not guarantee future results.

::: check Does past performance guarantee future results?
- Yes
+ No
- Only for funds
= It is information, not a promise.
:::

=== TEXT: 🏢 Shares, property and foreign assets | 600
## 🏢 Shares, property and foreign assets

### Shares (stocks)

Buying a share means owning **a small piece of a company**. You may earn from:

1. **Price growth:** the share price rises.
2. **Dividends:** the company shares some profit.

Prices **rise and fall daily**. Over many years, shares have often grown more than safer assets, but there is **no guarantee**, and short-term falls can be large.

### Scenario: a 30% fall

You hold shares worth 300,000. The market falls and they are worth 210,000.

| Question | Answer |
|---|---|
| How much did you lose on paper? | 90,000 (30%) |
| Is it a real loss? | Only if you sell |
| What gain brings you back? | About 43% (210,000 to 300,000) |

```playground-js Challenge: try a 50% fall. What gain is needed to recover?
const fall = 30; // percent
const left = 100 - fall;
const needed = (100 / left - 1) * 100;
console.log(`After a ${fall}% fall you need a ${needed.toFixed(1)}% gain to get back.`);
```

> 📌 **Remember:** the deeper the fall, the bigger the gain needed. Avoid money you cannot leave alone.

::: check A holding falls 50%. What gain is needed to recover?
- 50%
+ 100%
- 25%
= Halved money must double.
:::

### Real estate

Property can bring **rent** and **price growth**, but it needs a lot of money, takes time to sell, and has **legal risks** (disputed ownership, fake documents). Always **verify ownership** with a lawyer and official records before paying.

### Foreign-currency assets

Some people hold foreign-currency assets to protect against a falling naira. These carry **their own risks and costs**: exchange-rate swings, fees, and rules. Learn before you buy.

::: check What is a major risk when buying land?
+ Fake or disputed ownership documents
- It always sells quickly
- It never needs checking
= Verify with a lawyer and official records.
:::

=== QUIZ: 🧠 What you can invest in checkpoint | 420
? What is a treasury bill?
+ A short-term government loan sold at a discount
- A company share
- A type of savings fee
= You get face value at maturity.
? What is a bond?
+ A loan to a government or company that pays interest
- A share of ownership
- A bank charge
= Bonds are IOUs.
? What does a mutual fund do?
+ Pools money and invests it in many assets
- Guarantees profit
- Lends only to you
= It gives diversification.
? What is a dividend?
+ A share of company profit paid to owners
- A bank fee
- A loan
= Not all companies pay them.
? A share price falls 20%. About what gain brings it back?
+ 25%
- 20%
- 10%
= 100 / 80 is 1.25.
? Which is a serious risk when buying land?
+ Disputed or fake ownership documents
- None
- The colour of the fence
= Always verify with a lawyer.
? True or false: shares always go up over any period.
- True
+ False
= They can fall, especially in the short term.
=== ASSIGNMENT: 🧮 Assignment 1: Build your comparison sheet | 3000
## 🧮 Assignment 1: Build your comparison sheet

This is **practical work in a spreadsheet** (Google Sheets or Excel) using **example numbers**. It is **not** a recommendation to buy anything.

### Part 1: Growth table (with formulas)

Build a table with these columns: **Year, Start value, Return %, End value**. Use **100,000 at 8%** for **10 years**, with formulas (`=B2*(1+C2)` style). Add a second table at **12%**.

### Part 2: The cost of time

Add a third table: invest **10,000 a month** for **5 years** versus **10 years** at **8%** (monthly formulas or a clear approximation). Show **final values** and the **difference**.

### Part 3: T-bill return

Calculate, with formulas, the **naira return and percent return** if you pay **92,000** and receive **100,000** at maturity.

### Part 4: Comparison

Make a **comparison table** of **savings account, treasury bill, mutual fund, shares and land**, with columns for **risk, access to your money, fees or costs, and what could go wrong**.

### Part 5: Write

In the box below, write **4 to 6 sentences**: what the three growth tables taught you, and which option fits an **emergency fund**, and which a **10-year goal**, and why.

### How to submit

1. Share your sheet as **"Anyone with the link can view"** and paste the **link** below.
2. Paste the **formulas** you used for the growth table and the T-bill return.
3. Write your **4 to 6 sentences**.

Your instructor reviews it and sends feedback.

# MODULE: Investing Wisely and Safely
=== TEXT: 🧺 Diversification and time horizon | 540
## 🧺 Diversification and time horizon

### Do not put all your eggs in one basket

**Diversification** means spreading money across **different types of assets**, sectors and sometimes countries, so one failure does not wipe you out.

> 📌 **Remember:** diversification does not remove risk, but it lowers the damage from any single mistake.

### See it work

```playground-js Challenge: change which investment fails. How does the total change in each portfolio?
// Three investments, each starting at 100,000. One fails completely.
const concentrated = [300000, 0, 0];      // all in one
const spread = [100000, 100000, 100000];  // spread across three

const failed = 0; // index of the investment that fails (0, 1 or 2)

function total(portfolio) {
  return portfolio.map((v, i) => (i === failed ? 0 : v)).reduce((a, b) => a + b, 0);
}

console.log("All in one, after failure :", total(concentrated).toLocaleString());
console.log("Spread, after failure     :", total(spread).toLocaleString());
```

::: check Why diversify?
+ So one bad investment cannot ruin everything
- To guarantee profit
- To avoid all risk
= It reduces concentration risk.
:::

### Time horizon

| Goal is in | Typical approach |
|---|---|
| Under 3 years | Safer options (savings, short bills) |
| 3 to 7 years | A careful mix |
| 7+ years | More growth assets, accepting ups and downs |

The longer you can wait, the more ups and downs you can usually tolerate. Ask: **"When will I need this money?"**

::: check A school-fee payment is due in 8 months. Which fits better?
+ A safe, accessible option
- A volatile investment
- A new unlisted scheme
= Short deadline, low risk.
:::

=== TEXT: 🧾 Costs and fees: the quiet drain | 480
## 🧾 Costs and fees: the quiet drain

Fees look small, but over years they take a **large bite** of your growth.

### See the effect

```playground-js Challenge: change the fee to 0.5, then to 3. How much of the final value is lost to fees?
function grow(amount, rate, years) {
  return amount * Math.pow(1 + rate / 100, years);
}

const amount = 500000;
const years = 20;
const grossReturn = 10;  // example gross return, % a year
const fee = 2;           // yearly fee, %

const withoutFee = grow(amount, grossReturn, years);
const withFee = grow(amount, grossReturn - fee, years);

console.log("Without fee:", Math.round(withoutFee).toLocaleString());
console.log("With fee   :", Math.round(withFee).toLocaleString());
console.log("Lost to fees:", Math.round(withoutFee - withFee).toLocaleString());
```

> 📌 **Remember:** a 2% yearly fee sounds small, but over 20 years it can take a **big share** of your gains. Always ask for the **total cost** of an investment.

::: check A fund returns 10% a year and charges 2%. About what return do you keep?
+ 8%
- 12%
- 10%
= Fees reduce your return.
:::

### Where costs hide

- **Management fees** on funds.
- **Trading or brokerage fees.**
- **Entry and exit charges.**
- **Currency conversion** costs.
- **Taxes** where they apply (check current rules).

::: check Which is a cost to ask about?
+ Management fees and exit charges
- Only the headline rate
- Nothing
= Always ask for the total cost.
:::

=== TEXT: 🧠 Behaviour: staying calm when markets fall | 540
## 🧠 Behaviour: staying calm when markets fall

Most investing mistakes are **behaviour mistakes**, not maths mistakes.

### The common ones

- **FOMO:** buying because everyone else is.
- **Panic selling:** selling after a fall, locking in a loss.
- **Chasing last year's winner.**
- **Overconfidence:** putting too much in one idea.
- **Checking prices all day.**

> 📌 **Remember:** a **written plan** made when you are calm protects you when you are not.

### Decision drill 1

You invested 300,000 for a 10-year goal. After six months it shows 240,000, and the news is full of panic. What is your **best next step**?

::: check What is the best response, assuming this is long-term money you do not need soon?
+ Re-read your written plan and stay with it unless your situation changed
- Sell everything immediately
- Borrow more to buy more
= Decisions should follow the plan, not the headlines.
:::

### Decision drill 2

A friend says: "Everyone is making 50% this month. Put in your school fees, you can take it out next week."

::: check What is the wisest answer?
+ No. Money needed soon should not be invested, and 50% a month is a red flag
- Yes, because it is only a week
- Yes, but borrow more
= Short-term money stays safe, and be careful of huge claims.
:::

### Rules that help

1. Write your **goal, horizon and limits** before investing.
2. Decide in advance **when you will review** (for example twice a year).
3. **Do not invest** money you will need soon.
4. **Never borrow** to invest.
5. If you feel **panic or excitement**, wait 24 hours.

::: check What is a good habit when you feel strong excitement about an investment?
+ Wait 24 hours and check the plan
- Buy immediately
- Tell everyone to join
= Time cools emotion.
:::

=== TEXT: 🚨 How a Ponzi scheme really unfolds | 600
## 🚨 How a Ponzi scheme really unfolds

A **Ponzi scheme** pays earlier investors with **new investors' money**, not real profit. It looks like a great investment, until it collapses.

### The life of a scheme (an example, with numbers)

**Month 1: the pitch.** "Invest 50,000. Get 100,000 in 30 days. Guaranteed."

**Month 2: the first payouts.** Early investors really do receive 100,000, and they tell friends. That is the **proof** that draws more people.

**Month 3: the growth.** The organiser promotes **screenshots of winners**, luxury items and "only a few slots left".

**Month 4: the cracks.** Payouts slow. New excuses appear: "system upgrade", "tax fee", "withdrawal fee".

**Month 5: the collapse.** New money stops coming. The organiser disappears, or says "wait for the next cycle".

### The maths that kills it

```playground-js Challenge: change the promised return from 100 to 20. How many people are needed each month?
let investors = 100;
const deposit = 50000;
const promisedPercent = 100; // pays back double

for (let month = 1; month <= 6; month++) {
  const payouts = investors * deposit * (1 + promisedPercent / 100);
  const newInvestorsNeeded = Math.ceil(payouts / deposit);
  console.log(`Month ${month}: ${investors} investors, need about ${newInvestorsNeeded} NEW people to pay them`);
  investors = newInvestorsNeeded;
}
```

By month 6 the scheme would need **more people than most countries have**. It must collapse.

> 📌 **Remember:** if returns come from **new members**, not from **real business profit**, it is a Ponzi or pyramid scheme.

::: check Where does a Ponzi scheme get the money it pays to early investors?
+ From newer investors
- From real business profit
- From the government
= It collapses when new money slows.
:::

### Why smart people join

- **Proof:** friends **really did** get paid early.
- **Social pressure:** "everyone is in".
- **Hope:** the offer fits a real need.
- **Scarcity:** "slots are closing".

::: check Why does early payout make people trust a scheme?
+ It looks like proof, but it is paid from new money
- It proves the business is real
- It is always safe
= Early payouts are bait.
:::

=== TEXT: 🔍 The due-diligence scorecard | 540
## 🔍 The due-diligence scorecard

Use this **scorecard** on any investment offer. Give **1 point per "yes"**. **Any serious red flag means stop**, regardless of the score.

### The 10 questions

1. Is the operator **registered** with the right regulator (the SEC in Nigeria for investment offers)?
2. Is the **company registered**, with a real address and contact?
3. Can I **explain in one sentence** where the profit comes from?
4. Are the **terms written** and the fees clear?
5. Are returns **realistic**, and not guaranteed?
6. Can I **withdraw** easily, and has it been **tested** with a small amount?
7. Is there **no reward for recruiting** others?
8. Is there **no pressure** to hurry?
9. Do **independent sources** (not the operator's own page) say it is legitimate?
10. Does it fit **my goal, horizon and risk comfort**?

### Reading your score

- **9 to 10:** worth deeper research, still no guarantee.
- **6 to 8:** be very careful, and ask more questions.
- **Below 6:** walk away.

> ⚠️ **Any of these is a stop:** guaranteed high returns, recruitment rewards, pressure to hurry, no registration, or "pay a fee to withdraw".

::: check An offer pays you for recruiting friends. What should you do?
+ Stop. It is a major red flag
- Join quickly
- Invite everyone
= Recruitment rewards are a pyramid sign.
:::

### If you were scammed

1. Stop paying, **keep all evidence**.
2. Tell your **bank** and report to the **police** and the **regulator**.
3. **Do not pay** "recovery agents" upfront. It is often a second scam.
4. Warn others, and be kind to yourself. Many smart people are caught.

::: check What should you not do after being scammed?
- Report it
+ Pay a stranger upfront to recover your money
- Keep evidence
= Recovery scams target victims.
:::

=== TEXT: 🗺️ Your investment policy statement | 480
## 🗺️ Your investment policy statement

Professionals write an **investment policy statement (IPS)**: a short document that says **what you will do and what you will not do**. You can write a simple one.

### The template

| Part | Your answer |
|---|---|
| **Goal** | What is the money for, and by when? |
| **Horizon** | How many years? |
| **Risk comfort** | How would I feel if it fell 20% for a while? |
| **Amount and rhythm** | How much, how often, from which part of income? |
| **Mix** | How is it spread? (savings, bills, funds, shares) |
| **Rules: I will** | Review twice a year; keep investing steadily |
| **Rules: I will not** | Borrow to invest; chase hype; invest money needed soon |
| **Checks** | Scorecard on every offer; test withdrawals |

### Example (for learning only)

*Goal: 500,000 in 5 years for starting a business. Horizon: 5 years. Risk comfort: low to medium. Amount: 6,000 a month. Mix: money market fund and treasury bills. Rules: review every 6 months, never borrow to invest, use the scorecard on any new offer.*

> 📌 **Remember:** a written plan is a promise to your future self, made while you are calm.

::: check What is the purpose of an investment policy statement?
+ To write down your plan and rules while you are calm
- To guarantee profit
- To impress friends
= It guides decisions when emotions run high.
:::

### Get help carefully

For big decisions, talk to a **licensed professional**. Be wary of anyone who is paid only if you buy, and never share your PIN or OTP.

::: check Who is a better source for big decisions?
+ A licensed professional who explains risks and fees
- Anyone promising profit
- A stranger on social media
= Licensing and clear explanations matter.
:::

=== QUIZ: 🧠 Investing wisely checkpoint | 420
? What does diversification do?
+ Lowers the damage from any single investment failing
- Removes all risk
- Guarantees profit
= It spreads risk.
? A fund returns 9% a year and charges 1% in fees. About what do you keep?
+ 8%
- 10%
- 9%
= Fees reduce returns.
? What is a major red flag in an investment offer?
+ Guaranteed high returns
- Written terms
- A regulator registration
= Be very cautious.
? Where does a Ponzi scheme get the money to pay early investors?
+ From new investors
- From real profit
- From the central bank
= It collapses when new money slows.
? Where should you check if an operator is licensed?
+ The regulator's register (the SEC in Nigeria)
- A friend's opinion
- A social media page
= Use official sources.
? You need the money in 8 months. What fits best?
+ A safe, accessible option
- A volatile investment
- A new scheme
= Short-term money stays safe.
? True or false: you should borrow money to invest if the offer looks good.
- True
+ False
= Never borrow to invest.
=== ASSIGNMENT: 🔍 Assignment 2: Take apart three offers | 3000
## 🔍 Assignment 2: Take apart three offers

This is practice. **Do not invest** because of it.

### Case A: "Daily Gold Club"

*A Telegram group says: "Deposit 20,000, earn 5% every day, withdraw anytime. 3 slots left today! Invite 5 friends and get a bonus. Our CEO is a billionaire (see photo)."*

### Case B: "SafeBond Fund"

*A licensed fund manager (registered with the regulator, with an office and published reports) offers a money market fund. Their page says: "Returns vary, fees are 1.5% a year, withdrawals take up to 3 working days, past performance is not a guarantee."*

### Case C: "Land Opportunity"

*A seller offers a plot at a very low price: "Pay today to secure it. I have the papers on my phone. Only 2 plots left."*

### Your tasks (write in the box below)

1. Score **each case** on the **10-question scorecard** (yes or no for each question, with one-line reasons where you can tell, or "cannot tell").
2. For each case, write your **decision** (walk away, research further, or consider) and **why** (3 to 4 sentences).
3. For Case A, work out how much **20,000 would become after 30 days at 5% a day, compounded**. Use a calculator or a spreadsheet. Explain why this is **unrealistic**.
4. For Case C, list **the steps you would take** before paying anything.
5. Write **your own investment policy statement** (all eight parts) for an example goal.

### How to submit

Write your answers, numbered 1 to 5. Your instructor reviews them and sends feedback.

# MODULE: Final Exam: The Investing Lab
=== TEXT: 🧰 Investing cheat sheet | 300
## 🧰 Investing cheat sheet

- **Risk and return are linked.** No guarantees.
- **Emergency fund first**, then invest money you will not need soon.
- **Inflation** erodes cash. **Compounding** rewards time. Rule of 72: years to double = 72 / return.
- **Diversify**, watch **fees**, and keep a long horizon for growth assets.
- **Behaviour** beats maths: write a plan, wait 24 hours, never borrow to invest.
- **Scorecard** every offer. Recruiting rewards, guarantees and pressure mean stop.

> 📌 **Remember:** never invest in what you cannot explain, and never trust a guarantee.

### Education only

This course is **education, not financial advice**. Investments can lose value.

=== ASSIGNMENT: 🏁 FINAL EXAM: The Investing Lab | 5400
## 🏁 FINAL EXAM: The Investing Lab

A **practical** exam: build a working **Investing Lab workbook** in Google Sheets or Excel, with **formulas**, using **example numbers**. This is for learning, **not advice**. There is **no timer**.

### Sheet 1: Growth calculator

1. Build a calculator where changing **starting amount, monthly contribution, yearly return and years** updates the **final value** (use formulas).
2. Add **three scenarios**: low return, base return and high return (for example 4%, 8% and 12%), and show the **final value** for each.
3. Add a row showing the **buying power** of the base-case final value after **inflation** (use an example inflation rate).

### Sheet 2: Fee impact

4. For **500,000 over 20 years at 10% gross**, show the final value with **fees of 0%, 1%, 2% and 3%**, and the **amount lost to fees** each time.

### Sheet 3: Paper allocation

5. Take a **hypothetical 1,000,000** with a goal and horizon of your choice. Allocate it across **at least four categories** (for example savings, treasury bills, funds, shares), and for each write the **percentage, amount, risk level and reason**.
6. Add a **risk table**: what happens to your total if the **shares part falls 30%** and the **other parts stay the same**. Show the **new total** and the **gain needed to recover**.

### Sheet 4: Due diligence

7. Score **two offers** (one realistic, one suspicious: invent them or use real ones with names removed) on the **10-question scorecard**, with your **decision** for each.

### Sheet 5: Investment policy statement

8. Write your **investment policy statement** (goal, horizon, risk comfort, amount and rhythm, mix, rules I will, rules I will not, checks).

### In the box

9. Write **5 to 6 sentences**: what surprised you most in the lab, which lesson you will apply first, and what you will never do.

### How to submit

1. Share the workbook as **"Anyone with the link can view"** and paste the **link** below.
2. Paste the **key results** (final values of the three scenarios, fee-impact numbers, recovery gain).
3. Write your **answer to item 9**.

Your instructor reviews it and sends feedback, and you can improve and resubmit.

> 🏆 Finish this and every other lesson to earn your **Career Forge certificate**, with a public link for your CV.

=== TEXT: 🎓 You did it! Certificate and what is next | 240
## 🎓 You did it! Certificate and what is next

You can now explain how investing works, run the numbers yourself, take apart a scheme, and score any offer. That knowledge alone can save you from costly mistakes.

### Your certificate 🏅

When you have finished **every lesson**, including the Investing Lab, your **certificate** is issued automatically with a public link for your CV and LinkedIn.

> 📌 **Remember:** slow, informed and consistent beats fast and hyped.

### Next steps

1. Build your **budget and emergency fund** first (see **Personal Money Basics**).
2. Study **Cryptocurrency Basics** and **Business Finance** if they fit your goals.
3. Talk to a **licensed professional** before major decisions.
4. Review your policy statement twice a year, and keep learning.

This course is education, not financial advice. Investments can lose value. Thank you for learning with us.

The Career Forge team
