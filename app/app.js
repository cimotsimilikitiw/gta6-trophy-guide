// Leonida Ledger — an offline guide and tracker for the 55 Grand Theft Auto VI trophies.
// Plain ES module, no dependencies, no network: the trophy list is the only thing it fetches,
// and it comes from this app's own data/ folder.

const DATA_PATH = 'data/trophies.json';
const STORE_KEY = 'leonida-ledger-v1';

const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];
const GRADE_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
const KIND_LABEL = { story: 'Story', activities: 'Activities', collectibles: 'Collectibles', other: 'Other' };

const el = (id) => document.getElementById(id);

const ui = {
  rows: el('trophy-rows'),
  detail: el('detail'),
  search: el('search'),
  grade: el('grade-filter'),
  kindChips: el('kind-chips'),
  spoiler: el('spoiler-toggle'),
  spoilerText: el('spoiler-text'),
  clear: el('clear-filters'),
  visible: el('visible-count'),
  earned: el('earned-count'),
  total: el('total-count'),
  meter: el('meter-fill'),
  meterBar: document.querySelector('.meter'),
  percent: el('percent-note'),
  gradeList: el('grade-list'),
  stageGrid: el('stage-grid'),
  missableList: el('missable-list'),
  missableCount: el('missable-count'),
  exportButton: el('export-button'),
  importButton: el('import-button'),
  importFile: el('import-file'),
  resetButton: el('reset-button'),
  saveStatus: el('save-status'),
  shareLink: el('share-link'),
  shareNote: el('share-note'),
  toast: el('toast'),
};

const state = {
  doc: null,
  trophies: [],
  stages: [],
  earned: new Set(),
  kind: 'all',
  grade: 'all',
  query: '',
  spoilersHidden: false,
  selectedId: null,
  view: 'checklist',
};

/* ---------- storage ---------- */

function readStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((n) => Number.isInteger(n)));
  } catch {
    return new Set();
  }
}

function writeStore() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify([...state.earned].sort((a, b) => a - b)));
  } catch {
    toast('This browser refused to save progress; ticks last for this session only.');
  }
}

function readHash() {
  const params = new URLSearchParams(location.hash.replace(/^#/, ''));
  const rawIds = (params.get('p') || '').split(',').filter(Boolean);
  const ids = rawIds
    .map((part) => Number.parseInt(part, 36))
    .filter((n) => Number.isInteger(n) && n > 0);
  const view = params.get('v');
  const kind = params.get('k');
  const trophy = Number.parseInt(params.get('t') || '', 10);
  return {
    ids: rawIds.length ? new Set(ids) : null,
    view: view === 'roadmap' || view === 'save' ? view : null,
    kind: kind && ['all', 'story', 'missable', 'collectibles', 'activities', 'other'].includes(kind) ? kind : null,
    spoilers: params.get('s') === '1',
    trophy: Number.isInteger(trophy) ? trophy : null,
  };
}

/* ---------- helpers ---------- */

function toast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add('is-on');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => ui.toast.classList.remove('is-on'), 2600);
}

function isStory(t) {
  return t.kind === 'story';
}

function conceal(t) {
  return state.spoilersHidden && isStory(t) && !state.earned.has(t.id);
}

function shownName(t) {
  return conceal(t) ? 'Hidden story trophy' : t.name;
}

function shownDescription(t) {
  return conceal(t) ? 'Description hidden until this trophy is earned.' : t.description;
}

function stageName(id) {
  const stage = state.stages.find((s) => s.id === id);
  return stage ? stage.name : 'Unsorted';
}

function byId(id) {
  return state.trophies.find((t) => t.id === id) || null;
}

function matches(t) {
  if (state.kind === 'missable' && !t.missable) return false;
  if (state.kind !== 'all' && state.kind !== 'missable' && t.kind !== state.kind) return false;
  if (state.grade !== 'all' && t.grade !== state.grade) return false;
  if (state.query) {
    const hay = [t.name, t.description, t.guide, t.chapter, t.kind, t.grade, ...(t.steps || []), ...(t.sources || [])]
      .join(' ')
      .toLowerCase();
    if (!hay.includes(state.query)) return false;
  }
  return true;
}

/* ---------- progress ---------- */

