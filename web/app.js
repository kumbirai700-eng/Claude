// ============================================================================
//  THE CREATIVE COLLECTIVE — app (Australia)  ·  Aurora Australis
// ============================================================================

const LS = {
  get(k, fb) { try { return JSON.parse(localStorage.getItem('tcc_' + k)) ?? fb; } catch { return fb; } },
  set(k, v) { localStorage.setItem('tcc_' + k, JSON.stringify(v)); },
};
const state = {
  city: 'Sydney', query: '', roles: new Set(), selected: null,
  creators: [...SEED_CREATORS, ...LS.get('creators', [])],
  jobs: [...LS.get('jobs', []), ...SEED_JOBS],
  gear: [...LS.get('gear', []), ...SEED_GEAR],
  shortlist: new Set(LS.get('shortlist', [])),
  spaces: [...LS.get('spaces', []), ...SEED_SPACES],
  map: null, markers: [], mode: 'people', heroMap: null, spaceMap: null,
  user: LS.get('user', null),
  following: new Set(LS.get('following', [])),
  cur: LS.get('cur', 'AUD'),
  saves: LS.get('saves', { 'Saved': [] }),       // { collectionName: ["creator:c01", ...] }
  compare: new Set(LS.get('compare', [])),        // creator ids
};
const RATES = { AUD:1, USD:0.66, NZD:1.08, GBP:0.52, EUR:0.61 };
const CUR_SYM = { AUD:'$', USD:'US$', NZD:'NZ$', GBP:'£', EUR:'€' };
// convert any "$1,400/day" style string into the active currency, keeping the suffix
function money(str){
  if(str==null) return str;
  return String(str).replace(/\$\s?([\d,]+(?:\.\d+)?)/g, (m,n)=>{
    const v = Math.round(parseFloat(n.replace(/,/g,'')) * RATES[state.cur]);
    return CUR_SYM[state.cur] + v.toLocaleString();
  });
}
// apply saved profile edits over seed / local creators
(function(){ const ov=LS.get('overrides',{}); state.creators.forEach(c=>{ if(ov[c.id]) Object.assign(c, ov[c.id]); }); })();
let ROUTE_PARAMS = new URLSearchParams();

// ---------- helpers ----------
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstElementChild; };
const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
function hashHue(s){ let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))%360; return h; }
function avatarBg(name){ const h=hashHue(name); return `background:linear-gradient(135deg,hsl(${h} 70% 58%),hsl(${(h+50)%360} 75% 48%))`; }
function initials(n){ return n.split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase(); }

// royalty-free imagery (Picsum) with deterministic seeds + graceful fallback
function shotURL(id, n, w = 600, h = 700){ return `https://picsum.photos/seed/tcc-${id}-${n}/${w}/${h}`; }
function coverURL(c){ return `https://picsum.photos/seed/tcc-${c.id}-cv/1200/520`; }
function gearURL(g){ return `https://picsum.photos/seed/${g.img}/640/420`; }
function spaceURL(s, n = 1, w = 800, h = 560){ return `https://picsum.photos/seed/${s.img}-${n}/${w}/${h}`; }
// a graphic ring (donut) — pct 0..100 of the green arc
function ringSVG(pct){ const r=20, c=2*Math.PI*r, on=c*pct/100; return `<svg class="sb-ring" viewBox="0 0 48 48"><circle cx="24" cy="24" r="${r}" class="ring-track"/><circle cx="24" cy="24" r="${r}" class="ring-on" stroke-dasharray="${on.toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 24 24)"/></svg>`; }
const SHOT_H = [620,470,760,540,690,450,720,520,600];           // masonry variety
const portfolioCount = c => Math.min(9, 5 + (c.jobs % 5));
const IMGERR = "this.style.display='none';this.parentElement.style.background='var(--aurora)';this.parentElement.style.opacity='.5'";

function toast(msg){ const t=$('#toast'); t.textContent=msg; t.hidden=false; clearTimeout(t._t); t._t=setTimeout(()=>t.hidden=true,2600); }

// ---------- filtering ----------
function filtered(){
  const q = state.query.trim().toLowerCase();
  return state.creators.filter(c => {
    if (c.city !== state.city) return false;
    if (state.roles.size && !c.roles.some(r => state.roles.has(r))) return false;
    if (q){ const hay=(c.name+' '+c.roles.join(' ')+' '+(c.tags||[]).join(' ')+' '+(c.area||'')).toLowerCase(); if(!hay.includes(q)) return false; }
    return true;
  });
}

// ============================================================================
//  ROUTER
// ============================================================================
const routes = { home:renderHome, discover:renderDiscover, jobs:renderJobs, gear:renderGear, join:renderJoin, creator:renderCreator, spaces:renderSpaces, space:renderSpace, blog:renderBlog, post:renderPost, account:renderAccount, about:renderAbout, legal:renderLegal, admin:renderAdmin };
function router(){
  const raw = location.hash.replace('#','') || 'home';
  const [route, qs] = raw.split('?');
  ROUTE_PARAMS = new URLSearchParams(qs || '');

  if (route === 'discover'){
    if (ROUTE_PARAMS.get('mode') === 'spaces') state.mode = 'spaces';
    else if (ROUTE_PARAMS.has('cat') || ROUTE_PARAMS.has('role')) state.mode = 'people';
    if (ROUTE_PARAMS.get('city')) state.city = ROUTE_PARAMS.get('city');
    if (ROUTE_PARAMS.has('q')) state.query = ROUTE_PARAMS.get('q');
    if (ROUTE_PARAMS.has('cat')){ const cat=CATEGORIES.find(c=>c.id===ROUTE_PARAMS.get('cat')); state.roles=new Set(cat?cat.roles:[]); }
    else if (ROUTE_PARAMS.has('role')) state.roles=new Set([ROUTE_PARAMS.get('role')]);
    else if (ROUTE_PARAMS.has('reset')){ state.roles=new Set(); state.query=''; }
  }
  // tear down live maps when leaving their views
  if (route !== 'discover' && state.map){ try{ state.map.remove(); }catch{} state.map=null; state.markers=[]; }
  if (route !== 'home' && state.heroMap){ try{ state.heroMap.remove(); }catch{} state.heroMap=null; }
  if (route !== 'space' && state.spaceMap){ try{ state.spaceMap.remove(); }catch{} state.spaceMap=null; }

  const fn = routes[route] || renderHome;
  $$('.nav-links a').forEach(a => a.classList.toggle('active', a.dataset.route === route));
  $('#view').innerHTML = '';
  fn();
  if (route !== 'discover') window.scrollTo(0,0);
  $('.nav-links')?.classList.remove('open');
  initReveal();
  applySEO(route, ROUTE_PARAMS);
  renderCompareTray();
}

// ---------- SEO: per-route title / meta / OG / Twitter / JSON-LD ----------
function setMeta(name, content, attr='name'){
  let m = document.head.querySelector(`meta[${attr}="${name}"]`);
  if(!m){ m=document.createElement('meta'); m.setAttribute(attr,name); document.head.appendChild(m); }
  m.setAttribute('content', content);
}
function setLD(obj){
  let s = document.getElementById('ld-json');
  if(!s){ s=document.createElement('script'); s.id='ld-json'; s.type='application/ld+json'; document.head.appendChild(s); }
  s.textContent = JSON.stringify(obj);
}
function applySEO(route, params){
  const base = 'The Creative Collective';
  let title = `${base} — Australia's creative marketplace`;
  let desc = "Discover and book Australia's creative crew — photographers, models, gaffers, stylists, editors, music and studios. Build your team in one place.";
  let ld = { '@context':'https://schema.org', '@type':'WebSite', name:base, url:location.origin };
  if(route==='creator'){ const c=state.creators.find(x=>x.id===params.get('id')); if(c){
    title=`${c.name} — ${c.roles[0]} in ${c.city} | ${base}`;
    desc=`${c.name}, ${c.roles.join(', ')} based in ${c.area}, ${c.city}. ${c.bio.slice(0,120)}`;
    ld={ '@context':'https://schema.org','@type':'Person', name:c.name, jobTitle:c.roles.join(', '), address:{'@type':'PostalAddress',addressLocality:c.city,addressCountry:'AU'},
      aggregateRating:{'@type':'AggregateRating', ratingValue:c.rating, reviewCount:c.reviewCount} }; } }
  else if(route==='space'){ const s=state.spaces.find(x=>x.id===params.get('id')); if(s){ title=`${s.name} — ${s.type} in ${s.city} | ${base}`; desc=`Hire ${s.name}, a ${s.type.toLowerCase()} in ${s.area}, ${s.city}. ${s.rate}/hr.`; } }
  else if(route==='spaces'){ title=`Studios & locations for hire | ${base}`; desc='Hire studios, warehouses, galleries and sound stages across Australia.'; }
  else if(route==='jobs'){ title=`Post a creative brief | ${base}`; desc='Post a job and book Australian creative crew — pay per post, no subscription.'; }
  else if(route==='blog'){ title=`The Scene — Australian creative culture | ${base}`; desc="Dispatches from Australia's underground creative scene."; }
  else if(route==='about'){ title=`About | ${base}`; desc='Why we built the home of Australian creative talent.'; }
  else if(route==='legal'){ title=`${(params.get('doc')||'Legal').replace(/-/g,' ')} | ${base}`; desc='Legal policies for The Creative Collective.'; }
  document.title = title;
  setMeta('description', desc);
  setMeta('og:title', title, 'property'); setMeta('og:description', desc, 'property'); setMeta('og:type','website','property');
  setMeta('twitter:card','summary_large_image'); setMeta('twitter:title', title); setMeta('twitter:description', desc);
  setLD(ld);
}
window.addEventListener('hashchange', router);

