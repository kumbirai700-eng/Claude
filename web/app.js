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
const routes = { home: renderHome, discover: renderDiscover, jobs: renderJobs, gear: renderGear, join: renderJoin };

function router() {
  const raw = location.hash.replace('#', '') || 'home';
  const [route, qs] = raw.split('?');
  const params = new URLSearchParams(qs || '');

  // pre-filter the discover view when arriving from home (search bar / category cards)
  if (route === 'discover') {
    if (params.get('city')) state.city = params.get('city');
    if (params.has('q')) state.query = params.get('q');
    if (params.has('cat')) {
      const cat = CATEGORIES.find(c => c.id === params.get('cat'));
      state.roles = new Set(cat ? cat.roles : []);
    } else if (params.has('role')) {
      state.roles = new Set([params.get('role')]);
    } else if (params.has('reset')) {
      state.roles = new Set(); state.query = '';
    }
  }

  const fn = routes[route] || renderHome;
  $$('.nav-links a').forEach(a => a.classList.toggle('active', a.dataset.route === route));
  $('#view').innerHTML = '';
  fn();
  window.scrollTo(0, 0);
  $('.nav-links')?.classList.remove('open');
}
window.addEventListener('hashchange', router);

// ----- inline SVG icon set (no emoji-as-icon, per skill checklist) -----
const ICONS = {
  search:  '<path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="m21 21-4.3-4.3"/>',
  pin:     '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  arrow:   '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  check:   '<path d="M20 6 9 17l-5-5"/>',
  spark:   '<path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"/>',
  camera:  '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z"/><circle cx="12" cy="13" r="4"/>',
  user:    '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  bulb:    '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1h6c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2Z"/>',
  wave:    '<path d="M2 12h2l2-7 4 16 4-13 2 6h6"/>',
  brush:   '<path d="M9.06 11.9 16.5 4.5a2.1 2.1 0 0 1 3 3l-7.4 7.4M9 12a3 3 0 0 0-3 3c0 1.3-1 2-2 2 1 1.5 3 2 4.5 2A3.5 3.5 0 0 0 12 17a3 3 0 0 0-3-5Z"/>',
  clap:    '<path d="m4 11 16-3M4 11l-1 8a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-8M4 11 3 7l16-3 1 4M9 6.5l1 3M14 5.5l1 3"/>',
  layers:  '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
  film:    '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 3v18M17 3v18M3 8h4M3 16h4M17 8h4M17 16h4"/>',
  shield:  '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
  wallet:  '<path d="M19 7H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/><path d="M16 13h.01M3 9V7a2 2 0 0 1 2-2h11"/>',
  eye:     '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
};
const ic = (name, cls = 'icn') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;

// category -> icon
const CAT_ICON = { talent:'user', camera:'camera', lighting:'bulb', sound:'wave', glam:'brush', direction:'clap', post:'film', design:'layers' };

