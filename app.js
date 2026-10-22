// ================== Flashy ==================
// All progress is saved in the browser (localStorage), one profile per name.

const STORE_KEY = 'flashy-math-v1';
const QUESTIONS_PER_COURSE = 25;
const SECONDS_PER_QUESTION = 10;
const MEGA_EVERY = 25;
const MEGA_GEMS = 400;

const GRADES = ['K', '1', '2', '3', '4', '5', '6', '7', '8'];
const GRADE_NAMES = ['Kindergarten', '1st grade', '2nd grade', '3rd grade', '4th grade', '5th grade', '6th grade', '7th grade', '8th grade'];

const OPS = {
  add: { sym: '+', label: 'Addition' },
  sub: { sym: '−', label: 'Subtraction' },
  mul: { sym: '×', label: 'Multiplication' },
  div: { sym: '÷', label: 'Division' },
  mix: { sym: '★', label: 'Mix it up' },
};

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

// ---------- helpers ----------
const $ = (id) => document.getElementById(id);
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const randNonZero = (a, b) => { let n; do { n = rand(a, b); } while (n === 0); return n; };
const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = rand(0, i); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
const fmt = (n) => (n < 0 ? '−' + Math.abs(n) : String(n));
const fmtRight = (n) => (n < 0 ? `(${fmt(n)})` : fmt(n));

function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function daysBetween(a, b) {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1)) / 86400000);
}

// ---------- saving ----------
let data = load();

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* storage blocked: play without saving */ }
  return { current: null, profiles: {} };
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
}
function player() { return data.current ? data.profiles[data.current] : null; }

function newProfile(name, grade) {
  return {
    name, grade, op: 'add', gems: 0,
    streak: 0, bestStreak: 0, lastVisit: null,
    lastClaim: null, claimedDays: [], chestsOpened: 0,
    courses: 0, totalCorrect: 0, bestScore: 0,
    seenIntro: false,
  };
}

// Count a visit for today and update the day streak.
function touchStreak(p) {
  const today = dayKey();
  if (p.lastVisit === today) return;
  const gap = p.lastVisit ? daysBetween(p.lastVisit, today) : null;
  if (gap === 1) {
    p.streak += 1;
  } else {
    p.streak = 1;
    p.claimedDays = [];
  }
  p.lastVisit = today;
  p.bestStreak = Math.max(p.bestStreak, p.streak);
  save();
}

const canClaim = (p) => p.lastClaim !== dayKey();
const isMegaDay = (day) => day % MEGA_EVERY === 0;
const fireTier = (streak) => [...FIRE_TIERS].reverse().find((t) => streak >= t.min);

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

function makeQuestion(op, grade) {
  if (op === 'mix') op = ['add', 'sub', 'mul', 'div'][rand(0, 3)];
  const [x, y] = LEVELS[op][grade]();
  let a, b, answer;
  if (op === 'add') { a = x; b = y; answer = a + b; }
  if (op === 'sub') { a = x; b = y; answer = a - b; }
  if (op === 'mul') { a = x; b = y; answer = a * b; }
  if (op === 'div') { b = x; answer = y; a = b * y; }
  const text = `${fmt(a)} ${OPS[op].sym} ${fmtRight(b)}`;
  return { text, answer };
}

function makeCourse(op, grade) {
  const qs = [];
  const seen = new Set();
  let tries = 0;
  while (qs.length < QUESTIONS_PER_COURSE) {
    const q = makeQuestion(op, grade);
    if (seen.has(q.text) && tries++ < 300) continue; // avoid repeats when possible
    seen.add(q.text);
    qs.push(q);
  }
  return qs;
}

// ---------- SVG pieces ----------
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

// ---------- screens ----------
const SCREENS = ['login', 'ready', 'countdown', 'quiz', 'results', 'lobby'];
function show(name) {
  SCREENS.forEach((s) => $(`screen-${s}`).classList.toggle('hidden', s !== name));
  $('topbar').classList.toggle('hidden', name === 'login');
  if (['countdown', 'quiz', 'login'].includes(name)) hideToast();
  window.scrollTo(0, 0);
}

