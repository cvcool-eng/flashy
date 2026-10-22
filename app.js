// ================== Flashy ==================
// All progress is saved in the browser (localStorage), one profile per name.

const STORE_KEY = 'flashy-math-v1';
const QUESTIONS_PER_COURSE = 25;
const FIRST_COURSE_QUESTIONS = 10; // an account's first finished course is shorter
const courseLength = (p) => (p.courses === 0 ? FIRST_COURSE_QUESTIONS : QUESTIONS_PER_COURSE);
// Seconds per question by grade (K..8); harder subjects get a little extra.
const TIMER_BY_GRADE = [15, 15, 12, 12, 10, 10, 12, 12, 12];
const EXTRA_TIME = { frac: 5, dec: 3, pct: 5, eq: 5 };
// 7th and 8th grade courses warm up with easier questions of the same type.
const WARMUP_GRADES = [7, 8];
const WARMUP_SHARE = 0.4;
const MEGA_EVERY = 25;
const MEGA_GEMS = 400;
const COMBO_EVERY = 5;   // every 5 in a row...
const COMBO_GEMS = 5;    // ...gives 5 bonus gems
const BADGE_GEMS = 20; // claimed by tapping the badge in the Progress tab
const FREEZE_PRICE = 150;
const FREEZE_MAX = 2;
const REVIEW_PER_COURSE = 3;  // missed questions brought back in the next course
const REVIEW_KEEP = 10;

const GRADES = ['K', '1', '2', '3', '4', '5', '6', '7', '8'];
const GRADE_NAMES = ['Kindergarten', '1st grade', '2nd grade', '3rd grade', '4th grade', '5th grade', '6th grade', '7th grade', '8th grade'];

const OPS = {
  add:  { sym: '+', label: 'Addition', minGrade: 0 },
  sub:  { sym: '−', label: 'Subtraction', minGrade: 0 },
  mul:  { sym: '×', label: 'Multiplication', minGrade: 0 },
  div:  { sym: '÷', label: 'Division', minGrade: 0 },
  frac: { sym: '½', label: 'Fractions', minGrade: 5 },
  dec:  { sym: '.5', label: 'Decimals', minGrade: 5 },
  pct:  { sym: '%', label: 'Percents', minGrade: 6 },
  eq:   { sym: 'x', label: 'Equations', minGrade: 6 },
  mix:  { sym: '★', label: 'Mix it up', minGrade: 0 },
};
const opsForGrade = (g) => Object.keys(OPS).filter((k) => OPS[k].minGrade <= g);
const mixPool = (g) => opsForGrade(g).filter((k) => k !== 'mix');

// Streak fire colors: changes every 25 days, then keeps going.
const FIRE_TIERS = [
  { min: 0,   name: 'Orange', outer: '#ff7a1a', inner: '#ffd23f', glow: '#ff8c1a' },
  { min: 25,  name: 'Blue',   outer: '#2f8cff', inner: '#9be7ff', glow: '#3fa9ff' },
  { min: 50,  name: 'Purple', outer: '#a142f4', inner: '#f0a8ff', glow: '#b25cff' },
  { min: 75,  name: 'Green',  outer: '#18c964', inner: '#c9ffd6', glow: '#2ee87a' },
  { min: 100, name: 'Pink',   outer: '#ff3d8b', inner: '#ffd0e4', glow: '#ff5ca0' },
  { min: 150, name: 'Gold',   outer: '#ffb800', inner: '#fff6c2', glow: '#ffd84d' },
  { min: 200, name: 'White',  outer: '#dfe9ff', inner: '#ffffff', glow: '#ffffff' },
];

// Avatars: square tiles in Flashy's greens with the face filling the tile.
// The first six are free, the rest are unlocked with gems.
// A plain (uncarved) pumpkin, drawn by hand since there's no emoji for one.
const PUMPKIN_SVG = `<svg viewBox="0 0 100 100" class="face-svg" aria-hidden="true">
  <path d="M50 26c-4-10-1-16 6-19" stroke="#3f7d2c" stroke-width="7" fill="none" stroke-linecap="round"/>
  <path d="M56 18c10-8 22-6 26 2-9 5-19 5-26-2z" fill="#5fae3e"/>
  <ellipse cx="30" cy="60" rx="22" ry="30" fill="#e8741c"/>
  <ellipse cx="70" cy="60" rx="22" ry="30" fill="#e8741c"/>
  <ellipse cx="50" cy="60" rx="22" ry="32" fill="#f7902a"/>
  <path d="M36 34c-6 14-6 38 0 52M64 34c6 14 6 38 0 52" stroke="#c95d10" stroke-width="2.5" fill="none" opacity=".7"/>
  <path d="M44 36c-3 6-4 12-4 16" stroke="#ffc07a" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>
</svg>`;
const SAGE = ['#a3cfaa', '#6fa67a'];   // light green
const GREEN = ['#3f9a74', '#226b4f'];  // mid green
const TEAL = ['#1d6b64', '#0e3f3b'];   // deep teal
const AVATARS = [
  { id: 'fox',     name: 'Fox',     face: '🦊', bg: TEAL,  price: 0 },
  { id: 'panda',   name: 'Panda',   face: '🐼', bg: GREEN, price: 0 },
  { id: 'frog',    name: 'Frog',    face: '🐸', bg: TEAL,  price: 0 },
  { id: 'cat',     name: 'Cat',     face: '🐱', bg: GREEN, price: 0 },
  { id: 'dog',     name: 'Dog',     face: '🐶', bg: SAGE,  price: 0 },
  { id: 'monkey',  name: 'Monkey',  face: '🐵', bg: SAGE,  price: 0 },
  { id: 'bear',    name: 'Bear',    face: '🐻', bg: SAGE,  price: 100 },
  { id: 'lion',    name: 'Lion',    face: '🦁', bg: TEAL,  price: 100 },
  { id: 'koala',   name: 'Koala',   face: '🐨', bg: GREEN, price: 150 },
  { id: 'tiger',   name: 'Tiger',   face: '🐯', bg: TEAL,  price: 150 },
  { id: 'wolf',    name: 'Wolf',    face: '🐺', bg: SAGE,  price: 200 },
  { id: 'owl',     name: 'Owl',     face: '🦉', bg: GREEN, price: 250 },
  { id: 'pig',     name: 'Pig',     face: '🐷', bg: TEAL,  price: 250 },
  { id: 'bunny',   name: 'Bunny',   face: '🐰', bg: GREEN, price: 150 },
  { id: 'hamster', name: 'Hamster', face: '🐹', bg: TEAL,  price: 150 },
  { id: 'penguin', name: 'Penguin', face: '🐧', bg: SAGE,  price: 200 },
  { id: 'turtle',  name: 'Turtle',  face: '🐢', bg: TEAL,  price: 200 },
  { id: 'lizard',  name: 'Lizard',  face: '🦎', bg: TEAL,  price: 250 },
  { id: 'octopus', name: 'Octopus', face: '🐙', bg: GREEN, price: 250 },
  { id: 'snowman', name: 'Snowman', face: '⛄', bg: TEAL,  price: 300 },
  { id: 'whale',   name: 'Whale',   face: '🐳', bg: SAGE,  price: 300 },
  { id: 'robot',   name: 'Robot',   face: '🤖', bg: TEAL,  price: 300 },
  { id: 'pumpkin', name: 'Pumpkin', face: PUMPKIN_SVG, bg: TEAL, price: 350 },
  { id: 'alien',   name: 'Alien',   face: '👽', bg: TEAL,  price: 350 },
  { id: 'shark',   name: 'Shark',   face: '🦈', bg: SAGE,  price: 400 },
  { id: 'dragon',  name: 'Dragon',  face: '🐲', bg: SAGE,  price: 450 },
  { id: 'stars',   name: 'Star Eyes', face: '🤩', bg: TEAL, price: 500 },
  { id: 'trex',    name: 'T-Rex',   face: '🦖', bg: TEAL,  price: 800 },
  { id: 'skydragon', name: 'Sky Dragon', face: '🐉', bg: GREEN, price: 1000 },
];

// Frames: the cooler they look, the more they cost. Looks live in style.css (.frame-<id>).
const FRAMES = [
  { id: 'none',      name: 'No frame',  price: 0 },
  { id: 'classic',   name: 'Classic',   price: 0 },
  { id: 'gold',      name: 'Gold',      price: 150 },
  { id: 'candy',     name: 'Candy',     price: 250 },
  { id: 'ice',       name: 'Ice',       price: 300 },
  { id: 'ocean',     name: 'Ocean',     price: 350 },
  { id: 'fire',      name: 'Fire',      price: 400 },
  { id: 'sunset',    name: 'Sunset',    price: 450 },
  { id: 'toxic',     name: 'Toxic',     price: 550 },
  { id: 'neon',      name: 'Neon',      price: 600 },
  { id: 'lava',      name: 'Lava',      price: 650 },
  { id: 'shadow',    name: 'Shadow',    price: 750 },
  { id: 'rainbow',   name: 'Rainbow',   price: 800 },
  { id: 'aurora',    name: 'Aurora',    price: 900 },
  { id: 'galaxy',    name: 'Galaxy',    price: 1000 },
  { id: 'diamond',   name: 'Diamond',   price: 1200 },
  { id: 'lightning', name: 'Lightning', price: 1500 },
  { id: 'legendary', name: 'Legendary', price: 2000 },
];

// Name colors: the same colors and prices as the frames (looks live in style.css, .nc-<id>).
const NAME_COLORS = FRAMES.map((f) => ({
  id: f.id, price: f.price,
  name: f.id === 'none' ? 'Default' : f.id === 'classic' ? 'Sage' : f.name,
}));

const BADGES = [
  { id: 'first',     icon: '🎓', name: 'First Steps',   desc: 'Finish your first course',            test: (p) => p.courses >= 1 },
  { id: 'perfect',   icon: '💯', name: 'Perfect!',      desc: 'Get every question right',            test: (p) => p.perfects >= 1 },
  { id: 'combo10',   icon: '⚡', name: 'On a Roll',     desc: 'Get 10 right in a row',               test: (p) => p.bestCombo >= 10 },
  { id: 'speedy',    icon: '🚀', name: 'Speedy',        desc: 'Average under 3 seconds with 80% right', test: (p) => p.speedy },
  { id: 'courses10', icon: '📚', name: 'Bookworm',      desc: 'Finish 10 courses',                   test: (p) => p.courses >= 10 },
  { id: 'courses50', icon: '🏆', name: 'Champion',      desc: 'Finish 50 courses',                   test: (p) => p.courses >= 50 },
  { id: 'streak7',   icon: '🔥', name: 'Week Streak',   desc: 'Reach a 7 day streak',                test: (p) => p.bestStreak >= 7 },
  { id: 'streak25',  icon: '💙', name: 'Blue Flame',    desc: 'Reach a 25 day streak',               test: (p) => p.bestStreak >= 25 },
  { id: 'streak50',  icon: '💜', name: 'Unstoppable',   desc: 'Reach a 50 day streak',               test: (p) => p.bestStreak >= 50 },
  { id: 'gems1000',  icon: '💎', name: 'Gem Collector', desc: 'Earn 1,000 gems',                     test: (p) => p.gemsEarned >= 1000 },
  { id: 'style',     icon: '🎨', name: 'New Look',      desc: 'Unlock an avatar or frame',           test: (p) => p.purchases >= 1 },
  { id: 'explorer',  icon: '🧭', name: 'Explorer',      desc: 'Try 4 different subjects',            test: (p) => Object.keys(p.subjectStats).length >= 4 },
  ...['add', 'sub', 'mul', 'div'].map((op) => ({
    id: `${op}100`, icon: OPS[op].sym, name: `${OPS[op].label} Ace`,
    desc: `Get 100 ${OPS[op].label.toLowerCase()} questions right`,
    test: (p) => (p.subjectStats[op] ? p.subjectStats[op].right : 0) >= 100,
  })),
];

const GEM_SVG = '<svg viewBox="0 0 24 24" class="gem-icon" aria-hidden="true"><path d="M6 3h12l4 6-10 12L2 9z" fill="#7fe3ff"/><path d="M2 9h20L12 21z" fill="#3cb8e0"/></svg>';
const LOCK_SVG = '<span class="lock" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="12" rx="3" fill="#f4f8f1"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="#f4f8f1" stroke-width="2.6"/><circle cx="12" cy="16" r="2" fill="#12544F"/></svg></span>';
const SOUND_ON_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const SOUND_OFF_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9l6 6M22 9l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

// ---------- helpers ----------
const $ = (id) => document.getElementById(id);
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const randNonZero = (a, b) => { let n; do { n = rand(a, b); } while (n === 0); return n; };
const pick = (arr) => arr[rand(0, arr.length - 1)];
const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = rand(0, i); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
const fmt = (n) => { const s = String(Number(Number(n).toFixed(2))); return s.startsWith('-') ? '−' + s.slice(1) : s; };
const fmtRight = (n) => (n < 0 ? `(${fmt(n)})` : fmt(n));
const signed = (n) => (n < 0 ? `− ${-n}` : `+ ${n}`);
const avatarById = (id) => AVATARS.find((a) => a.id === id) || AVATARS[0];
const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Give a name element its name color (swaps out any old nc-* class).
function paintName(el, id) {
  [...el.classList].filter((c) => c.startsWith('nc-')).forEach((c) => el.classList.remove(c));
  el.classList.add(`nc-${id || 'none'}`);
}

function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function daysBetween(a, b) {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1)) / 86400000);
}

// ---------- saving ----------
const FREE_AVATARS = AVATARS.filter((a) => !a.price).map((a) => a.id);
const FREE_FRAMES = FRAMES.filter((f) => !f.price).map((f) => f.id);
// If saved progress exists but can't be read, never save over it.
let loadFailed = false;
let data = load();

function load() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      Object.values(d.profiles || {}).forEach(upgradeProfile);
      return d;
    }
  } catch (e) {
    if (raw) loadFailed = true; // storage blocked or unreadable: play without saving
  }
  return { current: null, profiles: {} };
}
function save() {
  if (loadFailed) return;
  try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
}
function player() { return data.current ? data.profiles[data.current] : null; }

function newProfile(name, grade, avatar = 'fox') {
  return upgradeProfile({
    name, grade, op: 'add', gems: 0,
    streak: 0, bestStreak: 0, lastVisit: null,
    lastClaim: null, claimedDays: [], chestsOpened: 0,
    courses: 0, totalCorrect: 0, bestScore: 0,
    seenIntro: false,
    lastWelcome: Date.now(), // no "welcome back" on the very first sign-in
    avatar, gemsEarned: 0,
  });
}

// Fill in anything an older saved profile doesn't have yet.
function upgradeProfile(p) {
  const defaults = {
    avatar: 'fox', frame: 'classic',
    ownedAvatars: [...FREE_AVATARS], ownedFrames: [...FREE_FRAMES],
    freezes: 0, subjectStats: {}, daily: {}, badges: [],
    bestCombo: 0, perfects: 0, purchases: 0, speedy: false,
    gemsEarned: p.gems || 0, reviewQueue: [], mode: 'type', typingLevel: 'easy',
    nameColor: 'none', ownedNameColors: [...FREE_FRAMES],
    // badges earned before claiming existed were already paid out, so they count as claimed
    badgesClaimed: [...(p.badges || [])],
    typingHistory: [], bestWpm: 0, lessonUnlocked: 0, lessonBest: {}, placementDone: false, easyFont: false,
  };
  Object.entries(defaults).forEach(([k, v]) => { if (p[k] === undefined) p[k] = v; });
  // everyone always owns the free ones, and unknown picks fall back to a free one
  FREE_AVATARS.forEach((id) => { if (!p.ownedAvatars.includes(id)) p.ownedAvatars.push(id); });
  FREE_FRAMES.forEach((id) => { if (!p.ownedFrames.includes(id)) p.ownedFrames.push(id); });
  FREE_FRAMES.forEach((id) => { if (!p.ownedNameColors.includes(id)) p.ownedNameColors.push(id); });
  if (!NAME_COLORS.some((c) => c.id === p.nameColor)) p.nameColor = 'none';
  if (!AVATARS.some((a) => a.id === p.avatar)) p.avatar = 'fox';
  if (!FRAMES.some((f) => f.id === p.frame)) p.frame = 'classic';
  return p;
}

