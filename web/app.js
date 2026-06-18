// ============================================================================
//  THE CREATIVE CENTRE — app
//  Vanilla SPA. No build step, no external deps. Open index.html and go.
// ============================================================================

// ---------- persistent state ----------
const LS = {
  get(k, fb) { try { return JSON.parse(localStorage.getItem('tcc_' + k)) ?? fb; } catch { return fb; } },
  set(k, v) { localStorage.setItem('tcc_' + k, JSON.stringify(v)); },
};

const state = {
  city: 'Lagos',
  query: '',
  roles: new Set(),          // active discipline filters
  selected: null,            // selected creator id
  creators: [...SEED_CREATORS, ...LS.get('creators', [])],
  jobs: [...LS.get('jobs', []), ...SEED_JOBS],
  gear: [...LS.get('gear', []), ...SEED_GEAR],
  shortlist: new Set(LS.get('shortlist', [])),
};

// ---------- tiny helpers ----------
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

function hashHue(str) { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360; return h; }
function avatarStyle(name) {
  const h = hashHue(name);
  return `background:linear-gradient(135deg, hsl(${h} 80% 62%), hsl(${(h + 38) % 360} 85% 52%))`;
}
function initials(name) { return name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase(); }

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(t._t); t._t = setTimeout(() => (t.hidden = true), 2600);
}