function progress() {
  const total = state.trophies.length;
  const count = state.trophies.filter((t) => state.earned.has(t.id)).length;
  const pct = total ? Math.round((count / total) * 100) : 0;
  return { total, count, pct };
}

function renderProgress() {
  const { total, count, pct } = progress();
  ui.earned.textContent = String(count);
  ui.total.textContent = String(total);
  ui.meter.style.width = `${pct}%`;
  ui.meterBar.setAttribute('aria-valuenow', String(count));
  ui.meterBar.setAttribute('aria-valuemax', String(total));
  ui.percent.textContent = `${pct}% complete · ${total - count} to go`;

  ui.gradeList.replaceChildren();
  for (const grade of GRADE_ORDER) {
    const all = state.trophies.filter((t) => t.grade === grade);
    const got = all.filter((t) => state.earned.has(t.id)).length;
    const li = document.createElement('li');
    li.className = `grade-row grade-${grade}`;
    const dot = document.createElement('span');
    dot.className = 'grade-dot';
    const name = document.createElement('span');
    name.className = 'grade-name';
    name.textContent = GRADE_LABEL[grade];
    const count = document.createElement('span');
    count.className = 'grade-count';
    count.textContent = `${got}/${all.length}`;
    li.append(dot, name, count);
    ui.gradeList.append(li);
  }
}

/* ---------- checklist ---------- */

function buildRow(t) {
  const tr = document.createElement('tr');
  tr.dataset.id = String(t.id);
  tr.className = 'trophy-row';
  if (state.earned.has(t.id)) tr.classList.add('is-earned');
  if (t.id === state.selectedId) tr.classList.add('is-selected');
  if (conceal(t)) tr.classList.add('is-concealed');

  const tickCell = document.createElement('td');
  tickCell.className = 'col-tick';
  const label = document.createElement('label');
  label.className = 'tick';
  label.title = `Mark ${shownName(t)} earned`;
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = state.earned.has(t.id);
  box.setAttribute('aria-label', `Mark ${shownName(t)} earned`);
  box.addEventListener('change', (event) => {
    event.stopPropagation();
    toggleEarned(t.id, box.checked);
  });
  const mark = document.createElement('span');
  mark.className = 'tick-mark';
  label.append(box, mark);
  tickCell.append(label);

  const nameCell = document.createElement('td');
  nameCell.className = 'col-name';
  const name = document.createElement('span');
  name.className = 'trophy-name';
  name.textContent = shownName(t);
  const desc = document.createElement('span');
  desc.className = 'trophy-desc';
  desc.textContent = shownDescription(t);
  const meta = document.createElement('span');
  meta.className = 'trophy-meta';
  const bits = [`#${String(t.id).padStart(2, '0')}`, t.chapter];
  if (t.missable) bits.push('missable');
  meta.textContent = bits.join(' · ');
  if (t.missable) meta.classList.add('is-missable');
  nameCell.append(name, desc, meta);

  const gradeCell = document.createElement('td');
  gradeCell.className = 'col-grade';
  const badge = document.createElement('span');
  badge.className = `badge badge-${t.grade}`;
  badge.textContent = GRADE_LABEL[t.grade];
  gradeCell.append(badge);

  tr.append(tickCell, nameCell, gradeCell);
  tr.addEventListener('click', () => select(t.id));
  return tr;
}

function renderList() {
  const visible = state.trophies.filter(matches);
  ui.rows.replaceChildren();
  if (!visible.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 3;
    td.className = 'empty-cell';
    td.textContent = 'No trophy matches these filters. Clear them to see the full list.';
    tr.append(td);
    ui.rows.append(tr);
  } else {
    for (const t of visible) ui.rows.append(buildRow(t));
  }
  ui.visible.textContent = `${visible.length} of ${state.trophies.length} shown`;
  if (!state.selectedId && visible.length) state.selectedId = visible[0].id;
  renderDetail();
}

/* ---------- detail pane ---------- */

function sourceItem(text) {
  const li = document.createElement('li');
  li.textContent = text;
  return li;
}