// Count a visit for today and update the day streak.
// If days were missed, the streak is put on hold (pendingBreak) until the
// player chooses to use streak freezes or restart (see showStreakBreak).
function touchStreak(p) {
  const today = dayKey();
  if (p.lastVisit === today) return;
  const gap = p.lastVisit ? daysBetween(p.lastVisit, today) : null;
  if (p.pendingBreak) {
    p.pendingBreak.missed += Math.max(0, gap - 1); // still undecided from before
  } else if (gap === 1) {
    p.streak += 1;
  } else if (gap > 1 && p.streak > 0) {
    p.pendingBreak = { missed: gap - 1, streak: p.streak };
  } else {
    p.streak = 1;
    p.claimedDays = [];
  }
  p.lastVisit = today;
  p.bestStreak = Math.max(p.bestStreak, p.streak);
  save();
}

// While the lost-streak choice is waiting, today's chest can't be claimed yet.
const canClaim = (p) => p.lastClaim !== dayKey() && !p.pendingBreak;
const isMegaDay = (day) => day % MEGA_EVERY === 0;
const fireTier = (streak) => [...FIRE_TIERS].reverse().find((t) => streak >= t.min);

// ---------- sounds + music (made with Web Audio, no files) ----------
// Everything plays through a master volume and a limiter so it's loud but never crackly:
//   sound effects -> sfxBus ┐
//   lobby music  -> musicBus ┴-> master -> limiter -> speakers
let actx = null;
let sfxBus = null;
let musicBus = null;
const MASTER_VOLUME = 1.4;
const MUSIC_VOLUME = 0.55;
const soundOn = () => data.sound !== false;
const musicOn = () => data.music !== false;

function audioCtx() {
  try {
    if (!actx) {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      const limiter = actx.createDynamicsCompressor();
      limiter.threshold.value = -8;
      limiter.knee.value = 6;
      limiter.ratio.value = 12;
      const master = actx.createGain();
      master.gain.value = MASTER_VOLUME;
      master.connect(limiter).connect(actx.destination);
      sfxBus = actx.createGain();
      sfxBus.connect(master);
      musicBus = actx.createGain();
      musicBus.gain.value = 0;
      musicBus.connect(master);
    }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  } catch (e) { return null; }
}

// One note at an exact time on the audio clock.
function note(freq, start, dur, { type = 'sine', vol = 0.3, attack = 0.01, slide = 0, bus = sfxBus } = {}) {
  const o = actx.createOscillator();
  const g = actx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(bus);
  o.start(start);
  o.stop(start + dur + 0.05);
}
// A sound effect `at` seconds from now.
function tone(freq, dur, { at = 0, ...opts } = {}) {
  if (!soundOn() || !audioCtx()) return;
  note(freq, actx.currentTime + at, dur, opts);
}
const sfx = {
  right: () => { tone(660, 0.14, { type: 'triangle', vol: 0.4 }); tone(990, 0.22, { type: 'triangle', vol: 0.4, at: 0.09 }); },
  wrong: () => tone(220, 0.3, { type: 'sawtooth', vol: 0.18, slide: 0.7 }),
  tick: () => tone(1200, 0.05, { type: 'square', vol: 0.1 }),
  count: () => tone(520, 0.18, { type: 'triangle', vol: 0.4 }),
  go: () => tone(780, 0.35, { type: 'triangle', vol: 0.45 }),
  combo: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, { type: 'triangle', vol: 0.35, at: i * 0.07 })),
  shake: () => tone(140, 0.09, { type: 'square', vol: 0.12 }),
  chest: () => [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.24, { type: 'triangle', vol: 0.32, at: i * 0.06 })),
  buy: () => { tone(880, 0.12, { vol: 0.35 }); tone(1320, 0.24, { vol: 0.35, at: 0.08 }); },
  badge: () => [659, 784, 988, 1319].forEach((f, i) => tone(f, 0.2, { vol: 0.3, at: i * 0.09 })),
  // UI sounds
  click: () => tone(520, 0.07, { type: 'sine', vol: 0.22, slide: 1.7 }),
  open: () => [523, 659, 880].forEach((f, i) => tone(f, 0.12, { type: 'sine', vol: 0.2, at: i * 0.05 })),
  close: () => [784, 587, 440].forEach((f, i) => tone(f, 0.1, { type: 'sine', vol: 0.16, at: i * 0.045 })),
  swoosh: () => tone(300, 0.16, { type: 'triangle', vol: 0.14, slide: 2.2 }),
};

// ----- lobby music: chill lo-fi keys -----
// Warm, muffled electric-piano chords (Fmaj7 - G - Em7 - Am7), a soft bass note,
// and a sparse pluck melody. No drums.
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
const MUSIC_BPM = 140;
const STEP = 60 / MUSIC_BPM / 4; // one 16th note
const CHORDS = [[53, 57, 60, 64], [55, 59, 62, 67], [52, 55, 59, 62], [57, 60, 64, 67]];
const BASS = [41, 43, 40, 45];
const MELODY = [ // sparse pluck in A minor pentatonic, step -> note
  { 2: 76, 6: 74, 10: 72 },
  { 0: 74, 6: 79, 12: 76 },
  { 2: 71, 6: 72, 10: 74 },
  { 0: 76, 8: 72, 12: 69 },
];
let music = { playing: false, timer: null, step: 0, nextTime: 0, keys: null, pluck: null };

function musicNodes() {
  if (music.keys) return;
  // muffled "lo-fi" filter for the keys and the melody
  music.keys = actx.createBiquadFilter();
  music.keys.type = 'lowpass';
  music.keys.frequency.value = 1400;
  music.keys.connect(musicBus);
  music.pluck = actx.createBiquadFilter();
  music.pluck.type = 'lowpass';
  music.pluck.frequency.value = 2200;
  music.pluck.connect(musicBus);
}

function scheduleMusic() {
  // schedule a little ahead of the audio clock so timing stays steady
  while (music.nextTime < actx.currentTime + 0.25) {
    const s = music.step;
    const bar = Math.floor(s / 16) % 4;
    const step = s % 16;
    const loop = Math.floor(s / 64);
    const t = music.nextTime;

    // keys: a warm chord at the top of every bar, plus a softer re-hit halfway
    if (step === 0 || step === 8) {
      CHORDS[bar].forEach((m) => {
        note(midi(m), t, STEP * 8, { type: 'sine', vol: step ? 0.05 : 0.09, attack: 0.02, bus: music.keys });
        note(midi(m) * 1.003, t, STEP * 6, { type: 'triangle', vol: step ? 0.02 : 0.035, attack: 0.02, bus: music.keys });
      });
    }
    // soft, round bass note under each chord (plus a quiet octave so phones can hear it)
    if (step === 0) {
      note(midi(BASS[bar]), t, STEP * 15, { type: 'sine', vol: 0.3, attack: 0.04, bus: music.keys });
      note(midi(BASS[bar] + 12), t, STEP * 12, { type: 'sine', vol: 0.06, attack: 0.04, bus: music.keys });
    }
    // melody comes in every other loop
    const mel = MELODY[bar][step];
    if (mel && loop % 2 === 1) note(midi(mel), t, STEP * 3, { type: 'square', vol: 0.05, attack: 0.005, bus: music.pluck });

    music.step++;
    music.nextTime += STEP;
  }
}

function startMusic() {
  if (!musicOn() || music.playing || !audioCtx()) return;
  musicNodes();
  music.playing = true;
  music.step = 0;
  music.nextTime = actx.currentTime + 0.1;
  musicBus.gain.cancelScheduledValues(actx.currentTime);
  musicBus.gain.setValueAtTime(musicBus.gain.value, actx.currentTime);
  musicBus.gain.linearRampToValueAtTime(MUSIC_VOLUME, actx.currentTime + 1.2);
  scheduleMusic();
  music.timer = setInterval(scheduleMusic, 60);
}
function stopMusic() {
  if (!music.playing) return;
  music.playing = false;
  clearInterval(music.timer);
  musicBus.gain.cancelScheduledValues(actx.currentTime);
  musicBus.gain.setValueAtTime(musicBus.gain.value, actx.currentTime);
  musicBus.gain.linearRampToValueAtTime(0, actx.currentTime + 0.5);
}
// Music plays only while the lobby is on screen (and the page is visible).
const inLobby = () => !$('screen-lobby').classList.contains('hidden');
function updateMusic() {
  if (musicOn() && inLobby() && document.visibilityState === 'visible') startMusic();
  else stopMusic();
}
// Browsers only allow audio after the first tap, so try again on every tap.
document.addEventListener('pointerdown', () => updateMusic(), true);
document.addEventListener('visibilitychange', updateMusic);

function setSound(on) {
  data.sound = on;
  save();
  renderSoundControls();
}
function setMusic(on) {
  data.music = on;
  save();
  renderSoundControls();
  updateMusic();
}
function renderSoundControls() {
  $('quiz-sound').innerHTML = soundOn() ? SOUND_ON_SVG : SOUND_OFF_SVG;
  $('quiz-sound').setAttribute('aria-label', soundOn() ? 'Turn sound off' : 'Turn sound on');
  $('sound-switch').classList.toggle('on', soundOn());
  $('sound-switch').setAttribute('aria-checked', String(soundOn()));
  $('music-switch').classList.toggle('on', musicOn());
  $('music-switch').setAttribute('aria-checked', String(musicOn()));
}
$('quiz-sound').onclick = () => setSound(!soundOn());
$('sound-switch').onclick = () => setSound(!soundOn());
$('music-switch').onclick = () => setMusic(!musicOn());

// ---------- question generator ----------
// Each grade returns [first number, second number] for the operation.
const LEVELS = {
  add: [
    () => [rand(0, 5), rand(0, 5)],
    () => [rand(0, 9), rand(0, 9)],
    () => [rand(10, 50), rand(1, 9)],
    () => [rand(10, 99), rand(10, 99)],
    () => [rand(100, 500), rand(10, 99)],
    () => [rand(100, 999), rand(10, 99)],
    () => [rand(-10, 10), rand(-10, 10)],
    () => [rand(-20, 20), rand(-20, 20)],
    () => [rand(-50, 50), rand(-50, 50)],
  ],
  sub: [
    () => { const a = rand(1, 5); return [a, rand(0, a)]; },
    () => { const a = rand(2, 10); return [a, rand(0, a)]; },
    () => [rand(10, 50), rand(1, 9)],
    () => { const a = rand(20, 99); return [a, rand(10, a)]; },
    () => [rand(100, 500), rand(10, 99)],
    () => { const a = rand(100, 999); return [a, rand(10, Math.min(a, 500))]; },
    () => [rand(-10, 10), rand(-10, 10)],
    () => [rand(-20, 20), rand(-20, 20)],
    () => [rand(-50, 50), rand(-50, 50)],
  ],
  mul: [
    () => [rand(0, 2), rand(0, 3)],
    () => [rand(0, 3), rand(0, 5)],
    () => [rand(0, 5), rand(0, 5)],
    () => [rand(0, 10), rand(0, 5)],
    () => [rand(2, 10), rand(2, 10)],
    () => [rand(2, 12), rand(2, 12)],
    () => [rand(10, 20), rand(2, 9)],
    () => [rand(-10, 10), rand(-10, 10)],
    () => [rand(-12, 12), rand(-12, 12)],
  ],
  // [divisor, answer] — the dividend is built from these so answers are whole numbers
  div: [
    () => [rand(1, 2), rand(0, 3)],
    () => [rand(1, 3), rand(0, 5)],
    () => [rand(1, 5), rand(1, 5)],
    () => [rand(1, 5), rand(1, 10)],
    () => [rand(2, 10), rand(2, 10)],
    () => [rand(2, 12), rand(2, 12)],
    () => [rand(2, 9), rand(10, 20)],
    () => [randNonZero(-10, 10), rand(-10, 10)],
    () => [randNonZero(-12, 12), rand(-12, 12)],
  ],
};

// Warm-up versions for 7th/8th grade: still negative numbers, just smaller.
const WARMUP_LEVELS = {
  add: () => [rand(-10, 10), rand(-10, 10)],
  sub: () => [rand(-10, 10), rand(-10, 10)],
  mul: () => [rand(-6, 6), rand(-6, 6)],
  div: () => [randNonZero(-6, 6), rand(-6, 6)],
};

// "Type the answer" mode keeps every problem simple: one number with up to
// 2 digits and the other with 1 digit (like 34 + 7 or 34 × 7). Negatives stay from 6th grade.
const SIMPLE_LEVELS = {
  add: (g) => (g <= 1 ? LEVELS.add[g]() : g >= 6 ? [rand(-50, 50), randNonZero(-9, 9)] : [rand(10, 99), rand(1, 9)]),
  sub: (g) => {
    if (g === 0) return LEVELS.sub[0]();
    if (g === 1) { const a = rand(2, 10); return [a, rand(0, Math.min(a, 9))]; }
    return g >= 6 ? [rand(-50, 50), randNonZero(-9, 9)] : [rand(10, 99), rand(1, 9)];
  },
  mul: (g) => (g <= 2 ? LEVELS.mul[g]() : g === 3 ? [rand(2, 10), rand(2, 9)] : g >= 6 ? [randNonZero(-30, 30), randNonZero(-9, 9)] : [rand(10, 50), rand(2, 9)]),
  // [divisor, answer], keeping the number being divided at 2 digits
  div: (g) => {
    if (g <= 2) return LEVELS.div[g]();
    const d = rand(2, 9) * (g >= 6 && rand(0, 1) ? -1 : 1);
    const most = Math.floor(99 / Math.abs(d));
    return [d, g >= 6 ? rand(-most, most) : rand(1, most)];
  },
};

function basicQuestion(op, grade, easy, simple) {
  const [x, y] = easy ? WARMUP_LEVELS[op]() : simple ? SIMPLE_LEVELS[op](grade) : LEVELS[op][grade]();
  let a, b, answer;
  if (op === 'add') { a = x; b = y; answer = a + b; }
  if (op === 'sub') { a = x; b = y; answer = a - b; }
  if (op === 'mul') { a = x; b = y; answer = a * b; }
  if (op === 'div') { b = x; answer = y; a = b * y; }
  return { text: `${fmt(a)} ${OPS[op].sym} ${fmtRight(b)}`, answer };
}

// Fractions, decimals, percents and equations. Answers are always typed as plain numbers.
// `easy` means "warm-up": the same kind of question as one grade lower.
const EXTRA_GEN = {
  frac(g, easy) {
    const lvl = easy ? g - 1 : g;
    const kind = pick(lvl <= 5 ? ['add', 'unit'] : lvl === 6 ? ['add', 'sub', 'of'] : ['sub', 'of', 'equiv', 'add']);
    if (kind === 'add' || kind === 'sub') {
      const d = rand(3, 12);
      let a = rand(1, d - 1), b = rand(1, d - 1);
      if (kind === 'sub' && a < b) [a, b] = [b, a];
      return kind === 'add'
        ? { text: `${a}/${d} + ${b}/${d}`, ask: `= ? / ${d}`, answer: a + b }
        : { text: `${a}/${d} − ${b}/${d}`, ask: `= ? / ${d}`, answer: a - b };
    }
    if (kind === 'unit') { const d = pick([2, 3, 4, 5, 10]); const k = rand(2, 10); return { text: `1/${d} of ${d * k}`, answer: k }; }
    if (kind === 'of') { const d = rand(2, 10), n = rand(1, d - 1), k = rand(2, 12); return { text: `${n}/${d} of ${d * k}`, answer: n * k }; }
    const b = rand(2, 9), a = rand(1, b - 1), m = rand(2, 6);
    return { text: `${a}/${b} = ? / ${b * m}`, ask: 'What goes in the ?', answer: a * m };
  },
  dec(g, easy) {
    const lvl = easy ? g - 1 : g;
    const kind = pick(lvl <= 5 ? ['add1', 'sub1'] : lvl === 6 ? ['add2', 'sub2', 'add1'] : lvl === 7 ? ['add2', 'sub2', 'mul'] : ['add2', 'sub2', 'mul', 'div']);
    if (kind === 'add1' || kind === 'sub1' || kind === 'add2' || kind === 'sub2') {
      const two = kind.endsWith('2');
      const scale = two ? 100 : 10;
      let x = two ? rand(100, 999) : rand(1, 99), y = two ? rand(10, 999) : rand(1, 99);
      const plus = kind.startsWith('add');
      if (!plus && x < y) [x, y] = [y, x];
      return { text: `${fmt(x / scale)} ${plus ? '+' : '−'} ${fmt(y / scale)}`, answer: (plus ? x + y : x - y) / scale, decimal: true };
    }
    if (kind === 'mul') { const x = rand(2, 50), k = rand(2, 9); return { text: `${fmt(x / 10)} × ${k}`, answer: (x * k) / 10, decimal: true }; }
    const a = rand(2, 50), b = rand(2, 9);
    return { text: `${fmt((a * b) / 10)} ÷ ${b}`, answer: a / 10, decimal: true };
  },
  pct(g, easy) {
    const pcts = g === 6 || easy ? [10, 20, 25, 50, 75] : [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80];
    const p = pick(pcts), base = 20 * rand(1, 10), part = (base * p) / 100;
    if (g >= 8 && !easy && rand(0, 1)) return { text: `${part} out of ${base}`, ask: '= ? %', answer: p };
    return { text: `${p}% of ${base}`, answer: part };
  },
  eq(g, easy) {
    const neg = g >= 7;
    const kind = pick(g === 6 ? ['plus', 'minus'] : easy ? ['plus', 'minus', 'times'] : g === 7 ? ['plus', 'minus', 'times', 'over'] : ['times', 'two', 'two', 'minus']);
    const a = kind === 'times' || kind === 'over' || kind === 'two' ? rand(2, 9) : rand(1, easy ? 10 : 20);
    if (kind === 'plus') { const x = neg ? rand(easy ? -5 : -10, 15) : rand(0, 20); return { text: `x + ${a} = ${fmt(x + a)}`, ask: 'x = ?', answer: x }; }
    if (kind === 'minus') { const x = neg ? rand(easy ? -5 : -10, 15) : rand(a, a + 20); return { text: `x − ${a} = ${fmt(x - a)}`, ask: 'x = ?', answer: x }; }
    if (kind === 'times') { const x = neg ? randNonZero(easy ? -6 : -12, easy ? 6 : 12) : rand(1, 12); return { text: `${a}x = ${fmt(a * x)}`, ask: 'x = ?', answer: x }; }
    if (kind === 'over') { const x = rand(-10, 12); return { text: `x ÷ ${a} = ${fmt(x)}`, ask: 'x = ?', answer: x * a }; }
    const b = randNonZero(-20, 20), x = rand(-10, 12);
    return { text: `${a}x ${signed(b)} = ${fmt(a * x + b)}`, ask: 'x = ?', answer: x };
  },
};