// ---------- filtering ----------
function filtered() {
  const q = state.query.trim().toLowerCase();
  return state.creators.filter(c => {
    if (c.city !== state.city) return false;
    if (state.roles.size && !c.roles.some(r => state.roles.has(r))) return false;
    if (q) {
      const hay = (c.name + ' ' + c.roles.join(' ') + ' ' + (c.tags || []).join(' ') + ' ' + (c.area || '')).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

// ============================================================================
//  ROUTER
// ============================================================================
const routes = { discover: renderDiscover, jobs: renderJobs, gear: renderGear, join: renderJoin };

function router() {
  const route = (location.hash.replace('#', '') || 'discover').split('?')[0];
  const fn = routes[route] || renderDiscover;
  $$('.nav-links a').forEach(a => a.classList.toggle('active', a.dataset.route === route));
  $('#view').innerHTML = '';
  fn();
  window.scrollTo(0, 0);
  $('.nav-links')?.classList.remove('open');
}
window.addEventListener('hashchange', router);

// ============================================================================
//  VIEW: DISCOVER  (the map — Stage 0 product)
// ============================================================================
function renderDiscover() {
  const view = $('#view');
  view.appendChild(el(`
    <section class="discover">
      <!-- LEFT: filters -->
      <div class="panel" id="panel-left">
        <div class="panel-head">
          <h2>Find your crew</h2>
          <div class="sub">Models, camera, lighting, sound, glam, post — near you.</div>
        </div>
        <div class="filters">
          <div class="filter-group">
            <label class="label">City</label>
            <select class="field" id="city-select">
              ${CITIES.map(c => `<option ${c === state.city ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          <div class="filter-group">
            <label class="label">Search</label>
            <input class="field" id="search" placeholder="name, role, vibe…" value="${esc(state.query)}" />
          </div>
          <div class="filter-group" id="cat-filters"></div>
        </div>
      </div>

      <!-- CENTER: map -->
      <div class="map-wrap" id="map-wrap">
        <div class="map"></div>
        ${riverSVG()}
        <div class="map-overlay-top">
          <div class="map-city-tag"><span class="brand-mark">◉</span> <span id="map-city">${state.city}</span></div>
          <div class="map-count" id="map-count"></div>
        </div>
        <div id="pins"></div>
      </div>

      <!-- RIGHT: results -->
      <div class="panel panel-right">
        <div class="panel-head">
          <h2 id="results-title">Creators</h2>
          <div class="sub" id="results-sub"></div>
        </div>
        <div id="results"></div>
      </div>
    </section>
  `));

  // category filter rail
  $('#cat-filters').innerHTML = CATEGORIES.map(cat => `
    <div style="margin-bottom:18px">
      <div class="cat-title">${cat.label}</div>
      <div class="chips">
        ${cat.roles.map(r => `<button class="chip ${state.roles.has(r) ? 'on' : ''}" data-role="${esc(r)}">${esc(r)}</button>`).join('')}
      </div>
    </div>
  `).join('');

  // wire events
  $('#city-select').addEventListener('change', e => { state.city = e.target.value; state.selected = null; refreshDiscover(); });
  $('#search').addEventListener('input', e => { state.query = e.target.value; refreshDiscover(); });
  $$('#cat-filters .chip').forEach(ch => ch.addEventListener('click', () => {
    const r = ch.dataset.role;
    state.roles.has(r) ? state.roles.delete(r) : state.roles.add(r);
    ch.classList.toggle('on');
    refreshDiscover();
  }));

  refreshDiscover();
}

function refreshDiscover() {
  const list = filtered();
  $('#map-city').textContent = state.city;
  $('#map-count').innerHTML = `<b>${list.length}</b>&nbsp;available`;
  $('#results-title').textContent = state.roles.size ? [...state.roles].slice(0, 2).join(', ') + (state.roles.size > 2 ? '…' : '') : 'Creators';
  $('#results-sub').textContent = `${list.length} in ${state.city}`;
  renderPins(list);
  renderResults(list);
}

function renderPins(list) {
  const pins = $('#pins');
  if (!list.length) {
    pins.innerHTML = `
      <div class="map-empty">
        <div>
          <div class="big">No one here yet — that's the cold start.</div>
          <div>Try clearing filters or switching city. Every creator who joins makes this map worth more.</div>
          <div style="margin-top:18px"><a class="btn btn-primary btn-sm" href="#join">Be the first here →</a></div>
        </div>
      </div>`;
    return;
  }
  pins.innerHTML = list.map(c => `
    <div class="pin ${state.selected === c.id ? 'sel' : ''}" data-id="${c.id}" style="left:${c.x}%;top:${c.y}%">
      <div class="pin-dot" style="${avatarStyle(c.name)}">${initials(c.name)}</div>
      <div class="pin-tail"></div>
      <div class="pin-label">${esc(c.name)} · ${esc(c.roles[0])}</div>
    </div>`).join('');
  $$('#pins .pin').forEach(p => p.addEventListener('click', () => openProfile(p.dataset.id)));
}

function renderResults(list) {
  const box = $('#results');
  if (!list.length) { box.innerHTML = `<div style="padding:28px 20px;color:var(--muted);font-size:13.5px">No matches in ${state.city}. Widen your filters.</div>`; return; }
  box.innerHTML = list.map(c => `
    <div class="result ${state.selected === c.id ? 'sel' : ''}" data-id="${c.id}">
      <div class="avatar" style="${avatarStyle(c.name)}">${initials(c.name)}</div>
      <div class="result-body">
        <div class="result-name">${esc(c.name)} ${c.verified ? '<span class="verified" title="Verified">✦</span>' : ''}</div>
        <div class="result-role">${esc(c.roles.join(' · '))}</div>
        <div class="result-meta"><span>${esc(c.area)}</span><span class="rate">${esc(c.rate)}</span><span>${c.exp}y</span></div>
      </div>
    </div>`).join('');
  $$('#results .result').forEach(r => r.addEventListener('click', () => openProfile(r.dataset.id)));
}

// stylised "river" so the map reads as a city, not a void
function riverSVG() {
  return `<svg class="map-river" viewBox="0 0 100 100" preserveAspectRatio="none">
    <path d="M-5,72 C20,64 35,80 52,70 C70,60 82,76 105,66" fill="none" stroke="#151515" stroke-width="6"/>
    <path d="M-5,72 C20,64 35,80 52,70 C70,60 82,76 105,66" fill="none" stroke="#0d0d0d" stroke-width="2"/>
  </svg>`;
}

// ============================================================================
//  PROFILE DRAWER
// ============================================================================
function openProfile(id) {
  const c = state.creators.find(x => x.id === id);
  if (!c) return;
  state.selected = id;
  $$('.pin, .result').forEach(n => n.classList.toggle('sel', n.dataset.id === id));

  const saved = state.shortlist.has(id);
  const drawer = $('#drawer');
  drawer.innerHTML = `
    <div class="drawer-cover" style="${avatarStyle(c.name)}">
      <button class="drawer-close" id="drawer-close">✕</button>
      <div class="drawer-av" style="${avatarStyle(c.roles.join(''))}">${initials(c.name)}</div>
    </div>
    <div class="drawer-pad">
      <h2>${esc(c.name)} ${c.verified ? '<span class="verified" title="Verified">✦</span>' : ''}</h2>
      <div class="roles">${esc(c.roles.join(' · '))}</div>
      <div class="loc">${esc(c.area)}, ${esc(c.city)}</div>

      <div class="kv">
        <div><div class="k">Day rate</div><div class="v">${esc(c.rate)}</div></div>
        <div><div class="k">Experience</div><div class="v">${c.exp} yrs</div></div>
        <div><div class="k">Status</div><div class="v">${c.verified ? 'Verified' : 'New'}</div></div>
      </div>

      <p class="bio">${esc(c.bio)}</p>

      ${(c.tags && c.tags.length) ? `<div class="tagrow">${c.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}

      ${(c.gear && c.gear.length) ? `
        <div class="divider"></div>
        <div class="label">Owns gear</div>
        <ul class="gearlist">${c.gear.map(g => `<li>${esc(g)}</li>`).join('')}</ul>
        <div class="hr-note">Gear they own can be listed for rental once that opens in their city.</div>
      ` : ''}

      <div class="drawer-actions">
        <button class="btn btn-primary" id="btn-book">Send booking inquiry</button>
        <button class="btn btn-ghost" id="btn-save">${saved ? '✓ Shortlisted' : '☆ Shortlist'}</button>
      </div>
      <div class="hr-note">Contact opens after the brand posts a brief or unlocks contact — that's the line we monetise. Exact location is never shown; the pin is an approximate area.</div>
    </div>`;

  $('#drawer').hidden = false; $('#drawer').setAttribute('aria-hidden', 'false');
  $('#scrim').hidden = false;
  $('#drawer-close').addEventListener('click', closeProfile);
  $('#btn-save').addEventListener('click', () => {
    if (state.shortlist.has(id)) state.shortlist.delete(id); else state.shortlist.add(id);
    LS.set('shortlist', [...state.shortlist]);
    $('#btn-save').textContent = state.shortlist.has(id) ? '✓ Shortlisted' : '☆ Shortlist';
    toast(state.shortlist.has(id) ? `${c.name} shortlisted` : `Removed ${c.name}`);
  });
  $('#btn-book').addEventListener('click', () => { closeProfile(); location.hash = '#jobs'; setTimeout(() => toast('Post a brief to reach ' + c.name.split(' ')[0]), 200); });
}
function closeProfile() {
  $('#drawer').hidden = true; $('#drawer').setAttribute('aria-hidden', 'true');
  $('#scrim').hidden = true;
  state.selected = null;
  $$('.pin, .result').forEach(n => n.classList.remove('sel'));
}

// ============================================================================
//  VIEW: JOBS  (brand search & posting — Stage 1)
// ============================================================================
function renderJobs() {
  const view = $('#view');
  view.appendChild(el(`
    <div class="wrap">
      <div class="page-head">
        <div class="eyebrow">For brands · Stage 1</div>
        <h1>Post a brief. The right crew comes to you.</h1>
        <p>Pay per job post — no subscription to start. Browse the map free; you only pay when you're ready to hire. Matching creators in your city get notified the moment you post.</p>
      </div>

      <div class="section-pad grid" style="grid-template-columns: 1.1fr .9fr; gap:40px; align-items:start;">
        <div>
          <div class="label" style="margin-bottom:16px">Open briefs</div>
          <div id="jobs-list" class="grid"></div>
        </div>
        <div>
          <div class="card form-card" style="position:sticky;top:80px">
            <div class="eyebrow">New brief</div>
            <h3 style="margin-bottom:18px">Post a job</h3>
            <form id="job-form">
              <div class="form-row"><label class="label">Brand / company</label><input class="field" name="brand" required placeholder="Studio Noir" /></div>
              <div class="form-row"><label class="label">Title</label><input class="field" name="title" required placeholder="Beauty campaign — MUA + retoucher" /></div>
              <div class="form-row two">
                <div><label class="label">City</label><select class="field" name="city">${CITIES.map(c => `<option>${c}</option>`).join('')}</select></div>
                <div><label class="label">Shoot date</label><input class="field" type="date" name="date" required /></div>
              </div>
              <div class="form-row"><label class="label">Roles needed</label>
                <select class="field" name="role">${ALL_ROLES.map(r => `<option>${r}</option>`).join('')}</select>
                <div class="hint">Add the lead role; you can list more in the brief.</div>
              </div>
              <div class="form-row two">
                <div><label class="label">Budget</label><input class="field" name="budget" placeholder="£3,000 total" /></div>
                <div><label class="label">Usage</label><input class="field" name="usage" placeholder="Web + OOH, 6 mo" /></div>
              </div>
              <div class="form-row"><label class="label">The brief</label><textarea class="field" name="brief" placeholder="What you're making, the vibe, what you need on the day…"></textarea></div>
              <div class="form-row" style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--r-sm);padding:14px;display:flex;justify-content:space-between;align-items:center">
                <div><div style="font-weight:600;font-size:14px">Job post</div><div class="hint" style="margin:0">Single brief · first-timer rate</div></div>
                <div style="font-weight:800;font-size:18px;color:var(--accent)">£39</div>
              </div>
              <button class="btn btn-primary btn-block" type="submit">Post brief & notify crew</button>
              <div class="hint" style="text-align:center;margin-top:10px">Post 3+ and we'll offer a monthly plan that saves you money.</div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `));

  paintJobs();
  $('#job-form').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const job = {
      id: 'j' + Date.now(), brand: f.get('brand'), title: f.get('title'), city: f.get('city'),
      roles: [f.get('role')], date: f.get('date'), budget: f.get('budget') || '—',
      usage: f.get('usage') || '—', brief: f.get('brief') || '', posted: new Date().toISOString().slice(0, 10),
    };
    const mine = LS.get('jobs', []); mine.unshift(job); LS.set('jobs', mine);
    state.jobs.unshift(job);
    e.target.reset();
    paintJobs();
    const matches = state.creators.filter(c => c.city === job.city && c.roles.includes(job.roles[0])).length;
    toast(`Brief posted — ${matches} matching creator${matches === 1 ? '' : 's'} notified in ${job.city}`);
  });
}

function paintJobs() {
  $('#jobs-list').innerHTML = state.jobs.map(j => `
    <div class="card">
      <h3>${esc(j.title)}</h3>
      <div class="meta">${esc(j.city)} · shoot ${esc(j.date)}</div>
      ${j.brief ? `<div class="desc">${esc(j.brief)}</div>` : ''}
      <div class="pill-row">
        ${j.roles.map(r => `<span class="pill accent">${esc(r)}</span>`).join('')}
        <span class="pill">${esc(j.budget)}</span>
        <span class="pill">${esc(j.usage)}</span>
      </div>
      <div class="card-foot">
        <span class="brandline">${esc(j.brand)} · posted ${esc(j.posted)}</span>
        <button class="btn btn-ghost btn-sm" data-apply="${j.id}">Express interest</button>
      </div>
    </div>`).join('');
  $$('[data-apply]').forEach(b => b.addEventListener('click', () => toast('Interest sent — the brand will see your profile')));
}

// ============================================================================
//  VIEW: GEAR  (rental — Stage 3)
// ============================================================================
function renderGear() {
  const view = $('#view');
  view.appendChild(el(`
    <div class="wrap">
      <div class="page-head">
        <div class="eyebrow">For everyone · Stage 3</div>
        <h1>Rent gear from crew nearby.</h1>
        <p>Cameras, lights, grip, aerial — listed by the creators already on the map. Commission only, no listing fee. This opens city-by-city once there's enough crew to make it worth it.</p>
      </div>
      <div class="section-pad">
        <div class="grid" style="grid-template-columns:auto auto;justify-content:start;gap:12px;margin-bottom:28px">
          <select class="field" id="gear-city" style="width:auto">${['All cities', ...CITIES].map(c => `<option>${c}</option>`).join('')}</select>
          <a class="btn btn-ghost btn-sm" href="#join">List your gear →</a>
        </div>
        <div id="gear-list" class="grid grid-3"></div>
      </div>
    </div>
  `));
  const paint = () => {
    const city = $('#gear-city').value;
    const list = state.gear.filter(g => city === 'All cities' || g.city === city);
    $('#gear-list').innerHTML = list.length ? list.map(g => `
      <div class="card">
        <div class="pill accent" style="display:inline-block">${esc(g.cat)}</div>
        <h3 style="margin-top:12px">${esc(g.item)}</h3>
        <div class="meta">${esc(g.area)}, ${esc(g.city)}</div>
        <div class="card-foot">
          <span class="brandline">by ${esc(g.owner)} · dep. ${esc(g.deposit)}</span>
          <span style="font-weight:800;color:var(--accent)">${esc(g.rate)}</span>
        </div>
        <button class="btn btn-ghost btn-sm btn-block" style="margin-top:14px" data-rent="${g.id}">Request dates</button>
      </div>`).join('') : `<div style="color:var(--muted)">No gear listed in ${city} yet — this market opens as crew density grows.</div>`;
    $$('[data-rent]').forEach(b => b.addEventListener('click', () => toast('Request sent — owner confirms availability & deposit')));
  };
  $('#gear-city').addEventListener('change', paint);
  paint();
}

// ============================================================================
//  VIEW: JOIN  (creator onboarding — Stage 0, near-zero friction)
// ============================================================================
function renderJoin() {
  const view = $('#view');
  view.appendChild(el(`
    <div class="hero">
      <div class="hero-inner">
        <div class="eyebrow">For creators · always free</div>
        <h1>Get on the map. <em>Get found.</em></h1>
        <p>Four fields and you're discoverable to every brand searching your city. Models, photographers, gaffers, sound, hair & makeup, editors, producers — all of it. No fee, no cut of your bookings, ever.</p>
        <div class="hero-stats">
          <div><div class="num">${state.creators.length}+</div><div class="lbl">creators on the map</div></div>
          <div><div class="num">${ALL_ROLES.length}</div><div class="lbl">creative roles</div></div>
          <div><div class="num">${CITIES.length}</div><div class="lbl">cities live</div></div>
        </div>
      </div>
    </div>

    <div class="strip">
      <div class="wrap"><div class="steps">
        <div class="step"><div class="n">01</div><h4>Drop your pin</h4><p>Name, role, city, one piece of work. That's the whole signup.</p></div>
        <div class="step"><div class="n">02</div><h4>Get discovered</h4><p>Brands find you by role and distance — no cold DMs needed.</p></div>
        <div class="step"><div class="n">03</div><h4>Get booked</h4><p>Briefs land in your city; you express interest and book direct.</p></div>
        <div class="step"><div class="n">04</div><h4>Rent your gear</h4><p>Own kit? List it later and earn on idle days.</p></div>
      </div></div>
    </div>

    <div class="wrap section-pad">
      <div class="card form-card">
        <div class="eyebrow">Create your profile</div>
        <h3 style="font-size:24px;margin-bottom:6px">Join the Creative Centre</h3>
        <p style="color:var(--muted);font-size:14px;margin-bottom:24px">Only the first four are required. Everything else you can add later.</p>
        <form id="join-form">
          <div class="form-row two">
            <div><label class="label">Name *</label><input class="field" name="name" required placeholder="Your name" /></div>
            <div><label class="label">City *</label><select class="field" name="city">${CITIES.map(c => `<option>${c}</option>`).join('')}</select></div>
          </div>
          <div class="form-row">
            <label class="label">Your role(s) * — pick all that apply</label>
            <div class="checkrow" id="role-picker">
              ${ALL_ROLES.map(r => `<label class="check"><input type="checkbox" value="${esc(r)}" />${esc(r)}</label>`).join('')}
            </div>
          </div>
          <div class="form-row two">
            <div><label class="label">Area *</label><input class="field" name="area" required placeholder="Neighbourhood (approx — never your address)" /></div>
            <div><label class="label">Day rate</label><input class="field" name="rate" placeholder="optional" /></div>
          </div>
          <div class="form-row two">
            <div><label class="label">Years experience</label><input class="field" type="number" name="exp" min="0" placeholder="optional" /></div>
            <div><label class="label">Gear you own</label><input class="field" name="gear" placeholder="comma separated · optional" /></div>
          </div>
          <div class="form-row"><label class="label">Short bio</label><textarea class="field" name="bio" placeholder="What you do and how you work — optional"></textarea></div>
          <button class="btn btn-primary btn-block" type="submit">Put me on the map →</button>
          <div class="hint" style="text-align:center;margin-top:10px">Free forever. We never take a cut of your bookings.</div>
        </form>
      </div>
    </div>
  `));

  $('#join-form').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const roles = $$('#role-picker input:checked').map(i => i.value);
    if (!roles.length) { toast('Pick at least one role'); return; }
    const creator = {
      id: 'u' + Date.now(), name: f.get('name'), roles, city: f.get('city'),
      area: f.get('area'), x: 20 + Math.random() * 60, y: 20 + Math.random() * 56,
      rate: f.get('rate') || 'On request', exp: +f.get('exp') || 0, verified: false,
      gear: (f.get('gear') || '').split(',').map(s => s.trim()).filter(Boolean),
      bio: f.get('bio') || 'New to the Creative Centre.', tags: roles.slice(0, 3),
    };
    const mine = LS.get('creators', []); mine.push(creator); LS.set('creators', mine);
    state.creators.push(creator);
    state.city = creator.city;
    toast(`You're on the ${creator.city} map, ${creator.name.split(' ')[0]}!`);
    location.hash = '#discover';
  });
}

// ============================================================================
//  BOOT
// ============================================================================
$('#scrim').addEventListener('click', closeProfile);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeProfile(); });
$('#burger')?.addEventListener('click', () => $('.nav-links').classList.toggle('open'));
$$('[data-nav]').forEach(a => a.addEventListener('click', () => $('.nav-links')?.classList.remove('open')));
router();