// ---------- inline SVG icons ----------
const ICONS = {
  search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  pin:'<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  arrow:'<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>', check:'<path d="M20 6 9 17l-5-5"/>',
  star:'<path d="m12 2 3 6.5 7 .9-5 4.8 1.2 7L12 18l-6.4 3.2L6.8 14l-5-4.8 7-.9L12 2Z"/>',
  camera:'<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z"/><circle cx="12" cy="13" r="4"/>',
  user:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  bulb:'<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1h6c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2Z"/>',
  wave:'<path d="M2 12h2l2-7 4 16 4-13 2 6h6"/>',
  brush:'<path d="M9.06 11.9 16.5 4.5a2.1 2.1 0 0 1 3 3l-7.4 7.4M9 12a3 3 0 0 0-3 3c0 1.3-1 2-2 2 1 1.5 3 2 4.5 2A3.5 3.5 0 0 0 12 17a3 3 0 0 0-3-5Z"/>',
  clap:'<path d="m4 11 16-3M4 11l-1 8a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-8M4 11 3 7l16-3 1 4M9 6.5l1 3M14 5.5l1 3"/>',
  layers:'<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
  film:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 3v18M17 3v18M3 8h4M3 16h4M17 8h4M17 16h4"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
  wallet:'<path d="M19 7H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/><path d="M16 13h.01M3 9V7a2 2 0 0 1 2-2h11"/>',
  layout:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  building:'<path d="M3 21h18M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M15 21V9h3a1 1 0 0 1 1 1v11M8 7h2M8 11h2M8 15h2"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="3"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  ruler:'<path d="m16 3 5 5L8 21l-5-5L16 3Z"/><path d="m9 10 1 1M12 7l1 1M6 13l1 1"/>',
  bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
  heart:'<path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21.5l8.8-8.8a5 5 0 0 0 0-7.1Z"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  scale:'<path d="M12 3v18M5 21h14M7 7l-4 7a4 4 0 0 0 8 0L7 7Zm10 0-4 7a4 4 0 0 0 8 0l-4-7ZM7 7l5-2 5 2"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
  chev:'<path d="m9 6 6 6-6 6"/>',
  x:'<path d="M6 6l12 12M18 6 6 18"/>',
};
const ic = (n, cls='icn') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]||''}</svg>`;
const CAT_ICON = { talent:'user', camera:'camera', lighting:'bulb', sound:'wave', glam:'brush', direction:'clap', post:'film', design:'layers', music:'wave' };

// unique scalloped "seal" verified badge (replaces the generic tick)
const VBADGE = `<svg class="vbadge" viewBox="0 0 24 24" aria-label="Verified"><path class="seal" d="M12 1l2.4 1.6 2.8-.5 1.3 2.5 2.5 1.3-.5 2.8L23 12l-1.6 2.4.5 2.8-2.5 1.3-1.3 2.5-2.8-.5L12 23l-2.4-1.6-2.8.5-1.3-2.5-2.5-1.3.5-2.8L1 12l1.6-2.4-.5-2.8 2.5-1.3 1.3-2.5 2.8.5z"/><path class="seal-tick" d="M8.4 12.3l2.4 2.3 4.8-5"/></svg>`;

// simplified equirectangular continents for the spinning globe (transparent)
const WORLD_SVG = `<svg class="g-world" viewBox="0 0 360 180" preserveAspectRatio="none"><g class="g-land">
<path d="M38,44 C44,34 70,30 82,42 C92,52 86,62 90,72 C78,82 70,96 60,92 C50,88 46,72 40,66 C32,58 32,52 38,44Z"/>
<path d="M78,98 C90,92 98,106 94,124 C90,142 82,156 76,148 C70,134 70,112 78,98Z"/>
<path d="M176,44 C186,40 196,48 190,58 C198,70 206,84 202,104 C198,124 190,138 184,132 C176,120 174,96 178,76 C170,66 168,52 176,44Z"/>
<path d="M206,40 C236,32 280,40 298,56 C308,68 290,80 262,78 C236,76 210,66 206,52Z"/>
<path d="M150,42 C160,38 170,46 164,56 C156,62 146,54 150,42Z"/>
<path d="M292,118 C308,112 322,122 318,136 C312,148 296,150 288,140 C282,130 284,122 292,118Z"/>
<circle cx="302" cy="92" r="3.4"/><circle cx="314" cy="101" r="2.6"/><circle cx="287" cy="105" r="2.6"/><circle cx="332" cy="150" r="3.2"/><circle cx="120" cy="150" r="2.4"/></g></svg>`;

// ============================================================================
//  VIEW: HOME
// ============================================================================
function renderHome(){
  const total = state.creators.length;
  const bars = (s)=>Array.from({length:7},(_,i)=>`<i style="height:${28+((s*7+i*17)%70)}%"></i>`).join('');
  const dots = (n,on)=>Array.from({length:n},(_,i)=>`<i class="${i<on?'on':''}"></i>`).join('');
  const tops = state.creators.filter(c => c.top).slice(0, 5);
  const featured = state.creators.filter(c => c.verified).sort((a,b)=>b.jobs-a.jobs).slice(0, 4);
  const orbitList = state.creators.filter(c => c.verified).sort((a,b)=>b.jobs-a.jobs).slice(0, 7);
  const INTL = [['Maya','Berlin','Photographer'],['Andre','São Paulo','Director'],['Yuki','Tokyo','Stylist'],['Zoë','London','Producer'],['Omar','Lagos','DP'],['Lena','NYC','Editor']];
  const featSpaces = [...state.spaces].sort((a,b)=>b.rating-a.rating).slice(0, 3);
  const catCount = id => state.creators.filter(c => c.roles.some(r => ROLE_CATEGORY[r]===id)).length;

  $('#view').appendChild(el(`<div class="home">
    <!-- HERO -->
    <section class="home-hero">
      <div class="aurora-bg"><span class="a1"></span><span class="a2"></span><span class="a3"></span></div>
      <div class="home-hero-inner">
        <div class="hero-copy">
          <span class="badge"><span class="dot"></span> ${CITIES.length} cities · free for creators · no cut, ever</span>
          <h1>The crew, the kit,<br>the spot. <em>One map.</em></h1>
          <p class="lede">Every part of a shoot — crew, gear and locations — plotted across Australia. Built for the people who actually make the work.</p>
          <form class="hsearch" id="hero-search" role="search">
            <div class="hs-field hs-what">
              <span class="hs-ic">${ic('search')}</span>
              <input id="hs-q" autocomplete="off" aria-label="What are you looking for" />
              <div class="hsearch-sug" id="hs-sug" hidden></div>
            </div>
            <div class="hs-field hs-where">
              <span class="hs-ic">${ic('pin')}</span>
              <input id="hs-where" autocomplete="off" placeholder="Where?" aria-label="Where" />
              <div class="hsearch-sug" id="hs-where-sug" hidden></div>
            </div>
            <button class="hsearch-go" type="submit">GO ${ic('arrow')}</button>
          </form>
          <div class="pop-row"><span class="lbl">Try</span>
            <a class="pop-tag" href="#discover?role=Model">Models</a>
            <a class="pop-tag" href="#discover?role=Photographer">Photographers</a>
            <a class="pop-tag" href="#discover?role=Gaffer">Gaffers</a>
            <a class="pop-tag" href="#discover?mode=spaces">Studios</a>
          </div>
        </div>

        <div class="hero-globe-card">
          <div class="feature-visual globe-wrap" id="globe-wrap">
            <div class="globe" id="globe">
              <div class="g-tex" id="g-tex">${WORLD_SVG}${WORLD_SVG}</div>
              <div class="g-grat">${Array.from({length:7},(_,k)=>`<i class="gm" style="left:${(k+1)*12.5}%"></i>`).join('')}<i class="gl" style="top:32%"></i><i class="gl" style="top:50%"></i><i class="gl" style="top:68%"></i></div>
              <div class="g-shade"></div><div class="g-rim"></div>
            </div>
            ${INTL.slice(0,4).map((p,i)=>`<div class="g-prof p${i}"><div class="g-prof-av" style="${avatarBg(p[0]+p[1])}">${p[0][0]}</div><div class="g-prof-t"><b>${esc(p[0])}</b><span>${esc(p[2])} · ${esc(p[1])}</span></div></div>`).join('')}
            <div class="globe-hint">${ic('arrow','icn')} drag the globe</div>
          </div>
        </div>
      </div>
    </section>

    <!-- MARQUEE TAPE -->
    <div class="marquee"><div class="marquee-track">${[1,2].map(()=>`<span>${ALL_ROLES.slice(0,16).join('</span><span>')}</span>`).join('')}</div></div>

    <!-- LEADERBOARD (replaces floating cards) -->
    <section class="sec"><div class="wrap">
      <div class="sec-head reveal"><div class="eyebrow">★ Top this week</div><h2>Who's getting booked</h2><p>The crew putting in work right now, ranked by bookings and rating across the cities.</p></div>
      <div class="board">
        ${tops.map((c,i)=>`<div class="rank-card reveal d${(i%4)+1}" data-id="${c.id}">
          <div class="rc-img" style="background-image:url('${coverURL(c)}')"><span class="rc-num">${i+1}</span><span class="rc-city">${esc(c.city)}</span></div>
          <div class="rc-body"><div class="rc-name">${esc(c.name)}</div><div class="rc-role">${esc(c.roles[0])}</div><div class="rc-meta"><span class="star">${ic('star')} ${c.rating.toFixed(1)}</span><span>${c.jobs} jobs</span></div></div>
        </div>`).join('')}
      </div>
    </div></section>

    <!-- CATEGORIES -->
    <section class="sec"><div class="wrap">
      <div class="sec-head reveal"><div class="eyebrow">Every role on the call sheet</div><h2>Find any kind of creative</h2><p>Not just talent and cameras — the full crew, grouped the way a production actually works.</p></div>
      <div class="cat-grid">${CATEGORIES.map((c,i)=>`<a class="cat-card reveal d${(i%4)+1}" href="#discover?cat=${c.id}"><div class="cat-ico">${ic(CAT_ICON[c.id])}</div><h3>${c.label}</h3><div class="roles">${c.roles.slice(0,4).join(' · ')}${c.roles.length>4?' …':''}</div><div class="cnt">View near you →</div></a>`).join('')}</div>
    </div></section>

    <!-- DISCOVERY MAP -->
    <section class="sec"><div class="wrap"><div class="feature">
      <div class="feature-copy reveal"><div class="kicker">The discovery map</div><h2>See who's actually near you.</h2>
        <p>An accurate, live map of Australia — filter by role and distance, preview portfolios from the pin, and shortlist before you ever send a message.</p>
        <ul class="feature-list"><li>${VBADGE} Real geography, smooth zoom, talent plotted by city</li><li>${VBADGE} Approximate location only — exact addresses never shown</li><li>${VBADGE} Never a dead empty map — coverage widens automatically</li></ul>
        <a class="btn btn-primary" href="#discover?reset=1">Open the map ${ic('arrow')}</a>
      </div>
      <div class="feature-visual feature-map-card reveal d2">
        <div id="feat-map"></div>
        <div class="hmc-bar"><span class="hmc-live"><span class="dot"></span> LIVE MAP — AUSTRALIA</span><span class="hmc-cnt">${total} creators · ${state.spaces.length} spaces</span></div>
      </div>
    </div></div></section>

    <!-- HOW IT WORKS -->
    <section class="sec"><div class="wrap">
      <div class="sec-head center reveal"><div class="eyebrow">How it works</div><h2>Two sides, one map</h2><p>Creators join free and get found. Brands post a brief and book. Density makes both sides worth more.</p></div>
      <div class="dual">
        <div class="dual-card reveal"><div class="tag">For creators · always free</div><h3>Curate a profile that gets you booked</h3>
          <ul class="flow"><li><span class="step-n">1</span><div><h4>Build your portfolio</h4><p>A profile worth showing — gallery, credits, rates, gear. Made to feel like your folio, not a form.</p></div></li><li><span class="step-n">2</span><div><h4>Get discovered</h4><p>Brands find you by role and distance. No cold DMs, no agency gatekeeping.</p></div></li><li><span class="step-n">3</span><div><h4>Get booked direct</h4><p>Briefs land in your city; book directly. We never take a cut.</p></div></li></ul>
          <a class="btn btn-ghost" href="#join">Create your profile ${ic('arrow')}</a></div>
        <div class="dual-card reveal d2"><div class="tag">For brands · pay per post</div><h3>Post a brief, book the crew</h3>
          <ul class="flow"><li><span class="step-n">1</span><div><h4>Browse free</h4><p>Explore the live map before you ever sign up. Feel the density first.</p></div></li><li><span class="step-n">2</span><div><h4>Post a brief</h4><p>One job post notifies every matching creator in the city. No subscription to start.</p></div></li><li><span class="step-n">3</span><div><h4>Review &amp; book</h4><p>Shortlist responders, confirm the shoot, keep the relationship.</p></div></li></ul>
          <a class="btn btn-ghost" href="#jobs">Post a brief ${ic('arrow')}</a></div>
      </div>
    </div></section>

    <!-- FEATURED -->
    <section class="sec"><div class="wrap">
      <div class="sec-head reveal"><div class="eyebrow">On the map now</div><h2>Featured creators</h2></div>
      <div class="orbit reveal">
        <div class="orbit-center"><div class="oc-mark">◐</div><div class="oc-t">THE<br>SCENE</div></div>
        <div class="orbit-ring" id="orbit-ring">
          ${orbitList.map((c,i)=>{ const a=Math.round(i*360/orbitList.length); return `<i class="spoke" style="transform:rotate(${a}deg)"></i>`; }).join('')}
          ${orbitList.map((c,i)=>{ const a=Math.round(i*360/orbitList.length); return `<div class="orbit-node" data-id="${c.id}" style="transform:rotate(${a}deg) translate(var(--R)) rotate(${-a}deg)"><div class="on-spin"><div class="on-bob float" style="animation-delay:${i*-0.8}s"><div class="on-av" style="${avatarBg(c.name)};background-image:url('${coverURL(c)}')"></div><div class="on-meta"><b>${esc(c.name.split(' ')[0])}</b><span>${esc(c.roles[0])}</span></div></div></div></div>`; }).join('')}
        </div>
      </div>
    </div></section>

    <!-- SPACES -->
    <section class="sec"><div class="wrap">
      <div class="sec-head reveal"><div class="eyebrow">Spaces · location hire</div><h2>And somewhere to shoot it.</h2><p>Studios, warehouses, rooftops and sound stages — on the same map as the crew and gear. Book talent, kit and location in one place.</p></div>
      <div class="space-grid">${featSpaces.map(s=>spaceCard(s)).join('')}</div>
      <div style="margin-top:28px"><a class="btn btn-ghost" href="#spaces">Browse all spaces ${ic('arrow')}</a></div>
    </div></section>

    <!-- SUPPLY CTAs : get listed -->
    <section class="sec"><div class="wrap">
      <div class="sec-head reveal"><div class="eyebrow">★ Get listed</div><h2>Got something? Put it to work.</h2><p>The platform only works because of the people supplying it. List free — you only ever pay when you get booked.</p></div>
      <div class="list-cta-grid">
        <a class="list-cta c-space reveal" href="#join">
          <div class="lc-tag">Spaces</div>
          <h3>Run a studio or space?</h3>
          <p>Recording studio, warehouse, rooftop, gallery, rehearsal room sitting empty between bookings? Put it in front of every crew shooting in your city.</p>
          <span class="lc-go">List your space ${ic('arrow')}</span>
        </a>
        <a class="list-cta c-gear reveal d2" href="#gear">
          <div class="lc-tag">Gear</div>
          <h3>Own gear that's gathering dust?</h3>
          <p>Cameras, lenses, lights, grip — earn on the days it's not on a job. List it free, set your rate, we handle deposits and the calendar.</p>
          <span class="lc-go">List your gear ${ic('arrow')}</span>
        </a>
        <a class="list-cta c-crew reveal d3" href="#join">
          <div class="lc-tag">Crew</div>
          <h3>Behind the camera or in front of it?</h3>
          <p>Model, shooter, gaffer, editor — whatever you do on set, build a folio that gets you found. Free forever, no cut of your bookings.</p>
          <span class="lc-go">Get on the map ${ic('arrow')}</span>
        </a>
      </div>
      <div class="list-strip reveal">
        <span>Looking for clients for your studio?</span>
        <a class="btn btn-primary" href="#join">List up your space — it's free</a>
      </div>
    </div></section>

    <!-- PRICING -->
    <section class="sec"><div class="wrap">
      <div class="sec-head center reveal"><div class="eyebrow">Pricing</div><h2>Free where it has to be. Paid where it makes sense.</h2><p>Creators are free forever — density is the product. Brands pay only when they hire. Gear earns as that market matures.</p></div>
      <div class="price-grid">
        <div class="price-card reveal"><div class="who">Creators</div><div class="amt">Free <small>forever</small></div><div class="stage">Stage 0 · live</div><ul><li>${ic('check')} Unlimited portfolio &amp; gallery</li><li>${ic('check')} Discoverable on the map</li><li>${ic('check')} Apply to briefs in your city</li><li>${ic('check')} 0% cut of your bookings</li></ul><a class="btn btn-ghost btn-block" href="#join">Join free</a></div>
        <div class="price-card hl reveal d2"><div class="who">Brands</div><div class="amt">$3.99 <small>/ job post</small></div><div class="stage">Stage 1 · live</div><ul><li>${ic('check')} Browse the full map free</li><li>${ic('check')} Post a brief, notify matching crew</li><li>${ic('check')} Shortlist &amp; contact unlock</li><li>${ic('check')} Post 3+ → switch to a saver plan</li></ul><a class="btn btn-primary btn-block" href="#jobs">Post a brief</a></div>
        <div class="price-card reveal d3"><div class="who">Gear rental</div><div class="amt">Commission <small>only</small></div><div class="stage">Stage 3 · rolling out</div><ul><li>${ic('check')} List gear you already own</li><li>${ic('check')} No listing fee</li><li>${ic('check')} Deposit &amp; calendar handled</li><li>${ic('check')} Opens city-by-city</li></ul><a class="btn btn-ghost btn-block" href="#gear">Browse gear</a></div>
      </div>
    </div></section>

    <!-- TRUST -->
    <section class="sec"><div class="wrap">
      <div class="sec-head center reveal"><div class="eyebrow">Trust &amp; safety</div><h2>Built so the map feels safe</h2></div>
      <div class="trust-grid">
        <div class="trust-card reveal"><div class="ti">${ic('pin')}</div><h4>Approximate location</h4><p>Pins show a suburb, never a home address. Exact coordinates are never exposed.</p></div>
        <div class="trust-card reveal d2"><div class="ti">${ic('shield')}</div><h4>Verified creators</h4><p>A verification badge signals creators we've checked, so brands know who they're booking.</p></div>
        <div class="trust-card reveal d3"><div class="ti">${ic('wallet')}</div><h4>No cut of bookings</h4><p>Creators keep 100%. We earn from brands and gear — never from your day rate.</p></div>
      </div>
    </div></section>

    <!-- FAQ -->
    <section class="sec"><div class="wrap">
      <div class="sec-head center reveal"><div class="eyebrow">FAQ</div><h2>Questions, answered</h2></div>
      <div class="faq reveal">
        <details open><summary>Is it really free for creators?</summary><div class="ans">Yes — free forever, and we never take a percentage of your bookings. Density is the product, so getting every kind of creative onto the map without friction matters more than charging you.</div></details>
        <details><summary>Who can I find on here?</summary><div class="ans">The whole call sheet: models, actors and dancers; photographers, videographers and DPs; gaffers, grips and sound; hair, makeup and wardrobe; producers, directors and casting; editors, colorists and retouchers; set and prop designers — ${ALL_ROLES.length} roles in total.</div></details>
        <details><summary>How do brands pay?</summary><div class="ans">Pay-per-job-post — a small fee per brief, no subscription to start. Browsing the map is always free. Brands who post repeatedly get offered a monthly plan that saves money.</div></details>
        <details><summary>What about gear rental?</summary><div class="ans">It's rolling out city-by-city as crew density grows. Creators list gear they already own, renters request dates, and we take a commission on completed rentals — no listing fee.</div></details>
        <details><summary>Which cities are live?</summary><div class="ans">${CITIES.join(', ')} — with more opening as coverage builds. Joining in a new city helps it reach the density that makes the map worth using.</div></details>
      </div>
    </div></section>

    <!-- CTA -->
    <section class="cta-band"><div class="aurora-bg"><span class="a1"></span><span class="a2"></span><span class="a3"></span></div>
      <div class="cta-band-inner reveal"><div class="wl-pill"><span class="dot"></span> ${waitlistCount().toLocaleString()} founding members waiting</div><h2>Be part of the scene.</h2><p>We're opening city by city. Join the waitlist and be first in.</p>
        <div class="cta-actions"><button class="btn btn-primary" id="cta-wl">Join the waitlist</button><a class="btn btn-ghost" href="#about">Why we're building this</a></div></div>
    </section>

    <!-- FOOTER -->
    <footer class="foot-big">
      <div class="foot-cols">
        <div class="about"><a class="brand" href="#home" data-nav><span class="brand-mark"><svg viewBox="0 0 900 820" class="brand-au"><path d="M612,60 C660,96 740,190 800,440 C788,540 755,612 730,645 C700,665 625,672 590,650 C540,646 500,648 470,645 C360,652 230,640 155,610 C135,580 120,530 120,520 C130,440 150,360 250,230 C300,172 330,142 360,150 C420,150 455,118 470,86 C520,108 560,148 560,150 C600,118 612,60 612,60 Z"/></svg></span><span class="brand-name">THE&nbsp;CREATIVE&nbsp;COLLECTIVE</span></a><p>Australia's map-based marketplace for finding creative crew. Free for creators, density-first by design.</p></div>
        <div class="foot-col"><h5>Product</h5><a href="#discover?reset=1">Discover map</a><a href="#spaces">Spaces</a><a href="#jobs">For brands</a><a href="#gear">Gear rental</a><a href="#blog">The Scene</a></div>
        <div class="foot-col"><h5>Company</h5><a href="#about">About</a><a id="foot-wl" href="#about">Join waitlist</a><a href="#blog">The Scene</a><a href="#admin">Admin</a></div>
        <div class="foot-col"><h5>Legal</h5>${Object.entries(LEGAL_DOCS).map(([k,v])=>`<a href="#legal?doc=${k}">${esc(v[0])}</a>`).join('')}</div>
      </div>
      <div class="foot-bar"><span>© 2026 The Creative Collective · Australia</span><span>Free for creators, always.</span></div>
    </footer>
  </div>`));

  initHeroSearch();
  initHeroMap();
  $$('.home [data-id]').forEach(n => n.addEventListener('click', () => {
    const space = n.classList.contains('space-card');
    location.hash = (space ? '#space?id=' : '#creator?id=') + n.dataset.id;
  }));
  $$('.home [data-nav]').forEach(a => a.addEventListener('click', () => $('.nav-links')?.classList.remove('open')));
  $('#cta-wl')?.addEventListener('click', openWaitlist);
  $('#foot-wl')?.addEventListener('click', e => { e.preventDefault(); openWaitlist(); });
  wireSaves(); wireCompare();
  initGlobe();
}

// landing search — WHAT (role, typewriter) + WHERE (city autocomplete) + GO
function initHeroSearch(){
  const form = $('#hero-search'), inp = $('#hs-q'), sug = $('#hs-sug');
  const wIn = $('#hs-where'), wSug = $('#hs-where-sug'); if(!form) return;

  // typewriter placeholder on the WHAT field
  const ex = ['photographer','recording studio','gaffer','makeup artist','sound mixer','warehouse'];
  let ei=0, ci=0, del=false, typing=true;
  (function type(){
    if(!document.body.contains(inp)) return; if(!typing) return;
    const t=ex[ei]; ci+=del?-1:1; inp.setAttribute('placeholder','Try “'+t.slice(0,ci)+'”');
    if(!del && ci>=t.length){ del=true; setTimeout(type,1500); return; }
    if(del && ci<=0){ del=false; ei=(ei+1)%ex.length; }
    setTimeout(type, del?34:64);
  })();

  // WHAT suggestions
  inp.addEventListener('focus', ()=>{ typing=false; inp.setAttribute('placeholder','Role, studio, gear…'); whatSug(inp.value); });
  inp.addEventListener('blur',  ()=>{ setTimeout(()=>sug.hidden=true,160); if(!inp.value){ typing=true; type(); } });
  inp.addEventListener('input', ()=>whatSug(inp.value));
  function whatSug(q){
    const ql=q.trim().toLowerCase();
    const roles=(ql?ALL_ROLES.filter(r=>r.toLowerCase().includes(ql)):['Model','Photographer','Gaffer','Recording Engineer','Makeup Artist']).slice(0,5);
    sug.innerHTML = roles.map(r=>`<button data-pick="${esc(r)}">${ic('users','icn')} <b>${esc(r)}</b></button>`).join('') || `<div class="sug-none">Search “${esc(q)}”</div>`;
    sug.hidden=false;
    $$('#hs-sug button').forEach(b=>b.addEventListener('mousedown', e=>{ e.preventDefault(); inp.value=b.dataset.pick; sug.hidden=true; wIn.focus(); }));
  }
  // WHERE suggestions (city autocomplete)
  wIn.addEventListener('focus', ()=>whereSug(wIn.value));
  wIn.addEventListener('blur',  ()=>setTimeout(()=>wSug.hidden=true,160));
  wIn.addEventListener('input', ()=>whereSug(wIn.value));
  function whereSug(q){
    const ql=q.trim().toLowerCase();
    const cities=CITIES.filter(c=>!ql||c.toLowerCase().includes(ql)).slice(0,6);
    wSug.innerHTML = cities.map(c=>`<button data-city="${esc(c)}">${ic('pin','icn')} <b>${esc(c)}</b><span>${state.creators.filter(x=>x.city===c).length}</span></button>`).join('') || `<div class="sug-none">No city</div>`;
    wSug.hidden=false;
    $$('#hs-where-sug button').forEach(b=>b.addEventListener('mousedown', e=>{ e.preventDefault(); wIn.value=b.dataset.city; wSug.hidden=true; }));
  }

  form.addEventListener('submit', e=>{
    e.preventDefault();
    const q=inp.value.trim().toLowerCase();
    const role=ALL_ROLES.find(r=>r.toLowerCase()===q) || ALL_ROLES.find(r=>q && r.toLowerCase().includes(q.split(' ')[0]));
    const city=CITIES.find(c=>c.toLowerCase()===wIn.value.trim().toLowerCase()) || CITIES.find(c=>wIn.value && c.toLowerCase().includes(wIn.value.trim().toLowerCase()));
    const studio = /studio|warehouse|space|location/.test(q);
    const p=new URLSearchParams();
    if(city) p.set('city',city);
    if(studio) p.set('mode','spaces'); else if(role) p.set('role',role); else if(q) p.set('q',q);
    if(![...p].length) p.set('reset','1');
    location.hash='#discover?'+p.toString();
  });
}

// live mini-map in the discovery feature section (Australia-wide, animated pins)
function initHeroMap(){
  const host = $('#feat-map'); if(!host) return;
  if (typeof maplibregl === 'undefined'){ host.innerHTML = `<div class="hmc-fallback">${ic('pin','icn')} Live map loads online</div>`; return; }
  state.heroMap = new maplibregl.Map({
    container: 'feat-map', interactive: true, attributionControl: false,
    style: { version:8, sources:{ c:{ type:'raster', tileSize:256, tiles:['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png','https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png','https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'] } }, layers:[{ id:'c', type:'raster', source:'c' }] },
    center:[134.5,-25.7], zoom:3.1, dragRotate:false,
  });
  state.heroMap.on('load', ()=>{
    state.heroMap.resize();
    const seen=new Set();
    state.creators.forEach(c=>{
      const node = el(`<div class="hmk" style="${avatarBg(c.name)}">${initials(c.name)}</div>`);
      node.addEventListener('click', ()=>location.hash='#creator?id='+c.id);
      new maplibregl.Marker({element:node}).setLngLat([c.lng,c.lat]).addTo(state.heroMap);
    });
  });
}

// interactive drag-to-spin continents globe (texture scroll)
function initGlobe(){
  const tex = $('#g-tex'), wrap = $('#globe-wrap'); if(!tex || !wrap) return;
  let off = 0, vel = 0.35, dragging = false, lastX = 0, W = 0;
  const measure = () => { W = tex.scrollWidth / 2 || 300; };
  measure(); setTimeout(measure, 400);
  wrap.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; wrap.classList.add('dragging'); });
  addEventListener('pointermove', e => { if(!dragging) return; const dx = e.clientX - lastX; lastX = e.clientX; off -= dx; vel = -dx; });
  addEventListener('pointerup', () => { dragging = false; wrap.classList.remove('dragging'); });
  (function loop(){
    if(!document.body.contains(tex)) return;
    if(!dragging){ off += vel; vel += (0.35 - vel) * 0.04; }
    if(W){ off = ((off % W) + W) % W; }
    tex.style.transform = `translateX(${-off}px)`;
    requestAnimationFrame(loop);
  })();
}

// ============================================================================
//  VIEW: DISCOVER (real MapLibre map)
// ============================================================================
function renderDiscover(){
  if (ROUTE_PARAMS.get('mode')==='jobs') state.mode='jobs';
  $('#view').appendChild(el(`<section class="discover discover-v2">
    <div class="panel">
      <div class="panel-head">
        <div class="mode-toggle three">
          <button data-mode="people" class="${state.mode==='people'?'on':''}">${ic('users')} Crew</button>
          <button data-mode="spaces" class="${state.mode==='spaces'?'on':''}">${ic('building')} Spaces</button>
          <button data-mode="jobs"   class="${state.mode==='jobs'?'on':''}">${ic('clap')} Jobs</button>
        </div>
        <div class="city-ac">
          ${ic('pin','icn')}
          <input id="city-ac" autocomplete="off" placeholder="Search a city…" value="${esc(state.city)}" />
          <div class="city-sug" id="city-sug" hidden></div>
        </div>
        <div class="search-wrap">${ic('search','icn')}<input id="search" placeholder="search ${state.mode==='jobs'?'briefs':state.mode==='spaces'?'spaces':'crew'}…" value="${esc(state.query)}" /></div>
        <details class="filter-drop" id="filter-drop">
          <summary><span class="fd-label">Filters</span><span class="fd-count" id="fd-count"></span><i class="fd-caret"></i></summary>
          <div class="filters" id="cat-filters"></div>
        </details>
      </div>
      <div class="results-head"><span id="results-title">Results</span><span id="results-sub"></span></div>
      <div id="results"></div>
    </div>
    <div class="map-wrap" id="map-wrap">
      <div id="map"></div>
      <div class="map-overlay-top"><div class="map-city-tag">${ic('pin','icn')} <span id="map-city">${esc(state.city)}</span></div><div class="map-count" id="map-count"></div></div>
      <details class="map-hotspots" id="hotspots-wrap" open>
        <summary>Hotspots <i class="fd-caret"></i></summary>
        <div id="hotspots"></div>
      </details>
    </div>
  </section>`));

  $$('.mode-toggle button').forEach(b => b.addEventListener('click', () => {
    if (state.mode === b.dataset.mode) return;
    state.mode = b.dataset.mode; state.query = ''; state.roles = new Set();
    $$('.mode-toggle button').forEach(x => x.classList.toggle('on', x===b));
    $('#search').value=''; $('#search').placeholder = `search ${state.mode==='jobs'?'briefs':state.mode==='spaces'?'spaces':'crew'}…`;
    buildFilters(); refreshDiscover();
  }));
  setupCityAC();
  $('#search').addEventListener('input', e => { state.query=e.target.value; refreshDiscover(); });

  buildFilters();
  initMap();
  refreshDiscover();
}

// city autocomplete
function setupCityAC(){
  const inp = $('#city-ac'), sug = $('#city-sug');
  const show = (q) => {
    const ql = q.trim().toLowerCase();
    const list = CITIES.filter(c => !ql || c.toLowerCase().includes(ql)).slice(0, 8);
    sug.innerHTML = list.map(c => { const n=cityCount(c); return `<button data-city="${esc(c)}">${esc(c)}<span>${n} here</span></button>`; }).join('') || `<div class="city-none">No match</div>`;
    sug.hidden = false;
    $$('#city-sug button').forEach(b => b.addEventListener('mousedown', e => { e.preventDefault(); pickCity(b.dataset.city); }));
  };
  inp.addEventListener('focus', () => show(''));
  inp.addEventListener('input', () => show(inp.value));
  inp.addEventListener('blur', () => setTimeout(()=>{ sug.hidden=true; }, 150));
  inp.addEventListener('keydown', e => { if(e.key==='Enter'){ const m=CITIES.find(c=>c.toLowerCase().includes(inp.value.trim().toLowerCase())); if(m) pickCity(m); } });
}
function pickCity(c){ state.city=c; $('#city-ac').value=c; $('#city-sug').hidden=true; flyToCity(); buildFilters(); refreshDiscover(); }
function cityCount(c){
  if(state.mode==='spaces') return state.spaces.filter(s=>s.city===c).length;
  if(state.mode==='jobs')   return state.jobs.filter(j=>j.city===c).length;
  return state.creators.filter(x=>x.city===c).length;
}

function buildFilters(){
  const wrap = $('#cat-filters'); if(!wrap) return;
  if (state.mode === 'people'){
    wrap.innerHTML = CATEGORIES.map(cat => `<div class="fg"><div class="cat-title">${cat.label}</div><div class="chips">${cat.roles.map(r=>`<button class="chip ${state.roles.has(r)?'on':''}" data-role="${esc(r)}">${esc(r)}</button>`).join('')}</div></div>`).join('');
    $$('#cat-filters .chip').forEach(ch => ch.addEventListener('click', () => { const r=ch.dataset.role; state.roles.has(r)?state.roles.delete(r):state.roles.add(r); ch.classList.toggle('on'); refreshDiscover(); }));
  } else if (state.mode === 'spaces'){
    wrap.innerHTML = `<div class="fg"><div class="cat-title">Space type</div><div class="chips">${SPACE_TYPES.map(t=>`<button class="chip ${state.roles.has(t)?'on':''}" data-type="${esc(t)}">${esc(t)}</button>`).join('')}</div></div>`;
    $$('#cat-filters .chip').forEach(ch => ch.addEventListener('click', () => { const t=ch.dataset.type; state.roles.has(t)?state.roles.delete(t):state.roles.add(t); ch.classList.toggle('on'); refreshDiscover(); }));
  } else {
    wrap.innerHTML = `<div class="fg"><div class="cat-title">Role needed</div><div class="chips">${ALL_ROLES.slice(0,16).map(r=>`<button class="chip ${state.roles.has(r)?'on':''}" data-role="${esc(r)}">${esc(r)}</button>`).join('')}</div></div>`;
    $$('#cat-filters .chip').forEach(ch => ch.addEventListener('click', () => { const r=ch.dataset.role; state.roles.has(r)?state.roles.delete(r):state.roles.add(r); ch.classList.toggle('on'); refreshDiscover(); }));
  }
}

// "where people post up the most" — density across all cities for the active mode
function renderHotspots(){
  const box = $('#hotspots'); if(!box) return;
  const counts = CITIES.map(c => ({ c, n: cityCount(c) })).filter(x=>x.n>0).sort((a,b)=>b.n-a.n).slice(0,6);
  const max = counts[0]?.n || 1;
  box.innerHTML = counts.map(({c,n})=>`
    <button class="hotspot ${c===state.city?'on':''}" data-city="${esc(c)}"><span class="hs-name">${esc(c)}</span><span class="hs-bar"><i style="width:${Math.round(n/max*100)}%"></i></span><span class="hs-n">${n}</span></button>`).join('');
  $$('#hotspots .hotspot').forEach(b => b.addEventListener('click', () => pickCity(b.dataset.city)));
}

function filteredSpaces(){
  const q = state.query.trim().toLowerCase();
  return state.spaces.filter(s => {
    if (s.city !== state.city) return false;
    if (state.roles.size && !state.roles.has(s.type)) return false;
    if (q){ const hay=(s.name+' '+s.type+' '+s.area+' '+s.amenities.join(' ')).toLowerCase(); if(!hay.includes(q)) return false; }
    return true;
  });
}
function filteredJobs(){
  const q = state.query.trim().toLowerCase();
  return state.jobs.filter(j => {
    if (j.city !== state.city) return false;
    if (state.roles.size && !j.roles.some(r => state.roles.has(r))) return false;
    if (q){ const hay=(j.title+' '+j.brand+' '+j.roles.join(' ')+' '+j.brief).toLowerCase(); if(!hay.includes(q)) return false; }
    return true;
  });
}

function initMap(){
  const c = CITY_COORDS[state.city];
  if (typeof maplibregl === 'undefined'){
    $('#map').innerHTML = `<div class="map-empty"><div><div class="big">Map needs a connection</div><div>The live map loads from the internet. Results still work in the list →</div></div></div>`;
    return;
  }
  state.map = new maplibregl.Map({
    container: 'map',
    style: {
      version: 8,
      sources: { carto: { type:'raster', tileSize:256,
        tiles:['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png','https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png','https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'],
        attribution:'© OpenStreetMap · © CARTO' } },
      layers: [{ id:'carto', type:'raster', source:'carto' }],
    },
    center: [c.lng, c.lat], zoom: c.zoom, attributionControl: true,
  });
  state.map.addControl(new maplibregl.NavigationControl({ showCompass:false }), 'bottom-left');
  state.map.on('load', () => state.map.resize());
}
function flyToCity(){ const c=CITY_COORDS[state.city]; if(state.map) state.map.flyTo({ center:[c.lng,c.lat], zoom:c.zoom, speed:1.2, curve:1.5 }); $('#map-city').textContent=state.city; }

function refreshDiscover(){
  renderHotspots();
  const fc=$('#fd-count'); if(fc){ fc.textContent = state.roles.size ? state.roles.size : ''; fc.classList.toggle('on', state.roles.size>0); }
  if (state.mode === 'spaces'){
    const list = filteredSpaces();
    $('#map-count').innerHTML = `<b>${list.length}</b>&nbsp;spaces`;
    $('#results-title').textContent = 'Spaces';
    $('#results-sub').textContent = `${list.length} in ${state.city}`;
    drawSpaceMarkers(list); renderSpaceResults(list);
  } else if (state.mode === 'jobs'){
    const list = filteredJobs();
    $('#map-count').innerHTML = `<b>${list.length}</b>&nbsp;briefs`;
    $('#results-title').textContent = 'Open briefs';
    $('#results-sub').textContent = `${list.length} in ${state.city}`;
    drawJobMarkers(list); renderJobResults(list);
  } else {
    const list = filtered();
    $('#map-count').innerHTML = `<b>${list.length}</b>&nbsp;available`;
    $('#results-title').textContent = state.roles.size ? [...state.roles].slice(0,2).join(', ')+(state.roles.size>2?'…':'') : 'Creators';
    $('#results-sub').textContent = `${list.length} in ${state.city}`;
    drawMarkers(list); renderResults(list);
  }
}

function drawJobMarkers(list){
  clearMarkers(); if (!state.map) return;
  list.forEach((j,i) => {
    const ll = near(j.city, (i%3-1)*.012, ((i+1)%3-1)*.012);
    const node = el(`<div class="mk mk-job" data-id="${j.id}"><div class="mk-dot">${ic('clap','icn')}</div></div>`);
    node.querySelector('.icn').style.cssText='width:17px;height:17px;color:var(--ink)';
    node.addEventListener('click', () => location.hash='#jobs');
    state.markers.push(new maplibregl.Marker({ element:node, anchor:'center' }).setLngLat([ll.lng, ll.lat]).addTo(state.map));
  });
}
function renderJobResults(list){
  const box = $('#results');
  if(!list.length){ box.innerHTML = `<div class="res-empty">No briefs in ${esc(state.city)}. <a href="#jobs" style="color:var(--green)">Post one →</a></div>`; return; }
  box.innerHTML = list.map(j => `<div class="result job" data-id="${j.id}"><div class="result-body"><div class="result-name">${esc(j.title)}</div><div class="result-role">${esc(j.brand)} · ${esc(j.roles.join(', '))}</div><div class="result-meta"><span class="rate">${esc(money(j.budget))}</span><span>${esc(j.date)}</span></div></div></div>`).join('');
  $$('#results .result').forEach(r => r.addEventListener('click', () => location.hash='#jobs'));
}

function clearMarkers(){ state.markers.forEach(m => m.remove()); state.markers = []; }

function drawMarkers(list){
  clearMarkers(); if (!state.map) return;
  list.forEach(c => {
    const node = el(`<div class="mk ${state.selected===c.id?'sel':''}" data-id="${c.id}"><div class="mk-dot" style="${avatarBg(c.name)}"><span>${initials(c.name)}</span></div></div>`);
    node.addEventListener('click', () => openProfile(c.id));
    state.markers.push(new maplibregl.Marker({ element:node, anchor:'bottom' }).setLngLat([c.lng, c.lat]).addTo(state.map));
  });
}
function drawSpaceMarkers(list){
  clearMarkers(); if (!state.map) return;
  list.forEach(s => {
    const node = el(`<div class="mk mk-space ${state.selected===s.id?'sel':''}" data-id="${s.id}"><div class="mk-dot">${ic('building','icn')}</div></div>`);
    node.querySelector('.icn').style.cssText='width:18px;height:18px;color:var(--ink)';
    node.addEventListener('click', () => location.hash='#space?id='+s.id);
    state.markers.push(new maplibregl.Marker({ element:node, anchor:'center' }).setLngLat([s.lng, s.lat]).addTo(state.map));
  });
}

function renderResults(list){
  const box = $('#results');
  if (!list.length){ box.innerHTML = `<div style="padding:30px 20px;color:var(--muted);font-size:13.5px">No matches in ${esc(state.city)}. Widen your filters, or <a href="#join" style="color:var(--green)">be the first here →</a></div>`; return; }
  box.innerHTML = list.map(c => `<div class="result ${state.selected===c.id?'sel':''}" data-id="${c.id}"><div class="avatar" style="${avatarBg(c.name)}">${initials(c.name)}</div><div class="result-body"><div class="result-name">${esc(c.name)} ${c.verified?`<span class="verified-ico">${VBADGE}</span>`:''}<span class="r-avail ${c.availability}"></span></div><div class="result-role">${esc(c.roles.join(' · '))}</div><div class="result-meta"><span class="rate">${esc(money(c.rate))}</span><span class="star">${ic('star')} ${c.rating.toFixed(1)}</span><span>${esc(c.responseTime)}</span></div></div><div class="result-actions">${saveBtnHTML('creator',c.id)}${compareBtnHTML(c.id)}</div></div>`).join('');
  $$('#results .result').forEach(r => r.addEventListener('click', e => { if(e.target.closest('.result-actions')) return; openProfile(r.dataset.id); }));
  wireSaves(box); wireCompare(box);
}
function renderSpaceResults(list){
  const box = $('#results');
  if (!list.length){ box.innerHTML = `<div style="padding:30px 20px;color:var(--muted);font-size:13.5px">No spaces in ${esc(state.city)} yet. <a href="#join" style="color:var(--green)">List yours →</a></div>`; return; }
  box.innerHTML = list.map(s => `<div class="result" data-id="${s.id}"><div class="avatar" style="background-image:url('${spaceURL(s)}')"></div><div class="result-body"><div class="result-name">${esc(s.name)}</div><div class="result-role">${esc(s.type)} · ${esc(s.area)}</div><div class="result-meta"><span class="rate">${esc(money(s.rate))}</span><span>${esc(s.cap)} ppl</span><span class="star">${ic('star')} ${s.rating.toFixed(1)}</span></div></div></div>`).join('');
  $$('#results .result').forEach(r => r.addEventListener('click', () => location.hash='#space?id='+r.dataset.id));
}

// ============================================================================
//  PROFILE DRAWER (quick view from the map)
// ============================================================================
function openProfile(id){
  const c = state.creators.find(x => x.id===id); if(!c) return;
  state.selected = id;
  $$('.mk, .result').forEach(n => n.classList.toggle('sel', n.dataset.id===id));
  if (state.map){ state.map.flyTo({ center:[c.lng,c.lat], zoom:Math.max(state.map.getZoom(),12.5), speed:.8 }); }
  const saved = state.shortlist.has(id);
  const shots = Array.from({length:3}, (_,i)=>`<img loading="lazy" src="${shotURL(c.id,i+1,300,300)}" onerror="${IMGERR}" alt="">`).join('');
  $('#drawer').innerHTML = `
    <div class="drawer-cover" style="background-image:url('${coverURL(c)}')"><button class="drawer-close" id="drawer-close" aria-label="Close">✕</button><div class="drawer-av" style="${avatarBg(c.name)}">${initials(c.name)}</div></div>
    <div class="drawer-pad">
      <h2>${esc(c.name)} ${c.verified?`<span class="verified-ico">${VBADGE}</span>`:''}</h2>
      <div class="roles">${esc(c.roles.join(' · '))}</div>
      <div class="loc">${esc(c.area)}, ${esc(c.city)}</div>
      <div class="kv"><div><div class="k">Day rate</div><div class="v">${esc(money(c.rate))}</div></div><div><div class="k">Rating</div><div class="v">${c.rating.toFixed(1)}★</div></div><div><div class="k">Booked</div><div class="v">${c.jobs}×</div></div></div>
      <div class="mini-gal">${shots}</div>
      <p class="bio">${esc(c.bio)}</p>
      ${socialsHTML(c)}
      <div class="drawer-actions">${connectBtnHTML(c.id)}<button class="btn btn-ghost" id="d-save">${saved?'✓ Shortlisted':'☆ Shortlist'}</button></div>
      <div style="font-family:var(--mono);font-size:11.5px;color:var(--muted);margin-top:12px;text-transform:uppercase"><b data-conncount="${c.id}" style="color:var(--green)">${numFmt(c.connections||0)}</b> connections</div>
      <a class="view-full" href="#creator?id=${c.id}">View full portfolio →</a>
    </div>`;
  $('#drawer').hidden=false; $('#drawer').setAttribute('aria-hidden','false'); $('#scrim').hidden=false;
  wireConnect($('#drawer'));
  $('#drawer-close').addEventListener('click', closeProfile);
  $('#d-save').addEventListener('click', () => { state.shortlist.has(id)?state.shortlist.delete(id):state.shortlist.add(id); LS.set('shortlist',[...state.shortlist]); $('#d-save').textContent=state.shortlist.has(id)?'✓ Shortlisted':'☆ Shortlist'; toast(state.shortlist.has(id)?`${c.name} shortlisted`:`Removed ${c.name}`); });
  $('#d-book').addEventListener('click', () => { closeProfile(); location.hash='#jobs'; setTimeout(()=>toast('Post a brief to reach '+c.name.split(' ')[0]),200); });
  $('.view-full').addEventListener('click', closeProfile);
}
function closeProfile(){ $('#drawer').hidden=true; $('#drawer').setAttribute('aria-hidden','true'); $('#scrim').hidden=true; state.selected=null; $$('.mk,.result').forEach(n=>n.classList.remove('sel')); }

// ============================================================================
//  VIEW: CREATOR PORTFOLIO PAGE  (the crown jewel)
// ============================================================================
function renderCreator(){
  const id = ROUTE_PARAMS.get('id');
  const c = state.creators.find(x => x.id===id);
  if (!c){ location.hash='#discover'; return; }
  const gearOwned = state.gear.filter(g => g.owner===c.name);

  $('#view').appendChild(el(`<div class="profile">
    <div class="pf-hero"><div class="pf-hero-bg" style="background-image:url('${coverURL(c)}')"></div>
      <a class="pf-back btn btn-ghost btn-sm" href="#discover">${ic('arrow','icn')} Back to map</a></div>
    <div class="pf-head">
      <div class="pf-av" style="${avatarBg(c.name)}">${initials(c.name)}</div>
      <div class="pf-id">
        <h1>${esc(c.name)} ${c.verified?`<span class="pf-seal" title="Verified">${VBADGE}</span>`:''}</h1>
        <div class="roles">${esc(c.roles.join(' · '))}</div>
        <div class="pf-id-meta">${verifyChipsHTML(c)} ${availabilityHTML(c)}</div>
        <div class="loc">${ic('pin','icn')} ${esc(c.area)}, ${esc(c.city)}</div>
      </div>
      <div class="pf-actions">
        ${saveBtnHTML('creator',c.id,'lg')}
        ${compareBtnHTML(c.id,'lg')}
        ${connectBtnHTML(c.id)}
      </div>
    </div>
    <div class="pf-body">
      <div class="pf-main">
        ${statsGridHTML(c)}
        <div class="pf-section-t">About</div>
        <p class="pf-bio">${esc(c.bio)}</p>
        <div class="pf-tags">${(c.tags||[]).map(t=>`<span class="pf-tag">${esc(t)}</span>`).join('')}</div>
        ${socialsHTML(c)}
        <div class="pf-section-t">Portfolio <span class="pf-hint">hover / tap a piece for project details</span></div>
        <div class="flip-grid">${projectFlipHTML(c)}</div>
        <div class="pf-section-t">Reviews</div>
        ${reviewsHTML(c)}
      </div>
      <aside class="pf-rail">
        <div class="rate">${esc(money(c.rate))}</div>
        ${availabilityHTML(c)}
        <button class="btn btn-primary btn-block" id="pf-enq" style="margin-top:14px">${ic('mail','icn')} Send project enquiry</button>
        ${connectBtnHTML(c.id, true)}
        <button class="btn btn-ghost btn-block" id="pf-save-rail" style="margin-top:10px">${isSaved('creator',c.id)?'♥ Saved':'♡ Save'}</button>
        ${gearOwned.length?`<div class="pf-section-t" style="margin:24px 0 12px">Gear for hire</div><div class="pf-gear">${gearOwned.map(g=>`<div class="gi"><img loading="lazy" src="${gearURL(g)}" onerror="${IMGERR}" alt=""><div><div class="gt">${esc(g.brand)} ${esc(g.model)}</div><div class="gs">${esc(money(g.rate))} · ${esc(g.cat)}</div></div></div>`).join('')}</div>`:''}
        <div class="note">Enquiries are structured so ${c.name.split(' ')[0]} can reply fast. Location shown is an approximate suburb.</div>
      </aside>
    </div>
  </div>`));

  $('#pf-enq').addEventListener('click', () => openEnquiry(c));
  $('#pf-save-rail').addEventListener('click', () => { toggleSave('creator',c.id); $('#pf-save-rail').textContent = isSaved('creator',c.id)?'♥ Saved':'♡ Save'; });
  $$('.flip .fb-view').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); openLightbox(b.dataset.full); }));
  $$('.flip').forEach(f => f.addEventListener('click', () => f.classList.toggle('flipped')));  // tap to flip (mobile)
  // review submission
  $('#rev-add').addEventListener('click', () => openReview(c));
  wireConnect(); wireSaves(); wireCompare();
}

function openReview(c){
  let stars=5;
  modalOpen(`<div class="rev-modal"><button class="ico-btn modal-close" id="md-x">${ic('x','icn')}</button>
    <h3>Write a review</h3><p class="sub">Worked with ${esc(c.name)}? Share how it went.</p>
    <form id="rev-form">
      <div class="form-row two"><div><input class="field" name="name" required placeholder="Your name"></div><div><input class="field" name="role" placeholder="Occupation"></div></div>
      <div class="form-row"><label class="label">Rating</label><div class="star-pick" id="star-pick">${[1,2,3,4,5].map(n=>`<button type="button" data-star="${n}" class="${n<=5?'on':''}">★</button>`).join('')}</div></div>
      <div class="form-row"><textarea class="field" name="text" required placeholder="What was it like working together?"></textarea></div>
      <button class="btn btn-primary btn-block" type="submit">Post review</button>
    </form></div>`);
  $('#md-x').addEventListener('click', modalClose);
  const paintStars=()=>$$('#star-pick button').forEach(b=>b.classList.toggle('on', +b.dataset.star<=stars));
  $$('#star-pick button').forEach(b=>b.addEventListener('click',()=>{ stars=+b.dataset.star; paintStars(); }));
  $('#rev-form').addEventListener('submit', e=>{ e.preventDefault(); const f=new FormData(e.target);
    const r={ name:f.get('name'), role:f.get('role')||'Client', stars, date:new Date().toISOString().slice(0,7), text:f.get('text') };
    c.reviews=[r,...(c.reviews||[])]; c.reviewCount=(c.reviewCount||0)+1;
    const ur=LS.get('userReviews',{}); ur[c.id]=[r,...(ur[c.id]||[])]; LS.set('userReviews',ur);
    sbInsert('reviews', { creator_ref:c.id, creator_name:c.name, author_name:r.name, author_role:r.role, stars:r.stars, text:r.text });
    modalClose(); const grid=$('#reviews-grid'); if(grid) grid.insertAdjacentHTML('afterbegin', reviewCardHTML(r)); toast('Review posted');
  });
}
function openLightbox(src){ const lb=el(`<div class="lightbox"><img src="${src}" alt=""></div>`); lb.addEventListener('click', ()=>lb.remove()); document.body.appendChild(lb); }

// ============================================================================
//  VIEW: BLOG  ("The Scene" — newsletter of underground AU creative culture)
// ============================================================================
function postURL(p, w=900, h=560){ return `https://picsum.photos/seed/${p.img}/${w}/${h}`; }
function renderBlog(){
  $('#view').appendChild(el(`<div>
    <div class="blog-hero"><div class="aurora-bg"><span class="a1"></span><span class="a2"></span><span class="a3"></span></div>
      <div class="wrap" style="position:relative;z-index:2"><div class="eyebrow">The Scene · the newsletter</div>
        <h1 style="font-family:var(--display-hero);font-size:clamp(40px,7vw,84px);text-transform:uppercase;line-height:.86">What's moving<br>in the underground.</h1>
        <p style="color:var(--muted);max-width:56ch;margin-top:16px;font-size:17px">Dispatches from Australia's creative scene — who's making what, where it's happening, and the rooms, rates and people holding it together.</p>
        <div class="blog-cats" id="blog-cats">${BLOG_CATS.map((c,i)=>`<button class="blog-cat ${i===0?'on':''}" data-cat="${c}">${c}</button>`).join('')}</div>
      </div>
    </div>
    <div class="wrap section-pad"><div class="blog-grid" id="blog-grid"></div></div>
  </div>`));
  const paint = (cat='All') => {
    const list = SEED_POSTS.filter(p => cat==='All' || p.cat===cat);
    $('#blog-grid').innerHTML = list.map((p,i)=>`<div class="blog-card ${i===0&&cat==='All'?'feat':''}" data-id="${p.id}">
      <div class="blog-img" style="background-image:url('${postURL(p)}')"></div>
      <div class="blog-body"><div class="blog-meta"><span>${esc(p.cat)}</span><span>${esc(p.date)}</span><span>${p.read} min</span></div><h3>${esc(p.title)}</h3><p>${esc(p.excerpt)}</p></div>
    </div>`).join('');
    $$('#blog-grid .blog-card').forEach(c => c.addEventListener('click', () => location.hash='#post?id='+c.dataset.id));
  };
  $$('#blog-cats .blog-cat').forEach(b => b.addEventListener('click', () => { $$('#blog-cats .blog-cat').forEach(x=>x.classList.toggle('on',x===b)); paint(b.dataset.cat); }));
  paint();
}
function renderPost(){
  const p = SEED_POSTS.find(x => x.id===ROUTE_PARAMS.get('id'));
  if(!p){ location.hash='#blog'; return; }
  $('#view').appendChild(el(`<div class="post-wrap">
    <a class="btn btn-ghost btn-sm" href="#blog">${ic('arrow','icn')} The Scene</a>
    <div class="blog-meta" style="margin-top:24px"><span>${esc(p.cat)}</span><span>${esc(p.date)}</span><span>${p.read} min read</span><span>by ${esc(p.author)}</span></div>
    <h1>${esc(p.title)}</h1>
    <div class="post-img" style="background-image:url('${postURL(p,1200,700)}')"></div>
    <p class="body">${esc(p.body)}</p>
    <p class="body" style="margin-top:18px;color:var(--muted)">More from this story is coming — The Scene is a living newsletter. Want to be featured? <a href="#join" style="color:var(--green)">Get on the map.</a></p>
  </div>`));
}

