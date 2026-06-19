// ============================================================================
//  THE CREATIVE CENTRE — data (Australia)
//  Map-based marketplace for finding creative crew across Australia.
//  Real geo-coordinates so talent plots accurately on the live map.
// ============================================================================

// --- Disciplines, grouped into filter categories ---------------------------
const CATEGORIES = [
  { id: 'talent',    label: 'Talent',                 roles: ['Model', 'Actor', 'Dancer', 'Presenter', 'Extra'] },
  { id: 'camera',    label: 'Camera',                 roles: ['Photographer', 'Videographer', 'Cinematographer / DP', 'Camera Operator', 'Drone Operator', 'Assistant Camera'] },
  { id: 'lighting',  label: 'Lighting & Grip',        roles: ['Gaffer', 'Grip', 'Best Boy', 'Lighting Technician'] },
  { id: 'sound',     label: 'Sound',                  roles: ['Sound Mixer', 'Boom Operator', 'Composer', 'Sound Designer', 'Sound Engineer', 'Audio Engineer'] },
  { id: 'music',     label: 'Music & Studio',         roles: ['Music Producer', 'Recording Engineer', 'Mixing Engineer', 'Mastering Engineer', 'Session Musician', 'Vocalist', 'Beatmaker', 'Songwriter', 'Studio Engineer', 'DJ'] },
  { id: 'glam',      label: 'Hair, Makeup & Style',   roles: ['Makeup Artist', 'Hair Stylist', 'Wardrobe Stylist', 'Nail Artist', 'Groomer'] },
  { id: 'fashion',   label: 'Fashion & Wardrobe',     roles: ['Fashion Designer', 'Textile Designer', 'Pattern Maker', 'Garment Technician', 'Fashion Stylist'] },
  { id: 'direction', label: 'Direction & Production', roles: ['Director', 'Creative Director', 'Art Director', 'Producer', 'Production Assistant', 'Casting Director'] },
  { id: 'post',      label: 'Post-Production',         roles: ['Editor', 'Colorist', 'Retoucher', 'VFX Artist', 'Motion Designer', 'Animator'] },
  { id: 'design',    label: 'Design & Build',          roles: ['Set Designer', 'Prop Stylist', 'Production Designer', 'Illustrator', 'Graphic Designer'] },
  { id: 'events',    label: 'Events & Stage',         roles: ['Event Manager', 'Event Producer', 'MC', 'Host'] },
  { id: 'brand',     label: 'Marketing & Brand',      roles: ['Marketing Manager', 'Content Creator', 'Social Media Manager', 'Brand Strategist', 'Copywriter', 'Publicist', 'PR Manager'] },
];
const ROLE_CATEGORY = {};
CATEGORIES.forEach(c => c.roles.forEach(r => (ROLE_CATEGORY[r] = c.id)));
const ALL_ROLES = CATEGORIES.flatMap(c => c.roles);

// --- Australian cities, with map centre + default zoom ----------------------
const CITY_COORDS = {
  'Sydney':          { lat: -33.8688, lng: 151.2093, zoom: 11.4 },
  'Melbourne':       { lat: -37.8136, lng: 144.9631, zoom: 11.4 },
  'Brisbane':        { lat: -27.4698, lng: 153.0251, zoom: 11.4 },
  'Perth':           { lat: -31.9523, lng: 115.8613, zoom: 11.4 },
  'Adelaide':        { lat: -34.9285, lng: 138.6007, zoom: 11.6 },
  'Gold Coast':      { lat: -28.0167, lng: 153.4000, zoom: 11.4 },
  'Canberra':        { lat: -35.2809, lng: 149.1300, zoom: 11.6 },
  'Newcastle':       { lat: -32.9283, lng: 151.7817, zoom: 11.8 },
  'Hobart':          { lat: -42.8821, lng: 147.3272, zoom: 11.8 },
  'Darwin':          { lat: -12.4634, lng: 130.8456, zoom: 11.8 },
  'Wollongong':      { lat: -34.4248, lng: 150.8931, zoom: 11.8 },
  'Sunshine Coast':  { lat: -26.6500, lng: 153.0667, zoom: 11.4 },
  'Cairns':          { lat: -16.9186, lng: 145.7781, zoom: 12.0 },
  'Geelong':         { lat: -38.1499, lng: 144.3617, zoom: 12.0 },
  'Byron Bay':       { lat: -28.6474, lng: 153.6020, zoom: 12.4 },
  'Townsville':      { lat: -19.2590, lng: 146.8169, zoom: 12.0 },
  'Toowoomba':       { lat: -27.5598, lng: 151.9507, zoom: 12.2 },
  'Ballarat':        { lat: -37.5622, lng: 143.8503, zoom: 12.2 },
  'Bendigo':         { lat: -36.7570, lng: 144.2794, zoom: 12.2 },
  'Launceston':      { lat: -41.4332, lng: 147.1441, zoom: 12.2 },
  'Mackay':          { lat: -21.1411, lng: 149.1860, zoom: 12.2 },
  'Bunbury':         { lat: -33.3271, lng: 115.6414, zoom: 12.2 },
  'Mandurah':        { lat: -32.5269, lng: 115.7217, zoom: 12.2 },
  'Albury':          { lat: -36.0737, lng: 146.9135, zoom: 12.2 },
  'Coffs Harbour':   { lat: -30.2963, lng: 153.1157, zoom: 12.2 },
  'Noosa':           { lat: -26.3949, lng: 153.0908, zoom: 12.4 },
};
const CITIES = Object.keys(CITY_COORDS);

