// ============================================================================
//  THE CREATIVE CENTRE — seed data
//  A map-based marketplace for finding creative crew near you.
//  All data is local/seed; user-created records persist to localStorage.
// ============================================================================

// --- Disciplines, grouped into the categories used by the filter rail -------
const CATEGORIES = [
  { id: 'talent',    label: 'Talent',           roles: ['Model', 'Actor', 'Dancer', 'Presenter', 'Extra'] },
  { id: 'camera',    label: 'Camera',           roles: ['Photographer', 'Videographer', 'Cinematographer / DP', 'Camera Operator', 'Drone Operator', 'Assistant Camera'] },
  { id: 'lighting',  label: 'Lighting & Grip',  roles: ['Gaffer', 'Grip', 'Best Boy', 'Lighting Technician'] },
  { id: 'sound',     label: 'Sound',            roles: ['Sound Mixer', 'Boom Operator', 'Composer', 'Music Producer'] },
  { id: 'glam',      label: 'Hair, Makeup & Style', roles: ['Makeup Artist', 'Hair Stylist', 'Wardrobe Stylist', 'Nail Artist', 'Groomer'] },
  { id: 'direction', label: 'Direction & Production', roles: ['Director', 'Creative Director', 'Art Director', 'Producer', 'Production Assistant', 'Casting Director'] },
  { id: 'post',      label: 'Post-Production',   roles: ['Editor', 'Colorist', 'Retoucher', 'VFX Artist', 'Motion Designer'] },
  { id: 'design',    label: 'Design & Build',    roles: ['Set Designer', 'Prop Stylist', 'Production Designer', 'Illustrator'] },
];

// Flat lookup: role -> category id
const ROLE_CATEGORY = {};
CATEGORIES.forEach(c => c.roles.forEach(r => (ROLE_CATEGORY[r] = c.id)));
const ALL_ROLES = CATEGORIES.flatMap(c => c.roles);

const CITIES = ['Lagos', 'London', 'New York', 'Johannesburg'];

