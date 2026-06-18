# THE CREATIVE COLLECTIVE

A black, map-based marketplace for finding creative **crew** near you — not
just models and photographers, but the whole call sheet: **gaffers, sound
mixers, boom ops, MUAs, hair & wardrobe stylists, DPs, drone operators,
grips, editors, colorists, retouchers, producers, casting, set designers,
dancers** and more. One promise: **find your crew near you.**

```
web/            ← the working app (open web/index.html in a browser)
  index.html
  styles.css    ← black editorial theme
  app.js        ← SPA: discovery map, brand jobs, gear rental, creator join
  data.js       ← seed crew / jobs / gear
docs/           ← the strategy behind it
  monetization-strategy.md
  feature-set-and-user-flows.md
```

## Run it

No build step, no dependencies. Just open the file:

```bash
# from the repo root
open web/index.html          # macOS
xdg-open web/index.html      # Linux
# …or serve it:
python3 -m http.server -d web 8080   # then visit http://localhost:8080
```

## What's built

A full, self-contained front-end across the three core flows from the
strategy:

- **Discover (Stage 0)** — the black map. Filter the full crew by category
  (Talent / Camera / Lighting & Grip / Sound / Hair-Makeup-Style /
  Direction & Production / Post / Design & Build), search, tap pins, open
  rich profiles. Handles the empty-map cold-start gracefully — it never
  shows a dead screen.
- **Jobs (Stage 1)** — brand brief posting with the **pay-per-post** model
  (£39 first brief, subscription nudge after 3+). Posting notifies matching
  crew in-city. Briefs persist locally.
- **Gear (Stage 3)** — rental listings seeded by the gear crew already own,
  commission-only, opening city-by-city.
- **Join (always free)** — near-zero-friction creator onboarding (4 required
  fields) that drops a new pin on the map live.

State persists to `localStorage`, so creators you add, jobs you post, and
your shortlist survive a reload.

## Why it's shaped this way

Density is the product; an empty map kills it on first screenshot. So crew
are free and frictionless forever, brands are the paying side (but a slower
sale), and gear rides on top once density exists. The full reasoning and the
staged rollout are in [`docs/monetization-strategy.md`](docs/monetization-strategy.md);
the flows are in [`docs/feature-set-and-user-flows.md`](docs/feature-set-and-user-flows.md).
