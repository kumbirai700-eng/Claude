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
  { id: 'sound',     label: 'Sound',                  roles: ['Sound Mixer', 'Boom Operator', 'Composer', 'Music Producer'] },
  { id: 'glam',      label: 'Hair, Makeup & Style',   roles: ['Makeup Artist', 'Hair Stylist', 'Wardrobe Stylist', 'Nail Artist', 'Groomer'] },
  { id: 'direction', label: 'Direction & Production', roles: ['Director', 'Creative Director', 'Art Director', 'Producer', 'Production Assistant', 'Casting Director'] },
  { id: 'post',      label: 'Post-Production',         roles: ['Editor', 'Colorist', 'Retoucher', 'VFX Artist', 'Motion Designer'] },
  { id: 'design',    label: 'Design & Build',          roles: ['Set Designer', 'Prop Stylist', 'Production Designer', 'Illustrator'] },
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