// ============================================================================
//  VIEW: ADMIN  (Supabase-backed dashboard — gated by app_admins allowlist)
// ============================================================================
function renderAdmin(){
  const view = $('#view');
  if(!SB.on){ view.appendChild(el(`<div class="wrap section-pad"><div class="admin-gate"><h1>Admin</h1><p>Backend is connecting — refresh in a moment.</p></div></div>`)); return; }
  if(!SB.user){ renderAdminLogin(); return; }
  if(!SB.admin){ view.appendChild(el(`<div class="wrap section-pad"><div class="admin-gate"><div class="eyebrow">Admin</div><h1>No access</h1><p>You're logged in as <b>${esc(SB.user.email)}</b>, which isn't an admin account.</p><button class="btn btn-ghost" id="adm-out">Log out</button></div></div>`)); $('#adm-out').addEventListener('click', ()=>SB.client.auth.signOut().then(()=>location.reload())); return; }

  view.appendChild(el(`<div class="admin">
    <div class="admin-bar"><div><span class="adm-dot"></span> ADMIN · <b>${esc(SB.user.email)}</b></div>
      <div class="admin-bar-r"><span class="adm-live">● live on Supabase</span><button class="btn btn-ghost btn-sm" id="adm-out">Log out</button></div></div>
    <div class="wrap">
      <div class="page-head" style="padding:34px 0 20px"><div class="eyebrow">Dashboard</div><h1>The Collective — operations</h1></div>
      <div class="adm-metrics" id="adm-metrics"></div>
      <div class="adm-tabs" id="adm-tabs">
        ${['Waitlist','Enquiries','Reviews','Profiles','Support'].map((t,i)=>`<button class="adm-tab ${i===0?'on':''}" data-tab="${t.toLowerCase()}">${t}</button>`).join('')}
      </div>
      <div class="adm-panel" id="adm-panel"><div class="adm-loading">Loading…</div></div>
    </div>
  </div>`));
  $('#adm-out').addEventListener('click', ()=>SB.client.auth.signOut().then(()=>location.reload()));
  loadAdminMetrics();
  $$('#adm-tabs .adm-tab').forEach(b=>b.addEventListener('click', ()=>{ $$('#adm-tabs .adm-tab').forEach(x=>x.classList.toggle('on',x===b)); loadAdminTab(b.dataset.tab); }));
  loadAdminTab('waitlist');
}
function renderAdminLogin(){
  $('#view').appendChild(el(`<div class="wrap section-pad"><div class="admin-login">
    <div class="eyebrow">Admin access</div><h1>Sign in to the dashboard</h1>
    <p>Use your admin email. First time? Set a password below — you'll be let straight in.</p>
    <div class="modal-head" style="margin-top:24px"><button class="modal-tab on" data-t="login">Log in</button><button class="modal-tab" data-t="signup">Set password</button></div>
    <form id="adm-form" class="admin-form">
      <div class="form-row"><input class="field" type="email" name="email" required placeholder="Admin email" value="kumbirai700@gmail.com"></div>
      <div class="form-row"><input class="field" type="password" name="pass" required minlength="6" placeholder="Password (min 6 chars)"></div>
      <button class="btn btn-primary btn-block" type="submit" id="adm-submit">Log in</button>
      <div class="adm-msg" id="adm-msg"></div>
    </form>
  </div></div>`));
  let mode='login';
  $$('.modal-tab').forEach(b=>b.addEventListener('click',()=>{ mode=b.dataset.t; $$('.modal-tab').forEach(x=>x.classList.toggle('on',x===b)); $('#adm-submit').textContent = mode==='login'?'Log in':'Set password & enter'; }));
  $('#adm-form').addEventListener('submit', async e=>{
    e.preventDefault(); const f=new FormData(e.target); const email=f.get('email'), pass=f.get('pass'); const msg=$('#adm-msg'); msg.textContent='';
    const res = mode==='signup'
      ? await SB.client.auth.signUp({ email, password:pass, options:{ data:{ name:'Admin', kind:'admin' } } })
      : await SB.client.auth.signInWithPassword({ email, password:pass });
    if(res.error){ msg.textContent = res.error.message; return; }
    await refreshAdminFlag(); renderViewReset(); renderAdmin();
  });
}
function renderViewReset(){ $('#view').innerHTML=''; }
async function loadAdminMetrics(){
  const tables=[['waitlist','Waitlist'],['enquiries','Enquiries'],['reviews','Reviews'],['profiles','Profiles'],['support_tickets','Support']];
  const box=$('#adm-metrics'); box.innerHTML = tables.map(t=>`<div class="adm-metric"><div class="am-v" id="am-${t[0]}">—</div><div class="am-k">${t[1]}</div></div>`).join('');
  for(const [tbl] of tables){ const { count } = await SB.client.from(tbl).select('*',{count:'exact',head:true}); const e=$(`#am-${tbl}`); if(e) e.textContent = (count??0); }
}
async function loadAdminTab(tab){
  const panel=$('#adm-panel'); panel.innerHTML=`<div class="adm-loading">Loading…</div>`;
  const map={ waitlist:['waitlist',['name','email','phone','city','occupation','created_at']],
    enquiries:['enquiries',['project','to_name','from_name','from_email','budget','location','date','created_at']],
    reviews:['reviews',['creator_name','author_name','stars','text','created_at']],
    profiles:['profiles',['name','city','roles','verified','availability','created_at']],
    support:['support_tickets',['email','subject','status','created_at']] };
  const [tbl,cols]=map[tab];
  const { data, error } = await SB.client.from(tbl).select('*').order('created_at',{ascending:false}).limit(200);
  if(error){ panel.innerHTML=`<div class="adm-empty">Can't read ${tbl}: ${esc(error.message)}</div>`; return; }
  if(!data||!data.length){ panel.innerHTML=`<div class="adm-empty">No ${tab} yet. As people use the live site, rows appear here in real time.</div>`; return; }
  panel.innerHTML = `<div class="adm-table-wrap"><table class="adm-table"><thead><tr>${cols.map(c=>`<th>${esc(c.replace(/_/g,' '))}</th>`).join('')}</tr></thead>
    <tbody>${data.map(r=>`<tr>${cols.map(c=>{ let v=r[c]; if(Array.isArray(v))v=v.join(', '); if(c==='created_at'&&v)v=new Date(v).toLocaleDateString(); if(c==='stars')v='★'.repeat(v||0); if(v===true)v='✓'; if(v===false)v='·'; return `<td>${esc(String(v??'—')).slice(0,120)}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`;
}

// ============================================================================
//  VIEW: ABOUT
// ============================================================================
function renderAbout(){
  $('#view').appendChild(el(`<div>
    <div class="hero"><div class="aurora-bg"><span class="a1"></span><span class="a2"></span><span class="a3"></span></div>
      <div class="hero-inner"><div class="eyebrow">About</div><h1>The home of Australia's <em>creative industry.</em></h1>
        <p>We're building the place where Australian creatives get discovered, build teams and get booked — without agencies, gatekeepers or a cut of your work.</p></div></div>
    <div class="wrap section-pad">
      <div class="about-grid">
        <div class="about-card reveal"><div class="ac-n">01</div><h3>Support local creatives</h3><p>Every model, shooter, gaffer, stylist and producer in the country deserves a shopfront that's actually theirs. Free, forever.</p></div>
        <div class="about-card reveal d2"><div class="ac-n">02</div><h3>Make discovery easy</h3><p>Talent shouldn't live in DMs and group chats. One map, real portfolios, honest reviews — find the right person in minutes.</p></div>
        <div class="about-card reveal d3"><div class="ac-n">03</div><h3>Help teams come together</h3><p>A shoot is a team sport. Crew, gear and a space to shoot it — assembled in one place, locally.</p></div>
      </div>
      <div class="founder reveal">
        <div class="founder-img" style="background-image:url('https://picsum.photos/seed/founder-cc/700/800')"></div>
        <div class="founder-copy"><div class="eyebrow">Founder story</div><h2 class="serif">Why we started.</h2>
          <p class="serif">I spent years watching brilliant creatives struggle to get found, while brands burned weeks trying to build a team. The talent was everywhere — it just wasn't <em>visible</em>.</p>
          <p class="serif">The Creative Collective is the platform I wished existed: a place that puts the people who actually make the work first, keeps it local, and never takes a cut of a creative's booking. This is for the scene.</p>
          <div class="founder-sign">— The Creative Collective</div>
        </div>
      </div>
      <div class="about-cta reveal"><h2>Be part of it.</h2><button class="btn btn-primary" id="ab-wl">Join the waitlist</button></div>
    </div>
  </div>`));
  $('#ab-wl').addEventListener('click', openWaitlist);
}

// ============================================================================
//  VIEW: LEGAL  (templates, ready for legal review)
// ============================================================================
const LEGAL_DOCS = {
  'privacy-policy':   ['Privacy Policy', 'How we collect, use and protect your personal information.'],
  'terms-of-service': ['Terms of Service', 'The terms that govern your use of The Creative Collective.'],
  'creator-terms':    ['Creator Terms', 'Terms specific to creatives listing a profile, gear or space.'],
  'acceptable-use':   ['Acceptable Use Policy', 'What is and isn’t allowed on the platform.'],
  'copyright-policy': ['Copyright Policy', 'How we handle copyright and takedown requests.'],
  'cookie-policy':    ['Cookie Policy', 'How we use cookies and similar technologies.'],
};
function renderLegal(){
  const slug = ROUTE_PARAMS.get('doc') || 'privacy-policy';
  const d = LEGAL_DOCS[slug] || LEGAL_DOCS['privacy-policy'];
  const secs = ['Overview','Information we handle','How we use it','Your rights and choices','Third parties','Data retention','Changes to this policy','Contact'];
  $('#view').appendChild(el(`<div class="wrap legal-wrap">
    <nav class="crumb"><a href="#home">Home</a> ${ic('chev','icn')} <a href="#legal?doc=privacy-policy">Legal</a> ${ic('chev','icn')} <span>${esc(d[0])}</span></nav>
    <div class="legal-grid">
      <aside class="legal-nav">${Object.entries(LEGAL_DOCS).map(([k,v])=>`<a href="#legal?doc=${k}" class="${k===slug?'on':''}">${esc(v[0])}</a>`).join('')}</aside>
      <article class="legal-body">
        <div class="eyebrow">Legal</div><h1>${esc(d[0])}</h1>
        <p class="legal-intro serif">${esc(d[1])}</p>
        <p class="legal-note">Last updated: June 2026 · This is a template prepared for professional legal review before launch.</p>
        ${secs.map((s,i)=>`<h2>${i+1}. ${esc(s)}</h2><p class="serif">Placeholder copy for “${esc(s)}”. The Creative Collective will provide finalised, lawyer-reviewed wording here covering ${esc(s.toLowerCase())} as it relates to ${esc(d[0].toLowerCase())}. This structure is in place so legal content can be dropped in without further engineering.</p>`).join('')}
      </article>
    </div>
  </div>`));
}

// ============================================================================
//  VIEW: SPACES  (venue / location hire — browse)
// ============================================================================
function renderSpaces(){
  $('#view').appendChild(el(`<div class="wrap">
    <div class="page-head reveal"><div class="eyebrow">Spaces · location hire</div><h1>Shoot somewhere worth shooting.</h1><p>Studios, warehouses, galleries, rooftops and sound stages for hire — listed on the same map as the crew and kit. Book the talent, the gear and the location in one place. Hosts list free; we take a commission only when you book.</p></div>
    <div class="section-pad">
      <div class="grid" style="grid-template-columns:auto auto auto;justify-content:start;gap:12px;margin-bottom:28px">
        <select class="field" id="sp-city" style="width:auto">${['All cities',...CITIES].map(c=>`<option ${c===state.city?'selected':''}>${c}</option>`).join('')}</select>
        <select class="field" id="sp-type" style="width:auto"><option>All types</option>${SPACE_TYPES.map(t=>`<option>${t}</option>`).join('')}</select>
        <a class="btn btn-ghost btn-sm" href="#join">List your space →</a>
      </div>
      <div id="sp-list" class="space-grid"></div>
    </div></div>`));
  const paint = () => {
    const city=$('#sp-city').value, type=$('#sp-type').value;
    const list=state.spaces.filter(s => (city==='All cities'||s.city===city) && (type==='All types'||s.type===type));
    $('#sp-list').innerHTML = list.length ? list.map(s=>spaceCard(s)).join('') : `<div style="color:var(--muted)">No spaces match — try another city or type.</div>`;
    $$('#sp-list .space-card').forEach(card => card.addEventListener('click', e => { if(e.target.closest('.save-btn')) return; location.hash='#space?id='+card.dataset.id; }));
    wireSaves($('#sp-list')); initReveal();
  };
  $('#sp-city').addEventListener('change', paint); $('#sp-type').addEventListener('change', paint); paint();
}
function spaceCard(s){
  return `<div class="space-card reveal" data-id="${s.id}">
    <div class="space-img" style="background-image:url('${spaceURL(s)}')">
      <span class="type">${esc(s.type)}</span>
      ${s.instant?`<span class="instant">${ic('bolt')} Instant</span>`:''}
      ${saveBtnHTML('space',s.id,'on-img')}
      <span class="star">${ic('star')} ${s.rating.toFixed(1)} <span style="color:var(--muted)">(${s.reviews})</span></span>
    </div>
    <div class="space-info">
      <h3>${esc(s.name)}</h3>
      <div class="loc">${esc(s.area)}, ${esc(s.city)}</div>
      <div class="space-meta"><span>${ic('users')} ${esc(s.cap)} ppl</span><span>${ic('ruler')} ${esc(s.size)} m²</span></div>
      <div class="space-foot"><span class="brandline">by ${esc(s.host)}</span><span class="rate">${esc(money(s.rate))} <small>/ hr</small></span></div>
    </div></div>`;
}

// ============================================================================
//  VIEW: SPACE  (detail page)
// ============================================================================
function renderSpace(){
  const id = ROUTE_PARAMS.get('id');
  const s = state.spaces.find(x => x.id===id);
  if (!s){ location.hash='#spaces'; return; }
  const shots = [2,3,4,5,6].map(n=>{ const h=SHOT_H[n%SHOT_H.length]; return `<div class="shot" data-full="${spaceURL(s,n,1100,Math.round(h*1.4))}"><img loading="lazy" src="${spaceURL(s,n,600,h)}" onerror="${IMGERR}" alt="${esc(s.name)}"></div>`; }).join('');

  $('#view').appendChild(el(`<div class="profile">
    <div class="pf-hero"><div class="pf-hero-bg" style="background-image:url('${spaceURL(s,1,1400,700)}')"></div>
      <a class="pf-back btn btn-ghost btn-sm" href="#spaces">${ic('arrow','icn')} All spaces</a></div>
    <div class="pf-head">
      <div class="pf-id" style="padding-top:24px">
        <h1>${esc(s.name)} ${s.instant?`<span class="pf-verified">${ic('bolt')} Instant book</span>`:''}</h1>
        <div class="roles" style="font-family:var(--font)"><span class="sp-type-badge">${esc(s.type)}</span></div>
        <div class="loc">${ic('pin','icn')} ${esc(s.area)}, ${esc(s.city)}</div>
      </div>
    </div>
    <div class="pf-body">
      <div class="pf-main">
        <div class="pf-stats">
          <div class="pf-stat"><div class="v"><em>${s.rating.toFixed(1)}</em>★</div><div class="k">${s.reviews} reviews</div></div>
          <div class="pf-stat"><div class="v">${esc(s.cap)}</div><div class="k">Capacity</div></div>
          <div class="pf-stat"><div class="v">${esc(s.size)}<small style="font-size:15px"> m²</small></div><div class="k">Floor area</div></div>
          <div class="pf-stat"><div class="v">${esc(s.host)}</div><div class="k">Hosted by</div></div>
        </div>
        <div class="pf-section-t">Amenities</div>
        <div class="amenities">${s.amenities.map(a=>`<span class="amenity">${ic('check')} ${esc(a)}</span>`).join('')}</div>
        ${socialsHTML(s)}
        <div class="pf-section-t">The space</div>
        <div class="gallery">${shots}</div>
        <div class="pf-section-t">Where it is</div>
        <div class="space-map" id="space-map"><div class="hmc-fallback">${ic('pin','icn')} Map loads online</div></div>
        <div class="space-loc">${ic('pin','icn')} ${esc(s.area)}, ${esc(s.city)} · exact address shared after booking</div>
      </div>
      <aside class="pf-rail">
        <div class="rate">${esc(money(s.rate))} <small>/ hour</small></div>
        <div class="avail"><span class="dot"></span> ${s.instant?'Instant book available':'Usually replies within a day'}</div>
        <div class="cap-row"><div class="b"><div class="v">${esc(money(s.day))}</div><div class="k">Day rate</div></div><div class="b"><div class="v">${esc(s.cap)}</div><div class="k">Max people</div></div></div>
        <button class="btn btn-primary btn-block" id="sp-book">Request to book</button>
        <button class="btn btn-ghost btn-block" id="sp-tour" style="margin-top:10px">Ask about a recce</button>
        <div class="note">Commission applies on confirmed bookings only — listing is free. Exact address shared after booking is confirmed.</div>
      </aside>
    </div>
  </div>`));
  $('#sp-book').addEventListener('click', () => toast(`Booking request sent to ${s.host}`));
  $('#sp-tour').addEventListener('click', () => toast('Recce request sent — the host will be in touch'));
  $$('.gallery .shot').forEach(sh => sh.addEventListener('click', () => openLightbox(sh.dataset.full)));
  if (typeof maplibregl !== 'undefined'){
    const host=$('#space-map'); host.innerHTML='';
    state.spaceMap = new maplibregl.Map({ container:'space-map', attributionControl:false, interactive:true, dragRotate:false,
      style:{ version:8, sources:{ c:{ type:'raster', tileSize:256, tiles:['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png','https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png','https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'] } }, layers:[{ id:'c', type:'raster', source:'c' }] },
      center:[s.lng,s.lat], zoom:13 });
    state.spaceMap.on('load', ()=>{ state.spaceMap.resize();
      const node=el(`<div class="mk mk-space"><div class="mk-dot">${ic('building','icn')}</div></div>`);
      node.querySelector('.icn').style.cssText='width:18px;height:18px;color:var(--ink)';
      new maplibregl.Marker({element:node,anchor:'center'}).setLngLat([s.lng,s.lat]).addTo(state.spaceMap);
    });
  }
}

// ============================================================================
//  VIEW: JOBS
// ============================================================================
function renderJobs(){
  $('#view').appendChild(el(`<div class="wrap">
    <div class="page-head reveal"><div class="eyebrow">For brands · Stage 1</div><h1>Post a brief. The right crew comes to you.</h1><p>Pay per job post — no subscription to start. Browse the map free; you only pay when you're ready to hire. Matching creators in your city get notified the moment you post.</p></div>
    <div class="section-pad grid" style="grid-template-columns:1.1fr .9fr;gap:40px;align-items:start">
      <div><div class="label" style="margin-bottom:16px">Open briefs</div><div id="jobs-list" class="grid"></div></div>
      <div><div class="card form-card reveal" style="position:sticky;top:80px"><div class="eyebrow">New brief</div><h3 style="margin-bottom:18px">Post a job</h3>
        <form id="job-form">
          <div class="form-row"><label class="label">Brand / company</label><input class="field" name="brand" required placeholder="Studio Noir"></div>
          <div class="form-row"><label class="label">Title</label><input class="field" name="title" required placeholder="Beauty campaign — MUA + retoucher"></div>
          <div class="form-row two"><div><label class="label">City</label><select class="field" name="city">${CITIES.map(c=>`<option ${c===state.city?'selected':''}>${c}</option>`).join('')}</select></div><div><label class="label">Shoot date</label><input class="field" type="date" name="date" required></div></div>
          <div class="form-row"><label class="label">Lead role</label><select class="field" name="role">${ALL_ROLES.map(r=>`<option>${r}</option>`).join('')}</select></div>
          <div class="form-row two"><div><label class="label">Budget</label><input class="field" name="budget" placeholder="$5,000 total"></div><div><label class="label">Usage</label><input class="field" name="usage" placeholder="Web + OOH, 6 mo"></div></div>
          <div class="form-row"><label class="label">The brief</label><textarea class="field" name="brief" placeholder="What you're making, the vibe, what you need on the day…"></textarea></div>
          <div class="form-row price-row"><div><div style="font-weight:600;font-size:14px">Job post</div><div class="hint" style="margin:0">Single brief · first-timer rate</div></div><div class="amt2">$3.99</div></div>
          <button class="btn btn-primary btn-block" type="submit">Post brief &amp; notify crew</button>
          <div class="hint" style="text-align:center;margin-top:10px">Post 3+ and we'll offer a monthly plan that saves you money.</div>
        </form></div></div>
    </div>
  </div>`));
  paintJobs();
  $('#job-form').addEventListener('submit', e => {
    e.preventDefault(); const f=new FormData(e.target);
    const job={ id:'j'+Date.now(), brand:f.get('brand'), title:f.get('title'), city:f.get('city'), roles:[f.get('role')], date:f.get('date'), budget:f.get('budget')||'—', usage:f.get('usage')||'—', brief:f.get('brief')||'', posted:new Date().toISOString().slice(0,10) };
    const mine=LS.get('jobs',[]); mine.unshift(job); LS.set('jobs',mine); state.jobs.unshift(job); e.target.reset(); paintJobs();
    const matches=state.creators.filter(x=>x.city===job.city && x.roles.includes(job.roles[0])).length;
    toast(`Brief posted — ${matches} matching creator${matches===1?'':'s'} notified in ${job.city}`);
  });
}
function paintJobs(){
  $('#jobs-list').innerHTML = state.jobs.map(j=>`<div class="card reveal"><h3>${esc(j.title)}</h3><div class="meta">${esc(j.city)} · shoot ${esc(j.date)}</div>${j.brief?`<div class="desc">${esc(j.brief)}</div>`:''}<div class="pill-row">${j.roles.map(r=>`<span class="pill accent">${esc(r)}</span>`).join('')}<span class="pill">${esc(j.budget)}</span><span class="pill">${esc(j.usage)}</span></div><div class="card-foot"><span class="brandline">${esc(j.brand)} · posted ${esc(j.posted)}</span><button class="btn btn-ghost btn-sm" data-apply="${j.id}">Express interest</button></div></div>`).join('');
  $$('[data-apply]').forEach(b=>b.addEventListener('click',()=>toast('Interest sent — the brand will see your profile')));
  initReveal();
}

// ============================================================================
//  VIEW: GEAR
// ============================================================================
function renderGear(){
  $('#view').appendChild(el(`<div class="wrap">
    <div class="page-head reveal"><div class="eyebrow">For everyone · Stage 3</div><h1>Rent gear from crew nearby.</h1><p>Cameras, lights, grip, aerial — listed by the creators already on the map. Commission only, no listing fee. Opens city-by-city as crew density grows.</p></div>
    <div class="section-pad">
      <div class="grid" style="grid-template-columns:auto auto;justify-content:start;gap:12px;margin-bottom:28px"><select class="field" id="gear-city" style="width:auto">${['All cities',...CITIES].map(c=>`<option>${c}</option>`).join('')}</select><a class="btn btn-ghost btn-sm" href="#join">List your gear →</a></div>
      <div id="gear-list" class="gear-grid"></div>
    </div></div>`));
  const paint = () => {
    const city=$('#gear-city').value;
    const list=state.gear.filter(g=>city==='All cities'||g.city===city);
    $('#gear-list').innerHTML = list.length ? list.map(g=>{
      const per = parseFloat((g.rate||'').replace(/[^\d.]/g,''))||0;
      return `<div class="gear-card reveal"><div class="gear-img" style="background-image:url('${gearURL(g)}')"><span class="cat">${esc(g.cat)}</span></div>
      <div class="gear-info"><div class="brand">${esc(g.brand)}</div><h3>${esc(g.model)}</h3>
        <div class="gf"><span class="brandline">${esc(g.owner)} · ${esc(g.area)}</span><span class="rate">${esc(money(g.rate))}</span></div>
        <div class="gear-days">
          <span class="gd-lbl">Days</span>
          <div class="gd-step"><button type="button" data-step="-1" data-g="${g.id}">−</button><input type="number" min="1" max="60" value="1" data-days="${g.id}" data-per="${per}"><button type="button" data-step="1" data-g="${g.id}">+</button></div>
          <span class="gd-total" data-total="${g.id}">${esc(money('$'+per))}</span>
        </div>
        <button class="btn btn-primary btn-sm btn-block" style="margin-top:12px" data-rent="${g.id}">Request booking · dep. ${esc(money(g.deposit))}</button>
      </div></div>`; }).join('') : `<div style="color:var(--muted)">No gear listed in ${city} yet — this market opens as crew density grows.</div>`;
    const recalc = (id) => {
      const inp=$(`[data-days="${id}"]`); let d=Math.max(1,Math.min(60,+inp.value||1)); inp.value=d;
      $(`[data-total="${id}"]`).textContent=money('$'+(+inp.dataset.per)*d);
    };
    $$('[data-days]').forEach(inp=>{ recalc(inp.dataset.days); inp.addEventListener('input',()=>recalc(inp.dataset.days)); });
    $$('[data-step]').forEach(b=>b.addEventListener('click',()=>{ const inp=$(`[data-days="${b.dataset.g}"]`); inp.value=(+inp.value||1)+(+b.dataset.step); recalc(b.dataset.g); }));
    $$('[data-rent]').forEach(b=>b.addEventListener('click',()=>{ const d=$(`[data-days="${b.dataset.rent}"]`).value; toast(`Request sent — ${d}-day booking, owner confirms availability`); }));
    initReveal();
  };
  $('#gear-city').addEventListener('change', paint); paint();
}

// ============================================================================
//  VIEW: ACCOUNT  (your own profile — view & edit)
// ============================================================================
function renderAccount(){
  if(!state.user){ openAuth('login'); location.hash='#home'; return; }
  const c = state.creators.find(x => x.id === state.user.creatorId);
  if(!c){
    $('#view').appendChild(el(`<div class="wrap section-pad"><div class="page-head reveal"><div class="eyebrow">Your account</div><h1>Finish your profile</h1><p>You're logged in as <b style="color:var(--green)">${esc(state.user.email||state.user.name)}</b>. Create your folio so you show up on the map and people can connect with you.</p></div><div style="padding:34px 0;display:flex;gap:12px;flex-wrap:wrap"><a class="btn btn-primary" href="#join">Create my profile ${ic('arrow')}</a><a class="btn btn-ghost" href="#discover">Browse the map</a></div></div>`));
    return;
  }
  const s = c.socials||{}, f = c.followers||{};
  $('#view').appendChild(el(`<div class="wrap section-pad">
    <div class="page-head reveal" style="display:flex;justify-content:space-between;align-items:flex-end;gap:20px;flex-wrap:wrap">
      <div><div class="eyebrow">Your profile</div><h1>Edit your folio</h1><p>Changes go live on your public profile instantly.</p></div>
      <a class="btn btn-ghost" href="#creator?id=${c.id}">View public profile ${ic('arrow')}</a>
    </div>
    <div class="section-pad"><div class="card form-card reveal">
      <form id="acct-form">
        <div class="form-row two"><div><label class="label">Name</label><input class="field" name="name" value="${esc(c.name)}"></div><div><label class="label">City</label><select class="field" name="city">${CITIES.map(x=>`<option ${x===c.city?'selected':''}>${x}</option>`).join('')}</select></div></div>
        <div class="form-row"><label class="label">Role(s)</label><div class="checkrow" id="acct-roles">${ALL_ROLES.map(r=>`<label class="check"><input type="checkbox" value="${esc(r)}" ${c.roles.includes(r)?'checked':''}>${esc(r)}</label>`).join('')}</div></div>
        <div class="form-row two"><div><label class="label">Suburb</label><input class="field" name="area" value="${esc(c.area||'')}"></div><div><label class="label">Day rate</label><input class="field" name="rate" value="${esc(c.rate||'')}"></div></div>
        <div class="form-row two"><div><label class="label">Years experience</label><input class="field" type="number" name="exp" value="${c.exp||0}"></div><div><label class="label">Gear you own</label><input class="field" name="gear" value="${esc((c.gear||[]).join(', '))}"></div></div>
        <div class="form-row"><label class="label">Bio</label><textarea class="field" name="bio">${esc(c.bio||'')}</textarea></div>
        <div class="form-row"><label class="label">Socials &amp; following</label>
          <div class="form-row two" style="margin-bottom:10px"><div><input class="field" name="ig" value="${esc(s.ig||'')}" placeholder="Instagram @"></div><div><input class="field" name="ig_f" type="number" value="${f.ig||''}" placeholder="IG followers"></div></div>
          <div class="form-row two" style="margin-bottom:10px"><div><input class="field" name="tt" value="${esc(s.tt||'')}" placeholder="TikTok @"></div><div><input class="field" name="tt_f" type="number" value="${f.tt||''}" placeholder="TikTok followers"></div></div>
          <div class="form-row two" style="margin:0"><div><input class="field" name="x" value="${esc(s.x||'')}" placeholder="X / Twitter @"></div><div><input class="field" name="li" value="${esc(s.li||'')}" placeholder="LinkedIn"></div></div>
        </div>
        <button class="btn btn-primary btn-block" type="submit">Save changes</button>
      </form>
    </div></div>
  </div>`));
  $('#acct-form').addEventListener('submit', e => {
    e.preventDefault(); const fd=new FormData(e.target);
    const roles=$$('#acct-roles input:checked').map(i=>i.value); if(!roles.length){ toast('Pick at least one role'); return; }
    const clean=v=>(v||'').replace(/^@/,'').trim();
    const upd={ name:fd.get('name'), city:fd.get('city'), area:fd.get('area'), rate:fd.get('rate'), exp:+fd.get('exp')||0, bio:fd.get('bio'), roles, gear:(fd.get('gear')||'').split(',').map(x=>x.trim()).filter(Boolean), tags:roles.slice(0,3), socials:{ig:clean(fd.get('ig')),tt:clean(fd.get('tt')),x:clean(fd.get('x')),li:clean(fd.get('li'))}, followers:{ig:+fd.get('ig_f')||0,tt:+fd.get('tt_f')||0,x:f.x||0} };
    Object.assign(c, upd);
    const ov=LS.get('overrides',{}); ov[c.id]=Object.assign(ov[c.id]||{}, upd); LS.set('overrides',ov);
    if(FB.on && FB.db) FB.db.collection('profiles').doc(c.id).set(upd,{merge:true}).catch(()=>{});
    toast('Profile saved'); location.hash='#creator?id='+c.id;
  });
}

// ============================================================================
//  VIEW: JOIN  (portfolio-first onboarding)
// ============================================================================
function renderJoin(){
  $('#view').appendChild(el(`<div>
    <div class="hero"><div class="aurora-bg"><span class="a1"></span><span class="a2"></span><span class="a3"></span></div>
      <div class="hero-inner"><div class="eyebrow">For creators · always free</div><h1>Build a folio that <em>gets you booked.</em></h1><p>Four fields and you're on the map. Then make it yours — gallery, credits, gear — a profile that feels like your portfolio, not a form. No fee, no cut of your bookings, ever.</p>
        <div class="hero-stats"><div><div class="num"><em>${state.creators.length}+</em></div><div class="lbl">creators on the map</div></div><div><div class="num">${ALL_ROLES.length}</div><div class="lbl">creative roles</div></div><div><div class="num">${CITIES.length}</div><div class="lbl">cities live</div></div></div>
      </div></div>
    <div class="strip"><div class="wrap"><div class="steps">
      <div class="step"><div class="n">01</div><h4>Drop your pin</h4><p>Name, role, city, one piece of work. That's the whole signup.</p></div>
      <div class="step"><div class="n">02</div><h4>Curate your folio</h4><p>Add a gallery, rates and gear. Make the profile feel like you.</p></div>
      <div class="step"><div class="n">03</div><h4>Get discovered</h4><p>Brands find you by role and distance — no cold DMs.</p></div>
      <div class="step"><div class="n">04</div><h4>Get booked</h4><p>Briefs land in your city; book direct. We never take a cut.</p></div>
    </div></div></div>
    <div class="wrap section-pad"><div class="card form-card reveal"><div class="eyebrow">Create your profile</div><h3 style="font-size:26px;margin-bottom:6px">Join the Creative Collective</h3><p style="color:var(--muted);font-size:14px;margin-bottom:24px">Only the first four are required. Everything else builds your folio.</p>
      <form id="join-form">
        <div class="form-row two"><div><label class="label">Name *</label><input class="field" name="name" required placeholder="Your name"></div><div><label class="label">City *</label><select class="field" name="city">${CITIES.map(c=>`<option>${c}</option>`).join('')}</select></div></div>
        <div class="form-row"><label class="label">Your role(s) * — pick all that apply</label><div class="checkrow" id="role-picker">${ALL_ROLES.map(r=>`<label class="check"><input type="checkbox" value="${esc(r)}">${esc(r)}</label>`).join('')}</div></div>
        <div class="form-row two"><div><label class="label">Suburb *</label><input class="field" name="area" required placeholder="Approx suburb — never your address"></div><div><label class="label">Day rate</label><input class="field" name="rate" placeholder="optional"></div></div>
        <div class="form-row two"><div><label class="label">Years experience</label><input class="field" type="number" name="exp" min="0" placeholder="optional"></div><div><label class="label">Gear you own</label><input class="field" name="gear" placeholder="comma separated · optional"></div></div>
        <div class="form-row"><label class="label">Short bio</label><textarea class="field" name="bio" placeholder="What you do and how you work — optional"></textarea></div>
        <div class="form-row"><label class="label">Socials &amp; following — get connected</label>
          <div class="form-row two" style="margin-bottom:10px"><div><input class="field" name="ig" placeholder="Instagram @handle"></div><div><input class="field" name="ig_f" type="number" placeholder="IG followers"></div></div>
          <div class="form-row two" style="margin-bottom:10px"><div><input class="field" name="tt" placeholder="TikTok @handle"></div><div><input class="field" name="tt_f" type="number" placeholder="TikTok followers"></div></div>
          <div class="form-row two" style="margin:0"><div><input class="field" name="x" placeholder="X / Twitter @handle"></div><div><input class="field" name="li" placeholder="LinkedIn handle"></div></div>
        </div>
        <button class="btn btn-primary btn-block" type="submit">Put me on the map →</button>
        <div class="hint" style="text-align:center;margin-top:10px">Free forever. We never take a cut of your bookings.</div>
      </form></div></div>
  </div>`));
  $('#join-form').addEventListener('submit', e => {
    e.preventDefault(); const f=new FormData(e.target);
    const roles=$$('#role-picker input:checked').map(i=>i.value);
    if(!roles.length){ toast('Pick at least one role'); return; }
    const ll = near(f.get('city'), (Math.random()-.5)*.05, (Math.random()-.5)*.05);
    const clean = s => (s||'').replace(/^@/,'').trim();
    const socials = { ig:clean(f.get('ig')), tt:clean(f.get('tt')), x:clean(f.get('x')), li:clean(f.get('li')) };
    const followers = { ig:+f.get('ig_f')||0, tt:+f.get('tt_f')||0, x:0 };
    const creator={ id:'u'+Date.now(), name:f.get('name'), roles, city:f.get('city'), area:f.get('area'), lat:ll.lat, lng:ll.lng, rate:f.get('rate')||'On request', exp:+f.get('exp')||0, verified:false, rating:5.0, jobs:0, top:false, gear:(f.get('gear')||'').split(',').map(s=>s.trim()).filter(Boolean), bio:f.get('bio')||'New to the Creative Collective.', tags:roles.slice(0,3), socials, followers, connections:0 };
    const mine=LS.get('creators',[]); mine.push(creator); LS.set('creators',mine); state.creators.push(creator); state.city=creator.city;
    if (state.user){ state.user.creatorId=creator.id; saveUser(); }   // link profile to account
    toast(`You're on the ${creator.city} map, ${creator.name.split(' ')[0]}!`);
    location.hash='#creator?id='+creator.id;
  });
}

// ============================================================================
//  GLOBAL EFFECTS — loader, mouse glow, scroll reveal, nav hide
// ============================================================================
function hideLoader(){ const l=$('#loader'); if(l) l.classList.add('done'); }
window.addEventListener('load', () => setTimeout(hideLoader, 1500));
setTimeout(hideLoader, 4200); // safety net

// mouse-tracking aurora glow (rAF-smoothed)
(function(){
  const g=$('#glow'); if(!g) return;
  let tx=innerWidth/2, ty=innerHeight*0.3, x=tx, y=ty;
  addEventListener('mousemove', e => { tx=e.clientX; ty=e.clientY; }, { passive:true });
  addEventListener('mouseleave', () => g.style.opacity='0');
  addEventListener('mouseenter', () => g.style.opacity='');
  (function loop(){ x+=(tx-x)*.12; y+=(ty-y)*.12; g.style.transform=`translate(${x}px,${y}px)`; requestAnimationFrame(loop); })();
})();

// scroll reveal
let revealObserver;
function initReveal(){
  if(!('IntersectionObserver' in window)){ $$('.reveal').forEach(n=>n.classList.add('in')); return; }
  revealObserver = revealObserver || new IntersectionObserver((entries)=>{ entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); revealObserver.unobserve(en.target); } }); }, { threshold:.12, rootMargin:'0px 0px -8% 0px' });
  $$('.reveal:not(.in)').forEach(n => revealObserver.observe(n));
}