// jitter a creator near a city centre for a believable pin position
function near(city, dLat, dLng) {
  const c = CITY_COORDS[city];
  return { lat: +(c.lat + dLat).toFixed(5), lng: +(c.lng + dLng).toFixed(5) };
}

// --- Seed creators (Australian) --------------------------------------------
// rating 0-5, jobs = completed bookings, top = featured top-performer
const SEED_CREATORS = [
  { id:'c01', name:'Mia Nguyen',       roles:['Model'],                        city:'Sydney',    area:'Surry Hills',   ...near('Sydney',  .010,-.015), rate:'$1,400/day', exp:6,  verified:true,  rating:4.9, jobs:84, top:true,  gear:[],                                          tags:['Editorial','Runway','Beauty'],     bio:'Editorial & runway, repped internationally but books direct here. Equally at home in a studio or shooting golden-hour on Bondi.' },
  { id:'c02', name:'Jackson Lee',      roles:['Photographer'],                 city:'Sydney',    area:'Marrickville',  ...near('Sydney', -.018, .010), rate:'$2,200/day', exp:9,  verified:true,  rating:4.8, jobs:120, top:true, gear:['Sony A7 IV','24-70mm f2.8 GM','Profoto B10'], tags:['Fashion','Portrait','Studio'],     bio:'Fashion and portrait photographer with a daylight studio in the Inner West. Cyc wall and tethered Capture One on every shoot.' },
  { id:'c03', name:'Ruby Fitzgerald',  roles:['Makeup Artist'],                city:'Melbourne', area:'Fitzroy',       ...near('Melbourne', .012, .008), rate:'$850/day',  exp:7,  verified:true,  rating:5.0, jobs:73, top:true,  gear:[],                                          tags:['Beauty','Editorial','SFX'],        bio:'Clean beauty, editorial and SFX on request. Kit travels. Known for skin that reads flawless on camera without looking done.' },
  { id:'c04', name:'Tom Bradley',      roles:['Gaffer'],                       city:'Melbourne', area:'Brunswick',     ...near('Melbourne',-.014,-.012), rate:'$780/day',  exp:13, verified:true,  rating:4.9, jobs:96, top:false, gear:['Aputure 600x ×2','Astera Titan tubes ×8'], tags:['Commercial','Music Video'],        bio:'Commercials and music videos. Can package a small lighting van at short notice across greater Melbourne.' },
  { id:'c05', name:'Aisha Rahman',     roles:['Videographer','Editor'],        city:'Sydney',    area:'Newtown',       ...near('Sydney',  .004, .020), rate:'$1,600/day', exp:7,  verified:false, rating:4.7, jobs:41, top:false, gear:['Sony FX3','Ronin RS3','MacBook Pro M3 Max'], tags:['Documentary','Brand Film'],     bio:'Run-and-gun docs and brand films, shoot-to-edit. One contact from brief to delivery.' },
  { id:'c06', name:'Liam O\'Connor',   roles:['Sound Mixer','Boom Operator'],  city:'Brisbane',  area:'West End',      ...near('Brisbane', .008,-.010), rate:'$720/day',  exp:10, verified:true,  rating:4.9, jobs:88, top:false, gear:['Sound Devices MixPre-6','Sennheiser MKH 416','Wireless lav ×4'], tags:['Film','TV','Location'], bio:'Location sound for film & TV. Calm on set, clean tracks, fast turnarounds.' },
  { id:'c07', name:'Priya Anand',      roles:['Creative Director'],            city:'Melbourne', area:'Collingwood',   ...near('Melbourne', .006,-.006), rate:'$2,400/day',exp:12, verified:true,  rating:5.0, jobs:64, top:true,  gear:[],                                          tags:['Campaign','Branding'],             bio:'Builds campaign worlds end-to-end — decks, casting, on-set direction. Past lives at two of Melbourne\'s best agencies.' },
  { id:'c08', name:'Noah Williams',    roles:['Model'],                        city:'Gold Coast',area:'Burleigh Heads',...near('Gold Coast',.010,.012), rate:'$900/day',  exp:3,  verified:false, rating:4.6, jobs:22, top:false, gear:[],                                          tags:['Commercial','Surf','Lifestyle'],   bio:'Commercial, surf and lifestyle. Strong in water and movement work.' },
  { id:'c09', name:'Sofia Romano',     roles:['Wardrobe Stylist'],             city:'Sydney',    area:'Paddington',    ...near('Sydney', -.006,-.008), rate:'$1,100/day', exp:8,  verified:true,  rating:4.8, jobs:59, top:false, gear:[],                                          tags:['Fashion','E-comm'],                bio:'Fashion editorial and e-comm with deep showroom relationships across Sydney.' },
  { id:'c10', name:'Daniel Tan',       roles:['Colorist','Editor'],            city:'Sydney',    area:'Alexandria',    ...near('Sydney', -.012, .004), rate:'$1,300/day', exp:11, verified:true,  rating:4.9, jobs:77, top:false, gear:['DaVinci Resolve suite','Calibrated grade monitor'], tags:['Grade','Finishing'], bio:'Grade and finish for commercials and music videos. Remote sessions available nationwide.' },
  { id:'c11', name:'Indi Walker',      roles:['Dancer'],                       city:'Melbourne', area:'St Kilda',      ...near('Melbourne',-.008, .014), rate:'$650/day',  exp:6,  verified:false, rating:4.7, jobs:34, top:false, gear:[],                                          tags:['Commercial','Music Video'],        bio:'Contemporary and commercial. Can bring a trained crew for ensemble work.' },
  { id:'c12', name:'Hugo Mertens',     roles:['Drone Operator','Cinematographer / DP'], city:'Perth', area:'Fremantle', ...near('Perth', .010,-.008), rate:'$1,800/day',exp:9, verified:true,  rating:4.9, jobs:51, top:false, gear:['DJI Inspire 3','Sony A7S III','Ronin 4D'], tags:['Aerial','CASA Licensed'], bio:'CASA-licensed remote pilot and ground-unit DP. Aerials plus ground in one booking.' },
  { id:'c13', name:'Amara Okeke',      roles:['Hair Stylist'],                 city:'Brisbane',  area:'New Farm',      ...near('Brisbane',-.006, .008), rate:'$700/day',  exp:5,  verified:false, rating:4.8, jobs:29, top:false, gear:[],                                          tags:['Afro & Textured','Editorial'],     bio:'Afro and textured hair, wigs, editorial. Kit always on hand.' },
  { id:'c14', name:'Ella Petersen',    roles:['Retoucher'],                    city:'Melbourne', area:'Richmond',      ...near('Melbourne', .002, .010), rate:'$70/image', exp:7,  verified:true,  rating:5.0, jobs:140, top:true, gear:['Wacom Cintiq','Calibrated display'],        tags:['Beauty','High-end'],               bio:'High-end beauty and skin retouch with same-week turnaround. Trusted by Melbourne\'s top studios.' },
  { id:'c15', name:'Marcus Reid',      roles:['Producer'],                     city:'Sydney',    area:'Redfern',       ...near('Sydney',  .000,-.004), rate:'$2,000/day',exp:14, verified:true,  rating:4.9, jobs:103, top:false,gear:[],                                          tags:['Commercial','Line Producer'],      bio:'Line producing commercials and content across NSW. Permits, insurance and logistics handled.' },
  { id:'c16', name:'Grace Thompson',   roles:['Set Designer','Prop Stylist'],  city:'Melbourne', area:'Abbotsford',    ...near('Melbourne', .016, .002), rate:'$980/day',  exp:10, verified:true,  rating:4.8, jobs:47, top:false, gear:['Workshop access'],                          tags:['Build','Stills'],                  bio:'Builds and styles sets for stills and motion. Workshop in Abbotsford.' },
  { id:'c17', name:'Jye Anderson',     roles:['Grip'],                         city:'Brisbane',  area:'Newstead',      ...near('Brisbane', .004, .002), rate:'$640/day',  exp:8,  verified:false, rating:4.7, jobs:38, top:false, gear:['Dana dolly','C-stands','Flags & nets'],     tags:['Rigging','Dolly'],                 bio:'Dolly, rigging, all things grip. Truck available across SE Queensland.' },
  { id:'c18', name:'Talia Brooks',     roles:['Model'],                        city:'Melbourne', area:'South Yarra',   ...near('Melbourne',-.004,-.008), rate:'$1,300/day',exp:7,  verified:true,  rating:4.9, jobs:69, top:true,  gear:[],                                          tags:['Beauty','Commercial'],             bio:'Beauty and commercial with international tear sheets. Reliable, expressive, fast to direction.' },
  { id:'c19', name:'Kai Edwards',      roles:['Motion Designer','VFX Artist'], city:'Sydney',    area:'Chippendale',   ...near('Sydney', -.002, .012), rate:'$1,200/day',exp:6,  verified:false, rating:4.8, jobs:44, top:false, gear:['After Effects','Cinema 4D','Houdini'],      tags:['Mograph','Titles'],                bio:'Title design, mograph and light VFX cleanup for ads and music.' },
  { id:'c20', name:'Isla Murphy',      roles:['Casting Director'],             city:'Sydney',    area:'Bondi',         ...near('Sydney',  .020, .026), rate:'$1,000/job',exp:9,  verified:true,  rating:4.9, jobs:62, top:false, gear:[],                                          tags:['Street','Agency'],                 bio:'Street and agency casting with a deep talent network across Sydney.' },
  { id:'c21', name:'Oliver Chen',      roles:['Photographer'],                 city:'Perth',     area:'Leederville',   ...near('Perth', -.006, .006), rate:'$1,900/day',exp:12, verified:true,  rating:5.0, jobs:91, top:true,  gear:['Phase One IQ4','Profoto Pro-11'],          tags:['Advertising','Still Life'],        bio:'Advertising stills and luxury still life. Capture One tethered, immaculate lighting.' },
  { id:'c22', name:'Zara Haddad',      roles:['Art Director'],                 city:'Brisbane',  area:'Fortitude Valley',...near('Brisbane',-.002,-.004), rate:'$1,500/day',exp:8, verified:false, rating:4.7, jobs:36, top:false, gear:[],                                          tags:['Album Art','Campaign'],            bio:'Album art, campaigns and set concepts with a bold contemporary visual language.' },
  { id:'c23', name:'Charlie Walsh',    roles:['Director'],                     city:'Melbourne', area:'Carlton',       ...near('Melbourne', .010,-.002), rate:'$3,000/day',exp:13, verified:true,  rating:5.0, jobs:58, top:true,  gear:[],                                          tags:['Commercial','Narrative'],          bio:'Commercial and narrative director. Story-led, performance-focused, award-listed.' },
  { id:'c24', name:'Maya Solomon',     roles:['Producer','Casting Director'],  city:'Adelaide',  area:'Bowden',        ...near('Adelaide', .006, .006), rate:'$1,400/day',exp:9,  verified:true,  rating:4.8, jobs:40, top:false, gear:[],                                          tags:['Content','Casting'],               bio:'Content production and casting across South Australia. Calm, organised, well-connected.' },
  { id:'c25', name:'Finn Gallagher',   roles:['Cinematographer / DP'],         city:'Gold Coast',area:'Mermaid Beach', ...near('Gold Coast',-.006,.004), rate:'$2,100/day',exp:11, verified:true,  rating:4.9, jobs:67, top:false, gear:['ARRI Alexa Mini LF','Signature Primes'],   tags:['Commercial','Film'],               bio:'Cinematographer for commercials and film. Owns an Alexa Mini LF package.' },
  { id:'c26', name:'Sienna Park',      roles:['Makeup Artist','Hair Stylist'], city:'Perth',     area:'Mount Lawley',  ...near('Perth',  .004,-.002), rate:'$820/day',  exp:6,  verified:false, rating:4.8, jobs:31, top:false, gear:[],                                          tags:['Beauty','Bridal','Editorial'],     bio:'Beauty, bridal and editorial. Double-threat hair and makeup for lean crews.' },

  // ---- Brisbane (flooded for build preview) ----
  { id:'c27', name:'Kai Tupou',        roles:['Photographer'],                 city:'Brisbane',  area:'West End',       ...near('Brisbane',-.009,.012), rate:'$1,500/day', exp:7,  verified:true,  rating:4.9, jobs:72, top:true,  gear:['Canon R5','RF 50mm f1.2'],            tags:['Portrait','Music'],            bio:'Portrait and music photographer working the Brisbane scene. Fast, candid, story-driven.' },
  { id:'c28', name:'Bella Hartley',    roles:['Model'],                        city:'Brisbane',  area:'New Farm',       ...near('Brisbane',.011,-.004), rate:'$1,000/day', exp:4,  verified:true,  rating:4.8, jobs:38, top:false, gear:[],                                     tags:['Commercial','Editorial'],      bio:'Commercial and editorial model based in New Farm. Versatile, expressive, reliable.' },
  { id:'c29', name:'Marcus Devlin',    roles:['Music Producer','Mixing Engineer'], city:'Brisbane', area:'Fortitude Valley', ...near('Brisbane',.002,.009), rate:'$600/day', exp:9, verified:true, rating:5.0, jobs:94, top:true, gear:['SSL console','Neumann U87','Pro Tools HDX'], tags:['Hip-hop','R&B','Mix'], bio:'Producer and mix engineer. Runs a tracking room in the Valley — beats, vocals, full mixes.' },
  { id:'c30', name:'Jess Lombardi',    roles:['Recording Engineer','Studio Engineer'], city:'Brisbane', area:'Newstead', ...near('Brisbane',.006,.003), rate:'$520/day', exp:6, verified:false, rating:4.8, jobs:47, top:false, gear:['UA Apollo x8','Various mics'], tags:['Tracking','Live'], bio:'Tracking and studio engineer. Comfortable on bands, vocalists and podcasts alike.' },
  { id:'c31', name:'Tane Wiremu',      roles:['Videographer','Editor'],        city:'Brisbane',  area:'South Brisbane', ...near('Brisbane',-.004,-.006), rate:'$1,300/day',exp:8,  verified:true,  rating:4.9, jobs:61, top:false, gear:['Sony FX6','Ronin'],                   tags:['Music Video','Brand'],         bio:'Music videos and brand films across SE QLD. Shoot-to-edit, quick turnarounds.' },
  { id:'c32', name:'Harper Quinn',     roles:['Makeup Artist'],                city:'Brisbane',  area:'Paddington',     ...near('Brisbane',.008,.001), rate:'$700/day',  exp:5,  verified:false, rating:4.7, jobs:33, top:false, gear:[],                                     tags:['Beauty','Festival'],           bio:'Beauty and festival makeup. Bold colour work for music and editorial.' },
  { id:'c33', name:'Diego Santos',     roles:['Dancer','Choreographer'],       city:'Brisbane',  area:'Woolloongabba',  ...near('Brisbane',-.002,.004), rate:'$620/day', exp:7, verified:true, rating:4.9, jobs:44, top:false, gear:[], tags:['Commercial','Hip-hop'], bio:'Dancer and choreographer. Brings a crew for music video ensemble work.' },
  { id:'c34', name:'Sophie Nguyen',    roles:['Producer'],                     city:'Brisbane',  area:'Teneriffe',      ...near('Brisbane',.009,.006), rate:'$1,600/day',exp:11, verified:true,  rating:4.8, jobs:58, top:false, gear:[],                                     tags:['Commercial','Music Video'],    bio:'Line producer across QLD. Permits, crew, logistics handled end to end.' },
  { id:'c35', name:'Ravi Naidu',       roles:['Beatmaker','Music Producer'],   city:'Brisbane',  area:'Highgate Hill',  ...near('Brisbane',-.006,.000), rate:'$450/day', exp:5, verified:false, rating:4.8, jobs:51, top:false, gear:['MPC Live II','Ableton'], tags:['Beats','Trap','Lo-fi'], bio:'Beatmaker and producer. Sells packs, does custom production, loves a late session.' },

  // ---- Gold Coast (flooded for build preview) ----
  { id:'c36', name:'Ocean Bailey',     roles:['Model','Presenter'],            city:'Gold Coast',area:'Burleigh Heads', ...near('Gold Coast',.006,-.005),rate:'$950/day', exp:5, verified:true, rating:4.9, jobs:49, top:true, gear:[], tags:['Surf','Lifestyle','Swim'], bio:'Surf, swim and lifestyle. In and out of the water all day, no problem.' },
  { id:'c37', name:'Leila Haddad',     roles:['Photographer','Retoucher'],     city:'Gold Coast',area:'Palm Beach',     ...near('Gold Coast',-.003,.007),rate:'$1,400/day',exp:8, verified:true, rating:4.8, jobs:55, top:false, gear:['Nikon Z9','Profoto'], tags:['Swimwear','Editorial'], bio:'Swimwear and editorial photographer. Owns a light-filled space near Palm Beach.' },
  { id:'c38', name:'Cody Fraser',      roles:['Drone Operator','Videographer'],city:'Gold Coast',area:'Broadbeach',     ...near('Gold Coast',.009,.002), rate:'$1,200/day',exp:6, verified:false,rating:4.7, jobs:36, top:false, gear:['DJI Mavic 3 Cine','FX30'], tags:['Aerial','Real Estate','Travel'], bio:'CASA-licensed drone op and shooter. Coastline aerials are my bread and butter.' },
  { id:'c39', name:'Mia Tanaka',       roles:['Makeup Artist','Hair Stylist'], city:'Gold Coast',area:'Mermaid Waters', ...near('Gold Coast',-.005,-.003),rate:'$750/day', exp:6, verified:true, rating:5.0, jobs:42, top:false, gear:[], tags:['Bridal','Editorial','Beauty'], bio:'Bridal, beauty and editorial. Calm, fast, kit always ready.' },
  { id:'c40', name:'Jaylen Brooks',    roles:['Music Producer','Vocalist'],    city:'Gold Coast',area:'Southport',      ...near('Gold Coast',.003,.006), rate:'$500/day', exp:4, verified:false,rating:4.8, jobs:39, top:false, gear:['Logic Pro','SM7B'], tags:['R&B','Pop','Topline'], bio:'Producer and vocalist. Toplines, hooks and full productions from a Southport room.' },
  { id:'c41', name:'Ana Rivera',       roles:['Wardrobe Stylist'],             city:'Gold Coast',area:'Burleigh Heads', ...near('Gold Coast',.004,-.008),rate:'$900/day', exp:7, verified:true, rating:4.8, jobs:34, top:false, gear:[], tags:['Swim','Resort','Campaign'], bio:'Resort and swim styling for campaigns up and down the coast.' },
  { id:'c42', name:'Zane Whitfield',   roles:['Recording Engineer','Mastering Engineer'], city:'Gold Coast', area:'Nerang', ...near('Gold Coast',-.008,.010), rate:'$540/day', exp:10, verified:true, rating:4.9, jobs:63, top:true, gear:['Avid S6','Manley masters'], tags:['Mix','Master','Live'], bio:'Mix and mastering engineer with a purpose-built room in Nerang. Releases that translate everywhere.' },
];

