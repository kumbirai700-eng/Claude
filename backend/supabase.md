# Supabase — live backend

The Creative Collective is now backed by a live Supabase project (free tier,
Sydney region).

| | |
| --- | --- |
| Project | `creative-collective` |
| Org | Dracoo HQ |
| Region | `ap-southeast-2` (Sydney) |
| API URL | `https://tbukreqlmymhmvnuczah.supabase.co` |
| Publishable key | `sb_publishable_EW5W0u4hNaTBgvVT80ncpg_7BXoAd6U` (public — safe in the client) |

The URL + key are wired into `web/index.html` (`window.SUPABASE_URL` /
`window.SUPABASE_KEY`). `app.js` creates the client (`SB`) on boot.

## What writes to Supabase now
- **Waitlist** signups → `waitlist`
- **Project enquiries** → `enquiries`
- **Reviews** → `reviews`

(localStorage stays as an offline mirror so the demo still works without a
connection.)

## Schema
All tables, RLS policies, the `app_admins` allowlist, `is_admin()`, the
auto-create-profile trigger and a build-stage auto-confirm trigger are applied
as migrations. `backend/schema.sql` documents the design; the live DB is the
source of truth.

## Admin dashboard
Go to **`/#admin`** (also linked in the footer under Company).

- First visit: pick **"Set password"**, enter `kumbirai700@gmail.com` and a
  password of your choice (min 6) → you're let straight in (auto-confirm is on
  for build stage).
- After that: **"Log in"** with the same email + password.
- Your email is in the `app_admins` allowlist, so RLS lets you read the
  sensitive tables (waitlist, enquiries, support). Everyone else is blocked.

The dashboard shows live counts + tables for Waitlist, Enquiries, Reviews,
Profiles and Support, ordered newest-first.

## Hardening before public launch
- Turn the **auto-confirm trigger** off and use real email confirmation.
- Add more admins: `insert into app_admins (email) values ('teammate@x.com');`
- Review RLS once real creator accounts exist.