// --- Seed creators ----------------------------------------------------------
// x / y are percentage coordinates (0-100) on the stylised city map.
// avatarSeed drives the generated monogram colour.
const SEED_CREATORS = [
  { id:'c01', name:'Amara Okafor',     roles:['Model'],                       city:'Lagos',        area:'Lekki Phase 1',  x:64, y:38, rate:'₦180k/day',  exp:5,  verified:true,  gear:[],                              bio:'Editorial & runway. Comfortable in studio and on location. Repped, but books direct here.', tags:['Editorial','Runway','Beauty'] },
  { id:'c02', name:'Tunde Bello',      roles:['Photographer'],                city:'Lagos',        area:'Yaba',           x:42, y:52, rate:'₦250k/day',  exp:8,  verified:true,  gear:['Sony A7IV','24-70 f2.8','Profoto B10'], bio:'Fashion and portrait. Own studio in Yaba with cyc wall available.', tags:['Fashion','Portrait','Studio'] },
  { id:'c03', name:'Zanele Dlamini',   roles:['Makeup Artist'],               city:'Johannesburg', area:'Maboneng',       x:55, y:60, rate:'R3 500/day',  exp:6,  verified:true,  gear:[],                              bio:'Clean beauty, editorial, SFX on request. Kit travels.', tags:['Beauty','Editorial','SFX'] },
  { id:'c04', name:'Marcus Reid',      roles:['Gaffer'],                      city:'London',       area:'Hackney Wick',   x:48, y:30, rate:'£420/day',   exp:12, verified:true,  gear:['Aputure 600x','Astera tubes ×8'], bio:'Commercials and music videos. Can package a small lighting van.', tags:['Commercial','Music Video'] },
  { id:'c05', name:'Lola Adeyemi',     roles:['Videographer','Editor'],       city:'Lagos',        area:'Ikeja',          x:30, y:44, rate:'₦300k/day',  exp:7,  verified:false, gear:['FX3','Ronin RS3','MacBook Pro M3'], bio:'Run-and-gun docs and brand films. Shoot-to-edit one-stop.', tags:['Documentary','Brand Film'] },
  { id:'c06', name:'Daniel Mensah',    roles:['Sound Mixer','Boom Operator'], city:'London',       area:'Peckham',        x:52, y:66, rate:'£380/day',   exp:9,  verified:true,  gear:['Sound Devices MixPre','Sennheiser 416','Lav kit ×4'], bio:'Location sound for film & TV. Calm on set.', tags:['Film','TV','Location'] },
  { id:'c07', name:'Priya Nair',       roles:['Creative Director'],           city:'New York',     area:'Bushwick',       x:38, y:34, rate:'$1 200/day',  exp:11, verified:true,  gear:[],                              bio:'Builds campaign worlds end-to-end. Decks, casting, on-set direction.', tags:['Campaign','Branding'] },
  { id:'c08', name:'Kwame Asante',     roles:['Model'],                       city:'London',       area:'Dalston',        x:60, y:42, rate:'£300/day',   exp:3,  verified:false, gear:[],                              bio:'Commercial and streetwear. Strong movement.', tags:['Commercial','Streetwear'] },
  { id:'c09', name:'Sofia Bianchi',    roles:['Wardrobe Stylist'],            city:'New York',     area:'SoHo',           x:46, y:50, rate:'$900/day',    exp:8,  verified:true,  gear:[],                              bio:'Fashion editorial and e-comm. Showroom relationships in NYC.', tags:['Fashion','E-comm'] },
  { id:'c10', name:'Chidi Eze',        roles:['Colorist','Editor'],           city:'Lagos',        area:'Victoria Island',x:70, y:50, rate:'₦220k/day',  exp:10, verified:true,  gear:['DaVinci suite','Calibrated monitor'], bio:'Grade and finish for music videos & ads. Remote sessions available.', tags:['Grade','Finishing'] },
  { id:'c11', name:'Naledi Khumalo',   roles:['Dancer','Choreographer'],      city:'Johannesburg', area:'Braamfontein',   x:40, y:48, rate:'R2 800/day',  exp:6,  verified:false, gear:[],                              bio:'Afro-fusion, commercial, music video. Can bring a crew.', tags:['Commercial','Music Video'] },
  { id:'c12', name:'James Holloway',   roles:['Drone Operator','Cinematographer / DP'], city:'London', area:'Greenwich',  x:66, y:58, rate:'£550/day',   exp:9,  verified:true,  gear:['DJI Inspire 3','A7S III','Ronin'], bio:'Licensed (A2 CofC). Aerials + ground unit DP.', tags:['Aerial','Licensed'] },
  { id:'c13', name:'Fatima Sow',       roles:['Hair Stylist'],                city:'Lagos',        area:'Surulere',       x:36, y:62, rate:'₦150k/day',  exp:5,  verified:false, gear:[],                              bio:'Natural hair, wigs, editorial. Kit on hand.', tags:['Natural Hair','Editorial'] },
  { id:'c14', name:'Elena Petrova',    roles:['Retoucher'],                   city:'New York',     area:'LES',            x:54, y:40, rate:'$60/image',   exp:7,  verified:true,  gear:['Wacom','Calibrated display'], bio:'High-end beauty and skin retouch. Fast turnaround.', tags:['Beauty','High-end'] },
  { id:'c15', name:'Obi Nwosu',        roles:['Producer'],                    city:'Lagos',        area:'Ikoyi',          x:58, y:46, rate:'₦400k/day',  exp:13, verified:true,  gear:[],                              bio:'Line producing commercials and music videos across Lagos. Permits handled.', tags:['Commercial','Line Producer'] },
  { id:'c16', name:'Ruth Carter',      roles:['Set Designer','Prop Stylist'], city:'London',       area:'Tottenham',      x:44, y:24, rate:'£480/day',   exp:10, verified:true,  gear:['Workshop access'], bio:'Builds and styles sets for stills & motion. Workshop in N17.', tags:['Build','Stills'] },
  { id:'c17', name:'Aiden Walsh',      roles:['Grip'],                        city:'New York',     area:'Long Island City',x:62, y:62, rate:'$500/day',   exp:8,  verified:false, gear:['Dana dolly','C-stands','Flags'], bio:'Dolly, rigging, all things grip. Truck available.', tags:['Rigging','Dolly'] },
  { id:'c18', name:'Thandiwe Mokoena', roles:['Model'],                       city:'Johannesburg', area:'Sandton',        x:64, y:40, rate:'R4 000/day',  exp:7,  verified:true,  gear:[],                              bio:'Beauty and commercial. International tear sheets.', tags:['Beauty','Commercial'] },
  { id:'c19', name:'Leon Mbeki',       roles:['Motion Designer','VFX Artist'],city:'Johannesburg', area:'Rosebank',       x:50, y:52, rate:'R3 200/day',  exp:6,  verified:false, gear:['After Effects','Cinema 4D'], bio:'Title design, mograph, light VFX cleanup for ads.', tags:['Mograph','Titles'] },
  { id:'c20', name:'Grace Adeniyi',    roles:['Casting Director'],            city:'Lagos',        area:'Lekki Phase 1',  x:67, y:36, rate:'₦200k/job',  exp:9,  verified:true,  gear:[],                              bio:'Street and agency casting. Deep talent network in Lagos.', tags:['Casting','Street'] },
  { id:'c21', name:'Noah Bennett',     roles:['Photographer'],                city:'New York',     area:'Williamsburg',   x:42, y:44, rate:'$1 500/day',  exp:12, verified:true,  gear:['Phase One','Profoto Pro-11'], bio:'Advertising stills and luxury still life. Capture one tethered.', tags:['Advertising','Still Life'] },
  { id:'c22', name:'Ife Balogun',      roles:['Art Director'],                city:'Lagos',        area:'Yaba',           x:40, y:50, rate:'₦280k/day',  exp:8,  verified:false, gear:[],                              bio:'Album art, campaigns, set concepts. Strong on Afro-contemporary visual language.', tags:['Album Art','Campaign'] },
];

