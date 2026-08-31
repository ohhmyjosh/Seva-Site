# Seva — website

Marketing and explainer site for **Seva**, a hyperlocal work platform for Varanasi.

*Kaam bhi, pehchaan bhi* — work, and the dignity of being seen.

**Live:** https://seva-site.vercel.app

---

## What this is

A static site — no build step, no framework, no dependencies. Seven hand-written
HTML pages sharing one stylesheet and one script. Open `index.html` in a browser
and it works.

| Page | What it covers |
| --- | --- |
| `index.html` | The whole story in one scroll: the gap, what Seva is, the flywheel, the app, coverage, trust, pricing, horizons |
| `about.html` | Why Seva exists — mission, vision, six core values, five non-negotiables, the ministry boundary |
| `product.html` | What is actually built: stack, verification lifecycle, onboarding design, inclusion, data handling, honest status |
| `how-it-works.html` | The two journeys, the trust flywheel, the booking state machine, safety, pricing |
| `strategy.html` | The business model, the cash-commission problem, competition, the pilot loop, scaling |
| `traction.html` | Where we are, the horizons, the four-stage roadmap, and the asks |
| `partner.html` | Partnership tracks, reporting, and the contact form |

## Running it locally

Any static server will do:

```bash
python -m http.server 8899
# then open http://127.0.0.1:8899/
```

Opening the files directly over `file://` also works. The only external request
is Google Fonts.

## Design system

Everything lives in `style.css`, organised in numbered sections with the tokens
at the top. The palette is taken from the Seva app itself:

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | `#0a0b0d` | Base surface |
| `--ink-2` | `#0f1411` | Panels |
| `--bone` | `#f2f5f2` | Light bands |
| `--accent` | `#2fc978` | Brand green |
| `--accent-deep` | `#0f6b3f` | Green on light surfaces (contrast) |
| `--on-accent` | `#052013` | Text on a filled green panel |

Two greens exist on purpose: the bright one fails contrast on light backgrounds,
so light bands use `--accent-deep` instead.

Type is **Archivo** for display, **Newsreader** for body copy, and
**Noto Sans Devanagari** for Hindi.

## `script.js`

No dependencies. It handles:

- the mobile navigation
- reveal-on-scroll, staggered within each group
- the scroll-linked product story on the home page
- the category ticker
- the contact form (composes a `mailto:` — there is no backend)
- the football that rolls down the right-hand rail, easing toward the scroll
  position and rotating by real arc length

Everything degrades gracefully without JavaScript, and `prefers-reduced-motion`
is respected throughout.

## Deploying

The site is on Vercel as the `seva-site` project.

```bash
vercel deploy --prod
```

`vercel.json` sets cache headers for `/assets` and a few security headers.

## Notes

- The contact form has **no backend**. It opens the visitor's mail client.
  Swap in Formspree, Netlify Forms or similar when you want submissions stored.
- The pages were generated once from scripts and are now plain HTML — edit them
  directly.

## Licence

All rights reserved. © Seva App, Varanasi, India.