// --- Seed jobs (brand-posted briefs) ---------------------------------------
const SEED_JOBS = [
  { id:'j01', brand:'Aje Athletica', title:'Activewear campaign — model + photographer', city:'Sydney',    roles:['Model','Photographer'],                          date:'2026-07-04', budget:'$8,000 total',  usage:'Social + web, 12 months', brief:'Sunrise activewear shoot at Bondi. Need a model comfortable in movement and a photographer who shoots fast in changing light.', posted:'2026-06-15' },
  { id:'j02', brand:'Mecca Beauty',  title:'Beauty content — MUA + retoucher',           city:'Melbourne', roles:['Makeup Artist','Retoucher'],                     date:'2026-06-30', budget:'$5,500 total',  usage:'Web + OOH, 6 months',    brief:'Skin-forward beauty story, 6 looks. Same-week retouch turnaround required.', posted:'2026-06-16' },
  { id:'j03', brand:'Tourism WA',    title:'Brand film — full crew',                     city:'Perth',     roles:['Cinematographer / DP','Gaffer','Sound Mixer','Producer'], date:'2026-07-12', budget:'$32,000 total', usage:'All media, perpetuity', brief:'Two-day brand film across Fremantle and the coast. Small package crew, some aerial.', posted:'2026-06-17' },
];