// nav hide-on-scroll-down
(function(){ let last=0; const nav=$('#nav');
  addEventListener('scroll', () => { const y=scrollY; if(y>last && y>320) nav.classList.add('hide'); else nav.classList.remove('hide'); last=y; }, { passive:true });
})();

// ============================================================================
//  AUTH (prototype, localStorage) + CONNECTIONS
//  NOTE: this is a client-side stand-in so the flows work in the demo.
//  Real accounts need a backend (see Supabase plan) — passwords are NOT stored.
// ============================================================================
function numFmt(n){ return n>=1000 ? (n/1000).toFixed(n>=10000?0:1).replace('.0','')+'k' : ''+n; }
function saveUser(){ LS.set('user', state.user); renderNavCta(); }

function renderNavCta(){
  const box = $('#nav-cta-area'); if(!box) return;
  const savesBtn = `<button class="nav-ico" id="nav-saves" title="Saved" aria-label="Saved">${ic('heart','icn')}</button>`;
  if (state.user){
    const u = state.user;
    box.innerHTML = `${savesBtn}<a class="nav-profile" href="#account" data-nav title="Your profile">${ic('user','icn')}</a><div class="acct-chip" id="acct-chip"><span class="av" style="${avatarBg(u.name)}">${initials(u.name)}</span><span class="nm">${esc(u.name.split(' ')[0])}</span></div>`;
    $('#acct-chip').addEventListener('click', toggleAcctMenu);
  } else {
    box.innerHTML = `${savesBtn}<a class="btn-nav ghost" id="nav-login">Log in</a><button class="btn-nav solid" id="nav-wl">Join waitlist</button>`;
    $('#nav-login').addEventListener('click', () => openAuth('login'));
    $('#nav-wl').addEventListener('click', openWaitlist);
  }
  $('#nav-saves').addEventListener('click', openSaves);
}
function toggleAcctMenu(){
  if ($('#acct-menu')){ $('#acct-menu').remove(); return; }
  const u = state.user;
  const menu = el(`<div class="acct-menu" id="acct-menu">
    <a class="who2">${esc(u.email||u.name)}</a>
    ${u.creatorId?`<a href="#creator?id=${u.creatorId}" data-nav>My profile</a>`:`<a href="#join" data-nav>Finish your profile</a>`}
    <a href="#discover" data-nav>Discover</a>
    <button id="acct-logout">Log out</button>
  </div>`);
  document.body.appendChild(menu);
  $('#acct-logout').addEventListener('click', () => { state.user=null; LS.set('user',null); menu.remove(); renderNavCta(); toast('Logged out'); });
  setTimeout(() => document.addEventListener('click', function h(e){ if(!menu.contains(e.target) && e.target.id!=='acct-chip'){ menu.remove(); document.removeEventListener('click',h);} }), 0);
}

