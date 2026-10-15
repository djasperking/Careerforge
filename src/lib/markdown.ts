/**
 * Tiny, dependency-free Markdown → safe HTML renderer for blog content.
 * Everything is HTML-escaped first, then a small set of block/inline rules is
 * applied — so there is no XSS surface even for a less-trusted author.
 * Supports: #/##/### headings, - and 1. lists, > quotes, ``` code fences,
 * `inline code`, **bold**, *italic*, [links](url), --- rules, paragraphs.
 */

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

function inline(s: string): string {
  // Code spans are lifted out first so asterisks inside them are never read as emphasis.
  const codes: string[] = [];
  const text = s.replace(/`([^`]+)`/g, (_m, c: string) => {
    codes.push(c);
    return "\u0000" + (codes.length - 1) + "\u0000";
  });
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*\w])\*(?!\s)([^*]+?)\*(?!\w)/g, "$1<em>$2</em>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer nofollow">$1</a>',
    )
    .replace(/\u0000(\d+)\u0000/g, (_m, i: string) => "<code>" + codes[Number(i)] + "</code>");
}

/** A quote that opens with an emoji becomes a coloured callout (tip, warning, key point…). */
function calloutClass(text: string): string {
  if (/^(💡|✨|🎯)/u.test(text)) return "cf-callout cf-tip";
  if (/^(⚠️|⚠|🚫|❌|🛑)/u.test(text)) return "cf-callout cf-warn";
  if (/^(📌|🔑|⭐|✅|♿|🧠)/u.test(text)) return "cf-callout cf-key";
  return "cf-callout";
}

export function renderMarkdown(md: string): string {
  const lines = esc(md.replace(/\r\n/g, "\n")).split("\n");
  const out: string[] = [];
  let i = 0;
  let listType: "ul" | "ol" | null = null;

  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      closeList();
      const info = line.trim().slice(3).trim(); // already HTML-escaped with the rest of the text
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      const code = buf.join("\n");
      if (/^playground(-js)?\b/.test(info)) {
        // An editable live-preview box. Lessons upgrade it in the browser; anywhere
        // else it degrades to a plain code block. The code is escaped, so it is safe
        // both as the fallback <pre> and inside the data attribute.
        const lang = /^playground-js\b/.test(info) ? "js" : "html";
        const title = info.replace(/^playground(-js)?\s*/, "");
        out.push(
          `<div class="cf-playground" data-lang="${lang}" data-title="${title}" data-code="${code}"><pre><code>${code}</code></pre></div>`,
        );
      } else {
        out.push(`<pre><code>${code}</code></pre>`);
      }
      continue;
    }

    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      closeList();
      const lvl = h[1].length + 1;
      out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`);
      i++;
      continue;
    }

    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
      closeList();
      out.push("<hr />");
      i++;
      continue;
    }

    if (line.trim().startsWith("&gt;")) {
      closeList();
      const quote = inline(line.trim().replace(/^&gt;\s?/, ""));
      out.push(`<blockquote class="${calloutClass(quote)}">${quote}</blockquote>`);
      i++;
      continue;
    }

    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ul || ol) {
      const want = ul ? "ul" : "ol";
      if (listType !== want) {
        closeList();
        out.push(`<${want}>`);
        listType = want;
      }
      out.push(`<li>${inline((ul ?? ol)![1])}</li>`);
      i++;
      continue;
    }

    if (line.trim() === "") {
      closeList();
      i++;
      continue;
    }

    // paragraph — gather consecutive non-blank, non-special lines
    closeList();
    const para: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,3}\s|\s*[-*]\s|\s*\d+\.\s|```|&gt;|\s*-{3,}\s*$)/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    out.push(`<p>${inline(para.join("<br />"))}</p>`);
  }

  closeList();
  return out.join("\n");
}