// --- Seed gear listings (Stage 3) — with category + visual ------------------
// img = picsum seed (royalty-free); swap for verified product shots later.
const SEED_GEAR = [
  { id:'g01', owner:'Jackson Lee',   city:'Sydney',    cat:'Camera',   brand:'Sony',     model:'A7 IV body',              rate:'$120/day', deposit:'$800',   area:'Marrickville', img:'gear-sony-a7iv' },
  { id:'g02', owner:'Tom Bradley',   city:'Melbourne', cat:'Lighting', brand:'Aputure',  model:'600x + softbox',          rate:'$95/day',  deposit:'$500',   area:'Brunswick',    img:'gear-aputure-600x' },
  { id:'g03', owner:'Hugo Mertens',  city:'Perth',     cat:'Drone',    brand:'DJI',      model:'Inspire 3 (pilot opt.)',  rate:'$320/day', deposit:'$2,000', area:'Fremantle',    img:'gear-dji-inspire3' },
  { id:'g04', owner:'Jye Anderson',  city:'Brisbane',  cat:'Grip',     brand:'Dana',     model:'Dana Dolly kit',          rate:'$110/day', deposit:'$600',   area:'Newstead',     img:'gear-dana-dolly' },
  { id:'g05', owner:'Finn Gallagher',city:'Gold Coast',cat:'Camera',   brand:'ARRI',     model:'Alexa Mini LF package',   rate:'$650/day', deposit:'$5,000', area:'Mermaid Beach',img:'gear-arri-alexa' },
  { id:'g06', owner:'Oliver Chen',   city:'Perth',     cat:'Lens',     brand:'Profoto',  model:'Pro-11 + 2 heads',        rate:'$180/day', deposit:'$1,200', area:'Leederville',  img:'gear-profoto-pro11' },
  { id:'g07', owner:'Liam O\'Connor',city:'Brisbane',  cat:'Audio',    brand:'Sound Devices', model:'MixPre-6 + 416 + lavs', rate:'$130/day', deposit:'$700', area:'West End',     img:'gear-sound-devices' },
  { id:'g08', owner:'Aisha Rahman',  city:'Sydney',    cat:'Camera',   brand:'Sony',     model:'FX3 cine kit',            rate:'$200/day', deposit:'$1,500', area:'Newtown',      img:'gear-sony-fx3' },
];