// Simple versions of fractions, decimals, percents and equations for "Type the answer".
const SIMPLE_EXTRA = {
  frac(g) {
    const kind = pick(g <= 5 ? ['add', 'unit'] : ['add', 'sub', 'of']);
    const d = rand(3, 9);
    if (kind === 'add' || kind === 'sub') {
      let a = rand(1, d - 1), b = rand(1, d - 1);
      if (kind === 'sub' && a < b) [a, b] = [b, a];
      return kind === 'add'
        ? { text: `${a}/${d} + ${b}/${d}`, ask: `= ? / ${d}`, answer: a + b }
        : { text: `${a}/${d} − ${b}/${d}`, ask: `= ? / ${d}`, answer: a - b };
    }
    const k = rand(2, Math.min(9, Math.floor(99 / d)));
    if (kind === 'unit') return { text: `1/${d} of ${d * k}`, answer: k };
    const n = rand(1, d - 1);
    return { text: `${n}/${d} of ${d * k}`, answer: n * k };
  },
  dec() {
    let x = rand(11, 99), y = rand(1, 9);
    const plus = rand(0, 1) === 1;
    return { text: `${fmt(x / 10)} ${plus ? '+' : '−'} ${fmt(y / 10)}`, answer: (plus ? x + y : x - y) / 10, decimal: true };
  },
  pct() {
    const p = pick([10, 20, 25, 50]), base = pick([20, 40, 60, 80]);
    return { text: `${p}% of ${base}`, answer: (base * p) / 100 };
  },
  eq(g) {
    const neg = g >= 7;
    const kind = pick(['plus', 'minus', 'times']);
    const a = rand(kind === 'times' ? 2 : 1, 9);
    const x = kind === 'times' ? (neg ? randNonZero(-9, 9) : rand(1, 9)) : neg ? rand(-9, 40) : rand(a, 50);
    if (kind === 'plus') return { text: `x + ${a} = ${fmt(x + a)}`, ask: 'x = ?', answer: x };
    if (kind === 'minus') return { text: `x − ${a} = ${fmt(x - a)}`, ask: 'x = ?', answer: x };
    return { text: `${a}x = ${fmt(a * x)}`, ask: 'x = ?', answer: x };
  },
};

function makeQuestion(op, grade, easy = false, simple = false) {
  if (op === 'mix') op = pick(mixPool(grade));
  const extra = OPS[op].minGrade > 0;
  const q = extra
    ? (simple ? SIMPLE_EXTRA[op](grade) : EXTRA_GEN[op](grade, easy))
    : basicQuestion(op, grade, easy, simple);
  q.simple = simple;
  q.op = op;
  q.ask = q.ask || '= ?';
  q.decimal = !!q.decimal;
  return q;
}

// Seconds per question. Grades 5-8 get a fast 5 seconds (typing and multiple choice);
// younger grades keep the normal timer for their grade.
const OLDER_TIMER = 5;
function questionTime(p, op) {
  const base = p.grade >= 5 ? OLDER_TIMER : TIMER_BY_GRADE[p.grade];
  return base + (EXTRA_TIME[op] || 0);
}

// Multiple choice: the right answer plus 3 different, believable wrong ones,
// in random order. Never negative before 6th grade; decimals keep their decimal places.
function makeChoices(q, grade) {
  const allowNeg = grade >= 6;
  const places = q.decimal ? Math.min(2, Math.max(1, (String(q.answer).split('.')[1] || '').length)) : 0;
  const unit = 10 ** -places;
  const round = (n) => Number(n.toFixed(places));
  const answer = round(q.answer);
  const big = Math.max(2, Math.round(Math.abs(answer) * 0.1));
  const steps = [1, 2, 3, 4, 5].map((k) => k * unit).concat(places ? [1, 0.5] : [10, big]);
  const pool = [];
  steps.forEach((d) => pool.push(answer + d, answer - d));
  if (allowNeg && answer !== 0) pool.push(-answer);
  const wrong = new Set();
  shuffle(pool.map(round)).forEach((n) => {
    if (wrong.size < 3 && n !== answer && (allowNeg || n >= 0)) wrong.add(n);
  });
  for (let k = 6; wrong.size < 3; k++) wrong.add(round(answer + k * unit)); // backup, rarely needed
  return shuffle([answer, ...wrong]);
}

// A course: warm-up questions first for 7th/8th grade, plus a few
// "review" questions this player missed last time (if they fit the subject).
function makeCourse(p, count) {
  const qs = [];
  const seen = new Set();
  const warmup = WARMUP_GRADES.includes(p.grade) ? Math.round(count * WARMUP_SHARE) : 0;
  const simple = p.mode !== 'choice';
  let tries = 0;
  while (qs.length < count) {
    const q = makeQuestion(p.op, p.grade, qs.length < warmup, simple);
    const key = q.text + q.ask;
    if (seen.has(key) && tries++ < 300) continue; // avoid repeats when possible
    seen.add(key);
    qs.push(q);
  }
  // review questions only come back in the same kind of course they were missed in
  const reviews = p.reviewQueue
    .filter((q) => !!q.simple === simple)
    .filter((q) => (p.op === 'mix' ? mixPool(p.grade).includes(q.op) : q.op === p.op) && !seen.has(q.text + q.ask))
    .slice(0, Math.min(REVIEW_PER_COURSE, count - warmup));
  reviews.forEach((q) => {
    // swap a review question into a random spot after the warm-up
    const spot = rand(warmup, count - 1);
    qs[spot] = { ...q, review: true };
  });
  qs.forEach((q) => {
    q.time = questionTime(p, q.op);
    if (p.mode === 'choice') q.choices = makeChoices(q, p.grade);
  });
  return qs;
}

// ---------- SVG / HTML pieces ----------
// Chunky, rounded chest. The lid is its own group so CSS can swing it open.
function chestSVG({ open = false } = {}) {
  const c = { body: '#d9822b', dark: '#a85d17', lid: '#f0a040', trim: '#ffd23f', trimDark: '#d39b12', inside: '#5b2e0c' };
  return `<svg viewBox="0 0 100 92" class="chest${open ? ' open' : ''}" aria-hidden="true">
    <ellipse cx="50" cy="87" rx="38" ry="5" fill="rgba(0,0,0,.25)"/>
    <g class="chest-inside">
      <ellipse cx="50" cy="40" rx="40" ry="16" fill="#fff3b0" opacity=".55"/>
      <rect x="13" y="40" width="74" height="12" rx="6" fill="${c.inside}"/>
    </g>
    <rect x="10" y="44" width="80" height="40" rx="11" fill="${c.dark}"/>
    <rect x="10" y="44" width="80" height="33" rx="11" fill="${c.body}"/>
    <rect x="23" y="44" width="10" height="40" fill="${c.trim}"/>
    <rect x="67" y="44" width="10" height="40" fill="${c.trim}"/>
    <rect x="23" y="77" width="10" height="7" fill="${c.trimDark}"/>
    <rect x="67" y="77" width="10" height="7" fill="${c.trimDark}"/>
    <g class="chest-lid">
      <path d="M10 50 V36 Q10 14 50 14 Q90 14 90 36 V50 Z" fill="${c.lid}"/>
      <rect x="10" y="44" width="80" height="6" fill="${c.dark}" opacity=".45"/>
      <rect x="23" y="20" width="10" height="30" rx="3" fill="${c.trim}"/>
      <rect x="67" y="20" width="10" height="30" rx="3" fill="${c.trim}"/>
      <path d="M22 27 Q50 15 78 27" stroke="#fff" stroke-opacity=".45" stroke-width="5" fill="none" stroke-linecap="round"/>
      <rect x="40" y="36" width="20" height="22" rx="7" fill="${c.trim}" stroke="${c.trimDark}" stroke-width="2.5"/>
      <circle cx="50" cy="45" r="3" fill="${c.trimDark}"/>
      <rect x="48.8" y="46" width="2.4" height="6" rx="1" fill="${c.trimDark}"/>
    </g>
  </svg>`;
}

function avatarHTML(avatarId, frameId, size) {
  const a = avatarById(avatarId);
  return `<span class="av frame-${frameId}" style="--size:${size}px"><span class="av-face" style="background:linear-gradient(135deg, ${a.bg[0]}, ${a.bg[1]})">${a.face}</span></span>`;
}

// ---------- screens ----------
const SCREENS = ['login', 'ready', 'countdown', 'quiz', 'results', 'lobby', 'typing', 'typedone', 'lessons'];
function show(name) {
  SCREENS.forEach((s) => $(`screen-${s}`).classList.toggle('hidden', s !== name));
  $('topbar').classList.toggle('hidden', name === 'login');
  if (['countdown', 'quiz', 'login', 'typing'].includes(name)) hideToast();
  window.scrollTo(0, 0);
  updateMusic();
}

function renderTopbar() {
  const p = player();
  if (!p) return;
  $('gem-count').textContent = p.gems.toLocaleString();
  $('player-name').textContent = p.name;
  paintName($('player-name'), p.nameColor);
  $('top-avatar').innerHTML = avatarHTML(p.avatar, p.frame, 30);
  $('streak-count').textContent = p.streak;
  const t = fireTier(p.streak);
  const fire = $('fire');
  fire.style.setProperty('--fire-outer', t.outer);
  fire.style.setProperty('--fire-inner', t.inner);
  fire.style.setProperty('--fire-glow', t.glow);
  $('streak-wrap').title = `${p.streak} day streak (${t.name} fire)`;
  $('reward-badge').classList.toggle('hidden', !canClaim(p));
  $('progress-badge').classList.toggle('hidden', !unclaimedBadges(p).length);
  applyFont();
}

function gradeButtons(container, selected, onPick) {
  container.innerHTML = '';
  GRADES.forEach((g, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'grade-btn' + (i === selected ? ' selected' : '');
    b.textContent = g;
    b.title = GRADE_NAMES[i];
    b.onclick = () => {
      container.querySelectorAll('.grade-btn').forEach((x) => x.classList.remove('selected'));
      b.classList.add('selected');
      onPick(i);
    };
    container.appendChild(b);
  });
}

// ---------- banners (welcome back, badges, streak freeze) ----------
const bannerQueue = [];
let bannerBusy = false;

function showBanner(icon, text, { wave = false } = {}) {
  bannerQueue.push({ icon, text, wave });
  if (!bannerBusy) nextBanner();
}
function nextBanner() {
  const b = bannerQueue.shift();
  if (!b) { bannerBusy = false; return; }
  bannerBusy = true;
  const box = $('welcome');
  $('banner-icon').textContent = b.icon;
  $('banner-icon').classList.toggle('waving', b.wave);
  $('welcome-text').textContent = b.text;
  box.classList.remove('hidden', 'leaving');
  void box.offsetWidth;
  setTimeout(() => {
    box.classList.add('leaving');
    setTimeout(() => { box.classList.add('hidden'); nextBanner(); }, 300);
  }, 3200);
}

// "Welcome back, Name! 👋" when someone returns after 12+ hours away.
const WELCOME_AFTER_MS = 12 * 60 * 60 * 1000;

function maybeWelcome() {
  const p = player();
  if (!p) return;
  const now = Date.now();
  if (p.lastWelcome && now - p.lastWelcome < WELCOME_AFTER_MS) return;
  p.lastWelcome = now;
  save();
  showBanner('👋', `Welcome back, ${p.name}!`, { wave: true });
}

// ---------- lost streak: use streak freezes or restart ----------
function showStreakBreak() {
  const p = player();
  if (!p || !p.pendingBreak) return;
  const { missed, streak } = p.pendingBreak;
  const days = missed === 1 ? 'a day' : `${missed} days`;
  $('sb-text').textContent = `You missed ${days}, so your ${streak} day streak was lost.`;
  const freeze = $('sb-freeze');
  const enough = p.freezes >= missed;
  freeze.disabled = !enough;
  freeze.textContent = enough
    ? `Use ${missed === 1 ? 'a streak freeze' : `${missed} streak freezes`} (you have ${p.freezes})`
    : `Not enough streak freezes (you have ${p.freezes}, need ${missed})`;
  hideToast();
  $('streak-modal').classList.remove('hidden');
  sfx.wrong();
}

function resolveStreakBreak(useFreeze) {
  const p = player();
  const b = p && p.pendingBreak;
  if (!b) return;
  if (useFreeze) {
    if (p.freezes < b.missed) return;
    p.freezes -= b.missed;
    p.streak = b.streak + 1;
    sfx.buy();
  } else {
    p.streak = 1;
    p.claimedDays = [];
    sfx.close();
  }
  p.pendingBreak = null;
  p.bestStreak = Math.max(p.bestStreak, p.streak);
  save();
  $('streak-modal').classList.add('hidden');
  renderTopbar();
  if (!$('screen-lobby').classList.contains('hidden')) {
    renderLobby();
    if (!$('tab-rewards').classList.contains('hidden')) renderRewards();
  }
  if (useFreeze) showBanner('❄️', `Streak saved! You're on a ${p.streak} day streak.`);
  if (!quiz) maybeToast();
  announceBadges(p);
}
$('sb-freeze').onclick = () => resolveStreakBreak(true);
$('sb-restart').onclick = () => resolveStreakBreak(false);

// ---------- badges ----------
// Earned badges wait in the Progress tab until they're claimed for gems.
function checkBadges(p) {
  const earned = BADGES.filter((b) => !p.badges.includes(b.id) && b.test(p));
  earned.forEach((b) => p.badges.push(b.id));
  if (earned.length) save();
  return earned;
}
const unclaimedBadges = (p) => p.badges.filter((id) => !p.badgesClaimed.includes(id));
function claimBadge(id) {
  const p = player();
  if (!p.badges.includes(id) || p.badgesClaimed.includes(id)) return;
  p.badgesClaimed.push(id);
  p.gems += BADGE_GEMS;
  p.gemsEarned += BADGE_GEMS;
  save();
  sfx.buy();
  renderTopbar();
  renderStats();
}
// Badges earned outside of a course (streaks, unlocking things) pop up as banners.
function announceBadges(p) {
  const earned = checkBadges(p);
  if (!earned.length) return;
  sfx.badge();
  earned.forEach((b) => showBanner(b.icon, `Badge unlocked: ${b.name}! Claim ${BADGE_GEMS} gems in Progress`));
  renderTopbar();
}