function renderTopbar() {
  const p = player();
  if (!p) return;
  $('gem-count').textContent = p.gems.toLocaleString();
  $('player-name').textContent = p.name;
  $('streak-count').textContent = p.streak;
  const t = fireTier(p.streak);
  const fire = $('fire');
  fire.style.setProperty('--fire-outer', t.outer);
  fire.style.setProperty('--fire-inner', t.inner);
  fire.style.setProperty('--fire-glow', t.glow);
  $('streak-wrap').title = `${p.streak} day streak (${t.name} fire)`;
  $('reward-badge').classList.toggle('hidden', !canClaim(p));
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

// ---------- login ----------
let loginGrade = null;

function showLogin() {
  loginGrade = null;
  $('name-input').value = '';
  gradeButtons($('login-grades'), -1, (g) => { loginGrade = g; });
  $('login-form').classList.remove('hidden');
  $('accounts-view').classList.add('hidden');
  show('login');
  $('name-input').focus();
}

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
}

// "I have an account!" lists every account saved on this device.
function showAccounts() {
  const list = $('account-list');
  const profiles = Object.entries(data.profiles);
  list.innerHTML = profiles.length
    ? profiles.map(([key, p]) => `
      <button type="button" class="account-item" data-key="${key}">
        <span class="avatar">${p.name.charAt(0).toUpperCase()}</span>
        <span class="account-info">
          <strong></strong>
          <small>${GRADE_NAMES[p.grade]} · ${p.streak} day streak · ${p.gems.toLocaleString()} gems</small>
        </span>
      </button>`).join('')
    : '<p class="sub">No accounts on this device yet. Make a new one!</p>';
  // names go in as text, not HTML
  list.querySelectorAll('.account-item').forEach((b) => {
    b.querySelector('strong').textContent = data.profiles[b.dataset.key].name;
    b.onclick = () => signInAs(b.dataset.key);
  });
  $('login-form').classList.add('hidden');
  $('accounts-view').classList.remove('hidden');
}

$('have-account').onclick = showAccounts;
$('new-account').onclick = showLogin;

$('login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('name-input').value.trim();
  if (!name) return;
  if (loginGrade === null) { alert('Please pick your grade!'); return; }
  const key = name.toLowerCase();
  if (!data.profiles[key]) data.profiles[key] = newProfile(name, loginGrade);
  data.profiles[key].grade = loginGrade;
  signInAs(key);
});

// ---------- ready + countdown ----------
// The first time (right after signing in) the buttons are worded differently.
function showReady(afterSignIn = false) {
  const p = player();
  $('ready-details').textContent = `${GRADE_NAMES[p.grade]} · ${OPS[p.op].label} · ${QUESTIONS_PER_COURSE} questions`;
  $('screen-ready').querySelector('.ready-title').textContent = afterSignIn
    ? 'Do you wanna see what a course is like?'
    : 'Are you ready to start the course?';
  $('ready-yes').textContent = afterSignIn ? "Sure, I'll try it!" : 'Yes!';
  $('ready-no').textContent = afterSignIn ? 'No, I wanna see the lobby!' : 'No, go back!';
  show('ready');
}

$('ready-yes').onclick = startCountdown;
$('ready-no').onclick = () => showLobby('play');

function startCountdown() {
  show('countdown');
  const el = $('countdown-num');
  const steps = ['3', '2', '1', 'Go!'];
  let i = 0;
  const tick = () => {
    if (i >= steps.length) { startQuiz(); return; }
    el.textContent = steps[i];
    el.classList.remove('pop');
    void el.offsetWidth; // restart the animation
    el.classList.add('pop');
    i++;
    setTimeout(tick, i === steps.length ? 600 : 900);
  };
  tick();
}

// ---------- quiz ----------
let quiz = null;

function startQuiz() {
  const p = player();
  quiz = { qs: makeCourse(p.op, p.grade), i: 0, correct: 0, locked: false };
  buildKeypad();
  show('quiz');
  renderQuestion();
}

function renderQuestion() {
  const q = quiz.qs[quiz.i];
  const card = $('flashcard');
  card.classList.remove('right', 'wrong', 'flip');
  void card.offsetWidth;
  card.classList.add('flip');
  $('question').textContent = q.text;
  $('q-count').textContent = `${quiz.i + 1} / ${QUESTIONS_PER_COURSE}`;
  $('progress-fill').style.width = `${(quiz.i / QUESTIONS_PER_COURSE) * 100}%`;
  $('score-now').textContent = quiz.correct;
  const input = $('answer-input');
  input.value = '';
  input.className = 'answer-input';
  input.disabled = false;
  $('feedback').innerHTML = '&nbsp;';
  $('feedback').className = 'feedback';
  quiz.locked = false;
  input.focus();
  startTimer();
}

