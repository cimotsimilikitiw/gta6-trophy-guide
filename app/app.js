const DATA_FILE = 'data/trophies.json';
const STORE_KEY = 'gta6-trophy-tracker-v1';

const gradeOrder = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

const dom = {
  body: document.getElementById('trophy-body'),
  search: document.getElementById('search'),
  kind: document.getElementById('kind-filter'),
  grade: document.getElementById('grade-filter'),
  spoilers: document.getElementById('hide-spoilers'),
  clear: document.getElementById('clear-filters'),
  status: document.getElementById('status'),
  visible: document.getElementById('visible-count'),
  earnedCount: document.getElementById('earned-count'),
  totalCount: document.getElementById('total-count'),
  earnedPercent: document.getElementById('earned-percent'),
  progressFill: document.getElementById('progress-fill'),
  progressBar: document.querySelector('[role="progressbar"]'),
  stats: {
    platinum: document.getElementById('stat-platinum'),
    gold: document.getElementById('stat-gold'),
    silver: document.getElementById('stat-silver'),
    bronze: document.getElementById('stat-bronze'),
  },
};

let trophies = [];
let earned = loadEarned();

function loadEarned() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x) => Number.isInteger(x)));
  } catch {
    return new Set();
  }
}

function saveEarned() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify([...earned]));
  } catch {
    // Storage may be unavailable; keep in-memory state.
  }
}

function normalize(s) {
  return String(s || '').toLowerCase();
}

function matchesFilters(t) {
  const q = normalize(dom.search.value).trim();
  const kind = dom.kind.value;
  const grade = dom.grade.value;
  if (kind !== 'all' && t.kind !== kind) return false;
  if (grade !== 'all' && t.grade !== grade) return false;
  if (q) {
    const hay = `${t.name} ${t.description} ${t.guide} ${t.chapter} ${t.kind} ${t.grade}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function updateSummary() {
  const total = trophies.length;
  const count = trophies.reduce((n, t) => n + (earned.has(t.id) ? 1 : 0), 0);
  const pct = total ? Math.round((count / total) * 100) : 0;
  dom.earnedCount.textContent = String(count);
  dom.totalCount.textContent = String(total);
  dom.earnedPercent.textContent = `${pct}% complete`;
  dom.progressFill.style.width = `${pct}%`;
  dom.progressBar.setAttribute('aria-valuenow', String(count));
  dom.progressBar.setAttribute('aria-valuemax', String(total));

  const byGrade = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) {
    if (earned.has(t.id) && byGrade[t.grade] !== undefined) byGrade[t.grade] += 1;
  }
  dom.stats.platinum.textContent = String(byGrade.platinum);
  dom.stats.gold.textContent = String(byGrade.gold);
  dom.stats.silver.textContent = String(byGrade.silver);
  dom.stats.bronze.textContent = String(byGrade.bronze);
}

function trophyName(t, hideStory) {
  if (hideStory && t.kind === 'story') return 'Hidden story trophy';
  return t.name;
}

function trophyDesc(t, hideStory) {
  if (hideStory && t.kind === 'story') return 'Story detail hidden. Turn off “Hide story trophy names & details” to reveal it.';
  return t.description;
}

function trophyGuide(t, hideStory) {
  if (hideStory && t.kind === 'story') return 'Guide hidden to avoid story spoilers.';
  return t.guide;
}

function render() {
  const hideStory = dom.spoilers.checked;
  const visible = trophies
    .filter(matchesFilters)
    .slice()
    .sort((a, b) => (gradeOrder[a.grade] - gradeOrder[b.grade]) || (a.id - b.id));

  dom.body.innerHTML = '';
  if (visible.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.className = 'empty-cell';
    td.textContent = 'No trophies match the current filters.';
    tr.appendChild(td);
    dom.body.appendChild(tr);
  } else {
    for (const t of visible) {
      const tr = document.createElement('tr');
      const isDone = earned.has(t.id);
      if (isDone) tr.classList.add('is-earned');

      const tdDone = document.createElement('td');
      const label = document.createElement('label');
      label.className = 'earned-check';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = isDone;
      cb.dataset.id = String(t.id);
      cb.setAttribute('aria-label', `Mark ${trophyName(t, hideStory)} as earned`);
      const cbText = document.createElement('span');
      cbText.textContent = isDone ? 'Done' : 'Mark';
      cb.addEventListener('change', () => {
        const id = Number(cb.dataset.id);
        if (cb.checked) earned.add(id);
        else earned.delete(id);
        saveEarned();
        updateSummary();
        render();
      });
      label.append(cb, cbText);
      tdDone.appendChild(label);

      const tdName = document.createElement('td');
      const name = document.createElement('span');
      name.className = 'trophy-name';
      name.textContent = trophyName(t, hideStory);
      const desc = document.createElement('span');
      desc.className = 'trophy-desc';
      desc.textContent = trophyDesc(t, hideStory);
      const meta = document.createElement('span');
      meta.className = 'trophy-meta';
      const missable = t.missable ? 'Missable' : 'Not missable';
      meta.textContent = `#${t.id} · ${t.chapter} · ${missable}`;
      tdName.append(name, desc, meta);

      const tdGrade = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = `badge badge-${t.grade}`;
      badge.textContent = t.grade;
      tdGrade.appendChild(badge);

      const tdKind = document.createElement('td');
      const kind = document.createElement('span');
      kind.className = 'kind-tag';
      kind.textContent = t.kind;
      tdKind.appendChild(kind);

      const tdGuide = document.createElement('td');
      const guide = document.createElement('p');
      guide.className = 'guide-text';
      guide.textContent = trophyGuide(t, hideStory);
      tdGuide.appendChild(guide);

      tr.append(tdDone, tdName, tdGrade, tdKind, tdGuide);
      dom.body.appendChild(tr);
    }
  }

  dom.visible.textContent = `Showing ${visible.length} of ${trophies.length}`;
  updateSummary();
}

function clearFilters() {
  dom.search.value = '';
  dom.kind.value = 'all';
  dom.grade.value = 'all';
  render();
}

async function init() {
  try {
    const res = await fetch(DATA_FILE, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data || !Array.isArray(data.trophies)) throw new Error('Invalid trophy data');
    trophies = data.trophies;
    dom.status.textContent = `Loaded ${trophies.length} trophies.`;
    render();
  } catch (err) {
    console.error(err);
    dom.status.textContent = 'Could not load trophy data. Run a local server from the repo root.';
    dom.body.innerHTML = '<tr><td colspan="5" class="empty-cell">Failed to load trophies.</td></tr>';
  }
}

dom.search.addEventListener('input', render);
dom.kind.addEventListener('change', render);
dom.grade.addEventListener('change', render);
dom.spoilers.addEventListener('change', render);
dom.clear.addEventListener('click', clearFilters);

init();
