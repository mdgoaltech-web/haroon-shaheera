# Haroon & Shaheera — Wedding Invitation

A single-page wedding invitation for sharing on WhatsApp. Plain HTML, CSS and JavaScript:
no build step, no account, no server code. It runs on any static host.

## Files

| File | What it is |
| --- | --- |
| `config.js` | **All wedding details.** Names, wording, events, times, venues, RSVP numbers, share text. Edit this file only. |
| `index.html` | Page structure and the link-preview (WhatsApp) tags. |
| `styles.css` | Design. |
| `app.js` | Behaviour: opening animation, event cards, maps, calendar, RSVP, share, card viewer. |
| `assets/` | Garden artwork, share cover image, scans of the printed card. |
| `tools/` | Optional scripts that regenerate the artwork and cover image. |

## Before you send the link

1. **Check the flagged items** in the "For your review" box at the top of the page, and fix them in `config.js`:
   - **Bazm-e-Sama** is printed "Sunday 09th January 2027" on the card; it is confirmed and shown here as
     Saturday 9 January 2027. The scan under "The Printed Card" still shows the printed "Sunday".
2. Set `showReviewNotes: false` in `config.js`.
3. Set `siteUrl` in `config.js` to your final link.
4. In `index.html`, replace `YOUR-DOMAIN` (two places) with your real address so WhatsApp shows the cover image.

## Put it online (free options)

- **Netlify Drop** (quickest): open https://app.netlify.com/drop and drag this whole folder onto the page. You get a link at once.
- **Cloudflare Pages**: create a project, choose "Upload assets", upload this folder.
- **GitHub Pages**: push this folder to a repository, then Settings → Pages → deploy from the main branch.

There is nothing to build. Upload the folder as it is.

After uploading, paste the link into a WhatsApp chat with yourself to check the preview card.
WhatsApp caches previews; if you change the cover later, add `?v=2` to the link when you share it.

## Try it on your computer

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173

## How details behave

- **Calendar**: each event saves with its first printed time as the start, in Pakistan time (Asia/Karachi). No end time is added.
  If the printed day does not match the date, the calendar button for that event is switched off.
- **Maps**: a venue shows "Open in Maps" only when `pinVerified` is `true`.
- **RSVP**: remove a number from `rsvp.numbers` to hide it; set `whatsapp: false` to show Call only. Delete all numbers to hide the section.
- **Printed card**: remove entries from `cardPages` to hide pages (or all of them to hide the section).
- A link ending in `#events`, `#location` or `#rsvp` skips the envelope and opens at that section.

## Regenerate artwork (optional, needs Node.js)

```bash
node tools/build-art.mjs
```

To rebuild the share cover after changing names in `tools/cover.html`, serve the folder (command above), then:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars --window-size=1200,630 --virtual-time-budget=8000 --screenshot=cover.png http://localhost:4173/tools/cover.html
```

```bash
sips -s format jpeg -s formatOptions 82 cover.png --out assets/cover.jpg
```
