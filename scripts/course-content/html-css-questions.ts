/**
 * Quiz and exam questions for the "HTML & CSS from Zero" course.
 * Plain data + tiny builders; the seed script feeds these to the platform.
 */

export interface Opt {
  text: string;
  isCorrect: boolean;
}
export interface Q {
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "MULTIPLE_ANSWER";
  prompt: string;
  explanation: string;
  points: number;
  options: Opt[];
  difficulty?: "easy" | "medium" | "hard";
  topic?: string;
}

let rot = 0;

/** One correct answer among wrong ones; the correct answer's position rotates so it isn't always first. */
function mc(prompt: string, correct: string, wrong: string[], explanation: string, topic?: string, difficulty: Q["difficulty"] = "easy"): Q {
  const options: Opt[] = wrong.map((text) => ({ text, isCorrect: false }));
  options.splice(rot++ % (wrong.length + 1), 0, { text: correct, isCorrect: true });
  return { type: "MULTIPLE_CHOICE", prompt, explanation, points: 1, options, topic, difficulty };
}

function tf(prompt: string, answer: boolean, explanation: string, topic?: string, difficulty: Q["difficulty"] = "easy"): Q {
  return {
    type: "TRUE_FALSE",
    prompt,
    explanation,
    points: 1,
    options: [
      { text: "True", isCorrect: answer },
      { text: "False", isCorrect: !answer },
    ],
    topic,
    difficulty,
  };
}

function ma(prompt: string, correct: string[], wrong: string[], explanation: string, topic?: string, difficulty: Q["difficulty"] = "medium"): Q {
  const options: Opt[] = [...correct.map((text) => ({ text, isCorrect: true })), ...wrong.map((text) => ({ text, isCorrect: false }))];
  // Deterministic shuffle so correct answers aren't grouped at the top.
  options.sort((a, b) => ((a.text.length * 7 + rot) % 5) - ((b.text.length * 7 + rot) % 5));
  rot++;
  return { type: "MULTIPLE_ANSWER", prompt, explanation, points: 1, options, topic, difficulty };
}

export const QUIZ_WEB_BASICS: Q[] = [
  mc("What is HTML's job on a web page?", "It gives the page its structure and content", ["It adds colours and fonts", "It makes the page interactive", "It stores your files on a server"], "HTML is the structure — the headings, paragraphs, images and links. CSS handles the look.", "web basics"),
  mc("Which language controls colours, fonts and spacing?", "CSS", ["HTML", "A browser", "A server"], "CSS (Cascading Style Sheets) is the language of style.", "web basics"),
  tf("A browser reads HTML and CSS files and draws the page you see.", true, "Exactly — the browser is the translator that turns the text files into the page on your screen.", "web basics"),
  mc("What is the traditional file name for a website's front page?", "index.html", ["home.txt", "website.css", "start.exe"], "Web servers and browsers look for index.html first, so it's the standard name for a site's main page.", "web basics"),
  mc("In the 'house' analogy from the lesson, what does CSS represent?", "The paint, furniture and decoration", ["The walls and rooms", "The electricity and switches", "The street address"], "HTML = structure (walls and rooms), CSS = style (paint and furniture), JavaScript = behaviour (electricity).", "web basics"),
];

export const QUIZ_HTML: Q[] = [
  mc("What is the closing tag for <p>?", "</p>", ["<p/>", "<end p>", "</paragraph>"], "A closing tag is the same name with a forward slash: </p>.", "html basics"),
  mc("Where does the visible content of a page go?", "Inside <body>", ["Inside <head>", "Inside <title>", "Before <!DOCTYPE html>"], "<body> holds everything you can see. <head> holds invisible information such as the title and links to CSS.", "html basics"),
  mc("Which tag creates a clickable link?", "<a>", ["<link>", "<href>", "<url>"], "The anchor tag <a> with an href attribute makes a link.", "links"),
  mc("What is the alt attribute on an image for?", "A text description for screen readers and when the image can't load", ["It sets the image width", "It adds a border", "It chooses the image file"], "alt makes images accessible and helps Google understand them. Never leave it out.", "images"),
  tf("The <img> tag needs a closing tag.", false, "<img> is a 'void' element — it has no closing tag.", "images"),
  mc("Which heading tag is the biggest and most important?", "<h1>", ["<h6>", "<head>", "<header>"], "<h1> is the main heading. Use one per page, then <h2>, <h3> for sections.", "text"),
  ma("Which of these are semantic page-structure tags?", ["<header>", "<nav>", "<footer>"], ["<div>", "<span>"], "<header>, <nav>, <main>, <section>, <article> and <footer> describe meaning. <div> and <span> are neutral boxes.", "semantic html"),
  mc("Which input type hides what the user types?", 'type="password"', ['type="text"', 'type="hidden-text"', 'type="secret"'], 'type="password" shows dots instead of the characters.', "forms"),
];