// ---------- login ----------
let loginGrade = null;
let loginAvatar = FREE_AVATARS[0];
let editingKey = null; // set while editing an existing account on the sign-in page

function showLogin() {
  editingKey = null;
  loginGrade = null;
  loginAvatar = FREE_AVATARS[0];
  $('name-input').value = '';
  $('name-taken').classList.add('hidden');
  $('name-input').classList.remove('taken');
  gradeButtons($('login-grades'), -1, (g) => { loginGrade = g; $('grade-missing').classList.add('hidden'); });
  $('grade-missing').classList.add('hidden');
  renderLoginAvatars();
  setEditingLook(null);
  applyFont();
  $('login-form').classList.remove('hidden');
  $('accounts-view').classList.add('hidden');
  show('login');
  $('name-input').focus();
}

// Edit an account: the normal sign-in page, filled in, with "Currently editing (Name)".
function showEditProfile(key) {
  const p = data.profiles[key];
  editingKey = key;
  loginGrade = p.grade;
  loginAvatar = p.avatar;
  $('name-input').value = p.name;
  gradeButtons($('login-grades'), p.grade, (g) => { loginGrade = g; });
  renderLoginAvatars();
  setEditingLook(p.name);
  $('login-form').classList.remove('hidden');
  $('accounts-view').classList.add('hidden');
  show('login');
}

function setEditingLook(name) {
  $('editing-label').classList.toggle('hidden', !name);
  if (name) {
    const p = data.profiles[editingKey];
    $('editing-avatar').innerHTML = avatarHTML(p.avatar, p.frame, 34);
    $('editing-name').textContent = name;
  }
  $('login-submit').textContent = name ? 'Save changes' : "Let's go!";
  $('have-account').textContent = name ? 'Cancel' : 'I have an account!';
}

function renderLoginAvatars() {
  // while editing, the account's current avatar is offered too (even if it was unlocked with gems)
  const ids = FREE_AVATARS.includes(loginAvatar) ? FREE_AVATARS : [...FREE_AVATARS, loginAvatar];
  $('login-avatars').innerHTML = ids.map((id) => `
    <button type="button" class="avatar-choice${id === loginAvatar ? ' selected' : ''}" data-id="${id}" aria-label="${avatarById(id).name}">
      ${avatarHTML(id, 'none', 52)}
    </button>`).join('');
}
$('login-avatars').addEventListener('click', (e) => {
  const b = e.target.closest('.avatar-choice');
  if (!b) return;
  loginAvatar = b.dataset.id;
  renderLoginAvatars();
});

// Sign in to an account. Only an account's very first sign-in gets the
// "see what a course is like?" prompt; after that it goes to the lobby.
// (Accounts made before this flag existed have no seenIntro, so they count as seen.)
function signInAs(key) {
  const p = data.profiles[key];
  data.current = key;
  touchStreak(p);
  const firstTime = p.seenIntro === false;
  p.seenIntro = true;
  save();
  renderTopbar();
  if (firstTime) showReady(true);
  else showLobby('play');
  maybeToast();
  maybeWelcome();
  showStreakBreak();
  announceBadges(p);
}

// "I have an account!" lists every account saved on this device.
function showAccounts() {
  const list = $('account-list');
  const profiles = Object.entries(data.profiles);
  list.innerHTML = profiles.length
    ? profiles.map(([key, p]) => `
      <div class="account-row" data-key="${key}">
        <button type="button" class="account-item" data-key="${key}">
          ${avatarHTML(p.avatar, p.frame, 50)}
          <span class="account-info">
            <strong></strong>
            <small>${GRADE_NAMES[p.grade]} · ${p.streak} day streak · ${p.gems.toLocaleString()} gems</small>
          </span>
        </button>
        <button type="button" class="dots" aria-label="More options">⋯</button>
        <div class="acct-menu hidden">
          <button type="button" data-act="edit">Edit</button>
          <button type="button" data-act="delete" class="danger">Delete</button>
        </div>
      </div>`).join('')
    : '<p class="sub">No accounts on this device yet. Make a new one!</p>';
  // names go in as text, not HTML
  list.querySelectorAll('.account-item').forEach((b) => {
    b.querySelector('strong').textContent = data.profiles[b.dataset.key].name;
    paintName(b.querySelector('strong'), data.profiles[b.dataset.key].nameColor);
    b.onclick = () => signInAs(b.dataset.key);
  });
  $('login-form').classList.add('hidden');
  $('accounts-view').classList.remove('hidden');
}

// The ⋯ button on each account opens Edit / Delete.
const closeAccountMenus = () => document.querySelectorAll('.acct-menu').forEach((m) => m.classList.add('hidden'));
$('account-list').addEventListener('click', (e) => {
  const row = e.target.closest('.account-row');
  if (!row) return;
  const key = row.dataset.key;
  if (e.target.closest('.dots')) {
    const menu = row.querySelector('.acct-menu');
    const wasOpen = !menu.classList.contains('hidden');
    closeAccountMenus();
    menu.classList.toggle('hidden', wasOpen);
    if (!wasOpen) sfx.open();
    return;
  }
  const act = e.target.closest('[data-act]');
  if (!act) return;
  closeAccountMenus();
  if (act.dataset.act === 'edit') showEditProfile(key);
  if (act.dataset.act === 'delete') {
    const name = data.profiles[key].name;
    askQuit(() => {
      delete data.profiles[key];
      if (data.current === key) data.current = null;
      save();
      sfx.close();
      showAccounts();
    }, {
      title: `Delete ${name}?`,
      sub: `This erases all of ${name}'s progress, gems and avatars. It can't be undone.`,
      yes: `Yes, delete ${name}`,
      no: 'No, keep it!',
    });
  }
});
document.addEventListener('click', (e) => { if (!e.target.closest('.account-row')) closeAccountMenus(); });

$('have-account').onclick = showAccounts; // says "Cancel" while editing
$('new-account').onclick = showLogin;

$('login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('name-input').value.trim();
  if (!name) return;
  if (loginGrade === null) { $('grade-missing').classList.remove('hidden'); sfx.wrong(); return; }
  const key = name.toLowerCase();
  if (editingKey) {
    // save changes to an existing account (renaming moves it to the new name)
    const taken = Object.entries(data.profiles).find(([k, other]) => k !== editingKey && (k === key || other.name.toLowerCase() === key));
    if (taken) { $('name-taken').classList.remove('hidden'); $('name-input').classList.add('taken'); sfx.wrong(); return; }
    const p = data.profiles[editingKey];
    p.name = name;
    p.grade = loginGrade;
    p.avatar = loginAvatar;
    if (key !== editingKey) {
      data.profiles[key] = p;
      delete data.profiles[editingKey];
      if (data.current === editingKey) data.current = key;
    }
    editingKey = null;
    save();
    sfx.buy();
    setEditingLook(null);
    showAccounts();
    return;
  }
  // names are unique on this device: a new account can't reuse one that's taken
  const taken = Object.entries(data.profiles).some(([k, other]) => k === key || other.name.toLowerCase() === key);
  if (taken) {
    $('name-taken').classList.remove('hidden');
    $('name-input').classList.remove('nudge');
    void $('name-input').offsetWidth;
    $('name-input').classList.add('nudge', 'taken');
    $('name-input').focus();
    sfx.wrong();
    return;
  }
  data.profiles[key] = newProfile(name, loginGrade, loginAvatar);
  signInAs(key);
});
$('name-input').addEventListener('input', () => {
  $('name-taken').classList.add('hidden');
  $('name-input').classList.remove('taken');
});

// ---------- profile: avatars, frames + name colors ----------
// Tap your avatar/name (top right) to try on, unlock and use cosmetics.
// Each kind: its item list, which list of owned ids it uses, and which one is in use.
const COSMETICS = {
  avatar: { list: AVATARS,     owned: 'ownedAvatars',    using: 'avatar',    label: '' },
  frame:  { list: FRAMES,      owned: 'ownedFrames',     using: 'frame',     label: ' frame' },
  name:   { list: NAME_COLORS, owned: 'ownedNameColors', using: 'nameColor', label: ' name color' },
};
let locker = null; // { kind, avatar, frame, nameColor (what's being tried on), focus: {kind, id} }

function openProfile() {
  const p = player();
  if (!p) return;
  locker = { kind: 'avatar', avatar: p.avatar, frame: p.frame, nameColor: p.nameColor, focus: { kind: 'avatar', id: p.avatar } };
  renderProfile();
  $('profile-modal').classList.remove('hidden');
  sfx.open();
}
function closeProfile() {
  if (!$('profile-modal').classList.contains('hidden')) sfx.close();
  $('profile-modal').classList.add('hidden');
  locker = null;
  renderTopbar();
}

function renderProfile() {
  const p = player();
  $('pv-avatar').innerHTML = avatarHTML(locker.avatar, locker.frame, 104);
  $('pv-name').textContent = p.name;
  paintName($('pv-name'), locker.nameColor);
  $('pv-sub').textContent = `${GRADE_NAMES[p.grade]} · ${p.badges.length} badges`;
  $('pv-gems').textContent = p.gems.toLocaleString();
  document.querySelectorAll('#profile-seg button').forEach((b) => b.classList.toggle('active', b.dataset.kind === locker.kind));

  const kind = COSMETICS[locker.kind];
  const items = [...kind.list].sort((a, b) => a.price - b.price);
  const owned = p[kind.owned];
  const using = p[kind.using];
  $('item-grid').classList.toggle('names', locker.kind === 'name');
  $('item-grid').innerHTML = items.map((it) => {
    const has = owned.includes(it.id);
    const sel = locker.focus.kind === locker.kind && locker.focus.id === it.id;
    const face = locker.kind === 'avatar' ? avatarHTML(it.id, 'none', 58)
      : locker.kind === 'frame' ? avatarHTML(locker.avatar, it.id, 58)
      : `<span class="name-sample nc-${it.id}">${escapeHTML(p.name)}</span>`;
    const tag = !has ? `<span class="item-price">${GEM_SVG}${it.price}</span>`
      : it.id === using ? '<span class="item-tag on">Using</span>'
      : '<span class="item-tag">Owned</span>';
    return `<button type="button" class="item${has ? '' : ' locked'}${sel ? ' selected' : ''}" data-id="${it.id}">
      <span class="item-face">${face}${has ? '' : LOCK_SVG}</span>
      <span class="item-name">${it.name}</span>${tag}
    </button>`;
  }).join('');

  // the button under the preview acts on the item you last tapped
  const f = locker.focus;
  const fk = COSMETICS[f.kind];
  const item = fk.list.find((x) => x.id === f.id);
  const has = p[fk.owned].includes(f.id);
  const isOn = p[fk.using] === f.id;
  $('pv-item-name').textContent = f.id === 'none' ? item.name : item.name + fk.label;
  const btn = $('pv-action');
  btn.disabled = false;
  if (isOn) { btn.textContent = 'Using it ✓'; btn.disabled = true; }
  else if (has) btn.textContent = 'Use it';
  else if (p.gems >= item.price) btn.textContent = `Unlock for ${item.price} gems`;
  else { btn.textContent = `Need ${item.price - p.gems} more gems`; btn.disabled = true; }
}

$('top-profile').onclick = openProfile;
$('profile-close').onclick = closeProfile;
$('profile-modal').addEventListener('click', (e) => { if (e.target.id === 'profile-modal') closeProfile(); });
$('profile-seg').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b || !locker) return;
  locker.kind = b.dataset.kind;
  renderProfile();
});
$('item-grid').addEventListener('click', (e) => {
  const b = e.target.closest('.item');
  if (!b || !locker) return;
  const id = b.dataset.id;
  locker[COSMETICS[locker.kind].using] = id; // try it on
  locker.focus = { kind: locker.kind, id };
  renderProfile();
});
$('pv-action').onclick = () => {
  const p = player();
  const { kind, id } = locker.focus;
  const k = COSMETICS[kind];
  const item = k.list.find((x) => x.id === id);
  const owned = p[k.owned];
  if (!owned.includes(id)) {
    if (p.gems < item.price) return;
    p.gems -= item.price;
    p.purchases += 1;
    owned.push(id);
    sfx.buy();
    const pv = $('pv-avatar');
    pv.classList.remove('unlocked');
    void pv.offsetWidth;
    pv.classList.add('unlocked');
  }
  p[k.using] = id;
  save();
  renderTopbar();
  renderProfile();
  announceBadges(p);
};

// ---------- ready + countdown ----------
// The first time (right after signing in) the buttons are worded differently.
// The "ready?" screen is shared by math courses and typing tests.
let readyFor = 'math';

function showReady(afterSignIn = false) {
  const p = player();
  readyFor = 'math';
  $('mode-seg').classList.remove('hidden');
  if (!opsForGrade(p.grade).includes(p.op)) p.op = 'add';
  renderReadyDetails();
  $('screen-ready').querySelector('.ready-title').textContent = afterSignIn
    ? 'Do you wanna see what a course is like?'
    : 'Are you ready to start the course?';
  $('ready-yes').textContent = afterSignIn ? "Sure, I'll try it!" : 'Yes!';
  $('ready-no').textContent = afterSignIn ? 'No, I wanna see the lobby!' : 'No, go back!';
  show('ready');
}

// "Type the answer" or "Multiple choice", picked right before the course.
function renderReadyDetails() {
  const p = player();
  document.querySelectorAll('#mode-seg button').forEach((b) => b.classList.toggle('active', b.dataset.mode === (p.mode || 'type')));
  $('ready-details').textContent = `${GRADE_NAMES[p.grade]} · ${OPS[p.op].label} · ${courseLength(p)} questions · ${questionTime(p, 'add')} seconds each`;
}
$('mode-seg').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  player().mode = b.dataset.mode;
  save();
  renderReadyDetails();
});

// Ready screen for typing: a typing test (default), a lesson or the placement test.
let pendingRun = null;
let readyBack = () => showLobby('play');
function showTypingReady(run = null, title = 'Are you ready to start the typing test?', details = null, back = () => showLobby('play')) {
  const level = TYPING_LEVELS[player().typingLevel] || TYPING_LEVELS.easy;
  readyFor = 'typing';
  pendingRun = run;
  readyBack = back;
  $('mode-seg').classList.add('hidden');
  $('ready-details').textContent = details || `${level.label} typing test · ${TYPING_SENTENCES} sentences`;
  $('screen-ready').querySelector('.ready-title').textContent = title;
  $('ready-yes').textContent = 'Yes!';
  $('ready-no').textContent = 'No, go back!';
  show('ready');
}

$('ready-yes').onclick = () => {
  if (readyFor !== 'typing') { startCountdown(startQuiz); return; }
  const run = pendingRun || testRun();
  startCountdown(() => startTypingRun(run));
};
$('ready-no').onclick = () => (readyFor === 'typing' ? readyBack() : showLobby('play'));

function startCountdown(next) {
  show('countdown');
  const el = $('countdown-num');
  const steps = ['3', '2', '1', 'Go!'];
  let i = 0;
  const tick = () => {
    if (i >= steps.length) { next(); return; }
    el.textContent = steps[i];
    el.classList.remove('pop');
    void el.offsetWidth; // restart the animation
    el.classList.add('pop');
    if (steps[i] === 'Go!') sfx.go(); else sfx.count();
    i++;
    setTimeout(tick, i === steps.length ? 600 : 900);
  };
  tick();
}

// ---------- quiz ----------
// phase 'main' is the scored course; phase 'retry' is the second chance at
// missed questions, which never changes the score.
let quiz = null;

function startQuiz() {
  const p = player();
  const qs = makeCourse(p, courseLength(p));
  quiz = {
    main: qs, list: qs, phase: 'main', i: 0, correct: 0, locked: false,
    results: [], wrong: [], fixed: 0, combo: 0, bestCombo: 0, comboGems: 0, qStart: 0,
  };
  renderSoundControls();
  show('quiz');
  renderQuestion();
}

