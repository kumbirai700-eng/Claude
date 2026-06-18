# Backend — making real accounts work

Right now the app's login + connections run on **`localStorage`** (per-browser,
no real accounts). That's a prototype stand-in. To make your **first real
account** — one that persists, works across devices, and lets people actually
connect — point the app at **Supabase** (Postgres + Auth + Storage).

## Why Supabase
- Email/password + magic-link **auth** out of the box.
- **Postgres** for profiles, spaces, gear, jobs, connections, posts.
- **Storage** for portfolio images (replaces the placeholder Picsum URLs).
- **Row-level security** so people can only edit their own data.
- Free tier is plenty to launch.

## Stand it up (≈15 min)
1. Create a project at [supabase.com](https://supabase.com) → note the
   **Project URL** and **anon public key** (Settings → API).
2. Open **SQL Editor** → paste [`schema.sql`](./schema.sql) → **Run**.
   That creates every table, the follow graph, RLS policies, a
   `connection_counts` view, and a trigger that auto-creates a profile row
   on sign-up.
3. **Authentication → Providers** → enable Email (turn on “Confirm email” for
   production, off for fast testing).
4. **Storage** → create a public bucket `portfolios` for image uploads.

## Wire the front-end (the swap)
In `web/app.js` the auth + connections are isolated in one module
(`AUTH … + CONNECTIONS`). Swapping is a contained change:

```html
<!-- add before app.js -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```
```js
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// sign up  → replaces the prototype openAuth() submit
await sb.auth.signUp({ email, password, options:{ data:{ name, kind } }});
// log in
await sb.auth.signInWithPassword({ email, password });
// current user
const { data:{ user } } = await sb.auth.getUser();

// connect / disconnect (replaces the localStorage Set)
await sb.from('connections').insert({ follower_id:user.id, following_id:targetId });
await sb.from('connections').delete().eq('follower_id',user.id).eq('following_id',targetId);

// load creators from the DB instead of seed data
const { data:creators } = await sb.from('profiles').select('*').eq('kind','creator');
```

Keep the seed arrays as a fallback for local/offline demos; when
`SUPABASE_URL` is set, read/write live data instead.

## Deploy
Host `web/` (or the single `the-creative-centre.html`) on **Netlify** or
**Vercel** — both serve static files and the app talks to Supabase directly
from the browser. Add the two keys as build-time constants. Then visit the
site, hit **Sign up**, and that's your first real account.

---
**Want me to do the wiring?** Say the word and I'll: provision the project (the
Supabase integration is available in this environment), run this schema, port
the seed data in, and replace the localStorage auth/connection module with the
Supabase calls above.