export const QUIZ_CSS: Q[] = [
  mc("Which of these is a CSS class selector?", ".card", ["#card", "card", "<card>"], "Classes start with a dot (.card). IDs start with a hash (#card).", "selectors"),
  mc("Which property changes the colour of text?", "color", ["text-color", "font-paint", "background-color"], "color sets the text colour; background-color sets the background.", "colour"),
  mc("From the inside out, what is the correct order of the box model?", "Content, padding, border, margin", ["Content, margin, border, padding", "Margin, content, padding, border", "Border, content, margin, padding"], "Content sits in the middle, then padding, then the border, then margin outside everything.", "box model"),
  mc("Which declaration makes child elements line up side by side?", "display: flex;", ["display: row;", "float: line;", "align: horizontal;"], "display: flex on the parent turns children into a flex row.", "flexbox"),
  tf("Margin is the space inside an element's border.", false, "Padding is inside the border; margin is the space outside it.", "box model"),
  ma("Which of these are valid ways to write a colour in CSS?", ["#ff6347", "rgb(255, 99, 71)", "tomato"], ["colour(tomato-red)", "paint: #red"], "CSS accepts names, hex codes and rgb() values.", "colour"),
  mc("What does @media (max-width: 600px) { ... } do?", "Applies its styles only on screens 600px wide or narrower", ["Makes every element 600px wide", "Hides the page above 600px", "Loads a separate website"], "A media query applies CSS only when its condition is true — here, a narrow screen.", "responsive", "medium"),
  mc("Which property makes a hover change glide smoothly instead of jumping?", "transition", ["animation-speed", "smooth", "glide"], "transition animates a change in a property over a set time.", "effects"),
];

/** A pool of 24; the exam draws 15 at random per attempt. */
export const EXAM_QUESTIONS: Q[] = [
  mc("What is the purpose of <!DOCTYPE html> at the top of a page?", "It tells the browser the page uses modern HTML", ["It sets the page title", "It links the CSS file", "It creates the page header"], "The doctype declaration tells the browser how to interpret the page.", "html"),
  mc("Where does the text in the <title> tag appear?", "On the browser tab", ["At the top of the page body", "Inside the first heading", "At the bottom of the page"], "<title> lives in <head> and shows on the browser tab and in search results.", "html"),
  tf("Content inside <head> is shown on the visible page.", false, "<head> holds information about the page, not visible content. Visible content goes in <body>.", "html"),
  mc("Which tag should be used once per page for the main title?", "<h1>", ["<h3>", "<title>", "<header>"], "One <h1> per page gives the main title; <h2>, <h3> structure the sections.", "html"),
  mc("Which is the correct way to write a link?", '<a href="https://example.com">Visit</a>', ['<link>https://example.com</link>', '<a>https://example.com</a>', '<href="https://example.com">Visit</href>'], "A link is <a> with an href attribute and clickable text between the tags.", "html"),
  mc("Why should every <img> have an alt attribute?", "So people using screen readers (and search engines) know what the image shows", ["To make the image load faster", "To add a caption below the image", "To prevent the image being copied"], "alt is essential for accessibility and SEO.", "html"),
  mc("Which tag is best for a list of steps that must be followed in order?", "<ol>", ["<ul>", "<li>", "<table>"], "<ol> is an ordered (numbered) list; <ul> gives bullets.", "html"),
  mc("Which tag creates a table row?", "<tr>", ["<td>", "<th>", "<row>"], "<tr> is a table row; <td> and <th> are cells within it.", "html"),
  ma("Which of these are form controls?", ["<input>", "<textarea>", "<select>"], ["<p>", "<h1>"], "<input>, <textarea> and <select> collect information from the user.", "html"),
  mc("Which semantic tag is meant for the main navigation links?", "<nav>", ["<aside>", "<section>", "<span>"], "<nav> marks a block of navigation links.", "html"),
  tf("A page should have only one <main> element.", true, "<main> identifies the page's unique main content, so use it once.", "html"),
  mc("Which selector targets every element with class=\"box\"?", ".box", ["#box", "box", "*box"], "A dot targets a class. A hash targets an ID.", "css"),
  mc("Which selector targets the single element with id=\"top\"?", "#top", [".top", "top", "@top"], "IDs are selected with a hash and must be unique on the page.", "css"),
  mc("Which property sets an element's background colour?", "background-color", ["bgcolor", "color", "paint"], "background-color sets the background; color sets the text colour.", "css"),
  tf("Each CSS declaration (property: value) should end with a semicolon.", true, "Semicolons separate declarations. Forgetting one is the most common CSS typo.", "css"),
  mc("Which unit is relative to the base font size?", "rem", ["px", "cm", "pt"], "1rem equals the root font size (usually 16px), which makes layouts scale well.", "css"),
  mc("In the box model, which layer is the outermost?", "Margin", ["Padding", "Border", "Content"], "From the inside: content, padding, border, margin.", "css"),
  mc("What does padding do?", "Adds space inside an element, between its content and its border", ["Adds space outside the border", "Changes the border colour", "Sets the element's width"], "Padding is inside the border; margin is outside.", "css"),
  mc("What does box-sizing: border-box change?", "Width and height include the padding and border", ["It removes the border", "It adds a shadow", "It centres the box"], "With border-box, a 300px-wide element stays 300px wide even with padding and border.", "css", "medium"),
  mc("Which Flexbox property spreads items along the main axis (for example, space between them)?", "justify-content", ["align-items", "flex-wrap", "text-align"], "justify-content works along the main direction; align-items works across it.", "css", "medium"),
  mc("What is the gap property used for in Flexbox?", "Setting space between flex items", ["Setting space outside the container", "Making items wrap", "Changing item order"], "gap adds consistent spacing between items without extra margins.", "css"),
  ma("Which of these can be changed inside a :hover rule?", ["color", "background-color", "transform"], ["the HTML tag name", "the file name"], "Any CSS property can change on hover, such as colours and transforms. HTML tags and file names can't.", "css", "medium"),
  mc("What does <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> do?", "Makes the page display at the correct size on phones", ["Adds a picture of the page", "Links the CSS file", "Sets the page language"], "Without it, phones show a tiny zoomed-out desktop page.", "responsive"),
  tf("A media query lets you apply different CSS depending on the screen size.", true, "Media queries such as @media (max-width: 600px) make designs responsive.", "responsive"),
];