// --- Seed jobs (brand-posted briefs) ---------------------------------------
const SEED_JOBS = [
  { id:'j01', brand:'Mavin Records',  title:'Music video — lead dancers & DP', city:'Lagos',   roles:['Dancer','Cinematographer / DP'], date:'2026-07-02', budget:'₦2.5M total', usage:'Social + broadcast, 12 months', brief:'High-energy Afrobeats video. Need 4 dancers and a DP comfortable with low-light club scenes.', posted:'2026-06-15' },
  { id:'j02', brand:'Studio Noir',    title:'Beauty campaign — MUA + retoucher', city:'London',  roles:['Makeup Artist','Retoucher'], date:'2026-06-28', budget:'£3,000 total', usage:'Web + OOH, 6 months', brief:'Clean skin-forward beauty story, 6 looks. Same-week retouch turnaround.', posted:'2026-06-16' },
  { id:'j03', brand:'Aerodyne',       title:'Brand film — full crew', city:'New York', roles:['Cinematographer / DP','Gaffer','Sound Mixer','Producer'], date:'2026-07-10', budget:'$18,000 total', usage:'All media, perpetuity', brief:'2-day brand film for a drone startup. Small package crew, some aerial.', posted:'2026-06-17' },
];

// --- Seed gear listings (Stage 3) ------------------------------------------
const SEED_GEAR = [
  { id:'g01', owner:'Tunde Bello',   city:'Lagos',  item:'Sony A7IV body', cat:'Camera',   rate:'₦25k/day',  deposit:'₦100k', area:'Yaba' },
  { id:'g02', owner:'Marcus Reid',   city:'London', item:'Aputure 600x + softbox', cat:'Lighting', rate:'£70/day', deposit:'£300', area:'Hackney Wick' },
  { id:'g03', owner:'James Holloway', city:'London', item:'DJI Inspire 3 (pilot optional)', cat:'Aerial', rate:'£220/day', deposit:'£1,000', area:'Greenwich' },
  { id:'g04', owner:'Aiden Walsh',   city:'New York', item:'Dana Dolly kit', cat:'Grip', rate:'$90/day', deposit:'$400', area:'Long Island City' },
];
