# Monetization Strategy

**Decision: brand-pays, creator-free, rolled out in stages.**

This document records the call and, more importantly, *why* — so the
sequencing decisions downstream (which feature ships when, which side we
optimize onboarding for, when the first dollar is allowed to appear) all
trace back to one set of reasons instead of being re-argued every time.

---

## The core tension

Every two-sided marketplace runs into the same wall: **the side you charge
has to already see value before they'll pay.** On a map-based platform,
value comes from *density* — and density comes from the free side joining
without friction.

For us, the free side has to be **creators**, for a reason sharper than
generic chicken-and-egg: creators are the side with **negative network
effects working against us early.**

- The entire pitch is "find someone near you." An empty map kills the
  product instantly.
- One empty-map screenshot is enough to make a brand never come back.

So creators must be **free and frictionless, full stop** — at least until
there is real coverage in a handful of cities.

---

## The cost of this choice (timing, not soundness)

The decision is sound. What it costs us is **timing**, and we should go in
with eyes open:

1. **Revenue lags signups by months, not weeks.**
   Brands are a slower sale than consumers. B2B carries procurement,
   marketing-budget sign-off, and an internal champion who has to decide
   it's worth trying a platform with no track record yet. Expect a chunk
   of **unmonetized growth** before the first dollar.

2. **Concentration risk on the revenue side.**
   A paying base of a relatively small number of brand accounts is more
   fragile than thousands of small creator subscriptions. Losing two or
   three brand clients hurts far more than losing a handful of free users
   ever would. Worth knowing going in — not a reason to avoid it.

Both costs are *manageable* and *expected*. Neither undermines the call.

---

## Why not the alternatives

### Charging creators from day one
Fixes cash flow, kills the product.

- **Adverse selection:** if people must pay before there's any brand
  activity to justify it, only the most committed few sign up — not the
  broad base the map needs to look alive.
- **Loses the edge:** the organic, low-friction growth that's supposed to
  beat "creators cold-DMing brands on Instagram" evaporates the moment
  there's a paywall in front of an empty map.

### Leaning on gear-rental commission as the first dollar
Tempting because it feels "passive" — no subscription to sell. But it's
**a third marketplace stacked on the other two.** It needs enough gear
owners *and* enough renters *in the same city* — its own density problem,
lagging behind both creators and brands. It's a strong **second-stage**
revenue layer once talent discovery has traction; it is **not solid ground
for the first dollar.**

---

## The staged rollout

This is the practical shape of the decision. Each stage unlocks the next
because it produces the thing the next stage needs to sell.

| Stage | What's live | Monetization | Gate to advance |
| ----- | ----------- | ------------ | --------------- |
| **0 — Launch** | Free for everyone. Creator signup + map discovery. (What the landing page does today.) | None | Visible coverage in 1–2 cities |
| **1 — Brand tier** | Brands can post jobs / search talent | **Pay-per-job-post** (not subscription — see below) | Repeat-posting brands emerge; real booking outcomes accumulate |
| **2 — Creator Pro** | "Get seen first" upsell for creators | Creator Pro subscription | Demonstrable booking outcomes to sell against |
| **3 — Gear rental** | Gear listing + rental flow | **Commission** on rentals | Activates on its own as the sub-market matures |

### Why pay-per-job-post before a brand subscription
For a brand trying us for the first time, **pay-per-post is a smaller ask**
than committing to a subscription against a platform with no track record.
Charge per post to get them in the door; **graduate repeat posters into a
subscription later**, once the value is proven by their own behavior.

### Why Creator Pro waits until Stage 2
"Get seen first" only means something **once people are actually being
found.** Pitching priority placement before there are booking outcomes is
selling a better seat in an empty theater. We need booking results to sell
*against* before this upsell has any teeth.

---

## One-line summary

> Free for everyone through launch and the first growth push → paid brand
> tier (pay-per-post) once cities look alive → Creator Pro upsell once
> bookings are happening → gear-rental commission activates as that
> sub-market matures.

See [`feature-set-and-user-flows.md`](feature-set-and-user-flows.md) for how
the product is sequenced against these stages.