function renderQuestion() {
  const q = quiz.list[quiz.i];
  const retry = quiz.phase === 'retry';
  const card = $('flashcard');
  card.classList.remove('right', 'wrong', 'flip');
  void card.offsetWidth;
  card.classList.add('flip');
  $('question').textContent = q.text;
  $('question').classList.toggle('long', q.text.length > 10);
  $('ask').textContent = q.ask;
  // a tag on the card for questions they missed before
  const tag = $('review-tag');
  tag.classList.toggle('hidden', !(retry || q.review));
  tag.textContent = 'Review question';
  $('screen-quiz').querySelector('.quiz-wrap').classList.toggle('retry', retry);
  $('q-count').textContent = retry ? `Retry ${quiz.i + 1} / ${quiz.list.length}` : `${quiz.i + 1} / ${quiz.list.length}`;
  $('progress-fill').style.width = `${(quiz.i / quiz.list.length) * 100}%`;
  $('score-line').innerHTML = retry
    ? 'Fix the ones you missed! These don\'t change your score.'
    : `Correct: <strong>${quiz.correct}</strong>`;
  const choice = !!q.choices;
  $('answer-form').classList.toggle('hidden', choice);
  $('keypad').classList.toggle('hidden', choice);
  $('choices').classList.toggle('hidden', !choice);
  const input = $('answer-input');
  input.value = '';
  input.className = 'answer-input';
  input.disabled = false;
  if (choice) {
    // second-chance questions get their choices shuffled again
    const opts = retry ? shuffle([...q.choices]) : q.choices;
    $('choices').innerHTML = opts.map((n, i) =>
      `<button type="button" class="choice" data-v="${n}"><span class="ckey">${i + 1}</span>${fmt(n)}</button>`).join('');
  } else {
    buildKeypad(q);
  }
  $('feedback').innerHTML = '&nbsp;';
  $('feedback').className = 'feedback';
  quiz.locked = false;
  if (!choice) input.focus();
  quiz.qStart = performance.now();
  startTimer(q.time);
}

// Only numbers: digits, a leading minus from 6th grade, and a decimal point for decimal questions.
const allowMinus = () => player() && player().grade >= 6;
const currentQ = () => (quiz ? quiz.list[quiz.i] : null);
function cleanNumber(text) {
  const q = currentQ();
  const neg = allowMinus() && /^\s*[-−]/.test(text);
  let s;
  if (q && q.decimal) {
    s = text.replace(/[^\d.]/g, '');
    const dot = s.indexOf('.');
    s = dot < 0 ? s.slice(0, 6) : s.slice(0, dot).slice(0, 6) + '.' + s.slice(dot + 1).replace(/\./g, '').slice(0, 2);
  } else {
    s = text.replace(/\D/g, '').slice(0, 6);
  }
  return (neg ? '-' : '') + s;
}

function buildKeypad(q) {
  const special = q.decimal ? '.' : allowMinus() ? '±' : '';
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', special, '0', '⌫'];
  $('keypad').innerHTML = keys.map((k) => k
    ? `<button type="button" class="key${k === '⌫' || k === '±' || k === '.' ? ' fn' : ''}" data-key="${k}">${k === '±' ? '+/−' : k}</button>`
    : '<span></span>').join('');
}

$('keypad').addEventListener('click', (e) => {
  const btn = e.target.closest('.key');
  if (!btn || !quiz || quiz.locked) return;
  const input = $('answer-input');
  const k = btn.dataset.key;
  if (k === '⌫') input.value = input.value.slice(0, -1);
  else if (k === '±') input.value = input.value.startsWith('-') ? input.value.slice(1) : '-' + input.value;
  else input.value = cleanNumber(input.value + k);
  input.focus();
});

$('answer-input').addEventListener('beforeinput', (e) => {
  // block letters and symbols before they ever show up
  const q = currentQ();
  const ok = /^[0-9]+$/.test(e.data || '') || (allowMinus() && /^[-−]$/.test(e.data)) || (q && q.decimal && e.data === '.');
  if (e.data && !ok) e.preventDefault();
});
$('answer-input').addEventListener('input', (e) => {
  const clean = cleanNumber(e.target.value);
  if (clean !== e.target.value) e.target.value = clean;
});

$('answer-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!quiz || quiz.locked) return;
  const input = $('answer-input');
  if (input.value === '' || Number.isNaN(Number(input.value))) {
    input.classList.remove('nudge');
    void input.offsetWidth;
    input.classList.add('nudge');
    input.focus();
    return;
  }
  checkAnswer(input.value);
});

// Multiple choice: tap an answer, or press 1-4 on a keyboard.
$('choices').addEventListener('click', (e) => {
  const b = e.target.closest('.choice');
  if (!b || !quiz || quiz.locked) return;
  checkAnswer(b.dataset.v);
});
document.addEventListener('keydown', (e) => {
  if (!quiz || quiz.locked || quitPending || $('choices').classList.contains('hidden')) return;
  const b = $('choices').children[Number(e.key) - 1];
  if (b) b.click();
});

// value is the typed or picked answer, or null when the timer ran out
function checkAnswer(value) {
  quiz.locked = true;
  stopTimer();
  const p = player();
  const input = $('answer-input');
  const q = quiz.list[quiz.i];
  const ok = value !== null && Math.abs(Number(value) - q.answer) < 1e-6;
  const seconds = Math.min(q.time, (performance.now() - quiz.qStart) / 1000);

  if (quiz.phase === 'main') {
    quiz.results.push({ q, ok, seconds });
    const st = p.subjectStats[q.op] || (p.subjectStats[q.op] = { right: 0, total: 0 });
    st.total += 1;
    if (ok) st.right += 1;
    const today = dayKey();
    p.daily[today] = (p.daily[today] || 0) + 1;
    if (ok) {
      quiz.correct++;
      quiz.combo++;
      quiz.bestCombo = Math.max(quiz.bestCombo, quiz.combo);
      if (q.review) p.reviewQueue = p.reviewQueue.filter((r) => r.text + r.ask !== q.text + q.ask);
      if (quiz.combo % COMBO_EVERY === 0) {
        quiz.comboGems += COMBO_GEMS;
        comboPop(`${quiz.combo} in a row!`, quiz.wrong.length ? 'Keep it up!' : `+${COMBO_GEMS} gems if perfect`);
      }
    } else {
      quiz.combo = 0;
      quiz.wrong.push(q);
    }
    save();
  } else if (ok) {
    quiz.fixed++;
  }

  if (ok) sfx.right(); else sfx.wrong();
  input.disabled = true;
  input.classList.add(ok ? 'right' : 'wrong');
  $('flashcard').classList.add(ok ? 'right' : 'wrong');
  [...$('choices').children].forEach((b) => {
    b.disabled = true;
    if (Math.abs(Number(b.dataset.v) - q.answer) < 1e-6) b.classList.add('right');
    else if (value !== null && b.dataset.v === String(value)) b.classList.add('wrong');
  });
  const fb = $('feedback');
  fb.className = 'feedback show ' + (ok ? 'good' : 'bad');
  const answerText = q.ask.includes('?') ? q.ask.replace('?', fmt(q.answer)) : `= ${fmt(q.answer)}`;
  fb.textContent = ok ? ['Correct!', 'Nice!', 'You got it!', 'Awesome!'][rand(0, 3)]
    : value === null ? `Time's up! ${answerText}`
    : `Not quite! ${answerText}`;
  if (quiz.phase === 'main') $('score-line').innerHTML = `Correct: <strong>${quiz.correct}</strong>`;
  const current = quiz;
  setTimeout(() => {
    if (quiz !== current) return; // they quit meanwhile
    nextQuestion();
  }, ok ? 800 : 1800);
}

function nextQuestion() {
  quiz.i++;
  if (quiz.i < quiz.list.length) { renderQuestion(); return; }
  if (quiz.phase === 'main' && quiz.wrong.length) { startRetry(); return; }
  finishQuiz();
}

function startRetry() {
  quiz.phase = 'retry';
  quiz.list = quiz.wrong.map((q) => ({ ...q }));
  quiz.i = 0;
  const n = quiz.list.length;
  $('retry-sub').textContent = `Let's try the ${n === 1 ? 'one' : n} you missed again.`;
  $('retry-intro').classList.remove('hidden');
  sfx.combo();
  const current = quiz;
  setTimeout(() => {
    $('retry-intro').classList.add('hidden');
    if (quiz === current) renderQuestion();
  }, 2200);
}

function comboPop(big, small) {
  const el = $('combo-pop');
  el.innerHTML = `<strong>${big}</strong><span>${small}</span>`;
  el.classList.remove('hidden', 'go');
  void el.offsetWidth;
  el.classList.add('go');
  sfx.combo();
}
$('combo-pop').addEventListener('animationend', () => $('combo-pop').classList.add('hidden'));

// ---------- question timer ----------
let timerFrame = null;

// `left` lets a paused timer pick up where it stopped (total stays the full time for the bar).
let timerEndAt = 0;
let timerTotal = 0;
function startTimer(seconds, left = seconds) {
  stopTimer();
  const total = seconds * 1000;
  const end = performance.now() + left * 1000;
  timerEndAt = end;
  timerTotal = seconds;
  let lastSec = Math.ceil(left);
  const tick = (now) => {
    const left = Math.max(0, end - now);
    const sec = Math.ceil(left / 1000);
    $('timer-fill').style.width = `${(left / total) * 100}%`;
    $('timer-num').textContent = sec;
    $('timer').classList.toggle('hurry', left <= 3000);
    if (sec !== lastSec) { lastSec = sec; if (sec > 0 && sec <= 3) sfx.tick(); }
    if (left <= 0) { timerFrame = null; if (quiz && !quiz.locked) checkAnswer(null); return; }
    timerFrame = requestAnimationFrame(tick);
  };
  timerFrame = requestAnimationFrame(tick);
}

function stopTimer() {
  if (timerFrame) cancelAnimationFrame(timerFrame);
  timerFrame = null;
}

// In-game "Are you sure you want to quit?" popup (instead of the browser's own box).
// The question timer pauses while it's open and picks up where it left off on "No".
let quitPending = null; // { onYes, resumeLeft }
// The same popup is used for other "are you sure?" questions by passing different words.
const QUIT_WORDS = { title: 'Are you sure you want to quit?', sub: "Your progress won't be saved.", yes: "Yes, I'm sure", no: 'No, I accidentally clicked this!' };
function askQuit(onYes, words = {}) {
  const w = { ...QUIT_WORDS, ...words };
  $('quit-title').textContent = w.title;
  $('quit-sub').textContent = w.sub;
  $('quit-yes').textContent = w.yes;
  $('quit-no').textContent = w.no;
  const running = !!timerFrame;
  const resumeLeft = running ? Math.max(0, (timerEndAt - performance.now()) / 1000) : null;
  stopTimer();
  quitPending = { onYes, resumeLeft, total: timerTotal };
  $('typing-input').blur();
  $('answer-input').blur();
  $('quit-modal').classList.remove('hidden');
  sfx.open();
}
$('quit-yes').onclick = () => {
  const q = quitPending;
  quitPending = null;
  $('quit-modal').classList.add('hidden');
  if (q) q.onYes();
};
$('quit-no').onclick = () => {
  const q = quitPending;
  quitPending = null;
  $('quit-modal').classList.add('hidden');
  sfx.close();
  if (q && q.resumeLeft !== null && quiz && !quiz.locked) startTimer(q.total, q.resumeLeft);
  if (typing && !typing.locked) $('typing-input').focus();
};

$('quit-btn').onclick = () => askQuit(() => {
  stopTimer();
  quiz = null;
  $('retry-intro').classList.add('hidden');
  showLobby('play');
});

function finishQuiz() {
  const p = player();
  const { results } = quiz;
  const score = quiz.correct;
  const total = quiz.main.length;
  const pct = score / total;
  const perfect = score === total;
  const times = results.map((r) => r.seconds);
  const avg = times.reduce((s, t) => s + t, 0) / times.length;

  // every missed question comes back as a "Review question" in a later course
  quiz.wrong.forEach((q) => {
    const key = q.text + q.ask;
    p.reviewQueue = [{ text: q.text, ask: q.ask, answer: q.answer, op: q.op, decimal: q.decimal, simple: q.simple },
      ...p.reviewQueue.filter((r) => r.text + r.ask !== key)].slice(0, REVIEW_KEEP);
  });

  // course gems only for getting every question right (badges still give their own gems)
  // 1 gem per correct answer; a perfect course gets double, plus the perfect and in-a-row bonuses
  const courseGems = perfect ? score * 2 + 10 + quiz.comboGems : score;
  let gems = courseGems;
  p.gems += gems;
  p.gemsEarned += gems;
  p.courses += 1;
  p.totalCorrect += score;
  if (perfect) p.perfects += 1;
  p.bestCombo = Math.max(p.bestCombo, quiz.bestCombo);
  if (avg < 3 && pct >= 0.8) p.speedy = true;
  // best score is out of a full 25-question course
  if (total === QUESTIONS_PER_COURSE) p.bestScore = Math.max(p.bestScore, score);
  const newBadges = checkBadges(p);
  save();
  renderTopbar();

  $('result-title').textContent = perfect ? 'PERFECT!' : pct >= 0.8 ? 'Great job!' : pct >= 0.5 ? 'Nice work!' : 'Keep practicing!';
  $('result-score').textContent = score;
  $('result-total').textContent = total;
  $('r-acc').textContent = `${Math.round(pct * 100)}%`;
  $('r-avg').textContent = `${avg.toFixed(1)}s`;
  $('r-combo').textContent = quiz.bestCombo;
  $('r-retry').textContent = quiz.wrong.length
    ? `Second chance: you fixed ${quiz.fixed} of ${quiz.wrong.length} you missed.`
    : 'No mistakes, so no second chance needed!';

  const parts = [];
  if (perfect) {
    parts.push(`${score * 2} for correct answers`, '10 perfect bonus');
    if (quiz.comboGems) parts.push(`${quiz.comboGems} for streaks in a row`);
  }
  $('result-gems').textContent = perfect
    ? `You earned ${gems} gems (${parts.join(', ')})`
    : gems
      ? `You earned ${gems} gems (1 for each correct answer). Get every question right for double gems and a bonus!`
      : 'Get some right next time to earn gems!';

  $('r-badges').innerHTML = newBadges.map((b) =>
    `<div class="new-badge"><span class="badge-ico">${b.icon}</span><span><strong>New badge: ${b.name}</strong><small>Claim ${BADGE_GEMS} gems for it in the Progress tab!</small></span></div>`).join('');
  if (newBadges.length) setTimeout(sfx.badge, 400);

  $('r-times').innerHTML = results.map((r, i) =>
    `<span class="tchip ${r.ok ? 'ok' : 'bad'}" title="Question ${i + 1}: ${r.q.text} (${r.ok ? 'right' : 'missed'})"><b>${i + 1}</b>${r.seconds.toFixed(1)}s</span>`).join('');
  $('r-missed-wrap').classList.toggle('hidden', !quiz.wrong.length);
  $('r-missed').innerHTML = quiz.wrong.map((q) => {
    const ans = q.ask.includes('?') ? q.ask.replace('?', fmt(q.answer)) : `= ${fmt(q.answer)}`;
    return `<div class="missed"><span>${q.text}</span><strong>${ans}</strong></div>`;
  }).join('');

  quiz = null;
  show('results');
}

$('again-btn').onclick = () => showReady();
$('lobby-btn').onclick = () => showLobby('play');

// ---------- lobby ----------
function showLobby(tab = 'play') {
  renderLobby();
  switchTab(tab);
  show('lobby');
}

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
  ['play', 'rewards', 'stats'].forEach((t) => $(`tab-${t}`).classList.toggle('hidden', t !== tab));
  const panel = $(`tab-${tab}`);
  panel.classList.remove('panel-in');
  void panel.offsetWidth;
  panel.classList.add('panel-in');
  if (tab === 'rewards') { hideToast(); renderRewards(); }
  if (tab === 'stats') renderStats();
}
document.querySelectorAll('.tab').forEach((t) => { t.onclick = () => { sfx.swoosh(); switchTab(t.dataset.tab); }; });

function renderLobby() {
  const p = player();
  const available = opsForGrade(p.grade);
  if (!available.includes(p.op)) p.op = 'add';
  const grid = $('op-grid');
  grid.innerHTML = '';
  available.forEach((key) => {
    const o = OPS[key];
    const b = document.createElement('button');
    b.className = 'op-card' + (p.op === key ? ' selected' : '');
    b.innerHTML = `<span class="sym">${o.sym}</span><span class="lbl">${o.label}</span>`;
    b.onclick = () => {
      p.op = key;
      save();
      grid.querySelectorAll('.op-card').forEach((x) => x.classList.toggle('selected', x === b));
    };
    grid.appendChild(b);
  });
  renderTypingLevels();
  renderLessonCta();
  renderTopbar();
}
$('start-course').onclick = () => showReady();