// --- Spaces / locations for hire (Stage 2 vertical) ------------------------
const SPACE_TYPES = ['Photo Studio','Daylight Studio','Warehouse','Gallery','Rooftop','Heritage Home','Event Space','Sound Stage','Loft','Garden / Outdoor'];

// rate = hourly; day = day rate; cap = capacity; size in m²; instant = instant-book
const SEED_SPACES = [
  { id:'s01', name:'Cyc & Co. Studio',        type:'Photo Studio',    city:'Sydney',    area:'Alexandria',     ...near('Sydney', -.013, .005), rate:'$140/hr', day:'$900/day',  cap:'25', size:'180', host:'Cyc & Co.',        rating:4.9, reviews:128, instant:true,  img:'space-cyc-syd',   amenities:['Cyc wall','Natural light','Blackout','Drive-in access','Parking','Makeup room'] },
  { id:'s02', name:'Warehouse 17',            type:'Warehouse',       city:'Melbourne', area:'Brunswick',      ...near('Melbourne',-.015,-.010), rate:'$120/hr', day:'$780/day',  cap:'80', size:'420', host:'North Studios',     rating:4.8, reviews:74,  instant:false, img:'space-wh17-mel',  amenities:['Drive-in access','3-phase power','Blackout','Parking','High ceilings','Green room'] },
  { id:'s03', name:'The Glasshouse',          type:'Daylight Studio', city:'Sydney',    area:'Marrickville',   ...near('Sydney',  .006,-.012), rate:'$110/hr', day:'$720/day',  cap:'20', size:'150', host:'Jackson Lee',       rating:5.0, reviews:96,  instant:true,  img:'space-glass-syd', amenities:['Natural light','Cyc wall','Makeup room','Fast WiFi','Kitchen'] },
  { id:'s04', name:'Rooftop 360',             type:'Rooftop',         city:'Brisbane',  area:'Fortitude Valley',...near('Brisbane',.003,.006), rate:'$160/hr', day:'$1,000/day',cap:'60', size:'300', host:'Valley Collective', rating:4.7, reviews:51,  instant:false, img:'space-roof-bne',  amenities:['City skyline','Power','Lift access','Bar','Sunset facing'] },
  { id:'s05', name:'Salt Gallery',            type:'Gallery',         city:'Melbourne', area:'Collingwood',    ...near('Melbourne',.008,-.004), rate:'$95/hr',  day:'$620/day',  cap:'40', size:'160', host:'Salt Projects',     rating:4.8, reviews:63,  instant:true,  img:'space-salt-mel',  amenities:['White walls','Natural light','Track lighting','Street access','WiFi'] },
  { id:'s06', name:'The Heritage Terrace',    type:'Heritage Home',   city:'Sydney',    area:'Paddington',     ...near('Sydney', -.004,-.009), rate:'$130/hr', day:'$850/day',  cap:'15', size:'220', host:'Sofia Romano',      rating:4.9, reviews:88,  instant:false, img:'space-herit-syd', amenities:['Period features','Natural light','Garden','Kitchen','Parking'] },
  { id:'s07', name:'Soundstage West',         type:'Sound Stage',     city:'Perth',     area:'Osborne Park',   ...near('Perth',  .012, .010), rate:'$210/hr', day:'$1,400/day',cap:'120',size:'640', host:'West Film Base',    rating:4.9, reviews:42,  instant:false, img:'space-stage-per', amenities:['Cyc wall','Soundproofed','3-phase power','Drive-in access','Green room','Parking'] },
  { id:'s08', name:'Mermaid Loft',            type:'Loft',            city:'Gold Coast',area:'Mermaid Beach',  ...near('Gold Coast',-.005,.003), rate:'$90/hr',  day:'$580/day',  cap:'18', size:'120', host:'Finn Gallagher',    rating:4.8, reviews:37,  instant:true,  img:'space-loft-gld',  amenities:['Natural light','Ocean views','Styled furniture','WiFi','Parking'] },
  { id:'s09', name:'Abbotsford Workshop',     type:'Warehouse',       city:'Melbourne', area:'Abbotsford',     ...near('Melbourne',.016,.003), rate:'$100/hr', day:'$640/day',  cap:'50', size:'350', host:'Grace Thompson',    rating:4.7, reviews:29,  instant:false, img:'space-abbo-mel',  amenities:['Build space','Drive-in access','3-phase power','Workshop tools','Parking'] },
  { id:'s10', name:'The Bowden Space',        type:'Event Space',     city:'Adelaide',  area:'Bowden',         ...near('Adelaide', .005, .007), rate:'$85/hr',  day:'$520/day',  cap:'90', size:'380', host:'Maya Solomon',      rating:4.8, reviews:46,  instant:true,  img:'space-bowd-adl',  amenities:['Open plan','Natural light','Kitchen','AV system','Parking','Wheelchair access'] },
  { id:'s11', name:'Newstead Daylight',       type:'Daylight Studio', city:'Brisbane',  area:'Newstead',       ...near('Brisbane',.005,.001), rate:'$105/hr', day:'$690/day',  cap:'22', size:'165', host:'Zara Haddad',       rating:4.9, reviews:58,  instant:true,  img:'space-news-bne',  amenities:['Floor-to-ceiling windows','Cyc wall','Makeup room','Kitchen','WiFi'] },
  { id:'s12', name:'Fremantle Garden Studio', type:'Garden / Outdoor',city:'Perth',     area:'Fremantle',      ...near('Perth', -.004, .004), rate:'$80/hr',  day:'$500/day',  cap:'35', size:'500', host:'Hugo Mertens',      rating:4.7, reviews:33,  instant:false, img:'space-gard-per',  amenities:['Outdoor','Greenery','Power access','Parking','Pet friendly','Restrooms'] },
];