function renderDetail() {
  const t = byId(state.selectedId);
  ui.detail.replaceChildren();
  if (!t) {
    const p = document.createElement('p');
    p.className = 'detail-empty';
    p.textContent = 'Pick a trophy to read its guide.';
    ui.detail.append(p);
    return;
  }

  const head = document.createElement('div');
  head.className = 'detail-head';
  const badge = document.createElement('span');
  badge.className = `badge badge-${t.grade}`;
  badge.textContent = GRADE_LABEL[t.grade];
  const kind = document.createElement('span');
  kind.className = 'pill';
  kind.textContent = KIND_LABEL[t.kind] || t.kind;
  const stage = document.createElement('span');
  stage.className = 'pill';
  stage.textContent = stageName(t.stage);
  head.append(badge, kind, stage);
  if (t.missable) {
    const flag = document.createElement('span');
    flag.className = 'pill pill-missable';
    flag.textContent = 'Missable';
    head.append(flag);
  }

  const title = document.createElement('h2');
  title.className = 'detail-title';
  title.textContent = shownName(t);

  const official = document.createElement('p');
  official.className = 'detail-desc';
  official.textContent = `“${shownDescription(t)}”`;

  ui.detail.append(head, title, official);

  if (conceal(t)) {
    const note = document.createElement('p');
    note.className = 'spoiler-note';
    note.textContent = 'Spoiler protection is on. Tick this trophy as earned, or switch spoilers off, to read its guide.';
    ui.detail.append(note);
    return;
  }

  const guide = document.createElement('div');
  guide.className = 'detail-guide';
  for (const para of String(t.guide).split(/\n{2,}/)) {
    const p = document.createElement('p');
    p.textContent = para;
    guide.append(p);
  }
  ui.detail.append(guide);

  if (Array.isArray(t.steps) && t.steps.length) {
    const h = document.createElement('h3');
    h.className = 'detail-sub';
    h.textContent = 'In practice';
    const ol = document.createElement('ol');
    ol.className = 'steps';
    for (const step of t.steps) {
      const li = document.createElement('li');
      li.textContent = step;
      ol.append(li);
    }
    ui.detail.append(h, ol);
  }

  if (Array.isArray(t.sources) && t.sources.length) {
    const h = document.createElement('h3');
    h.className = 'detail-sub';
    h.textContent = 'Sources';
    const ul = document.createElement('ul');
    ul.className = 'sources';
    for (const source of t.sources) ul.append(sourceItem(source));
    ui.detail.append(h, ul);
  }

  const foot = document.createElement('div');
  foot.className = 'detail-foot';
  const earn = document.createElement('button');
  earn.type = 'button';
  earn.className = state.earned.has(t.id) ? 'ghost' : 'primary';
  earn.textContent = state.earned.has(t.id) ? 'Unmark earned' : 'Mark earned';
  earn.addEventListener('click', () => toggleEarned(t.id, !state.earned.has(t.id)));
  const basis = document.createElement('span');
  basis.className = 'basis';
  basis.textContent = t.basis === 'stated' ? 'Requirement stated in the official description' : 'Method is a reading of the description';
  foot.append(earn, basis);
  ui.detail.append(foot);
}

function select(id) {
  state.selectedId = id;
  for (const row of ui.rows.querySelectorAll('.trophy-row')) {
    row.classList.toggle('is-selected', Number(row.dataset.id) === id);
  }
  renderDetail();
}

/* ---------- roadmap ---------- */