// ---------- typing test ----------
// 10 kid-friendly sentences. Untyped letters are faded, the current word has an
// outline, correct letters turn into normal text and wrong ones get a red tint.
const TYPING_SENTENCES = 10;
// gems are only for 100% accuracy (zero mistakes); Easy gives less
const TYPING_LEVELS = {
  easy:   { label: 'Easy',   sym: 'abc',  desc: 'Short and simple',         gems: 15 },
  medium: { label: 'Medium', sym: 'Abc.', desc: 'Capitals and periods',     gems: 40 },
  hard:   { label: 'Hard',   sym: 'Abc!', desc: 'Longer, with punctuation', gems: 50 },
};
const SENTENCES = {
  easy: [
    'i like to read books', 'the cat is on the mat', 'we can play at the park',
    'my dog likes to run fast', 'the sun is big and hot', 'i can count to ten',
    'fish swim in the sea', 'we eat lunch at noon', 'the frog can jump high',
    'i have a red ball', 'birds sing in the trees', 'my mom makes good soup',
    'we like to draw and paint', 'the bus is big and yellow', 'i love to play math games',
  ],
  medium: [
    'I love using Flashy to practice math.', 'My friend and I built a tall block tower.',
    'The puppy chased its tail around the yard.', 'We went to the beach and found shells.',
    'Reading a good book is so much fun.', 'My favorite color is green like a leaf.',
    'The rocket zoomed up into the night sky.', 'We planted seeds and watched them grow.',
    'I can add and subtract numbers fast.', 'The turtle is slow but it never gives up.',
    'Our class went on a trip to the zoo.', 'I brush my teeth every morning and night.',
    'The rain made big puddles on the road.', 'Pizza is the best food for a party.',
    'My brother likes to play soccer outside.',
  ],
  hard: [
    'I love using Flashy, it has math problems and typing quizzes!',
    'Wow, the dragon flew over the castle and landed by the lake.',
    'On Saturday, we baked cookies, played games, and watched a movie.',
    'Did you know that octopuses have three hearts and blue blood?',
    "My best friend's dog, Max, can catch a frisbee in the air!",
    'The astronaut floated in space and waved at the camera.',
    'When it snows, we build snowmen and drink hot chocolate.',
    'Practice makes progress, so keep trying your best every day!',
    "Penguins can't fly, but they are amazing swimmers.",
    'After school, I finish my homework and then ride my bike.',
    'The volcano rumbled, and bright orange lava poured out!',
    'We counted 125 stars, 8 planets, and 1 bright moon.',
    'Can you type this whole sentence without a single mistake?',
    'The library has books about dinosaurs, robots, and space.',
    "Grandma's garden has tomatoes, carrots, and sunflowers.",
  ],
};

function renderTypingLevels() {
  const p = player();
  if (!TYPING_LEVELS[p.typingLevel]) p.typingLevel = 'easy';
  $('typing-grid').innerHTML = Object.entries(TYPING_LEVELS).map(([key, l]) => `
    <button type="button" class="op-card type-card${p.typingLevel === key ? ' selected' : ''}" data-level="${key}">
      <span class="sym">${l.sym}</span><span class="lbl">${l.label}</span><small>${l.desc}</small>
    </button>`).join('');
}
$('typing-grid').addEventListener('click', (e) => {
  const b = e.target.closest('.type-card');
  if (!b) return;
  player().typingLevel = b.dataset.level;
  save();
  $('typing-grid').querySelectorAll('.type-card').forEach((x) => x.classList.toggle('selected', x === b));
});
$('start-typing').onclick = () => showTypingReady();

// A typing "run" is a typing test, a typing lesson or the placement test.
// They all use the same typing screen: { kind, sentences, i, typed, keys, mistakes, activeMs, locked, ... }
let typing = null;

function startTypingRun(run) {
  typing = { ...run, i: 0, typed: '', keys: 0, mistakes: 0, activeMs: 0, partsPassed: 0, stopEarly: false, locked: false };
  renderKeyboard();
  show('typing');
  showSentence();
}
function testRun() {
  const level = player().typingLevel || 'easy';
  return { kind: 'test', level, sentences: shuffle([...SENTENCES[level]]).slice(0, TYPING_SENTENCES) };
}
const startTyping = () => startTypingRun(testRun());

// "Sentence 2 / 10", "Lesson 4 · line 2 / 3", "Placement test · part 2 / 4"
function runLabel(n, sep = ' / ') {
  const total = typing.sentences.length;
  if (typing.kind === 'lesson') return `Lesson ${typing.lesson + 1} · line ${n}${sep}${total}`;
  if (typing.kind === 'placement') return `Placement test · part ${n}${sep}${total}`;
  return `Sentence ${n}${sep}${total}`;
}

function showSentence() {
  const s = typing.sentences[typing.i];
  typing.typed = '';
  typing.sKeys = 0;      // this sentence only, for the cutscene message
  typing.sMistakes = 0;
  typing.sStart = 0;
  typing.locked = false;
  $('typing-count').textContent = runLabel(typing.i + 1);
  $('typing-progress').style.width = `${(typing.i / typing.sentences.length) * 100}%`;
  const input = $('typing-input');
  input.value = '';
  input.maxLength = s.length;
  $('typing-hint').classList.remove('hidden');
  const card = $('typing-card');
  card.classList.remove('slide-in');
  void card.offsetWidth;
  card.classList.add('slide-in');
  renderSentence();
  input.focus();
}

// Draw the sentence letter by letter, grouped into words so the current word can have an outline.
function renderSentence() {
  const s = typing.sentences[typing.i];
  const t = typing.typed;
  const at = t.length;
  let html = '';
  let start = 0;
  s.split(/(\s)/).forEach((part) => {
    const end = start + part.length;
    const letters = [...part].map((ch, k) => {
      const i = start + k;
      const state = i < at ? (t[i] === ch ? 'ok' : 'bad') : 'todo';
      return `<span class="ch ${state}${i === at ? ' cursor' : ''}">${ch === ' ' ? '&nbsp;' : ch.replace('&', '&amp;').replace('<', '&lt;')}</span>`;
    }).join('');
    if (part === ' ') html += letters;
    else html += `<span class="word${at >= start && at <= end && at < s.length ? ' current' : ''}">${letters}</span>`;
    start = end;
  });
  $('typing-text').innerHTML = html;
  showKey(s[at]);
}

// Phones sometimes swap in curly quotes; treat them like normal ones.
const plainQuotes = (v) => v.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');

$('typing-input').addEventListener('input', (e) => {
  if (!typing || typing.locked) return;
  const s = typing.sentences[typing.i];
  const value = plainQuotes(e.target.value).slice(0, s.length);
  if (value !== e.target.value) e.target.value = value;
  // every new letter counts toward accuracy, even if it's fixed later
  for (let i = typing.typed.length; i < value.length; i++) {
    if (!typing.sStart) typing.sStart = performance.now();
    typing.keys++;
    typing.sKeys++;
    if (value[i] !== s[i]) { typing.mistakes++; typing.sMistakes++; sfx.tick(); }
  }
  typing.typed = value;
  if (value.length) $('typing-hint').classList.add('hidden');
  renderSentence();
  if (value.length === s.length) finishSentence();
});
$('typing-card').addEventListener('click', () => $('typing-input').focus());

// A random cheer that fits how the last sentence went (speed + mistakes).
const FAST_WPM = 30;
const CHEERS = {
  fast:    ['That was quick!', 'Super speedy!', 'Whoa, so fast!'],
  perfect: ['Perfect!', 'Nailed it!', 'Great job!', 'No mistakes!'],
  good:    ['Good job!', 'Almost perfect!', 'Nice typing!', 'So close to perfect!'],
  okay:    ['Not bad!', 'Getting there!', 'Nice try!'],
  low:     ['Keep trying!', 'You can do it!', 'Slow and steady!'],
};
function sentenceMessage() {
  const s = typing.sentences[typing.i];
  const acc = typing.sKeys ? (typing.sKeys - typing.sMistakes) / typing.sKeys : 1;
  const minutes = typing.sStart ? (performance.now() - typing.sStart) / 60000 : 1;
  const wpm = s.length / 5 / Math.max(minutes, 0.01);
  const group = typing.sMistakes === 0 ? (wpm >= FAST_WPM ? 'fast' : 'perfect')
    : acc >= 0.9 ? 'good' : acc >= 0.75 ? 'okay' : 'low';
  return pick(CHEERS[group]);
}

function finishSentence() {
  typing.locked = true;
  if (typing.sStart) typing.activeMs += performance.now() - typing.sStart;
  // the placement test stops at the first part typed below the passing accuracy
  if (typing.kind === 'placement') {
    const lineAcc = typing.sKeys ? (typing.sKeys - typing.sMistakes) / typing.sKeys : 1;
    if (lineAcc >= PASS_ACC) typing.partsPassed++; else typing.stopEarly = true;
  }
  const cheer = sentenceMessage(); // picked now, so the pause below doesn't count as typing time
  $('typing-progress').style.width = `${((typing.i + 1) / typing.sentences.length) * 100}%`;
  const current = typing;
  const last = typing.stopEarly || typing.i + 1 >= typing.sentences.length;
  // little cutscene between sentences
  setTimeout(() => {
    if (typing !== current) return;
    if (last) { finishTyping(); return; }
    sfx.combo();
    $('typing-cut-title').textContent = cheer;
    $('typing-cut-sub').textContent = runLabel(typing.i + 2, ' of ');
    $('typing-cut').classList.remove('hidden');
    setTimeout(() => {
      $('typing-cut').classList.add('hidden');
      if (typing !== current) return;
      typing.i++;
      showSentence();
    }, 1600);
  }, 400);
}

// End screen buttons change with the kind of run, so they're set each time.
let typedoneActions = { again: () => showTypingReady(), lobby: () => showLobby('play') };
$('type-again').onclick = () => typedoneActions.again();
$('type-lobby').onclick = () => typedoneActions.lobby();

function finishTyping() {
  const p = player();
  const run = typing;
  // 100% only with zero mistakes (so one slip never rounds up to "perfect")
  const raw = run.keys ? ((run.keys - run.mistakes) / run.keys) * 100 : 100;
  const acc = run.mistakes ? Math.min(99, Math.round(raw)) : 100;
  // words per minute: correct letters / 5, over the time spent actually typing.
  // Each letter counts as at least 50ms and the result is capped, so pasting or
  // autocomplete can't produce silly speeds.
  const minutes = Math.max(run.activeMs, run.keys * 50) / 60000;
  const wpm = minutes ? Math.min(MAX_WPM, Math.round(((run.keys - run.mistakes) / 5) / minutes)) : 0;
  const perfect = !run.mistakes;
  p.typingHistory.push({ d: dayKey(), kind: run.kind, acc, wpm });
  p.typingHistory = p.typingHistory.slice(-30);
  p.bestWpm = Math.max(p.bestWpm, wpm);

  $('type-acc').textContent = `${acc}%`;
  $('type-wpm').textContent = wpm;
  let gems = 0;
  let note = '';
  if (run.kind === 'test') {
    $('type-title').textContent = acc === 100 ? 'PERFECT!' : acc >= 90 ? 'Great typing!' : acc >= 75 ? 'Nice work!' : 'Keep practicing!';
    // full gems for 100%, half for 90%+, a quarter for 75%+
    const full = TYPING_LEVELS[run.level].gems;
    gems = perfect ? full : acc >= 90 ? Math.round(full / 2) : acc >= 75 ? Math.round(full / 4) : 0;
    typedoneActions = { again: () => showTypingReady(), lobby: () => showLobby('play') };
    $('type-again').textContent = 'Play again';
    $('type-lobby').textContent = 'Back to lobby';
  } else if (run.kind === 'lesson') {
    const i = run.lesson;
    const passed = acc >= PASS_ACC * 100;
    const best = p.lessonBest[i];
    if (!best || acc > best.acc || (acc === best.acc && wpm > best.wpm)) p.lessonBest[i] = { acc, wpm };
    const unlockedNew = passed && i === p.lessonUnlocked;
    if (unlockedNew) p.lessonUnlocked = i + 1;
    gems = perfect ? LESSON_GEMS : passed ? LESSON_PASS_GEMS : 0;
    $('type-title').textContent = perfect ? 'PERFECT!' : passed ? 'Lesson passed!' : 'Almost there!';
    note = !passed ? `Get ${PASS_ACC * 100}% accuracy to pass this lesson. You can do it!`
      : i + 1 >= LESSONS.length ? 'You finished every typing lesson!'
      : unlockedNew ? `Lesson ${i + 2}: ${LESSONS[i + 1].title} is unlocked!` : 'Lesson passed again!';
    const next = passed && i + 1 < LESSONS.length;
    typedoneActions = { again: () => showLessonReady(next ? i + 1 : i), lobby: showLessons };
    $('type-again').textContent = next ? 'Next lesson' : 'Try again';
    $('type-lobby').textContent = 'All lessons';
  } else {
    // placement: start at the first lesson after the parts they typed well
    const start = PLACEMENT_UNLOCK[run.partsPassed];
    p.placementDone = true;
    p.lessonUnlocked = Math.max(p.lessonUnlocked, start);
    $('type-title').textContent = 'Placement done!';
    note = start >= LESSONS.length
      ? 'You already know every key! Try the typing tests to get faster.'
      : `Start with Lesson ${start + 1}: ${LESSONS[start].title}`;
    typedoneActions = { again: showLessons, lobby: () => showLobby('play') };
    $('type-again').textContent = 'Go to lessons';
    $('type-lobby').textContent = 'Back to lobby';
  }
  p.gems += gems;
  p.gemsEarned += gems;
  save();
  renderTopbar();
  $('type-note').textContent = note;
  $('type-note').classList.toggle('hidden', !note);
  $('type-gems').textContent = run.kind === 'placement' ? ''
    : perfect ? `You earned ${gems} gems for typing with no mistakes!`
    : gems ? `You earned ${gems} gems! Type with no mistakes to earn the most gems.`
    : run.kind === 'lesson' ? 'Pass the lesson to earn gems!'
    : 'Get 75% or more to earn gems!';
  sfx.chest();
  typing = null;
  show('typedone');
  announceBadges(p);
}

$('typing-quit').onclick = () => askQuit(() => {
  const kind = typing && typing.kind;
  typing = null;
  $('typing-cut').classList.add('hidden');
  if (kind === 'test') showLobby('play'); else showLessons();
});

// ---------- on-screen keyboard with finger colors ----------
// Every key is colored by the finger that should press it; the next key glows.
const KB_ROWS = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
  ['shiftL', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'shiftR'],
  [' '],
];
const FINGER_KEYS = { lp: '`1qaz', lr: '2wsx', lm: '3edc', li: '45rtfgvb', ri: '67yuhjnm', rm: '8ik,', rr: '9ol.', rp: "0-=p[];'/", th: ' ' };
const FINGER = { shiftL: 'lp', shiftR: 'rp' };
Object.entries(FINGER_KEYS).forEach(([f, keys]) => [...keys].forEach((k) => { FINGER[k] = f; }));
const FINGER_NAMES = {
  lp: 'left pinky', lr: 'left ring finger', lm: 'left middle finger', li: 'left pointer finger',
  ri: 'right pointer finger', rm: 'right middle finger', rr: 'right ring finger', rp: 'right pinky', th: 'thumb',
};
// characters that need Shift, and the key they're on
const SHIFTED = { '!': '1', '@': '2', '#': '3', $: '4', '%': '5', '^': '6', '&': '7', '*': '8', '(': '9', ')': '0',
  _: '-', '+': '=', '{': '[', '}': ']', ':': ';', '"': "'", '<': ',', '>': '.', '?': '/', '~': '`' };

function renderKeyboard() {
  if ($('kb').childElementCount) return;
  $('kb').innerHTML = KB_ROWS.map((row, r) => `<div class="kb-row kb-row-${r}">${row.map((k) => {
    const label = k === 'shiftL' || k === 'shiftR' ? 'Shift' : k === ' ' ? '' : k;
    return `<span class="kk f-${FINGER[k]}${k === ' ' ? ' kk-space' : ''}${k.startsWith('shift') ? ' kk-shift' : ''}${k === 'f' || k === 'j' ? ' kk-bump' : ''}" data-k="${escapeHTML(k)}">${escapeHTML(label)}</span>`;
  }).join('')}</div>`).join('');
}

