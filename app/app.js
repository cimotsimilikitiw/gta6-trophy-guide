const DATA_URL = 'data/trophies.json';
const STORAGE_KEY = 'gta6-trophy-guide-v1';

const els = {
  body: document.getElementById('trophy-body'),
  grade: document.getElementById('filter-grade'),
  kind: document.getElementById('filter-kind'),
  status: document.getElementById('filter-status'),
  spoilers: document.getElementById('toggle-spoilers'),
  exportBtn: document.getElementById('btn-export'),
  importFile: document.getElementById('import-file'),
  resetBtn: document.getElementById('btn-reset-filters'),
  statusMsg: document.getElementById('status'),
  earned: document.getElementById('stat-earned'),
  pct: document.getElementById('stat-pct'),
  visible: document.getElementById('stat-visible'),
  totals: document.getElementById('totals'),
  listCount: document.getElementById('list-count'),
};

let trophies = [];
let earned = loadEarned();

function loadEarned() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    const ids = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.earned) ? parsed.earned : [];
    return new Set(ids.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n > 0));
  } catch {
    return new Set();
  }
}

function saveEarned() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
  } catch {
    /* Ignore storage failures (private mode/quota); the UI still works for the session. */
  }
}

function setStatus(message) {
  els.statusMsg.textContent = message;
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function kindLabel(kind) {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

function computeTotals(items) {
  const totals = { total: items.length, platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of items) {
    if (Object.prototype.hasOwnProperty.call(totals, t.grade)) totals[t.grade] += 1;
  }
  return totals;
}

function updateSummary(visibleCount) {
  const totals = computeTotals(trophies);
  const earnedCount = trophies.reduce((n, t) => n + (earned.has(t.id) ? 1 : 0), 0);
  const pct = totals.total ? Math.round((earnedCount / totals.total) * 100) : 0;
  els.earned.textContent = `${earnedCount} / ${totals.total}`;
  els.pct.textContent = `${pct}%`;
  els.visible.textContent = String(visibleCount);
  els.totals.textContent = `Totals: ${totals.total} trophies (${totals.platinum} platinum, ${totals.gold} gold, ${totals.silver} silver, ${totals.bronze} bronze).`;
  els.listCount.textContent = `Showing ${visibleCount} ${visibleCount === 1 ? 'trophy' : 'trophies'}`;
}

function filteredTrophies() {
  const grade = els.grade.value;
  const kind = els.kind.value;
  const status = els.status.value;
  return trophies.filter((t) => {
    if (grade !== 'all' && t.grade !== grade) return false;
    if (kind !== 'all' && t.kind !== kind) return false;
    const isEarned = earned.has(t.id);
    if (status === 'earned' && !isEarned) return false;
    if (status === 'remaining' && isEarned) return false;
    return true;
  });
}

function makeBadge(text, className) {
  const span = document.createElement('span');
  span.className = `badge ${className}`;
  span.textContent = text;
  return span;
}

function makeChip(text) {
  const span = document.createElement('span');
  span.className = 'chip';
  span.textContent = text;
  return span;
}

function render() {
  const rows = filteredTrophies();
  const hideStorySpoilers = els.spoilers.checked;
  els.body.replaceChildren();

  if (rows.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.className = 'empty';
    td.textContent = 'No trophies match the current filters.';
    tr.appendChild(td);
    els.body.appendChild(tr);
    updateSummary(0);
    return;
  }

  for (const t of rows) {
    const tr = document.createElement('tr');

    const doneTd = document.createElement('td');
    doneTd.className = 'done-cell';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = earned.has(t.id);
    cb.dataset.id = String(t.id);
    const cbLabel = `Mark "${t.name}" as earned`;
    cb.setAttribute('aria-label', cbLabel);
    cb.addEventListener('change', () => {
      if (cb.checked) earned.add(t.id);
      else earned.delete(t.id);
      saveEarned();
      updateSummary(filteredTrophies().length);
      if (els.status.value !== 'all') render();
    });
    doneTd.appendChild(cb);

    const trophyTd = document.createElement('td');
    const name = document.createElement('span');
    name.className = 'trophy-name';
    name.textContent = `${t.id}. ${t.name}`;
    const desc = document.createElement('p');
    desc.className = 'trophy-desc';
    desc.textContent = t.description;
    const meta = document.createElement('div');
    meta.className = 'trophy-meta';
    meta.append(makeChip(`Chapter: ${t.chapter || 'N/A'}`));
    meta.append(makeChip(t.missable ? 'Missable' : 'Not missable'));
    if (t.hidden) meta.append(makeChip('Hidden'));
    trophyTd.append(name, desc, meta);

    const gradeTd = document.createElement('td');
    gradeTd.appendChild(makeBadge(gradeLabel(t.grade), `grade-${t.grade}`));

    const kindTd = document.createElement('td');
    kindTd.appendChild(makeBadge(kindLabel(t.kind), `kind-${t.kind}`));

    const guideTd = document.createElement('td');
    guideTd.className = 'guide';
    const spoilerHidden = hideStorySpoilers && t.kind === 'story';
    if (spoilerHidden) {
      guideTd.classList.add('is-hidden');
      guideTd.textContent = 'Spoiler hidden. Turn off "Hide story spoiler guides" to view this guide.';
    } else {
      guideTd.textContent = t.guide;
    }

    tr.append(doneTd, trophyTd, gradeTd, kindTd, guideTd);
    els.body.appendChild(tr);
  }

  updateSummary(rows.length);
}

function exportProgress() {
  const payload = {
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort((a, b) => a - b),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gta6-trophy-progress.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  setStatus(`Exported ${payload.earned.length} earned trophies.`);
}

async function importProgress(file) {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const ids = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.earned) ? parsed.earned : null;
    if (!ids) throw new Error('Invalid format');
    const validIds = new Set(trophies.map((t) => t.id));
    const next = new Set();
    for (const raw of ids) {
      const n = Number(raw);
      if (Number.isInteger(n) && validIds.has(n)) next.add(n);
    }
    earned = next;
    saveEarned();
    render();
    setStatus(`Imported ${earned.size} earned trophies from ${file.name}.`);
  } catch {
    setStatus('Import failed: please choose a valid progress JSON file.');
  } finally {
    els.importFile.value = '';
  }
}

function resetFilters() {
  els.grade.value = 'all';
  els.kind.value = 'all';
  els.status.value = 'all';
  els.spoilers.checked = false;
  render();
  setStatus('Filters reset.');
}

async function loadData() {
  const res = await fetch(DATA_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load ${DATA_URL}: ${res.status}`);
  const data = await res.json();
  if (!data || !Array.isArray(data.trophies)) throw new Error('Invalid trophy data');
  return data.trophies;
}

async function init() {
  try {
    trophies = await loadData();
    els.grade.addEventListener('change', render);
    els.kind.addEventListener('change', render);
    els.status.addEventListener('change', render);
    els.spoilers.addEventListener('change', render);
    els.exportBtn.addEventListener('click', exportProgress);
    els.importFile.addEventListener('change', () => {
      const file = els.importFile.files?.[0];
      if (file) importProgress(file);
    });
    els.resetBtn.addEventListener('click', resetFilters);
    render();
  } catch (err) {
    console.error(err);
    setStatus('Could not load trophy data. Make sure you are serving the app folder.');
    els.body.innerHTML = '<tr><td class="empty" colspan="5">Failed to load trophies.</td></tr>';
  }
}

init();