function openAuth(tab='signup'){
  $('#auth')?.remove();
  const m = el(`<div class="modal-scrim" id="auth"><div class="modal">
    <button class="modal-close" id="auth-x">✕</button>
    <div class="modal-head"><button class="modal-tab" data-t="signup">Sign up</button><button class="modal-tab" data-t="login">Log in</button></div>
    <div class="modal-body" id="auth-body"></div>
  </div></div>`);
  document.body.appendChild(m);
  m.addEventListener('click', e => { if(e.target===m) m.remove(); });
  $('#auth-x').addEventListener('click', () => m.remove());
  const paint = (t) => {
    $$('.modal-tab').forEach(b => b.classList.toggle('on', b.dataset.t===t));
    $('#auth-body').innerHTML = t==='signup' ? `
      <h3>Join the scene</h3><div class="sub">Free for creators. No cut of your bookings, ever.</div>
      <form id="auth-form">
        <div class="form-row seg-pick"><label><input type="radio" name="kind" value="creator" checked><span>I'm a creator</span></label><label><input type="radio" name="kind" value="brand"><span>I'm a brand</span></label><label><input type="radio" name="kind" value="host"><span>I host a space</span></label></div>
        <div class="form-row"><input class="field" name="name" placeholder="Name" required></div>
        <div class="form-row"><input class="field" type="email" name="email" placeholder="Email" required></div>
        <div class="form-row"><input class="field" type="password" name="pass" placeholder="Password" required></div>
        <button class="btn btn-primary btn-block" type="submit">Create account</button>
      </form>` : `
      <h3>Welcome back</h3><div class="sub">Log in to connect, book and post.</div>
      <form id="auth-form">
        <div class="form-row"><input class="field" type="email" name="email" placeholder="Email" required></div>
        <div class="form-row"><input class="field" type="password" name="pass" placeholder="Password" required></div>
        <button class="btn btn-primary btn-block" type="submit">Log in</button>
      </form>`;
    $('#auth-form').addEventListener('submit', e => {
      e.preventDefault(); const f=new FormData(e.target);
      const name=f.get('name')||(f.get('email')||'').split('@')[0], email=f.get('email'), pass=f.get('pass'), kind=f.get('kind')||'creator';
      if (FB.on){   // real Firebase auth
        const op = t==='signup'
          ? FB.auth.createUserWithEmailAndPassword(email,pass).then(cr=>cr.user.updateProfile({displayName:name}))
          : FB.auth.signInWithEmailAndPassword(email,pass);
        op.then(()=>{ state.user=Object.assign(state.user||{},{kind}); LS.set('user',state.user); m.remove(); toast(t==='signup'?`Welcome, ${name.split(' ')[0]}`:`Welcome back`); })
          .catch(err=>toast(err.message.replace('Firebase: ','')));
        return;
      }
      state.user = { name, email, kind, creatorId: state.user?.creatorId };   // localStorage fallback
      saveUser(); m.remove();
      toast(t==='signup' ? `Welcome, ${state.user.name.split(' ')[0]} — account created` : `Welcome back, ${state.user.name.split(' ')[0]}`);
      if (t==='signup' && state.user.kind==='creator') setTimeout(()=>{ if(location.hash.indexOf('join')<0) location.hash='#join'; }, 300);
    });
  };
  $$('.modal-tab').forEach(b => b.addEventListener('click', () => paint(b.dataset.t)));
  paint(tab);
}
function requireAuth(then){ if(state.user) then(); else openAuth('signup'); }

