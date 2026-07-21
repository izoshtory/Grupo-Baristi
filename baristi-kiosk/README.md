# Baristi Tostadores — Self-Service Kiosk

A self-contained ordering kiosk demo for **Baristi Tostadores** (Grupo Baristi). No backend, no build step, no dependencies — it's plain HTML/CSS/JS and runs anywhere, including GitHub Pages.

Built from your real menu board and cocktail promo cards: 7 categories, 39 drinks + pastries, real MXN pricing, and a dedicated dark "Baristi After Hours (21+)" treatment for the cocktail menu.

## Running it locally

Because the app loads `data/menu.json` with `fetch()`, most browsers (Chrome/Edge) block that over a plain `file://` link — you'll need a tiny local server. From this folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Or with Node: `npx serve .`

(On GitHub Pages this restriction doesn't apply — it'll just work.)

## Deploying to GitHub Pages

1. Create a new GitHub repository and push this entire folder to it.
2. In the repo, go to **Settings → Pages**.
3. Under "Build and deployment", set **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`.
4. Save — GitHub will give you a URL like `https://yourname.github.io/repo-name/` within a minute or two.

No further configuration needed.

## Replacing the placeholder images

Every product and category currently shows a soft icon placeholder because there are no real photos in `/images` yet. Just drop JPGs into `/images` using these **exact filenames** and they'll appear automatically — no code changes needed:

**Category covers** (used behind each category tile — currently a plain color wash):
```
images/cat-hot.jpg          images/cat-frappe.jpg
images/cat-iced.jpg         images/cat-smoothie.jpg
images/cat-tonic.jpg        images/cat-cocktail.jpg
images/cat-bakery.jpg
```

**Hot Coffee:** `americano.jpg`, `talega.jpg`, `de-la-olla.jpg`, `cappuccino.jpg`, `lechero.jpg`, `chocolate.jpg`, `mocha.jpg`, `latte.jpg`, `chai-azteca.jpg`, `chai-cafe.jpg`, `matcha.jpg`, `te-artesanal.jpg`

**On the Rocks (iced):** same names with `-iced` added, e.g. `americano-iced.jpg`, `de-la-olla-iced.jpg`, `latte-iced.jpg`, `chai-azteca-iced.jpg`, `mocha-iced.jpg`, `chai-cafe-iced.jpg`, `chocolate-iced.jpg`, `te-artesanal-iced.jpg`, `matcha-iced.jpg`, plus `onix.jpg`

**Frappes:** `frappe-vainilla.jpg`, `frappe-mocha.jpg`, `frappe-caramelo.jpg`, `frappe-matcha.jpg`, `frappe-cajeta.jpg`, `frappe-chai-azteca.jpg`, `frappe-chai-cafe.jpg`, `frappe-mexican-oreo.jpg`, `frappe-oreo.jpg`, `frappe-onix.jpg`

**Smoothies:** `smoothie-guanabana.jpg`, `smoothie-mamey.jpg`, `smoothie-maracuya.jpg`, `smoothie-fresas.jpg`

**Tonics:** `tonico.jpg`

**Baristi After Hours:** `cocktail-lemon-blush.jpg`, `cocktail-rose-tonic.jpg`, `cocktail-coffee-tonic.jpg`, `cocktail-old-fashioned.jpg`, `cocktail-la-creme.jpg`, `cocktail-honey-espresso.jpg`, `cocktail-martini-espresso.jpg`, `cocktail-vietnamita.jpg`

**Pastries:** `croissant.jpg`, `concha.jpg`, `cinnamon-roll.jpg`, `tres-leches.jpg`

If a file is missing or fails to load, the app quietly falls back to the icon placeholder instead of showing a broken image — safe to roll out photos gradually.

Recommended: square-ish or 4:5 crop, at least 800px wide, optimized/compressed (TinyPNG or similar) for fast kiosk load times.

### Welcome screen background / logo
There's no hero photo behind the welcome screen right now — it's a dark espresso gradient with a monogram mark. If you'd like a real photo background, add an image at `assets/background.jpg` and add this to `css/style.css` under `#screen-welcome`:
```css
background-image: linear-gradient(180deg, rgba(28,19,13,.55), rgba(18,12,8,.9)), url('../assets/background.jpg');
background-size: cover;
background-position: center;
```

## Editing the menu

Everything lives in **`data/menu.json`** — no HTML/JS editing required for menu changes.

- **Categories** are listed under `"categories"`. Each needs `id`, `name_en`, `name_es`, `image`, and optionally `"adult": true` for an 18+ dark-themed category like the cocktail menu.
- **Items** are listed under `"items"`. Each needs a unique `id`, a `category` (must match a category `id`), bilingual `name_en`/`name_es` and `description_en`/`description_es`, an `image` path, and pricing:
  - Items with size tiers (most hot/iced drinks): use a `"sizes"` object, e.g. `"sizes": { "8oz": 44, "12oz": 50, "16oz": 56 }`. Any size keys work — the customization screen builds its buttons from whatever's there.
  - Fixed-price items (cocktails, pastries): use a single `"price"` number instead of `"sizes"`.
- **Modifiers** (milk, sweetness, extras) are shared across all sized items and defined once under `"modifiers"`. Add/remove/reprice options there and every applicable item picks it up automatically.
- **Tax rate** is set once via `"tax_rate"` (currently `0.16` for 16% IVA).

After editing `menu.json`, just refresh the page — nothing to rebuild or compile.

## Project structure

```
/
index.html          — all six kiosk screens + customization sheet
/css/style.css       — design tokens, layout, animations
/js/
  icons.js           — inline SVG icon set
  storage.js         — localStorage wrapper (cart, language, favorites)
  cart.js            — cart state + cart screen rendering
  menu.js            — menu data, category/product grids, customization sheet
  app.js             — screen navigation, translations, init
/data/menu.json       — all menu content (edit this to change the menu)
/images/              — product & category photos (see filenames above)
/assets/              — optional welcome-screen background / extra brand art
```

## What's demo-only

Per the brief, this is a front-of-house ordering demo: there's no payment integration and no login. Checkout simply confirms the order, shows a generated order number and estimated prep time, and returns to a fresh cart. The "Baristi After Hours" cocktail category includes an age-verification notice banner, but there's no actual ID-check flow — that would need staff/POS integration in a real deployment.