function showKey(ch) {
  document.querySelectorAll('#kb .kk.next').forEach((k) => k.classList.remove('next'));
  if (ch === undefined) { $('finger-hint').textContent = ''; return; }
  let base = ch;
  let shift = false;
  if (/[A-Z]/.test(ch)) { base = ch.toLowerCase(); shift = true; } else if (SHIFTED[ch]) { base = SHIFTED[ch]; shift = true; }
  const finger = FINGER[base];
  const key = document.querySelector(`#kb .kk[data-k="${CSS.escape(base)}"]`);
  if (key) key.classList.add('next');
  let hint = finger === 'th' ? 'Use your thumb on the space bar' : finger ? `Use your ${FINGER_NAMES[finger]}` : '';
  if (shift && finger) {
    const side = finger.startsWith('l') ? 'shiftR' : 'shiftL';
    document.querySelector(`#kb .kk[data-k="${side}"]`).classList.add('next');
    hint += ` + hold Shift with your ${side === 'shiftL' ? 'left' : 'right'} pinky`;
  }
  $('finger-hint').textContent = hint;
}

// ---------- typing lessons ----------
// One or two new keys per lesson. Pass with 90% accuracy to unlock the next one.
const PASS_ACC = 0.9;
const MAX_WPM = 200; // faster than any kid (or most adults) really types
const LESSON_GEMS = 10;     // for a lesson with zero mistakes
const LESSON_PASS_GEMS = 5; // for passing (90%+) with a few mistakes
const LESSON_LINES = 3;
const LESSONS = [
  { title: 'Home row: left hand', keys: 'asdf' },
  { title: 'Home row: right hand', keys: 'jkl;' },
  { title: 'The whole home row', keys: '' },
  { title: 'G and H', keys: 'gh' },
  { title: 'E and I', keys: 'ei' },
  { title: 'R and U', keys: 'ru' },
  { title: 'T and Y', keys: 'ty' },
  { title: 'W and O', keys: 'wo' },
  { title: 'Q and P', keys: 'qp' },
  { title: 'V and M', keys: 'vm' },
  { title: 'C and comma', keys: 'c,' },
  { title: 'X and period', keys: 'x.' },
  { title: 'Z, B and N', keys: 'zbn' },
  { title: 'Capital letters (Shift)', keys: '', caps: true },
  { title: 'Numbers 1 to 5', keys: '12345' },
  { title: 'Numbers 6 to 0', keys: '67890' },
  { title: 'Question and exclamation marks', keys: '?!' },
];
const CAPS_LESSON = LESSONS.findIndex((l) => l.caps);
// the home-row key each finger rests on, used to build "reach" drills
const HOME_KEY = { lp: 'a', lr: 's', lm: 'd', li: 'f', ri: 'j', rm: 'k', rr: 'l', rp: ';' };
const WORDS = [...new Set(`a as ad add dad sad fad lad all fall ask asks flask salad glad flag half hall shall has had dash gas
  she he the see seed feed need heel hide side ride wide kid kids lid did fish wish dish like hike bike life file head read
  real deal seal heal sea tea red rug run fun sun rush hug hut nut us use sure rule fur true tree three try toy yes yet day
  say way stay play ray tray they eat ate hat cat rat sat fat that this it its is his her tall wall will well tell fell yell
  sell shell tool pool food good wood hood look took book cook root word world two too who how now row low slow glow show
  owl wow top pot pop hop stop shop drop open paper happy puppy quiet quit quick queen park part pet help keep deep sleep
  map mom me my made game time home more move love live have very vote ever over river seven five give cup cake can car
  care call come cool color nice rice face race box fox six mix fix next extra zoo zebra zip buzz maze size lazy blue big
  bag bat bed bee bus ball bear best both baby bird but by be an and in on no not nap net new nine nose name night ten tent
  green brown moon snow rain wind train plane frog dog pig duck lion tiger apple juice jam jump joy kite king milk panda
  pizza house school friend smile laugh music dance sing draw paint write math plus count number`.split(/\s+/).filter(Boolean))];

const lessonKeys = (i) => LESSONS.slice(0, i + 1).map((l) => l.keys).join('');
const fitLine = (tokens, max = 32) => {
  let line = '';
  for (const t of tokens) { if ((line + ' ' + t).trim().length > max) break; line = (line + ' ' + t).trim(); }
  return line;
};

function lessonLines(i) {
  const lesson = LESSONS[i];
  const keys = lessonKeys(i);
  const letters = [...new Set(keys.replace(/[^a-z]/g, ''))];
  const fresh = [...lesson.keys];
  const freshLetters = fresh.filter((k) => /[a-z]/.test(k));
  const words = WORDS.filter((w) => [...w].every((c) => letters.includes(c)));
  const pickWords = (n) => {
    const preferred = words.filter((w) => freshLetters.some((c) => w.includes(c)));
    return Array.from({ length: n }, () => pick(preferred.length && Math.random() < 0.6 ? preferred : words));
  };
  const group = () => Array.from({ length: rand(2, 4) }, (_, k) => (k === 0 && freshLetters.length ? pick(freshLetters) : pick(letters))).join('');
  let lines;
  if (lesson.caps) {
    const cap = (w) => w[0].toUpperCase() + w.slice(1);
    lines = [
      fitLine(shuffle(letters.slice()).map((c) => c.toUpperCase() + c)),
      fitLine(pickWords(10).map(cap)),
      fitLine(pickWords(10)).replace(/^./, (c) => c.toUpperCase()) + '.',
    ];
  } else if (/\d/.test(lesson.keys)) {
    lines = [
      fitLine(shuffle(fresh.map((d) => d + d))),
      fitLine(Array.from({ length: 10 }, () => pick(fresh) + pick(letters))),
      fitLine(pickWords(8).flatMap((w) => [pick(fresh) + pick(fresh), w])),
    ];
  } else if (lesson.keys === '?!') {
    lines = [
      fitLine(['?? !!', '?!', '!?', 'is it?', 'yes!', 'no?', 'wow!']),
      `${fitLine(pickWords(5), 18)}? yes!`,
      `${fitLine(pickWords(4), 14)}! ${fitLine(pickWords(4), 14)}?`,
    ];
  } else {
    // new keys: drills that reach from the home row; review lessons use all known letters
    const drillKeys = fresh.length ? fresh : letters;
    const drills = drillKeys.flatMap((k) => { const h = HOME_KEY[FINGER[k]] || 'f'; return [k + k + k, h + k + h, k + h]; });
    let third = words.length >= 3 ? fitLine(pickWords(12)) : fitLine(Array.from({ length: 10 }, group));
    if (keys.includes(',')) third = third.replace(' ', ', ');
    if (keys.includes('.')) third += '.';
    lines = [fitLine(shuffle(drills)), fitLine(Array.from({ length: 10 }, group)), third];
  }
  return lines.slice(0, LESSON_LINES);
}

function lessonRun(i) {
  return { kind: 'lesson', lesson: i, sentences: lessonLines(i) };
}

// ---------- placement test ----------
// 4 parts, each adding keys; stops at the first part typed below 90%.
const PLACEMENT_LINES = [
  'a sad lad asks dad; all fall',
  'we try to read a story outside',
  'my brave fox can jump over six big boxes.',
  'Max has 3 cats, 2 dogs, and 1 fish!',
];
const PLACEMENT_UNLOCK = [0, 3, 9, CAPS_LESSON, LESSONS.length]; // lesson to start at, by parts passed
const placementRun = () => ({ kind: 'placement', sentences: [...PLACEMENT_LINES] });

// ---------- lessons screen ----------
function showLessons() {
  renderLessons();
  show('lessons');
}
function renderLessons() {
  const p = player();
  $('placement-sub').textContent = p.placementDone
    ? 'You took the placement test. You can take it again anytime.'
    : 'Already know some keys? Find the right lesson to start with.';
  $('lesson-list').innerHTML = LESSONS.map((l, i) => {
    const state = i < p.lessonUnlocked ? 'done' : i === p.lessonUnlocked ? 'current' : 'locked';
    const best = p.lessonBest[i];
    const chips = (l.caps ? ['Shift'] : [...l.keys]).map((k) => `<span class="key-chip">${escapeHTML(k)}</span>`).join('');
    return `<button type="button" class="lesson-card ${state}" data-i="${i}"${state === 'locked' ? ' disabled' : ''}>
      <span class="lesson-num">${state === 'done' ? '✓' : i + 1}</span>
      <span class="lesson-info"><strong>${escapeHTML(l.title)}</strong>
        <span class="lesson-keys">${chips || '<small>Review</small>'}</span>
        ${best ? `<small>Best: ${best.acc}% · ${best.wpm} WPM</small>` : ''}</span>
      ${state === 'current' ? '<span class="lesson-go">Start</span>' : state === 'locked' ? '<span class="lesson-lock" aria-label="Locked">🔒</span>' : ''}
    </button>`;
  }).join('');
}
$('lesson-list').addEventListener('click', (e) => {
  const b = e.target.closest('.lesson-card');
  if (b && !b.disabled) showLessonReady(Number(b.dataset.i));
});
$('placement-card').onclick = () => showTypingReady(placementRun(), 'Ready for the placement test?',
  `${PLACEMENT_LINES.length} short parts · type what you can`, showLessons);
$('lessons-back').onclick = () => showLobby('play');
$('lesson-cta').onclick = showLessons;

function showLessonReady(i) {
  showTypingReady(lessonRun(i), `Ready for Lesson ${i + 1}?`,
    `${LESSONS[i].title} · ${LESSON_LINES} short lines · ${PASS_ACC * 100}% to pass`, showLessons);
}

function renderLessonCta() {
  const p = player();
  const n = p.lessonUnlocked;
  $('lesson-cta-sub').textContent = n >= LESSONS.length
    ? 'All lessons done! Practice with typing tests.'
    : `Lesson ${n + 1}: ${LESSONS[n].title}`;
}

function renderRewards() {
  const p = player();
  // The row starts at day 1 and shows up to day 50; once the streak reaches 50
  // it keeps growing so there are always at least 25 days ahead.
  const end = p.streak < 50 ? 50 : Math.ceil((p.streak + MEGA_EVERY) / MEGA_EVERY) * MEGA_EVERY;
  const ready = canClaim(p);
  $('rewards-sub').textContent = ready
    ? `Day ${p.streak} chest is ready! Tap the glowing chest to open it.`
    : `You opened today's chest. Come back tomorrow for day ${p.streak + 1}!`;

  // One long row of chests, scrolling to the right.
  const track = $('chest-track');
  track.innerHTML = '';
  let focus = null;
  for (let day = 1; day <= end; day++) {
    const claimed = p.claimedDays.includes(day);
    let state = 'locked';
    if (claimed) state = 'claimed';
    else if (day === p.streak && ready) state = 'ready';
    else if (day < p.streak || (day === p.streak && !ready)) state = 'missed';
    const node = document.createElement('button');
    node.className = `chest-node ${state}${isMegaDay(day) ? ' big' : ''}${day <= p.streak ? ' reached' : ''}`;
    node.disabled = state !== 'ready';
    node.innerHTML = `${state === 'ready' ? '<span class="open-bubble">Open!</span>' : ''}
      <span class="node-chest">${chestSVG({ open: claimed })}</span>
      <span class="day">Day ${day}</span>`;
    if (state === 'ready') node.onclick = claimChest;
    if (day === p.streak) focus = node;
    track.appendChild(node);
  }
  if (focus) track.scrollLeft = focus.offsetLeft - track.clientWidth / 2 + focus.offsetWidth / 2;

  // streak freeze
  $('freeze-count').textContent = `You have ${p.freezes} of ${FREEZE_MAX}.`;
  const buy = $('buy-freeze');
  buy.disabled = p.freezes >= FREEZE_MAX || p.gems < FREEZE_PRICE;
  buy.innerHTML = p.freezes >= FREEZE_MAX ? 'Full' : `${GEM_SVG} ${FREEZE_PRICE}`;
}

$('buy-freeze').onclick = () => {
  const p = player();
  if (p.freezes >= FREEZE_MAX || p.gems < FREEZE_PRICE) return;
  p.gems -= FREEZE_PRICE;
  p.freezes += 1;
  save();
  sfx.buy();
  renderTopbar();
  renderRewards();
};

function claimChest() {
  const p = player();
  if (!canClaim(p)) return;
  const mega = isMegaDay(p.streak);
  const gems = mega ? MEGA_GEMS : rand(20, 200);
  p.gems += gems;
  p.gemsEarned += gems;
  p.lastClaim = dayKey();
  p.claimedDays.push(p.streak);
  p.chestsOpened += 1;
  save();
  hideToast();

  // Show the closed chest bobbing; tapping it starts the opening animation.
  chestOpening = { gems, opened: false };
  $('chest-big').innerHTML = chestSVG();
  $('chest-stage').className = 'chest-stage idle' + (mega ? ' big' : '');
  $('burst').innerHTML = '';
  $('chest-title').textContent = `Day ${p.streak} chest`;
  $('chest-hint').classList.remove('hidden');
  $('chest-reward').textContent = '';
  $('chest-ok').classList.add('hidden');
  $('chest-modal').classList.remove('hidden');
  sfx.open();
}

let chestOpening = null;

$('chest-stage').onclick = () => {
  if (!chestOpening || chestOpening.opened) return;
  chestOpening.opened = true;
  const stage = $('chest-stage');
  const big = stage.classList.contains('big') ? ' big' : '';
  $('chest-hint').classList.add('hidden');
  stage.className = 'chest-stage shaking' + big;
  [0, 250, 500, 750, 950].forEach((t) => setTimeout(sfx.shake, t));
  setTimeout(() => {
    stage.className = 'chest-stage opened' + big;
    $('chest-big').querySelector('svg').classList.add('open');
    sfx.chest();
    spawnBurst();
    countUp($('chest-reward'), chestOpening.gems);
    renderTopbar();
    setTimeout(() => $('chest-ok').classList.remove('hidden'), 900);
  }, 1200);
};

// Gems and confetti flying out of the chest.
function spawnBurst() {
  const colors = ['#8BBB92', '#2A835F', '#ffd166', '#ff7a1a', '#ffffff'];
  let html = '';
  for (let i = 0; i < 26; i++) {
    const angle = (Math.PI * 2 * i) / 26 + Math.random() * 0.4;
    const dist = rand(90, 170);
    const gem = i % 2 === 0;
    const style = `--dx:${Math.round(Math.cos(angle) * dist)}px;--dy:${Math.round(Math.sin(angle) * dist - 40)}px;` +
      `--r:${rand(-300, 300)}deg;animation-delay:${rand(0, 120)}ms;` +
      (gem ? '' : `background:${colors[i % colors.length]};`);
    html += `<span class="particle ${gem ? 'gem' : 'confetti'}" style="${style}"></span>`;
  }
  $('burst').innerHTML = html;
}

function countUp(el, target) {
  const startTime = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - startTime) / 900);
    el.textContent = `+${Math.round(target * (1 - Math.pow(1 - t, 3)))} gems`;
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

$('path-left').onclick = () => $('chest-track').scrollBy({ left: -320, behavior: 'smooth' });
$('path-right').onclick = () => $('chest-track').scrollBy({ left: 320, behavior: 'smooth' });

$('chest-ok').onclick = () => {
  sfx.close();
  chestOpening = null;
  $('chest-modal').classList.add('hidden');
  if (!$('screen-lobby').classList.contains('hidden')) renderRewards();
  announceBadges(player());
};

// ---------- progress tab ----------
function renderStats() {
  const p = player();
  const stats = [
    ['Gems', p.gems.toLocaleString()],
    ['Typing lessons', `${Math.min(p.lessonUnlocked, LESSONS.length)} / ${LESSONS.length}`],
    ['Best typing speed', `${p.bestWpm} WPM`],
    ['Day streak', p.streak],
    ['Longest streak', p.bestStreak],
    ['Courses finished', p.courses],
    ['Correct answers', p.totalCorrect],
    ['Best score', `${p.bestScore} / ${QUESTIONS_PER_COURSE}`],
    ['Best in a row', p.bestCombo],
    ['Chests opened', p.chestsOpened],
  ];
  $('stat-grid').innerHTML = stats.map(([l, n]) => `<div class="stat"><div class="num">${n}</div><div class="lbl">${l}</div></div>`).join('');

  $('badge-count').textContent = `${p.badges.length} of ${BADGES.length}`;
  $('badge-grid').innerHTML = BADGES.map((b) => {
    const has = p.badges.includes(b.id);
    const claim = has && !p.badgesClaimed.includes(b.id)
      ? `<button type="button" class="btn primary small claim-btn" data-badge="${b.id}">Claim ${BADGE_GEMS} gems</button>` : '';
    return `<div class="badge-card${has ? ' earned' : ''}${claim ? ' claimable' : ''}" title="${b.desc}">
      <span class="badge-ico">${b.icon}</span><strong>${b.name}</strong><small>${b.desc}</small>${claim}</div>`;
  }).join('');

  renderParent(p);
  renderSoundControls();
  renderInstall();
}