// connections
const isFollowing = id => state.following.has(id);
function connectBtnHTML(id, block){ const on=isFollowing(id); return `<button class="btn ${block?'btn-block ':''}btn-connect ${on?'is-on btn-ghost':'btn-primary'}" data-connect="${id}">${on?'Disconnect −':'Connect +'}</button>`; }
function wireConnect(scope=document){
  $$('[data-connect]', scope).forEach(b => b.addEventListener('click', () => {
    const id=b.dataset.connect;
    requireAuth(() => {
      const c=state.creators.find(x=>x.id===id);
      if(isFollowing(id)){ state.following.delete(id); if(c)c.connections=Math.max(0,(c.connections||0)-1); }
      else { state.following.add(id); if(c)c.connections=(c.connections||0)+1; }
      LS.set('following',[...state.following]);
      const on=isFollowing(id);
      $$(`[data-connect="${id}"]`).forEach(btn=>{ btn.textContent=on?'Disconnect −':'Connect +'; btn.classList.toggle('is-on',on); btn.classList.toggle('btn-ghost',on); btn.classList.toggle('btn-primary',!on); });
      $$(`[data-conncount="${id}"]`).forEach(n=>n.textContent=numFmt(c.connections||0));
      toast(on?`Connected with ${c.name.split(' ')[0]}`:`Disconnected`);
    });
  }));
}
const SOCIAL_ICON = { ig:'Instagram', tt:'TikTok', x:'X', li:'LinkedIn' };
const SOCIAL_URL = { ig:h=>`https://instagram.com/${h}`, tt:h=>`https://tiktok.com/@${h}`, x:h=>`https://x.com/${h}`, li:h=>`https://linkedin.com/in/${h}` };
function socialsHTML(c){
  if(!c.socials) return '';
  const f=c.followers||{};
  return `<div class="socials">${Object.entries(c.socials).filter(([k,v])=>v).map(([k,v])=>`<a class="social-link" href="${SOCIAL_URL[k](v)}" target="_blank" rel="noopener">${esc(SOCIAL_ICON[k])}${f[k]?` <span class="ct">${numFmt(f[k])}</span>`:''}</a>`).join('')}</div>`;
}

