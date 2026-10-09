# Career Forge Job Clipper

A small Chrome extension. Open any job page — including ones behind your own login — click the toolbar button, and the job lands in **Admin → Jobs → Review** as a draft. Nothing goes live until you publish it.

It only reads the page **you** opened. It never logs in, clicks, scrolls or navigates for you, and it never sees your passwords — you log in to other sites yourself, as normal.

## Install (about two minutes)

1. Open Chrome and go to `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and choose this folder (`extensions/job-clipper`).
4. Click the puzzle-piece icon and **pin** “Career Forge Job Clipper”.

The server address and your private token are already in `config.local.json` in this folder (it is kept out of git), so there is nothing to type in.

## Use it

- **One job:** open the job page → click the extension's button. The badge shows
  **✓** added, **=** already on your site (no duplicate made), **!** a problem
  (hover the button to read it).
- **Right-click** anywhere on a page → “Send this job to Career Forge”, or
  “See my clipped jobs” to open your review list (Admin → Jobs → **From your extension**),
  where each clipped job has one-click **Publish** / **Discard**.
- **Only single job pages are accepted.** Job lists, careers landing pages and marketing
  pages are refused (the badge shows **!** and hovering explains why) — open one specific job first.
- **Select text first** if a page is messy — the extension then sends only your selection.
- **Hands-free for pages you open:** open the extension's **Options**, add a pattern such as
  `https://work.turing.com/jobs/*`, and Save (Chrome will ask permission for that site).
  From then on, any matching page you open is clipped a few seconds after it finishes
  loading. It still only reads pages *you* open.

## Good to know

- **Duplicates are skipped** by link (ignoring tracking bits like `?utm_…`) and by the
  same title + company.
- Clipped listings keep an **excerpt** (about 2,500 characters) and link back to the
  original page, which is the safe way to handle members-only content.
- You are responsible for each site's terms. Clipping a page you're looking at is far
  lower risk than automated scraping, but check that republishing is allowed — and prefer
  sites that offer a partner feed.
- If the extension ever shows **!** with “Unauthorized”, the token in `config.local.json`
  no longer matches the one on the server.