// Only digits (and a leading minus sign from 6th grade, where answers can be negative).
const allowMinus = () => player() && player().grade >= 6;
function cleanNumber(text) {
  const neg = allowMinus() && /^\s*[-−]/.test(text);
  const digits = text.replace(/\D/g, '').slice(0, 6);
  return (neg ? '-' : '') + digits;
}

function buildKeypad() {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', allowMinus() ? '±' : '', '0', '⌫'];
  $('keypad').innerHTML = keys.map((k) => k
    ? `<button type="button" class="key${k === '⌫' || k === '±' ? ' fn' : ''}" data-key="${k}">${k === '±' ? '+/−' : k}</button>`
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
  if (e.data && !/^[0-9]+$/.test(e.data) && !(allowMinus() && /^[-−]$/.test(e.data))) e.preventDefault();
});
$('answer-input').addEventListener('input', (e) => {
  const clean = cleanNumber(e.target.value);
  if (clean !== e.target.value) e.target.value = clean;
});

$('answer-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!quiz || quiz.locked) return;
  const input = $('answer-input');
  if (input.value === '' || input.value === '-') {
    input.classList.remove('nudge');
    void input.offsetWidth;
    input.classList.add('nudge');
    input.focus();
    return;
  }
  checkAnswer(input.value);
});

// value is the typed answer, or null when the timer ran out
function checkAnswer(value) {
  quiz.locked = true;
  stopTimer();
  const input = $('answer-input');
  const q = quiz.qs[quiz.i];
  const ok = value !== null && Number(value) === q.answer;
  if (ok) quiz.correct++;
  input.disabled = true;
  input.classList.add(ok ? 'right' : 'wrong');
  $('flashcard').classList.add(ok ? 'right' : 'wrong');
  const fb = $('feedback');
  fb.className = 'feedback show ' + (ok ? 'good' : 'bad');
  fb.textContent = ok ? ['Correct!', 'Nice!', 'You got it!', 'Awesome!'][rand(0, 3)]
    : value === null ? `Time's up! The answer is ${fmt(q.answer)}`
    : `The answer is ${fmt(q.answer)}`;
  $('score-now').textContent = quiz.correct;
  const current = quiz;
  setTimeout(() => {
    if (quiz !== current) return; // they quit meanwhile
    quiz.i++;
    if (quiz.i >= QUESTIONS_PER_COURSE) finishQuiz();
    else renderQuestion();
  }, ok ? 800 : 1700);
}

// ---------- 10 second timer ----------
let timerFrame = null;

function startTimer() {
  stopTimer();
  const end = performance.now() + SECONDS_PER_QUESTION * 1000;
  const tick = (now) => {
    const left = Math.max(0, end - now);
    const frac = left / (SECONDS_PER_QUESTION * 1000);
    $('timer-fill').style.width = `${frac * 100}%`;
    $('timer-num').textContent = Math.ceil(left / 1000);
    $('timer').classList.toggle('hurry', left <= 3000);
    if (left <= 0) { timerFrame = null; if (quiz && !quiz.locked) checkAnswer(null); return; }
    timerFrame = requestAnimationFrame(tick);
  };
  timerFrame = requestAnimationFrame(tick);
}

function stopTimer() {
  if (timerFrame) cancelAnimationFrame(timerFrame);
  timerFrame = null;
}

$('quit-btn').onclick = () => {
  if (confirm('Quit this course? Your progress in this course will be lost.')) {
    stopTimer();
    quiz = null;
    showLobby('play');
  }
};