// ============================================================================
//  FIREBASE (optional real backend — fill window.FIREBASE_CONFIG to enable)
//  Falls back to localStorage when not configured, so the demo always works.
// ============================================================================
const FB = { on:false, auth:null, db:null };
function initFirebase(){
  const cfg = window.FIREBASE_CONFIG;
  if(!cfg || !cfg.apiKey || typeof firebase === 'undefined') return;
  try{
    firebase.initializeApp(cfg);
    FB.auth = firebase.auth(); FB.db = firebase.firestore(); FB.on = true;
    FB.auth.onAuthStateChanged(u => {
      if(u){ state.user = { name:u.displayName || (u.email||'').split('@')[0], email:u.email, uid:u.uid, kind:state.user?.kind||'creator', creatorId:state.user?.creatorId }; }
      else { state.user = null; }
      LS.set('user', state.user); renderNavCta();
    });
    console.info('Firebase connected ✓');
  }catch(e){ console.warn('Firebase init failed:', e.message); }
}

// ============================================================================
//  V1 — credibility chips, availability, stats, reviews, project flip cards
// ============================================================================
function verifyChipsHTML(c){
  const v=c.verify||{}; const chip=(on,l)=>`<span class="vchip ${on?'on':''}">${on?'✓':'·'} ${l}</span>`;
  return `<span class="vchips">${chip(v.id,'ID')}${chip(v.email,'Email')}${chip(v.portfolio,'Portfolio')}</span>`;
}
const AVAIL = { now:['Available now','now'], limited:['Limited availability','limited'], booked:['Booked out','booked'] };
function availabilityHTML(c){ const a=AVAIL[c.availability]||AVAIL.now; const d=c.availDays||{};
  const days=[d.weekdays&&'Weekdays',d.weekends&&'Weekends',d.evenings&&'Evenings'].filter(Boolean).join(' · ');
  return `<div class="avail-ind ${a[1]}"><span class="dot"></span> ${a[0]}${days?`<span class="avail-days">${days}</span>`:''}</div>`; }