// --- socials, followers & connections (build-stage demo defaults) ----------
function handleFrom(name){ return name.toLowerCase().replace(/[^a-z]+/g,''); }
SEED_CREATORS.forEach((c) => {
  const h = handleFrom(c.name);
  c.socials   = c.socials   || { ig:h, tt:h, x:h, li:c.name.replace(/\s+/g,'-').toLowerCase() };
  const base  = 1500 + (c.jobs * 137 % 52000);
  c.followers = c.followers || { ig: base, tt: Math.round(base*0.55), x: Math.round(base*0.18) };
  c.connections = c.connections || (240 + (c.jobs * 9 % 4200));
});
SEED_SPACES.forEach((s) => { s.socials = s.socials || { ig: handleFrom(s.name), tt:'', x:'', li:'' }; });

// --- Blog / The Scene — newsletter of underground AU creative culture ------
const SEED_POSTS = [
  { id:'p01', title:'Brisbane is quietly becoming the country’s best music city', cat:'Music', author:'The Scene', date:'2026-06-14', read:6, img:'post-bne-music', excerpt:'Cheap rent, warehouse venues and a tight producer network. Why the Valley and West End are pulling talent north.', body:'Something’s shifting up north. While Sydney prices out its venues and Melbourne nurses a hangover, Brisbane has quietly assembled the ingredients of a real scene...' },
  { id:'p02', title:'The rise of the one-person crew', cat:'Production', author:'The Scene', date:'2026-06-10', read:4, img:'post-onecrew', excerpt:'Shoot, light, record and edit — the multi-hyphenate is rewriting how small brands make work.', body:'The day rate that used to buy you a single specialist now buys a whole pipeline...' },
  { id:'p03', title:'Gold Coast: more than a backdrop', cat:'Locations', author:'The Scene', date:'2026-06-05', read:5, img:'post-gc', excerpt:'Swim, surf and resort shoots are booming — and the local crew base is finally catching up to the postcard.', body:'For years the Gold Coast was a place you flew into for the light and flew out of with the footage...' },
  { id:'p04', title:'Underground studios you can actually book', cat:'Spaces', author:'The Scene', date:'2026-05-29', read:7, img:'post-studios', excerpt:'From a Nerang mastering room to a Brunswick warehouse — the rooms the scene is actually using.', body:'The best rooms were never on the big directories. They got passed around on group chats...' },
  { id:'p05', title:'How to price yourself without killing the scene', cat:'Business', author:'The Scene', date:'2026-05-22', read:5, img:'post-pricing', excerpt:'Undercutting feels smart until it isn’t. A grounded take on rates for emerging creatives.', body:'There’s a race to the bottom happening in every city, and it helps no one...' },
  { id:'p06', title:'The connectors: meet the producers holding cities together', cat:'People', author:'The Scene', date:'2026-05-16', read:6, img:'post-connectors', excerpt:'Every scene runs on a handful of people who know everyone. We profile five of them.', body:'You’ve met them, or you’ve been booked by them. The producer who somehow knows the gaffer, the studio and the caterer...' },
];
const BLOG_CATS = ['All','Music','Production','Locations','Spaces','Business','People'];

