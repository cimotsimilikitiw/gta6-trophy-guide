// GTA VI Trophy Guide & Tracker
// Offline static app: loads trophy data, tracks earned state in localStorage,
// supports grade/kind/earned filters, spoiler-hidden story guides, and JSON export/import.
// Written in this recorded session; guide text lives in app/data/trophies.json.

const STORAGE_KEY = 'gta6-trophy-checklist';

const rowsEl = document.getElementById('rows');
const gradeFilter = document.getElementById('grade-filter');
const kindFilter = document.getElementById('kind-filter');
const spoilerToggle = document.getElementById('spoiler-toggle');
const earnedOnly = document.getElementById('earned-only');
const progressEl = document.getElementById('progress');
const totalsEl = document.getElementById('totals');
const visibleCountEl = document.getElementById('visible-count');
const exportBtn = document.getElementById('export-btn');
const importInput = document.getElementById('import-input');
const statusEl = document.getElementById('status');

const KIND_LABELS = {
  story: 'Story',
  activities: 'Activities',
  collectibles: 'Collectibles / Exploration',
  other: 'Other',
};

let trophies = [];
let earned = loadEarned();
let revealed = new Set();

function loadEarned() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(raw)) return new Set();
    return new Set(raw.filter((x) => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

function saveEarned() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned]));
}

function gradeCounts(list) {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of list) {
    if (counts[t.grade] !== undefined) counts[t.grade] += 1;
  }
  return counts;
}

function updateSummary(visible) {
  const total = trophies.length;
  const earnedCount = earned.size;
  const counts = gradeCounts(trophies);
  progressEl.textContent = `${earnedCount} of ${total} earned`;
  totalsEl.textContent = `Totals: ${total} trophies (${counts.platinum} platinum, ${counts.gold} gold, ${counts.silver} silver, ${counts.bronze} bronze).`;
  visibleCountEl.textContent = `Showing ${visible.length} of ${total} trophies`;
  const remaining = total - earnedCount;
  statusEl.textContent = remaining === 0
    ? 'All trophies earned. Platinum complete!'
    : `${remaining} trophy${remaining === 1 ? '' : 'ies'} remaining.`;
}

function passesFilters(t) {
  if (gradeFilter.value !== 'all' && t.grade !== gradeFilter.value) return false;
  if (kindFilter.value !== 'all' && t.kind !== kindFilter.value) return false;
  if (earnedOnly.checked && !earned.has(t.name)) return false;
  return true;
}

function makeGradeBadge(grade) {
  const span = document.createElement('span');
  span.className = `badge badge-${grade}`;
  span.textContent = grade.charAt(0).toUpperCase() + grade.slice(1);
  return span;
}

function makeKindLabel(kind) {
  const span = document.createElement('span');
  span.className = `kind kind-${kind}`;
  span.textContent = KIND_LABELS[kind] ?? kind;
  return span;
}

function makeGuideCell(t) {
  const td = document.createElement('td');
  td.className = 'guide-cell';

  const shouldHide = spoilerToggle.checked && t.kind === 'story' && !revealed.has(t.name);
  if (shouldHide) {
    const note = document.createElement('p');
    note.className = 'spoiler-note';
    note.textContent = 'Story guide hidden to avoid spoilers.';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'reveal-btn';
    btn.textContent = 'Reveal guide';
    btn.addEventListener('click', () => {
      revealed.add(t.name);
      render();
    });
    td.append(note, btn);
    return td;
  }

  const guide = document.createElement('p');
  guide.className = 'guide-text';
  guide.textContent = t.guide;
  td.append(guide);

  const meta = document.createElement('div');
  meta.className = 'guide-meta';

  if (t.chapter) {
    const chapter = document.createElement('span');
    chapter.className = 'meta-chip';
    chapter.textContent = t.chapter;
    meta.append(chapter);
  }
  if (t.missable) {
    const missable = document.createElement('span');
    missable.className = 'meta-chip meta-missable';
    missable.textContent = 'Missable risk';
    meta.append(missable);
  }
  if (spoilerToggle.checked && t.kind === 'story') {
    const shown = document.createElement('span');
    shown.className = 'meta-chip';
    shown.textContent = 'Spoiler revealed';
    meta.append(shown);
  }
  if (meta.childNodes.length > 0) td.append(meta);
  return td;
}

function render() {
  rowsEl.replaceChildren();
  const visible = trophies.filter(passesFilters);

  for (const t of visible) {
    const tr = document.createElement('tr');
    tr.className = earned.has(t.name) ? 'earned' : '';

    const tdEarned = document.createElement('td');
    tdEarned.className = 'earned-cell';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = earned.has(t.name);
    const label = `Mark ${t.name} as earned`;
    checkbox.setAttribute('aria-label', label);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) earned.add(t.name);
      else earned.delete(t.name);
      saveEarned();
      render();
    });
    tdEarned.append(checkbox);

    const tdTrophy = document.createElement('td');
    tdTrophy.className = 'trophy-cell';
    const name = document.createElement('p');
    name.className = 'trophy-name';
    name.textContent = t.name;
    const desc = document.createElement('p');
    desc.className = 'trophy-desc';
    desc.textContent = t.description;
    tdTrophy.append(name, desc);

    const tdGrade = document.createElement('td');
    tdGrade.className = 'grade-cell';
    tdGrade.append(makeGradeBadge(t.grade));

    const tdKind = document.createElement('td');
    tdKind.className = 'kind-cell';
    tdKind.append(makeKindLabel(t.kind));

    const tdGuide = makeGuideCell(t);

    tr.append(tdEarned, tdTrophy, tdGrade, tdKind, tdGuide);
    rowsEl.append(tr);
  }

  updateSummary(visible);
}

function exportProgress() {
  const payload = {
    format: 'gta6-trophy-guide-progress-v1',
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: [...earned],
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(url);
  statusEl.textContent = `Exported ${earned.size} earned trophy${earned.size === 1 ? '' : 'ies'}.`;
}

async function importProgress(file) {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const list = Array.isArray(parsed) ? parsed : parsed?.earned;
    if (!Array.isArray(list)) {
      throw new Error('Expected a JSON array or an object with an earned array.');
    }
    const validNames = new Set(trophies.map((t) => t.name));
    const imported = list.filter((x) => typeof x === 'string' && validNames.has(x));
    earned = new Set(imported);
    saveEarned();
    render();
    statusEl.textContent = `Imported ${imported.length} earned trophy${imported.length === 1 ? '' : 'ies'}.`;
  } catch (err) {
    statusEl.textContent = `Import failed: ${err instanceof Error ? err.message : 'Invalid file'}`;
  } finally {
    importInput.value = '';
  }
}

async function init() {
  try {
    const response = await fetch('data/trophies.json');
    if (!response.ok) throw new Error(`Failed to load trophies.json (${response.status})`);
    const doc = await response.json();
    if (!doc || !Array.isArray(doc.trophies)) throw new Error('Invalid trophies data');
    trophies = doc.trophies;
  } catch (err) {
    statusEl.textContent = `Could not load trophy data: ${err instanceof Error ? err.message : 'Unknown error'}`;
    return;
  }

  gradeFilter.addEventListener('change', render);
  kindFilter.addEventListener('change', render);
  spoilerToggle.addEventListener('change', render);
  earnedOnly.addEventListener('change', render);
  exportBtn.addEventListener('click', exportProgress);
  importInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) importProgress(file);
  });

  render();
}

init();