function renderRoadmap() {
  ui.stageGrid.replaceChildren();
  for (const stage of state.stages) {
    const rows = state.trophies.filter((t) => t.stage === stage.id);
    const got = rows.filter((t) => state.earned.has(t.id)).length;
    const card = document.createElement('article');
    card.className = 'stage-card';

    const num = document.createElement('p');
    num.className = 'stage-num';
    num.textContent = `Stage ${stage.id}`;
    const h = document.createElement('h3');
    h.className = 'stage-title';
    h.textContent = stage.name;
    const note = document.createElement('p');
    note.className = 'stage-note';
    note.textContent = stage.note;
    const bar = document.createElement('p');
    bar.className = 'stage-progress';
    bar.textContent = `${got} of ${rows.length} earned`;
    const list = document.createElement('ul');
    list.className = 'stage-rows';
    for (const t of rows) {
      const li = document.createElement('li');
      li.className = 'stage-row';
      if (state.earned.has(t.id)) li.classList.add('is-earned');
      const dot = document.createElement('span');
      dot.className = `badge-dot badge-${t.grade}`;
      const name = document.createElement('span');
      name.textContent = shownName(t);
      li.append(dot, name);
      if (t.missable) {
        const flag = document.createElement('span');
        flag.className = 'mini-flag';
        flag.textContent = 'missable';
        li.append(flag);
      }
      list.append(li);
    }
    card.append(num, h, note, bar, list);
    ui.stageGrid.append(card);
  }

  const missable = state.trophies.filter((t) => t.missable);
  ui.missableCount.textContent = `${missable.length} of 55 can be closed by story progress or a one-off moment`;
  ui.missableList.replaceChildren();
  for (const t of missable) {
    const li = document.createElement('li');
    li.className = 'missable-row';
    if (state.earned.has(t.id)) li.classList.add('is-earned');
    const badge = document.createElement('span');
    badge.className = `badge badge-${t.grade}`;
    badge.textContent = GRADE_LABEL[t.grade];
    const text = document.createElement('div');
    const name = document.createElement('span');
    name.className = 'missable-name';
    name.textContent = shownName(t);
    const desc = document.createElement('span');
    desc.className = 'missable-desc';
    desc.textContent = shownDescription(t);
    text.append(name, desc);
    li.append(badge, text);
    li.addEventListener('click', () => {
      state.kind = 'all';
      state.grade = 'all';
      state.query = '';
      ui.search.value = '';
      ui.grade.value = 'all';
      renderChips();
      switchView('checklist');
      select(t.id);
      ui.detail.scrollIntoView({ block: 'nearest' });
    });
    ui.missableList.append(li);
  }
}

/* ---------- chips ---------- */

function renderChips() {
  const options = [
    { id: 'all', label: 'All 55' },
    { id: 'story', label: 'Story' },
    { id: 'missable', label: 'Missable' },
    { id: 'collectibles', label: 'Collectibles' },
    { id: 'activities', label: 'Activities' },
    { id: 'other', label: 'Other' },
  ];
  ui.kindChips.replaceChildren();
  for (const option of options) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip';
    button.dataset.kind = option.id;
    let count = state.trophies.length;
    if (option.id === 'missable') count = state.trophies.filter((t) => t.missable).length;
    else if (option.id !== 'all') count = state.trophies.filter((t) => t.kind === option.id).length;
    button.textContent = `${option.label} ${count}`;
    button.setAttribute('aria-pressed', String(state.kind === option.id));
    if (state.kind === option.id) button.classList.add('is-on');
    button.addEventListener('click', () => {
      state.kind = option.id;
      renderChips();
      renderList();
    });
    ui.kindChips.append(button);
  }
}

/* ---------- views ---------- */

function switchView(view) {
  state.view = view;
  for (const tab of document.querySelectorAll('.tab')) {
    const on = tab.dataset.view === view;
    tab.classList.toggle('is-active', on);
    tab.setAttribute('aria-pressed', String(on));
  }
  for (const name of ['checklist', 'roadmap', 'save']) {
    el(`view-${name}`).hidden = name !== view;
  }
  if (view === 'roadmap') renderRoadmap();
  if (view === 'save') renderShare();
  if (view === 'checklist') select(state.selectedId);
}

/* ---------- save view ---------- */

function shareUrl() {
  const params = new URLSearchParams();
  const ids = [...state.earned].sort((a, b) => a - b).map((n) => n.toString(36)).join(',');
  if (ids) params.set('p', ids);
  if (state.view !== 'checklist') params.set('v', state.view);
  if (state.kind !== 'all') params.set('k', state.kind);
  if (state.spoilersHidden) params.set('s', '1');
  if (state.selectedId) params.set('t', String(state.selectedId));
  const query = params.toString();
  const base = `${location.origin}${location.pathname}`;
  return query ? `${base}#${query}` : base;
}

function renderShare() {
  ui.shareLink.value = shareUrl();
  const { count, total } = progress();
  ui.shareNote.textContent = count
    ? `The link carries ${count} of ${total} trophy ids and nothing else.`
    : 'Earn something and the link updates.';
}

/* ---------- mutations ---------- */

function toggleEarned(id, earned) {
  if (earned) state.earned.add(id);
  else state.earned.delete(id);
  writeStore();
  renderProgress();
  renderList();
  if (state.view === 'roadmap') renderRoadmap();
  if (state.view === 'save') renderShare();
  const t = byId(id);
  if (t) toast(earned ? `${t.name} marked earned` : `${t.name} unmarked`);
}