function statsGridHTML(c){
  return `<div class="stats-grid">
    <div class="sg"><div class="sg-v">${c.rating.toFixed(1)}★</div><div class="sg-k">${c.reviewCount} reviews</div></div>
    <div class="sg"><div class="sg-v">${c.jobs}</div><div class="sg-k">Bookings</div></div>
    <div class="sg"><div class="sg-v">${esc(c.responseTime)}</div><div class="sg-k">Responds in</div></div>
    <div class="sg"><div class="sg-v">${c.responseRate}%</div><div class="sg-k">Response rate</div></div>
    <div class="sg"><div class="sg-v">${c.repeatPct}%</div><div class="sg-k">Repeat clients</div></div>
    <div class="sg"><div class="sg-v">${c.exp}<small> yrs</small></div><div class="sg-k">Experience</div></div>
  </div>`;
}
function starsHTML(n){ return `<span class="stars">${'★'.repeat(n)}<span class="dim">${'★'.repeat(5-n)}</span></span>`; }
function reviewsHTML(c){
  const rev=c.reviews||[];
  return `<div class="reviews-head"><div><span class="rev-avg">${c.rating.toFixed(1)}</span> ${starsHTML(Math.round(c.rating))} <span class="rev-tot">${c.reviewCount} reviews</span></div>
    <button class="btn btn-ghost btn-sm" id="rev-add">Write a review</button></div>
    <div class="reviews-grid" id="reviews-grid">${rev.map(reviewCardHTML).join('')}</div>`;
}
function reviewCardHTML(r){
  return `<div class="review-card"><div class="rc-stars">${starsHTML(r.stars)}</div><p class="rc-text">${esc(r.text)}</p>
    <div class="rc-by"><b>${esc(r.name)}</b><span>${esc(r.role)} · ${esc(r.date)}</span></div></div>`;
}
function projectFlipHTML(c){
  const ps=c.projects||[];
  return Array.from({length:portfolioCount(c)}, (_,i)=>{ const h=SHOT_H[i%SHOT_H.length], p=ps[i%ps.length];
    return `<div class="flip" tabindex="0"><div class="flip-in">
      <div class="flip-front" style="background-image:url('${shotURL(c.id,i+1,600,h)}')"><span class="flip-cue">${ic('chev','icn')}</span></div>
      <div class="flip-back"><div class="fb-name">${esc(p.name)}</div>
        <dl><div><dt>Client</dt><dd>${esc(p.client)}</dd></div><div><dt>Role</dt><dd>${esc(p.role)}</dd></div><div><dt>Location</dt><dd>${esc(p.location)}</dd></div><div><dt>Year</dt><dd>${p.year}</dd></div></dl>
        <button class="fb-view" data-full="${shotURL(c.id,i+1,1100,Math.round(h*1.6))}">View image →</button>
      </div></div></div>`; }).join('');
}

// ============================================================================
//  V1 — SAVE / COLLECTIONS
// ============================================================================
const saveKey = (type,id) => `${type}:${id}`;
function isSaved(type,id){ const k=saveKey(type,id); return Object.values(state.saves).some(arr=>arr.includes(k)); }
function persistSaves(){ LS.set('saves', state.saves); }
function toggleSave(type,id){
  const k=saveKey(type,id);
  if(isSaved(type,id)){ Object.keys(state.saves).forEach(n=>state.saves[n]=state.saves[n].filter(x=>x!==k)); toast('Removed from saved'); }
  else { state.saves['Saved']=state.saves['Saved']||[]; state.saves['Saved'].push(k); toast('Saved'); }
  persistSaves(); syncSaveBtns(type,id);
}
function syncSaveBtns(type,id){ const on=isSaved(type,id); $$(`[data-save="${type}:${id}"]`).forEach(b=>b.classList.toggle('on',on)); }
function saveBtnHTML(type,id,cls=''){ return `<button class="save-btn ${cls} ${isSaved(type,id)?'on':''}" data-save="${type}:${id}" title="Save" aria-label="Save">${ic('heart','icn')}</button>`; }
function wireSaves(scope=document){ $$('[data-save]', scope).forEach(b=>b.addEventListener('click', e=>{ e.preventDefault(); e.stopPropagation(); const [t,i]=b.dataset.save.split(':'); toggleSave(t,i); })); }
function openSaves(){
  const names=Object.keys(state.saves);
  drawerOpen(`<div class="drawer-pad">
    <div class="drawer-top"><h2>Saved</h2><button class="ico-btn" id="dw-close">${ic('x','icn')}</button></div>
    <button class="btn btn-ghost btn-sm" id="new-coll" style="margin:6px 0 18px">+ New collection</button>
    ${names.map(n=>{ const items=state.saves[n]; return `<div class="coll"><div class="coll-h">${esc(n)} <span>${items.length}</span></div>
      <div class="coll-items">${items.length?items.map(k=>{ const [t,id]=k.split(':'); const o=t==='creator'?state.creators.find(x=>x.id===id):t==='space'?state.spaces.find(x=>x.id===id):state.jobs.find(x=>x.id===id); if(!o)return ''; const nm=o.name||o.title; const img=t==='space'?spaceURL(o):t==='creator'?coverURL(o):null;
        return `<a class="coll-item" href="#${t==='creator'?'creator?id=':t==='space'?'space?id=':'jobs'}${t==='job'?'':id}"><span class="ci-av" style="${img?`background-image:url('${img}')`:avatarBg(nm)}">${img?'':initials(nm)}</span><span class="ci-nm">${esc(nm)}</span></a>`; }).join(''):`<div class="coll-empty">Nothing yet — tap the heart on any creator, space or job.</div>`}</div></div>`; }).join('')}
  </div>`);
  $('#dw-close').addEventListener('click', drawerClose);
  $('#new-coll').addEventListener('click', ()=>{ const n=prompt('Collection name (e.g. Fashion Shoot, Campaign Team)'); if(n&&!state.saves[n]){ state.saves[n]=[]; persistSaves(); openSaves(); } });
  $$('#drawer .coll-item').forEach(a=>a.addEventListener('click', drawerClose));
}

// ============================================================================
//  V1 — COMPARE TRAY (up to 4)
// ============================================================================
function inCompare(id){ return state.compare.has(id); }
function toggleCompare(id){
  if(state.compare.has(id)) state.compare.delete(id);
  else { if(state.compare.size>=4){ toast('Compare up to 4'); return; } state.compare.add(id); }
  LS.set('compare',[...state.compare]); renderCompareTray(); $$(`[data-compare="${id}"]`).forEach(b=>b.classList.toggle('on',inCompare(id)));
}
function compareBtnHTML(id,cls=''){ return `<button class="cmp-btn ${cls} ${inCompare(id)?'on':''}" data-compare="${id}" title="Compare">${ic('scale','icn')}</button>`; }
function wireCompare(scope=document){ $$('[data-compare]', scope).forEach(b=>b.addEventListener('click', e=>{ e.preventDefault(); e.stopPropagation(); toggleCompare(b.dataset.compare); })); }
function renderCompareTray(){
  let tray=$('#cmp-tray');
  if(!state.compare.size){ tray?.remove(); return; }
  const list=[...state.compare].map(id=>state.creators.find(c=>c.id===id)).filter(Boolean);
  if(!tray){ tray=el(`<div class="cmp-tray" id="cmp-tray"></div>`); document.body.appendChild(tray); }
  tray.innerHTML = `<div class="cmp-tray-in"><div class="cmp-thumbs">${list.map(c=>`<div class="cmp-thumb"><span class="ct-av" style="${avatarBg(c.name)}">${initials(c.name)}</span><span class="ct-nm">${esc(c.name.split(' ')[0])}</span><button data-rmcmp="${c.id}" aria-label="Remove">${ic('x','icn')}</button></div>`).join('')}${Array.from({length:4-list.length},()=>`<div class="cmp-thumb empty">+</div>`).join('')}</div>
    <div class="cmp-actions"><button class="btn btn-ghost btn-sm" id="cmp-clear">Clear</button><button class="btn btn-primary btn-sm" id="cmp-go">Compare ${list.length}</button></div></div>`;
  $('#cmp-clear').addEventListener('click', ()=>{ state.compare.clear(); LS.set('compare',[]); renderCompareTray(); $$('[data-compare]').forEach(b=>b.classList.remove('on')); });
  $('#cmp-go').addEventListener('click', openCompare);
  $$('[data-rmcmp]').forEach(b=>b.addEventListener('click',()=>toggleCompare(b.dataset.rmcmp)));
}
function openCompare(){
  const list=[...state.compare].map(id=>state.creators.find(c=>c.id===id)).filter(Boolean);
  const rows=[['Role',c=>c.roles.join(', ')],['Location',c=>`${c.area}, ${c.city}`],['Rate',c=>money(c.rate)],['Responds in',c=>c.responseTime],['Response rate',c=>c.responseRate+'%'],['Reviews',c=>`${c.rating.toFixed(1)}★ (${c.reviewCount})`],['Repeat clients',c=>c.repeatPct+'%'],['Availability',c=>(AVAIL[c.availability]||AVAIL.now)[0]]];
  modalOpen(`<div class="cmp-modal"><div class="modal-top"><h3>Compare creators</h3><button class="ico-btn" id="md-x">${ic('x','icn')}</button></div>
    <div class="cmp-table" style="grid-template-columns:140px repeat(${list.length},1fr)">
      <div class="cmp-cell head"></div>${list.map(c=>`<a class="cmp-cell head creator" href="#creator?id=${c.id}"><span class="ct-av" style="${avatarBg(c.name)}">${initials(c.name)}</span>${esc(c.name)}</a>`).join('')}
      ${rows.map(r=>`<div class="cmp-cell k">${r[0]}</div>${list.map(c=>`<div class="cmp-cell">${esc(String(r[1](c)))}</div>`).join('')}`).join('')}
    </div></div>`);
  $('#md-x').addEventListener('click', modalClose);
  $$('.cmp-cell.creator').forEach(a=>a.addEventListener('click', modalClose));
}

// ============================================================================
//  V1 — STRUCTURED PROJECT ENQUIRY
// ============================================================================
function openEnquiry(creator){
  const team=['Photographer','Videographer','Model','Stylist','Hair & Makeup','Gaffer','Editor','Producer'];
  drawerOpen(`<div class="drawer-pad">
    <div class="drawer-top"><div><div class="eyebrow">Project enquiry</div><h2>${creator?`Brief ${esc(creator.name.split(' ')[0])}`:'Start a project'}</h2></div><button class="ico-btn" id="dw-close">${ic('x','icn')}</button></div>
    <form id="enq-form" class="enq-form">
      <div class="form-row"><label class="label">Project name</label><input class="field" name="project" required placeholder="Summer campaign"></div>
      <div class="form-row two"><div><label class="label">Location</label><select class="field" name="city">${CITIES.map(c=>`<option ${c===(creator?.city)?'selected':''}>${c}</option>`).join('')}</select></div><div><label class="label">Date</label><input class="field" type="date" name="date"></div></div>
      <div class="form-row"><label class="label">Budget</label><input class="field" name="budget" placeholder="$5,000"></div>
      <div class="form-row"><label class="label">Description</label><textarea class="field" name="desc" placeholder="What you're making and what you need on the day…"></textarea></div>
      <div class="form-row"><label class="label">Team required <span class="opt">optional</span></label><div class="checkrow">${team.map(t=>`<label class="check"><input type="checkbox" name="team" value="${t}">${t}</label>`).join('')}</div></div>
      <button class="btn btn-primary btn-block" type="submit">Send enquiry</button>
    </form></div>`);
  $('#dw-close').addEventListener('click', drawerClose);
  $('#enq-form').addEventListener('submit', e=>{ e.preventDefault(); const f=new FormData(e.target);
    const enq={ id:'e'+Date.now(), to:creator?.id||null, project:f.get('project'), city:f.get('city'), date:f.get('date'), budget:f.get('budget'), desc:f.get('desc'), team:f.getAll('team'), at:new Date().toISOString() };
    const all=LS.get('enquiries',[]); all.unshift(enq); LS.set('enquiries',all);
    sbInsert('enquiries', { to_ref:creator?.id||null, to_name:creator?.name||null, from_name:state.user?.name||null, from_email:state.user?.email||null, project:enq.project, location:enq.city, date:enq.date||null, budget:enq.budget, description:enq.desc, team:enq.team });
    drawerClose(); toast(creator?`Enquiry sent to ${creator.name.split(' ')[0]}`:'Enquiry sent');
  });
}

// ============================================================================
//  V1 — WAITLIST (replaces signup language)
// ============================================================================
function waitlistCount(){ return WAITLIST_BASE + (LS.get('waitlist',[]).length); }
function openWaitlist(){
  modalOpen(`<div class="wl-modal"><button class="ico-btn modal-close" id="md-x">${ic('x','icn')}</button>
    <div class="wl-count"><span class="dot"></span> ${waitlistCount().toLocaleString()} founding members waiting</div>
    <h3>Join the waitlist</h3><p class="sub">Be first in when we open your city. Founding members get verified early and featured.</p>
    <form id="wl-form">
      <div class="form-row two"><div><input class="field" name="name" required placeholder="Name"></div><div><input class="field" name="phone" placeholder="Phone"></div></div>
      <div class="form-row"><input class="field" type="email" name="email" required placeholder="Email"></div>
      <div class="form-row two"><div><select class="field" name="city">${CITIES.map(c=>`<option>${c}</option>`).join('')}</select></div><div><input class="field" name="occupation" placeholder="Occupation"></div></div>
      <button class="btn btn-primary btn-block" type="submit">Join waitlist</button>
    </form></div>`);
  $('#md-x').addEventListener('click', modalClose);
  $('#wl-form').addEventListener('submit', e=>{ e.preventDefault(); const f=new FormData(e.target);
    const entry={ name:f.get('name'), phone:f.get('phone'), email:f.get('email'), city:f.get('city'), occupation:f.get('occupation') };
    const all=LS.get('waitlist',[]); all.push({...entry, at:new Date().toISOString()}); LS.set('waitlist',all);
    sbInsert('waitlist', entry);
    modalClose(); toast(`You're on the list — #${waitlistCount().toLocaleString()}`);
  });
}

// ---------- generic drawer / modal helpers ----------
function drawerOpen(html){ const d=$('#drawer'); d.innerHTML=html; d.hidden=false; d.setAttribute('aria-hidden','false'); $('#scrim').hidden=false; wireSaves(d); }
function drawerClose(){ const d=$('#drawer'); d.hidden=true; d.setAttribute('aria-hidden','true'); $('#scrim').hidden=true; }
function modalOpen(html){ $('#vmodal')?.remove(); const m=el(`<div class="modal-scrim" id="vmodal"><div class="modal vmodal-box">${html}</div></div>`); document.body.appendChild(m); m.addEventListener('click',e=>{ if(e.target===m) m.remove(); }); }
function modalClose(){ $('#vmodal')?.remove(); }

// apply locally-submitted reviews on top of seed
(function(){ const ur=LS.get('userReviews',{}); state.creators.forEach(c=>{ if(ur[c.id]){ c.reviews=[...ur[c.id], ...(c.reviews||[])]; c.reviewCount=(c.reviewCount||0)+ur[c.id].length; } }); })();

// ============================================================================
//  SUPABASE — live backend (data + admin auth)
// ============================================================================
const SB = { on:false, client:null, admin:false, user:null };
function initSupabase(){
  if(!window.SUPABASE_URL || typeof supabase === 'undefined') return;
  try{
    SB.client = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
    SB.on = true;
    SB.client.auth.getSession().then(({data})=>{ SB.user = data.session?.user || null; refreshAdminFlag(); });
    SB.client.auth.onAuthStateChange((_e, session)=>{ SB.user = session?.user || null; refreshAdminFlag(); });
    console.info('Supabase connected ✓');
  }catch(e){ console.warn('Supabase init failed:', e.message); }
}
async function refreshAdminFlag(){
  if(!SB.on || !SB.user){ SB.admin=false; renderNavCta(); return; }
  const { data } = await SB.client.from('app_admins').select('email').limit(1);
  SB.admin = !!(data && data.length);
  renderNavCta();
}
// fire-and-forget insert helpers (localStorage stays as the offline mirror)
function sbInsert(table, row){ if(SB.on) SB.client.from(table).insert(row).then(({error})=>{ if(error) console.warn(table, error.message); }); }

// ---------- boot ----------
$('#scrim').addEventListener('click', closeProfile);
document.addEventListener('keydown', e => { if(e.key==='Escape'){ closeProfile(); $('.lightbox')?.remove(); } });
$('#burger')?.addEventListener('click', () => { const open=$('.nav-links').classList.toggle('open'); $('#burger').setAttribute('aria-expanded', open); });
const curSel = $('#cur-select');
if (curSel){ curSel.value = state.cur; curSel.addEventListener('change', () => { state.cur = curSel.value; LS.set('cur', state.cur); router(); }); }
initFirebase();
initSupabase();
renderNavCta();
router();