// Parent view: accuracy per subject, and how much was practiced each day this week.
function renderParent(p) {
  const rows = Object.keys(OPS)
    .filter((k) => k !== 'mix' && p.subjectStats[k] && p.subjectStats[k].total)
    .map((k) => { const s = p.subjectStats[k]; return { k, right: s.right, total: s.total, pct: Math.round((100 * s.right) / s.total) }; });
  let html = '<div class="parent-card"><h4>Accuracy by subject</h4>';
  if (!rows.length) {
    html += '<p class="sub">Finish a course to see how each subject is going.</p>';
  } else {
    html += rows.map((r) => `
      <div class="acc-row" title="${OPS[r.k].label}: ${r.right} of ${r.total} right (${r.pct}%)">
        <span class="acc-label">${OPS[r.k].label}</span>
        <span class="acc-track"><span class="acc-fill" style="width:${Math.max(r.pct, 2)}%"></span></span>
        <span class="acc-val">${r.pct}%</span>
      </div>`).join('');
    const weak = rows.filter((r) => r.total >= 10).sort((a, b) => a.pct - b.pct)[0];
    if (weak && weak.pct < 90) html += `<p class="parent-note">Needs the most practice: <strong>${OPS[weak.k].label}</strong> (${weak.pct}% right)</p>`;
  }
  html += '</div>';

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ label: i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' }), n: p.daily[dayKey(d)] || 0 });
  }
  const max = Math.max(1, ...days.map((d) => d.n));
  const week = days.reduce((s, d) => s + d.n, 0);
  html += `<div class="parent-card"><h4>Questions answered, last 7 days <span class="muted">${week} total</span></h4>
    <div class="week-chart">${days.map((d) => `
      <div class="day-col" title="${d.label}: ${d.n} questions">
        <span class="day-plot"><span class="day-val">${d.n || ''}</span><span class="day-bar" style="height:${d.n ? Math.max(4, (d.n / max) * 100) : 0}%"></span></span>
        <span class="day-lbl">${d.label}</span>
      </div>`).join('')}</div></div>`;

  // typing: lessons passed, plus speed (WPM) for the last 10 typing lessons/tests
  const hist = p.typingHistory.slice(-10);
  const kindName = { test: 'Typing test', lesson: 'Lesson', placement: 'Placement test' };
  html += `<div class="parent-card"><h4>Typing <span class="muted">${Math.min(p.lessonUnlocked, LESSONS.length)} of ${LESSONS.length} lessons passed</span></h4>`;
  if (!hist.length) {
    html += '<p class="sub">Finish a typing lesson or test to see typing speed here.</p>';
  } else {
    const maxW = Math.max(10, ...hist.map((h) => h.wpm));
    const avgAcc = Math.round(hist.reduce((s, h) => s + h.acc, 0) / hist.length);
    html += `<p class="parent-note chart-title">Words per minute, last ${hist.length} typing sessions</p>
      <div class="week-chart wpm-chart" style="grid-template-columns: repeat(${hist.length}, 1fr)">${hist.map((h, i) => `
        <div class="day-col" title="${kindName[h.kind]} on ${h.d}: ${h.wpm} WPM, ${h.acc}% accuracy">
          <span class="day-plot"><span class="day-val">${h.wpm}</span><span class="day-bar" style="height:${Math.max(4, (h.wpm / maxW) * 100)}%"></span></span>
          <span class="day-lbl">${i + 1}</span>
        </div>`).join('')}</div>
      <p class="parent-note">Average accuracy: <strong>${avgAcc}%</strong> · Best speed: <strong>${p.bestWpm} WPM</strong></p>`;
  }
  html += '</div>';
  $('parent-view').innerHTML = html;
}

$('badge-grid').addEventListener('click', (e) => {
  const b = e.target.closest('.claim-btn');
  if (b) claimBadge(b.dataset.badge);
});

$('logout-btn').onclick = () => {
  data.current = null;
  save();
  showLogin();
};

// ---------- easier-to-read font (per account) ----------
// Atkinson Hyperlegible: letters that are easy to tell apart, which helps early and
// struggling readers. It's only downloaded when someone turns it on.
function applyFont() {
  const p = player();
  const on = !!(p && p.easyFont);
  document.body.classList.toggle('easy-font', on);
  if (on && !$('easy-font-css')) {
    const link = document.createElement('link');
    link.id = 'easy-font-css';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap';
    document.head.appendChild(link);
  }
  $('font-switch').classList.toggle('on', on);
  $('font-switch').setAttribute('aria-checked', String(on));
}
$('font-switch').onclick = () => {
  const p = player();
  p.easyFont = !p.easyFont;
  save();
  applyFont();
};

// ---------- back up / restore progress ----------
// Progress lives only on this device, so families can save it to a file and
// load it on another device. Nothing is sent anywhere.
function backupProgress() {
  const p = player();
  const json = JSON.stringify({ flashyBackup: 1, savedAt: new Date().toISOString(), profile: p }, null, 2);
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `flashy-backup-${p.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${dayKey()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  showBanner('💾', 'Backup saved! Keep the file somewhere safe.');
}

// Only keep what a Flashy profile should have, with sensible types.
function cleanBackup(raw) {
  if (!raw || raw.flashyBackup !== 1 || !raw.profile || typeof raw.profile.name !== 'string') return null;
  const src = raw.profile;
  const name = src.name.trim().slice(0, 16);
  if (!name) return null;
  const p = newProfile(name, Math.min(8, Math.max(0, Number(src.grade) || 0)), 'fox');
  const nums = ['gems', 'gemsEarned', 'streak', 'bestStreak', 'chestsOpened', 'courses', 'totalCorrect', 'bestScore',
    'freezes', 'bestCombo', 'perfects', 'purchases', 'bestWpm', 'lessonUnlocked', 'lastWelcome'];
  nums.forEach((k) => { if (Number.isFinite(Number(src[k]))) p[k] = Number(src[k]); });
  const strs = ['op', 'mode', 'typingLevel', 'avatar', 'frame', 'nameColor', 'lastVisit', 'lastClaim'];
  strs.forEach((k) => { if (typeof src[k] === 'string') p[k] = src[k]; });
  const arrs = ['claimedDays', 'ownedAvatars', 'ownedFrames', 'ownedNameColors', 'badges', 'badgesClaimed', 'reviewQueue', 'typingHistory'];
  arrs.forEach((k) => { if (Array.isArray(src[k])) p[k] = src[k]; });
  ['subjectStats', 'daily', 'lessonBest'].forEach((k) => { if (src[k] && typeof src[k] === 'object') p[k] = src[k]; });
  ['speedy', 'placementDone', 'easyFont', 'seenIntro'].forEach((k) => { if (typeof src[k] === 'boolean') p[k] = src[k]; });
  p.seenIntro = true;
  return upgradeProfile(p);
}

async function restoreFromFile(file) {
  let raw = null;
  try { raw = JSON.parse(await file.text()); } catch (e) { /* not JSON */ }
  const p = cleanBackup(raw);
  if (!p) { showBanner('⚠️', "That file isn't a Flashy backup."); sfx.wrong(); return; }
  const key = p.name.toLowerCase();
  const restore = () => {
    data.profiles[key] = p;
    save();
    showBanner('✅', `Progress restored for ${p.name}!`);
    signInAs(key);
  };
  if (data.profiles[key]) {
    askQuit(restore, {
      title: `Replace ${p.name}'s progress?`,
      sub: `${p.name} already has progress on this device. Restoring will replace it with the backup.`,
      yes: 'Yes, restore the backup',
      no: 'No, keep what is here',
    });
  } else {
    restore();
  }
}
$('backup-btn').onclick = backupProgress;
$('restore-btn').onclick = () => $('restore-file').click();
$('restore-login').onclick = () => $('restore-file').click();
$('restore-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (file) restoreFromFile(file);
});

// ---------- install as an app ----------
let installEvent = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installEvent = e;
  renderInstall();
});
function renderInstall() {
  const installed = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  $('install-btn').classList.toggle('hidden', !installEvent || installed);
  $('install-note').textContent = installed ? 'Flashy is installed on this device.'
    : installEvent ? 'Install Flashy as an app'
    : ios ? 'On iPhone or iPad: tap Share, then "Add to Home Screen".'
    : 'To install: use the install icon in your browser\'s address bar.';
}
$('install-btn').onclick = async () => {
  if (!installEvent) return;
  installEvent.prompt();
  await installEvent.userChoice;
  installEvent = null;
  renderInstall();
};
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* offline support is optional */ });
}

// ---------- toast ----------
function maybeToast() {
  const p = player();
  if (p && canClaim(p)) $('toast').classList.remove('hidden');
}
function hideToast() { $('toast').classList.add('hidden'); }
$('toast-close').onclick = hideToast;
$('toast-claim').onclick = () => {
  hideToast();
  showLobby('rewards');
  claimChest();
};

// If the tab stays open past midnight, count the new day when they come back.
document.addEventListener('visibilitychange', () => {
  const p = player();
  if (document.visibilityState !== 'visible' || !p) return;
  if (p.lastVisit !== dayKey()) {
    touchStreak(p);
    renderTopbar();
    if (!$('screen-lobby').classList.contains('hidden')) renderLobby();
    if (!quiz) maybeToast();
    showStreakBreak();
  }
  if (!quiz) maybeWelcome();
});

// ---------- bouncy clicks ----------
// Every button springs when pressed; the class restarts the animation on each click.
const BOUNCY = '.btn, .tab, .op-card, .grade-btn, .key, .chest-node, .pill, .path-arrow, .item, .avatar-choice, .seg button, .choice, .type-card';
document.addEventListener('pointerdown', (e) => {
  const el = e.target.closest(BOUNCY);
  if (!el || el.disabled) return;
  sfx.click();
  el.classList.remove('bounce');
  void el.offsetWidth;
  el.classList.add('bounce');
});
document.addEventListener('animationend', (e) => {
  if (e.animationName === 'bounce') e.target.classList.remove('bounce');
});

// ---------- full screen ----------
// A button in the top bar, a switch in Settings, and F11 (which the installed app
// window doesn't handle on its own). Hidden where the browser doesn't allow it (iPhone).
const FS_ENTER_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const FS_EXIT_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const root = document.documentElement;
const fsSupported = !!(root.requestFullscreen || root.webkitRequestFullscreen);
const isFullscreen = () => !!(document.fullscreenElement || document.webkitFullscreenElement);

function toggleFullscreen() {
  try {
    if (isFullscreen()) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else {
      const req = (root.requestFullscreen || root.webkitRequestFullscreen).call(root);
      if (req && req.catch) req.catch(() => showBanner('⚠️', "This browser didn't allow full screen."));
    }
  } catch (e) { /* not allowed here */ }
}
function renderFullscreen() {
  const on = isFullscreen();
  $('fs-btn').innerHTML = on ? FS_EXIT_SVG : FS_ENTER_SVG;
  $('fs-btn').setAttribute('aria-label', on ? 'Exit full screen' : 'Full screen');
  $('fs-btn').title = on ? 'Exit full screen (F11)' : 'Full screen (F11)';
  $('fs-switch').classList.toggle('on', on);
  $('fs-switch').setAttribute('aria-checked', String(on));
}
if (fsSupported) {
  $('fs-btn').classList.remove('hidden');
  $('fs-row').classList.remove('hidden');
  $('fs-btn').onclick = toggleFullscreen;
  $('fs-switch').onclick = toggleFullscreen;
  document.addEventListener('fullscreenchange', renderFullscreen);
  document.addEventListener('webkitfullscreenchange', renderFullscreen);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F11') { e.preventDefault(); toggleFullscreen(); }
  });
  renderFullscreen();
}

// ---------- Contact us ----------
// Opens a little message box; Send opens the email app with the message filled in.
const CONTACT_EMAIL = 'asherndahl@gmail.com';
document.addEventListener('click', (e) => {
  const link = e.target.closest('.contact-link');
  if (!link) return;
  e.preventDefault();
  $('contact-text').value = '';
  $('contact-text').classList.remove('nudge');
  $('contact-modal').classList.remove('hidden');
  sfx.open();
  $('contact-text').focus();
});
function contactMailto(text) {
  const subject = encodeURIComponent('Message from Flashy');
  const body = encodeURIComponent(`${text}\n\n(Sent from the Flashy website)`);
  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}
function closeContact() {
  $('contact-modal').classList.add('hidden');
}
$('contact-close').onclick = () => { closeContact(); sfx.close(); };
$('contact-modal').addEventListener('click', (e) => { if (e.target.id === 'contact-modal') closeContact(); });
// The typed message, or null (and a shake) if the box is empty.
function contactMessage() {
  const box = $('contact-text');
  const text = box.value.trim();
  if (text) return text;
  box.classList.remove('nudge');
  void box.offsetWidth;
  box.classList.add('nudge');
  box.focus();
  return null;
}
// Gmail in the browser: works without any email app installed.
function contactGmailUrl(text) {
  const q = new URLSearchParams({ view: 'cm', fs: '1', to: CONTACT_EMAIL, su: 'Message from Flashy', body: text ? `${text}\n\n(Sent from the Flashy website)` : '' });
  return `https://mail.google.com/mail/?${q}`;
}
// Asks first, then opens Gmail in a new tab. Google asks you to sign in if you aren't,
// then shows the email ready to send (blank if you didn't type a message here).
$('contact-gmail').onclick = () => {
  const text = $('contact-text').value.trim();
  askQuit(() => {
    window.open(contactGmailUrl(text), '_blank', 'noopener');
    closeContact();
    showBanner('✉️', text ? 'Gmail opened with your message. Just tap Send there!' : 'Gmail opened with a new email to us. Type your message and tap Send!');
  }, {
    title: 'Open Gmail?',
    sub: "This opens the Gmail website in a new tab. If you're not signed in, Google will ask you to sign in first. Then your email will be ready to send.",
    yes: 'Open Gmail',
    no: 'Cancel',
  });
};
$('contact-send').onclick = () => {
  const text = contactMessage();
  if (!text) return;
  window.location.href = contactMailto(text);
  closeContact();
  showBanner('✉️', 'Your email app should open with your message. Just tap send!');
};
$('contact-copy').onclick = async () => {
  const text = contactMessage();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(`To: ${CONTACT_EMAIL}\n\n${text}`);
    showBanner('📋', `Copied! Paste it into an email to ${CONTACT_EMAIL}`);
    closeContact();
  } catch (e) {
    showBanner('⚠️', `Couldn't copy. Please email ${CONTACT_EMAIL}`);
  }
};

// ---------- Parents / Privacy pages ----------
// Remember where you were, so "Back to Flashy" returns to the same tab and scroll spot.
document.addEventListener('click', (e) => {
  const link = e.target.closest('.footer-links a');
  if (!link || link.href.startsWith('mailto:')) return; // the email link doesn't leave Flashy
  const tab = document.querySelector('.tab.active');
  const spot = {
    screen: $('screen-lobby').classList.contains('hidden') ? 'login' : 'lobby',
    tab: tab ? tab.dataset.tab : 'play',
    y: window.scrollY,
  };
  try { sessionStorage.setItem('flashy-return', JSON.stringify(spot)); } catch (err) { /* storage blocked */ }
});
function takeReturnSpot() {
  try {
    const raw = sessionStorage.getItem('flashy-return');
    sessionStorage.removeItem('flashy-return');
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

// ---------- start ----------
const returnSpot = takeReturnSpot();
if (returnSpot) $('splash').remove();
// Loading screen: shows for about 2 seconds, then fades away.
if (!returnSpot) setTimeout(() => {
  const splash = $('splash');
  splash.classList.add('leaving');
  splash.addEventListener('animationend', (e) => { if (e.target === splash) splash.remove(); });
  setTimeout(() => splash.remove(), 1200); // backup in case the animation is paused
}, 2000);

(function init() {
  const p = player();
  if (!p) { showLogin(); return; }
  touchStreak(p);
  showLobby(returnSpot && returnSpot.screen === 'lobby' ? returnSpot.tab : 'play');
  if (returnSpot) requestAnimationFrame(() => window.scrollTo(0, returnSpot.y || 0));
  maybeToast();
  maybeWelcome();
  showStreakBreak();
  announceBadges(p);
})();