function setSpoilers(hidden) {
  state.spoilersHidden = hidden;
  ui.spoiler.checked = hidden;
  ui.spoilerText.textContent = hidden ? 'Story names hidden' : 'Story names shown';
  renderList();
  if (state.view === 'roadmap') renderRoadmap();
}

function resetTicks() {
  state.earned.clear();
  writeStore();
  renderProgress();
  renderList();
  if (state.view === 'roadmap') renderRoadmap();
  if (state.view === 'save') renderShare();
  toast('All ticks cleared.');
}

/* ---------- export and import ---------- */

function exportProgress() {
  const payload = {
    app: 'leonida-ledger',
    version: 1,
    exported: new Date().toISOString(),
    earned: [...state.earned].sort((a, b) => a - b),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leonida-ledger-progress.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  ui.saveStatus.textContent = `Exported ${payload.earned.length} ticks.`;
}

async function importProgress(file) {
  try {
    const parsed = JSON.parse(await file.text());
    const list = Array.isArray(parsed) ? parsed : parsed && Array.isArray(parsed.earned) ? parsed.earned : null;
    if (!list) throw new Error('no earned list');
    const known = new Set(state.trophies.map((t) => t.id));
    const incoming = list.filter((n) => Number.isInteger(n) && known.has(n));
    state.earned = new Set(incoming);
    writeStore();
    renderProgress();
    renderList();
    if (state.view === 'roadmap') renderRoadmap();
    if (state.view === 'save') renderShare();
    ui.saveStatus.textContent = `Imported ${incoming.length} ticks.`;
    toast(`Imported ${incoming.length} ticks.`);
  } catch {
    ui.saveStatus.textContent = 'That file is not a progress export.';
    toast('That file is not a progress export.');
  }
}

/* ---------- wiring ---------- */

ui.search.addEventListener('input', () => {
  state.query = ui.search.value.trim().toLowerCase();
  renderList();
});
ui.grade.addEventListener('change', () => {
  state.grade = ui.grade.value;
  renderList();
});
ui.spoiler.addEventListener('change', () => setSpoilers(ui.spoiler.checked));
ui.clear.addEventListener('click', () => {
  state.kind = 'all';
  state.grade = 'all';
  state.query = '';
  ui.search.value = '';
  ui.grade.value = 'all';
  renderChips();
  renderList();
});
ui.exportButton.addEventListener('click', exportProgress);
ui.importButton.addEventListener('click', () => ui.importFile.click());
ui.importFile.addEventListener('change', () => {
  const file = ui.importFile.files && ui.importFile.files[0];
  if (file) importProgress(file);
  ui.importFile.value = '';
});
ui.resetButton.addEventListener('click', resetTicks);

for (const tab of document.querySelectorAll('.tab')) {
  tab.addEventListener('click', () => switchView(tab.dataset.view));
}

/* ---------- boot ---------- */

async function boot() {
  const stored = readStore();
  const link = readHash();
  state.earned = link.ids ?? stored;
  if (link.ids) writeStore();

  try {
    const response = await fetch(DATA_PATH, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const doc = await response.json();
    const list = Array.isArray(doc) ? doc : doc.trophies;
    if (!Array.isArray(list)) throw new Error('no trophy array');
    state.doc = doc;
    state.trophies = list.slice().sort((a, b) => a.id - b.id);
    state.stages = Array.isArray(doc.stages) ? doc.stages : [];
    state.selectedId = state.trophies.length ? state.trophies[0].id : null;
  } catch {
    ui.rows.innerHTML = '<tr><td colspan="3" class="empty-cell">The trophy data did not load. Serve this folder over HTTP (node serve.ts) rather than opening the file directly.</td></tr>';
    ui.visible.textContent = 'No data';
    return;
  }

  if (link.kind) {
    state.kind = link.kind;
    ui.grade.value = state.grade;
  }
  if (link.trophy && byId(link.trophy)) state.selectedId = link.trophy;

  renderChips();
  renderProgress();
  renderList();
  setSpoilers(link.spoilers);
  switchView(link.view ?? 'checklist');
}

boot();