// ============================================================================
//  V1 — credibility, responsiveness, availability, reviews, projects
// ============================================================================
const REVIEWER_POOL = [
  ['Harriet Cole','Brand Manager, Aje'], ['Sam Okoro','Producer, Mavin'], ['Lucy Tran','Founder, Mecca Lab'],
  ['Dev Patel','Creative Director'], ['Mia Sanderson','Marketing Lead, Tourism WA'], ['Jack Reilly','Photographer'],
  ['Nadia Hassan','Casting Director'], ['Tom Whitfield','Agency Producer'], ['Bianca Ferraro','Stylist'],
  ['Eli Moreau','Music Supervisor'], ['Grace Lin','E-comm Manager'], ['Owen Clarke','Label A&R'],
];
const REVIEW_TEXT = [
  'Absolute professional. Turned a tight brief into something we were genuinely proud of — on time, on budget, zero drama.',
  'One of the easiest bookings we’ve done. Communicated the whole way through and over-delivered on the day.',
  'Brought real craft and calm to a chaotic shoot. We’ve already booked them again.',
  'Understood the vision immediately and elevated it. Couldn’t recommend more highly for any campaign.',
  'Fast, talented and lovely to work with. The kind of creative you build a long relationship with.',
  'Delivered exactly what the brand needed and then some. Our go-to from now on.',
];
const PROJECT_POOL = [
  ['Summer Capsule','Aje Athletica','Lead','Bondi, NSW'], ['Skin Story','Mecca Beauty','Beauty','Melbourne, VIC'],
  ['Night Shift','Mavin Records','Music Video','Brisbane, QLD'], ['Coastline','Tourism WA','Brand Film','Fremantle, WA'],
  ['Resort 26','Swim Co.','Campaign','Gold Coast, QLD'], ['The Valley','Independent','Editorial','Fitzroy, VIC'],
  ['First Light','Tech Startup','Content','Sydney, NSW'], ['Heritage','Local Council','Documentary','Adelaide, SA'],
];

