# Feature Set & User Flows

Building on [`monetization-strategy.md`](monetization-strategy.md). The
guiding constraint carries straight over: **density is the product, and the
map looking alive is the only thing that matters early.** So the feature set
is sequenced against the rollout stages — we build the creator side to be
frictionless and dense first, then the brand side that monetizes it, then
gear rental as the sub-market matures.

Three core flows:

1. [Creator profile & discovery](#1-creator-profile--discovery) — Stage 0
2. [Brand search & job posting](#2-brand-search--job-posting) — Stage 1
3. [Gear rental](#3-gear-rental) — Stage 3

A note on ordering: these are listed in build order, which is also value
order. The creator flow has to be *complete and delightful* before the brand
flow has anything to point at, and the brand flow has to be producing
booking outcomes before either the Creator Pro upsell or gear rental has
ground to stand on.

---

## 1. Creator profile & discovery

**Stage 0. The whole product at launch. Optimized for one thing: making the
map look alive with as little friction as possible.**

### Creator onboarding — the friction budget is near zero
Every field we require is a creator we might lose, and every lost creator is
a thinner map. So onboarding is ruthlessly minimal, with depth added *after*
the pin exists, not before.

**Required to get a pin on the map (the absolute minimum):**
- Name / handle
- Discipline(s) — the full crew: model, actor, dancer, photographer,
  videographer, DP, gaffer, grip, sound mixer, boom op, MUA, hair/wardrobe
  stylist, producer, director, editor, colorist, retoucher, set designer…
  *(multi-select, grouped into categories, drives discovery filters)*
- Location — city + an approximate area to drop the pin
- One portfolio image or link

That's it. The moment those exist, the creator is on the map and
discoverable. Everything else is progressive.

**Progressive profile (prompted later, never blocking):**
- Full portfolio gallery (pull from Instagram/website to remove typing)
- Rates / availability *(optional — many won't list publicly)*
- Bio, equipment they own *(this field quietly seeds Stage 3 gear rental)*
- Travel radius
- Verification badge (later trust signal)

> **Design rule:** approximate location only. Creators won't (and shouldn't)
> publish a home address. The pin shows a neighborhood/area; exact
> coordinates are never exposed. This is a safety requirement, not a nicety.

### Discovery — the map *is* the homepage
The map is not a feature, it's the front door. It must read as "alive" on
first load even when sparse.

- **Map view** with clustered pins by discipline; pins carry a thumbnail so
  the map reads as a portfolio at a glance, not abstract dots.
- **Filters:** discipline, distance radius, availability, (later) rate band.
- **Profile preview** on pin tap → portfolio, disciplines, area → tap into
  full profile.
- **Sparse-map handling (critical):** never show a literal empty map. If
  coverage is thin, widen the radius automatically and label it ("Showing
  creators within 50mi"), or fall back to a curated city grid. The user
  should *never* hit the empty-screenshot moment from the strategy doc.

### Contact — deliberately gated until Stage 1
At Stage 0 there's no brand-side product yet, so discovery can lead to a
lightweight "save / shortlist" and an interest signal. **Direct booking and
job posting are intentionally a Stage 1 capability** — that's the line we
charge across. We don't want to build the full contact rail before there's a
paywall to attach it to.

---

## 2. Brand search & job posting

**Stage 1. The first monetized surface. Per the strategy: pay-per-job-post,
not subscription.**

### Brand onboarding — lighter than B2B reflex suggests
The instinct is heavy B2B onboarding (company verification, seats, billing
setup up front). Resist it. A brand should be able to **browse the live map
before creating an account at all** — let them feel the density first, since
that's the entire reason they'd pay. Account creation is deferred to the
moment of intent: posting a job or unlocking contact.

### Two entry modes into the same marketplace
Brands arrive with one of two mindsets; support both into the same pool.

**A. Search & reach out (pull).**
- Same map/filter discovery as creators, brand-side.
- Shortlist creators → unlock contact / send a booking inquiry.
- This is the natural on-ramp for a brand testing the waters with one role.

**B. Post a job (push).**
- Brand posts a brief: role(s), shoot date/location, budget band,
  deliverables, usage rights.
- Matching creators in-radius are notified; creators apply/express interest.
- Brand reviews respondents and books.

### The monetization moment
Per the strategy, **the charge is per job post** (and/or per contact unlock),
*not* a subscription. Rationale lives in the strategy doc, but the product
consequence here is concrete:

- **First-time brand:** pays for a single post → low-commitment trial. The
  pricing UI frames it as "post this job," not "subscribe."
- **Repeat brand:** after N posts, surface the subscription as a *savings*
  offer ("you've posted 4 jobs — a monthly plan would've saved you X").
  Let their own behavior qualify them; don't gate the subscription behind a
  sales call.

### Booking → the outcome data that unlocks everything downstream
Whether discovery flows through search or a job post, it funnels into a
**booking record**: agreed scope, date, and ideally a confirmation when the
shoot happens. This is not just operational bookkeeping — **booking outcomes
are the asset Stage 2 (Creator Pro "get seen first") is sold against.** No
booking data, nothing to upsell. So even a lightweight "mark as booked"
confirmation is worth building here, not deferring.

---

## 3. Gear rental

**Stage 3. A second-stage revenue layer, not first ground. Commission-based.
Activates on its own as the sub-market matures.**

Per the strategy doc, gear rental is **a third marketplace with its own
density problem** — it needs enough gear owners *and* renters in the same
city. So it's built to **piggyback on density we already have** rather than
bootstrap from zero.

### Seeded by Stage 0, not from scratch
The "equipment you own" field in the progressive creator profile (Section 1)
is doing quiet double-duty: by the time we activate rental, we already know
which creators in a city own gear. That turns a cold-start into a warm
"you've got a Sony A7IV listed — want to rent it out on idle days?" prompt.

### Gear owner flow
- Convert a listed item into a rental listing: photos, daily rate, deposit,
  availability calendar, pickup area (approximate, same safety rule as
  profiles).
- Owner approves/declines requests; calendar blocks on confirmed rentals.

### Renter flow
- Map/list discovery of gear in-radius, filtered by category and date.
- Request dates → owner confirms → payment held → pickup/return → release.
- Damage/deposit handling and a lightweight review on both sides.

### The monetization moment
**Commission on each completed rental** — no new subscription to sell, which
is exactly why it's attractive *here* (after density exists) and exactly why
it was rejected as the first dollar (before density exists). It earns when
the marketplace transacts, riding on infrastructure the booking flow already
established.

---

## How the flows map to the rollout

| Flow | Stage | Monetization touchpoint |
| ---- | ----- | ----------------------- |
| Creator profile & discovery | 0 — Launch | None — pure density build |
| Brand search & job posting | 1 — Brand tier | Pay-per-job-post / contact unlock |
| (Creator Pro "get seen first") | 2 — Creator upsell | Subscription, sold against booking outcomes from Stage 1 |
| Gear rental | 3 — Gear | Commission on completed rentals |

### The dependency that ties it together
Each stage **manufactures the input the next stage needs:**

- Stage 0 manufactures **density** → which makes the Stage 1 brand product
  worth paying for.
- Stage 1 manufactures **booking outcomes** → which gives Stage 2's "get
  seen first" something real to sell.
- Stages 0–1 manufacture **a dense, transacting user base** → which is the
  only ground on which Stage 3 gear rental can stand.

Build out of this order and you're selling a better seat in an empty
theater. Build in it and each layer pays for the runway of the next.

---

*Next: data model & schema for the booking record and profile entities, then
the Stage-0 map/discovery UI in detail.*