// ============================================================================
//  VIEW: HOME  (the landing page — the map is just ONE section of it)
// ============================================================================
function renderHome() {
  const total = state.creators.length;
  const featured = state.creators.filter(c => c.verified).slice(0, 4);
  const catCount = id => state.creators.filter(c => c.roles.some(r => ROLE_CATEGORY[r] === id)).length;

  $('#view').appendChild(el(`
    <div class="home">

      <!-- ============ HERO ============ -->
      <section class="home-hero">
        <div class="home-hero-grid"></div>
        <div class="home-hero-inner">
          <span class="badge"><span class="dot"></span> Live in ${CITIES.length} cities · free for creators</span>
          <h1>The whole crew, <em>on one map.</em></h1>
          <p class="lede">Models, photographers, gaffers, sound, hair &amp; makeup, editors, producers — every role on a shoot, discoverable near you. Brands post a brief; creators get found without cold-pitching.</p>

          <form class="searchbar" id="hero-search" role="search" aria-label="Find creative crew">
            <div class="seg">
              ${ic('search')}
              <select id="hs-role" aria-label="Role">
                <option value="">Any role</option>
                ${CATEGORIES.map(c => `<optgroup label="${c.label}">${c.roles.map(r => `<option>${esc(r)}</option>`).join('')}</optgroup>`).join('')}
              </select>
            </div>
            <div class="seg">
              ${ic('pin')}
              <select id="hs-city" aria-label="City">${CITIES.map(c => `<option ${c === state.city ? 'selected' : ''}>${c}</option>`).join('')}</select>
            </div>
            <button class="btn btn-primary" type="submit">Search ${ic('arrow')}</button>
          </form>

          <div class="pop-row">
            <span class="lbl">Popular:</span>
            <a class="pop-tag" href="#discover?role=Model">Models</a>
            <a class="pop-tag" href="#discover?role=Photographer">Photographers</a>
            <a class="pop-tag" href="#discover?role=Gaffer">Gaffers</a>
            <a class="pop-tag" href="#discover?role=Sound%20Mixer">Sound</a>
            <a class="pop-tag" href="#discover?role=Makeup%20Artist">MUAs</a>
            <a class="pop-tag" href="#discover?role=Editor">Editors</a>
          </div>

          <div class="hero-stats">
            <div><div class="num"><em>${total}+</em></div><div class="lbl">creators on the map</div></div>
            <div><div class="num">${ALL_ROLES.length}</div><div class="lbl">creative roles</div></div>
            <div><div class="num">${CATEGORIES.length}</div><div class="lbl">crew categories</div></div>
            <div><div class="num">£0</div><div class="lbl">cut of your bookings</div></div>
          </div>
        </div>
      </section>

      <!-- ============ MARQUEE ============ -->
      <div class="marquee"><div class="marquee-track">
        ${[1,2].map(() => `<span>${ALL_ROLES.slice(0,18).join('</span><span>')}</span>`).join('')}
      </div></div>

      <!-- ============ CATEGORIES ============ -->
      <section class="sec"><div class="wrap">
        <div class="sec-head">
          <div class="eyebrow">Every role on the call sheet</div>
          <h2>Find any kind of creative</h2>
          <p>Not just talent and cameras — the full crew, grouped the way a production actually works.</p>
        </div>
        <div class="cat-grid">
          ${CATEGORIES.map(c => `
            <a class="cat-card" href="#discover?cat=${c.id}">
              <div class="cat-ico">${ic(CAT_ICON[c.id] || 'spark')}</div>
              <h3>${c.label}</h3>
              <div class="roles">${c.roles.slice(0,4).join(' · ')}${c.roles.length>4?' …':''}</div>
              <div class="cnt">${catCount(c.id)} available →</div>
            </a>`).join('')}
        </div>
      </div></section>

      <!-- ============ MAP FEATURE (one feature) ============ -->
      <section class="sec"><div class="wrap">
        <div class="feature">
          <div class="feature-copy">
            <div class="kicker">The discovery map</div>
            <h2>See who's actually near you</h2>
            <p>The map is how discovery works — but it's one part of the platform, not the whole thing. Filter by role and distance, preview portfolios from the pin, and shortlist before you ever send a message.</p>
            <ul class="feature-list">
              <li>${ic('check')} Filter the full crew by category, distance &amp; availability</li>
              <li>${ic('check')} Approximate location only — exact addresses are never shown</li>
              <li>${ic('check')} Never a dead empty map — coverage widens automatically</li>
            </ul>
            <a class="btn btn-primary" href="#discover?reset=1">Open the map ${ic('arrow')}</a>
          </div>
          <div class="feature-visual">
            <div class="fv-map"></div>
            ${featured.map((c,i) => `<div class="fv-pin" style="${avatarStyle(c.name)};left:${[22,62,40,75][i]}%;top:${[30,40,66,22][i]}%">${initials(c.name)}</div>`).join('')}
          </div>
        </div>
      </div></section>

      <!-- ============ HOW IT WORKS (two audiences) ============ -->
      <section class="sec"><div class="wrap">
        <div class="sec-head center">
          <div class="eyebrow">How it works</div>
          <h2>Two sides, one map</h2>
          <p>Creators join free and get found. Brands post a brief and book. Density makes both sides worth more.</p>
        </div>
        <div class="dual">
          <div class="dual-card">
            <div class="tag">For creators · always free</div>
            <h3>Get on the map &amp; get found</h3>
            <ul class="flow">
              <li><span class="step-n">1</span><div><h4>Drop your pin</h4><p>Name, role, city, one piece of work. Four fields and you're discoverable.</p></div></li>
              <li><span class="step-n">2</span><div><h4>Get discovered</h4><p>Brands find you by role and distance — no cold DMs, no agency gatekeeping.</p></div></li>
              <li><span class="step-n">3</span><div><h4>Get booked direct</h4><p>Briefs land in your city; express interest and book. We never take a cut.</p></div></li>
            </ul>
            <a class="btn btn-ghost" href="#join">Create your profile ${ic('arrow')}</a>
          </div>
          <div class="dual-card">
            <div class="tag">For brands · pay per post</div>
            <h3>Post a brief, book the crew</h3>
            <ul class="flow">
              <li><span class="step-n">1</span><div><h4>Browse free</h4><p>Explore the live map before you ever create an account. Feel the density first.</p></div></li>
              <li><span class="step-n">2</span><div><h4>Post a brief</h4><p>One job post notifies every matching creator in the city. No subscription to start.</p></div></li>
              <li><span class="step-n">3</span><div><h4>Review &amp; book</h4><p>Shortlist responders, confirm the shoot, and keep the relationship.</p></div></li>
            </ul>
            <a class="btn btn-ghost" href="#jobs">Post a brief ${ic('arrow')}</a>
          </div>
        </div>
      </div></section>

      <!-- ============ FEATURED CREATORS ============ -->
      <section class="sec"><div class="wrap">
        <div class="sec-head"><div class="eyebrow">On the map now</div><h2>Featured creators</h2></div>
        <div class="feat-grid">
          ${featured.map(c => `
            <div class="feat-card" data-id="${c.id}">
              <div class="feat-cover" style="${avatarStyle(c.name)}"><div class="feat-av" style="${avatarStyle(c.roles.join(''))}">${initials(c.name)}</div></div>
              <div class="feat-body">
                <div class="nm">${esc(c.name)} <span class="verified" title="Verified">${ic('check','icn')}</span></div>
                <div class="rl">${esc(c.roles.join(' · '))}</div>
                <div class="mt"><span>${esc(c.area)}, ${esc(c.city)}</span><span class="rate">${esc(c.rate)}</span></div>
              </div>
            </div>`).join('')}
        </div>
      </div></section>

      <!-- ============ PRICING (staged model) ============ -->
      <section class="sec"><div class="wrap">
        <div class="sec-head center">
          <div class="eyebrow">Pricing</div>
          <h2>Free where it has to be. Paid where it makes sense.</h2>
          <p>Creators are free forever — density is the product. Brands pay only when they hire. Gear earns as that market matures.</p>
        </div>
        <div class="price-grid">
          <div class="price-card">
            <div class="who">Creators</div>
            <div class="amt">Free <small>forever</small></div>
            <div class="stage">Stage 0 · live</div>
            <ul>
              <li>${ic('check')} Unlimited profile &amp; portfolio</li>
              <li>${ic('check')} Discoverable on the map</li>
              <li>${ic('check')} Apply to briefs in your city</li>
              <li>${ic('check')} 0% cut of your bookings</li>
            </ul>
            <a class="btn btn-ghost btn-block" href="#join">Join free</a>
          </div>
          <div class="price-card hl">
            <div class="who">Brands</div>
            <div class="amt">£39 <small>/ job post</small></div>
            <div class="stage">Stage 1 · live</div>
            <ul>
              <li>${ic('check')} Browse the full map free</li>
              <li>${ic('check')} Post a brief, notify matching crew</li>
              <li>${ic('check')} Shortlist &amp; contact unlock</li>
              <li>${ic('check')} Post 3+ → switch to a saver plan</li>
            </ul>
            <a class="btn btn-primary btn-block" href="#jobs">Post a brief</a>
          </div>
          <div class="price-card">
            <div class="who">Gear rental</div>
            <div class="amt">Commission <small>only</small></div>
            <div class="stage">Stage 3 · rolling out</div>
            <ul>
              <li>${ic('check')} List gear you already own</li>
              <li>${ic('check')} No listing fee</li>
              <li>${ic('check')} Deposit &amp; calendar handled</li>
              <li>${ic('check')} Opens city-by-city</li>
            </ul>
            <a class="btn btn-ghost btn-block" href="#gear">Browse gear</a>
          </div>
        </div>
      </div></section>

      <!-- ============ TRUST / SAFETY ============ -->
      <section class="sec"><div class="wrap">
        <div class="sec-head center"><div class="eyebrow">Trust &amp; safety</div><h2>Built so the map feels safe</h2></div>
        <div class="trust-grid">
          <div class="trust-card">${ic('pin')}<h4>Approximate location</h4><p>Pins show a neighbourhood, never a home address. Exact coordinates are never exposed.</p></div>
          <div class="trust-card">${ic('shield')}<h4>Verified creators</h4><p>A verification badge signals creators we've checked, so brands know who they're booking.</p></div>
          <div class="trust-card">${ic('wallet')}<h4>No cut of bookings</h4><p>Creators keep 100%. We make money from brands and gear — never from your day rate.</p></div>
        </div>
      </div></section>

      <!-- ============ FAQ ============ -->
      <section class="sec"><div class="wrap">
        <div class="sec-head center"><div class="eyebrow">FAQ</div><h2>Questions, answered</h2></div>
        <div class="faq">
          <details open><summary>Is it really free for creators?</summary><div class="ans">Yes — free forever, and we never take a percentage of your bookings. Density is the product, so getting every kind of creative onto the map without friction matters more than charging you.</div></details>
          <details><summary>Who can I find on here?</summary><div class="ans">The whole call sheet: models, actors and dancers; photographers, videographers and DPs; gaffers, grips and sound; hair, makeup and wardrobe; producers, directors and casting; editors, colorists and retouchers; set and prop designers — ${ALL_ROLES.length} roles in total.</div></details>
          <details><summary>How do brands pay?</summary><div class="ans">Pay-per-job-post — a small fee per brief, no subscription to start. Browsing the map is always free. Brands who post repeatedly get offered a monthly plan that saves money.</div></details>
          <details><summary>What about gear rental?</summary><div class="ans">It's rolling out city-by-city as crew density grows. Creators list gear they already own, renters request dates, and we take a commission on completed rentals — no listing fee.</div></details>
          <details><summary>Which cities are live?</summary><div class="ans">${CITIES.join(', ')} today, with more opening as coverage builds. Joining in a new city helps it reach the density that makes the map worth using.</div></details>
        </div>
      </div></section>

      <!-- ============ FINAL CTA ============ -->
      <section class="cta-band">
        <h2>Your next shoot starts on the map.</h2>
        <p>Join free as a creator, or post your first brief in minutes.</p>
        <div class="cta-actions">
          <a class="btn btn-primary" href="#join">Join free as a creator</a>
          <a class="btn btn-ghost" href="#jobs">I'm a brand — post a brief</a>
        </div>
      </section>

      <!-- ============ BIG FOOTER ============ -->
      <footer class="foot-big">
        <div class="foot-cols">
          <div class="about">
            <a class="brand" href="#home" data-nav><span class="brand-mark" aria-hidden="true">◐</span><span class="brand-name">THE&nbsp;CREATIVE&nbsp;CENTRE</span></a>
            <p>A map-based marketplace for finding creative crew near you. Free for creators, density-first by design.</p>
          </div>
          <div class="foot-col"><h5>Product</h5><a href="#discover?reset=1">Discover map</a><a href="#jobs">For brands</a><a href="#gear">Gear rental</a><a href="#join">For creators</a></div>
          <div class="foot-col"><h5>Roles</h5><a href="#discover?role=Model">Models</a><a href="#discover?role=Photographer">Photographers</a><a href="#discover?role=Gaffer">Gaffers</a><a href="#discover?role=Sound%20Mixer">Sound</a></div>
          <div class="foot-col"><h5>Cities</h5>${CITIES.map(c => `<a href="#discover?city=${encodeURIComponent(c)}">${c}</a>`).join('')}</div>
        </div>
        <div class="foot-bar"><span>© 2026 The Creative Centre</span><span>Free for creators, always.</span></div>
      </footer>
    </div>
  `));

  // wire hero search → discover, prefiltered
  $('#hero-search').addEventListener('submit', e => {
    e.preventDefault();
    const role = $('#hs-role').value, city = $('#hs-city').value;
    const p = new URLSearchParams(); p.set('city', city);
    if (role) p.set('role', role);
    location.hash = '#discover?' + p.toString();
  });
  // featured cards → open profile (after navigating to discover so the drawer has context)
  $$('.feat-card').forEach(card => card.addEventListener('click', () => {
    const c = state.creators.find(x => x.id === card.dataset.id);
    if (c) { state.city = c.city; location.hash = '#discover'; setTimeout(() => openProfile(card.dataset.id), 60); }
  }));
  $$('.home [data-nav]').forEach(a => a.addEventListener('click', () => $('.nav-links')?.classList.remove('open')));
}

// ============================================================================
//  VIEW: DISCOVER  (the map — one feature, reached from Discover / home)
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