function finishQuiz() {
  const p = player();
  const score = quiz.correct;
  const perfect = score === QUESTIONS_PER_COURSE;
  const gems = score * 2 + (perfect ? 10 : 0);
  p.gems += gems;
  p.courses += 1;
  p.totalCorrect += score;
  p.bestScore = Math.max(p.bestScore, score);
  save();
  renderTopbar();
  quiz = null;

  const pct = score / QUESTIONS_PER_COURSE;
  const stars = pct === 1 ? 3 : pct >= 0.8 ? 2 : pct >= 0.5 ? 1 : 0;
  $('result-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  $('result-title').textContent = perfect ? 'PERFECT!' : pct >= 0.8 ? 'Great job!' : pct >= 0.5 ? 'Nice work!' : 'Keep practicing!';
  $('result-score').textContent = score;
  $('result-gems').textContent = `You earned ${gems} gems${perfect ? ' (includes +10 perfect bonus!)' : ''}`;
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
document.querySelectorAll('.tab').forEach((t) => { t.onclick = () => switchTab(t.dataset.tab); });

function renderLobby() {
  const p = player();
  const grid = $('op-grid');
  grid.innerHTML = '';
  Object.entries(OPS).forEach(([key, o]) => {
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
  renderTopbar();
}
$('start-course').onclick = () => showReady();

function renderRewards() {
  const p = player();
  const start = Math.floor((p.streak - 1) / MEGA_EVERY) * MEGA_EVERY + 1;
  const ready = canClaim(p);
  $('rewards-sub').textContent = ready
    ? `Day ${p.streak} chest is ready! Tap the glowing chest to open it.`
    : `You opened today's chest. Come back tomorrow for day ${p.streak + 1}!`;

  // One long row of chests (this 25-day stretch and the next), scrolling to the right.
  const track = $('chest-track');
  track.innerHTML = '';
  let focus = null;
  for (let day = start; day < start + MEGA_EVERY * 2; day++) {
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
}

function claimChest() {
  const p = player();
  if (!canClaim(p)) return;
  const mega = isMegaDay(p.streak);
  const gems = mega ? MEGA_GEMS : rand(20, 200);
  p.gems += gems;
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
}

let chestOpening = null;

$('chest-stage').onclick = () => {
  if (!chestOpening || chestOpening.opened) return;
  chestOpening.opened = true;
  const stage = $('chest-stage');
  const big = stage.classList.contains('big') ? ' big' : '';
  $('chest-hint').classList.add('hidden');
  stage.className = 'chest-stage shaking' + big;
  setTimeout(() => {
    stage.className = 'chest-stage opened' + big;
    $('chest-big').querySelector('svg').classList.add('open');
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
  chestOpening = null;
  $('chest-modal').classList.add('hidden');
  if (!$('screen-lobby').classList.contains('hidden')) renderRewards();
};

function renderStats() {
  const p = player();
  const stats = [
    ['Gems', p.gems.toLocaleString()],
    ['Day streak', p.streak],
    ['Longest streak', p.bestStreak],
    ['Courses finished', p.courses],
    ['Correct answers', p.totalCorrect],
    ['Best score', `${p.bestScore} / ${QUESTIONS_PER_COURSE}`],
    ['Chests opened', p.chestsOpened],
    ['Grade', GRADE_NAMES[p.grade]],
  ];
  $('stat-grid').innerHTML = stats.map(([l, n]) => `<div class="stat"><div class="num">${n}</div><div class="lbl">${l}</div></div>`).join('');
}

$('logout-btn').onclick = () => {
  data.current = null;
  save();
  showLogin();
};

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
  if (document.visibilityState !== 'visible' || !p || p.lastVisit === dayKey()) return;
  touchStreak(p);
  renderTopbar();
  if (!$('screen-lobby').classList.contains('hidden')) renderLobby();
  if (!quiz) maybeToast();
});

// ---------- bouncy clicks ----------
// Every button springs when pressed; the class restarts the animation on each click.
const BOUNCY = '.btn, .tab, .op-card, .grade-btn, .key, .chest-node, .pill, .path-arrow';
document.addEventListener('pointerdown', (e) => {
  const el = e.target.closest(BOUNCY);
  if (!el || el.disabled) return;
  el.classList.remove('bounce');
  void el.offsetWidth;
  el.classList.add('bounce');
});
document.addEventListener('animationend', (e) => {
  if (e.animationName === 'bounce') e.target.classList.remove('bounce');
});

// ---------- start ----------
(function init() {
  const p = player();
  if (!p) { showLogin(); return; }
  touchStreak(p);
  showLobby('play');
  maybeToast();
})();