function pick(arr, seed){ return arr[Math.abs(seed) % arr.length]; }

SEED_CREATORS.forEach((c) => {
  const seed = hashCode(c.id);
  // compact credibility — chips beside the name
  c.verify = c.verify || { id: c.verified, email: true, portfolio: c.jobs > 0 };
  // responsiveness
  const rt = ['1h','2h','3h','4h','same day'];
  c.responseTime = c.responseTime || pick(rt, seed + (c.verified?0:2));
  c.responseRate = c.responseRate || (88 + (seed % 12));               // 88–99%
  c.repeatPct    = c.repeatPct    || (22 + (seed % 45));               // 22–66%
  // availability
  const av = ['now','limited','booked'];
  c.availability = c.availability || (c.jobs>90?'limited':(c.jobs<30?'now':pick(av, seed)));
  c.availDays    = c.availDays    || { weekdays:true, weekends:(seed%2===0), evenings:(seed%3!==0) };
  // reviews
  const nrev = 3 + (seed % 5);
  c.reviews = c.reviews || Array.from({length:nrev}, (_,i)=>{
    const r = pick(REVIEWER_POOL, seed+i*7); const stars = (i%6===0)?4:5;
    return { name:r[0], role:r[1], stars, date: ['2026-05','2026-04','2026-03','2026-02'][i%4], text: pick(REVIEW_TEXT, seed+i*3) };
  });
  c.reviewCount = c.reviewCount || (nrev + (seed % 20));
  // portfolio project context (per shot)
  c.projects = c.projects || Array.from({length:9}, (_,i)=>{
    const p = pick(PROJECT_POOL, seed+i*5);
    return { name:p[0], client:p[1], role:p[2]||c.roles[0], location:p[3], year: 2026 - (i%4) };
  });
});
function hashCode(s){ let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))|0; return h; }

// Waitlist (founding members) — base + however many have joined locally
const WAITLIST_BASE = 728;
