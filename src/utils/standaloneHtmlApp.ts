import type { WorkspaceData } from '../types/productivity';

/**
 * Builds a complete, 100% self-contained, interactive single-file HTML version of AnchorDesk.
 * Users can double-click the downloaded .html file in any browser offline (zero build tools or server required).
 * Includes all 6 tabs (Today, Plan Tomorrow, Focus, Phone, Review, Dashboard), Light/Dark mode,
 * localStorage persistence, explicit Save button (saving to browser storage + saving an updated .html file),
 * and JSON export/import.
 */
export function buildStandaloneAppHtml(data: WorkspaceData): string {
  const safeJson = JSON.stringify(data).replace(/<\/script>/gi, '<\\/script>');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AnchorDesk — Offline Productivity &amp; Progress Tracker</title>
  <style>
    :root {
      --bg: #f8fafc;
      --surface: #ffffff;
      --surface-muted: #f1f5f9;
      --border: #e2e8f0;
      --text: #0f172a;
      --text-muted: #64748b;
      --accent: #2563eb;
      --accent-hover: #1d4ed8;
      --accent-text: #ffffff;
      --good: #15803d;
      --good-bg: #f0fdf4;
      --warn: #b45309;
      --warn-bg: #fffbeb;
      --danger: #b91c1c;
      --danger-bg: #fef2f2;
    }
    html.dark {
      --bg: #020617;
      --surface: #0f172a;
      --surface-muted: #1e293b;
      --border: #1e293b;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --accent: #3b82f6;
      --accent-hover: #2563eb;
      --accent-text: #ffffff;
      --good: #4ade80;
      --good-bg: rgba(20, 83, 45, 0.35);
      --warn: #fbbf24;
      --warn-bg: rgba(120, 53, 15, 0.35);
      --danger: #f87171;
      --danger-bg: rgba(127, 29, 29, 0.35);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    .tabular { font-variant-numeric: tabular-nums; }
    header {
      position: sticky;
      top: 0;
      z-index: 20;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
    }
    .header-inner {
      max-width: 980px;
      margin: 0 auto;
      padding: 0.65rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .brand { font-weight: 700; font-size: 1rem; white-space: nowrap; }
    .nav-desktop { display: none; gap: 0.25rem; }
    @media (min-width: 768px) {
      .nav-desktop { display: flex; }
      .nav-mobile { display: none !important; }
    }
    .nav-mobile {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      padding: 0.5rem 0.75rem;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.375rem;
    }
    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 0.45rem 0.7rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
    }
    .tab-btn:hover { color: var(--text); background: var(--surface-muted); }
    .tab-btn.active { background: var(--surface-muted); color: var(--text); font-weight: 600; }
    .nav-mobile .tab-btn { background: var(--surface-muted); min-height: 40px; font-size: 0.78rem; }
    .nav-mobile .tab-btn.active { background: var(--accent); color: var(--accent-text); }
    .header-actions { display: flex; align-items: center; gap: 0.5rem; }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      padding: 0.5rem 0.85rem;
      border-radius: 8px;
      font-size: 0.84rem;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text);
      white-space: nowrap;
    }
    .btn:hover { background: var(--surface-muted); }
    .btn-primary { background: var(--accent); color: var(--accent-text); border-color: var(--accent); }
    .btn-primary:hover { background: var(--accent-hover); }
    .btn-good { background: #16a34a; color: #fff; border-color: #16a34a; }
    .btn-danger { background: var(--danger-bg); color: var(--danger); border-color: transparent; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    main { max-width: 980px; margin: 0 auto; padding: 1.25rem 1rem 3rem; }
    .stack { display: flex; flex-direction: column; gap: 1.25rem; }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem;
    }
    .card-muted { background: var(--surface-muted); }
    .grid-2 { display: grid; grid-template-columns: 1fr; gap: 1.25rem; }
    .grid-3 { display: grid; grid-template-columns: 1fr; gap: 1rem; }
    @media (min-width: 768px) {
      .grid-2 { grid-template-columns: 1fr 1fr; }
      .grid-3 { grid-template-columns: repeat(3, 1fr); }
    }
    h1 { font-size: 1.25rem; margin: 0.25rem 0 0; }
    h2 { font-size: 1rem; margin: 0; }
    .muted { color: var(--text-muted); font-size: 0.84rem; }
    .row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
    .divider-list > * { padding: 0.85rem 0; border-bottom: 1px solid var(--border); }
    .divider-list > *:last-child { border-bottom: none; padding-bottom: 0; }
    .progress-track { height: 8px; border-radius: 999px; background: var(--surface-muted); overflow: hidden; margin-top: 0.75rem; }
    .progress-fill { height: 100%; background: var(--accent); transition: width 0.2s; }
    input[type="text"], input[type="number"], select, textarea {
      width: 100%;
      padding: 0.55rem 0.75rem;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text);
      font-size: 0.9rem;
      font-family: inherit;
    }
    label.field-label { display: block; font-size: 0.78rem; font-weight: 500; color: var(--text-muted); margin-bottom: 0.35rem; }
    .field-group { margin-bottom: 0.85rem; }
    .error-msg { color: var(--danger); font-size: 0.8rem; margin-top: 0.3rem; }
    .status-good { color: var(--good); background: var(--good-bg); padding: 0.75rem 1rem; border-radius: 10px; font-size: 0.88rem; }
    .status-warn { color: var(--warn); background: var(--warn-bg); padding: 0.85rem 1rem; border-radius: 10px; font-size: 0.88rem; }
    .timer-display { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 3.25rem; font-weight: 700; text-align: center; margin: 0.75rem 0; }
    .strike { text-decoration: line-through; color: var(--text-muted); }
    .chart-bars { display: grid; grid-template-columns: repeat(7, 1fr); align-items: end; gap: 0.5rem; height: 145px; padding-top: 1rem; }
    .chart-col { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; gap: 0.3rem; }
    .bar-wrap { flex: 1; width: 100%; display: flex; align-items: flex-end; justify-content: center; }
    .bar { width: 100%; max-width: 28px; border-radius: 4px 4px 0 0; background: var(--accent); }
    .bar-green { background: #16a34a; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55); display: flex; align-items: center; justify-content: center; padding: 1rem; z-index: 50; }
    .modal { width: 100%; max-width: 480px; background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 1.25rem; }
    .hidden { display: none !important; }
    .save-pill { font-size: 0.76rem; color: var(--good); }
  </style>
</head>
<body>
  <header>
    <div class="header-inner">
      <div class="brand">AnchorDesk</div>
      <nav class="nav-desktop" id="nav-desktop"></nav>
      <div class="header-actions">
        <button type="button" class="btn btn-primary" id="open-save-btn">Save</button>
        <button type="button" class="btn" id="theme-btn">Dark</button>
      </div>
    </div>
  </header>
  <nav class="nav-mobile" id="nav-mobile"></nav>
  <main id="app-main"></main>

  <!-- Save & File Persistence Modal -->
  <div id="save-modal" class="modal-backdrop hidden" role="dialog" aria-modal="true" aria-labelledby="save-modal-title">
    <div class="modal stack">
      <div class="row">
        <h2 id="save-modal-title">Save &amp; Keep Your Progress</h2>
        <button type="button" class="btn" id="close-save-btn">Close</button>
      </div>
      <p class="muted" style="margin:0;">
        Your changes auto-save in this browser. If closing the tab clears browser storage on your device, save a copy directly to your computer before closing.
      </p>
      <div id="save-status-box" class="status-good"></div>
      <div class="stack" style="gap:0.6rem;">
        <button type="button" class="btn btn-primary" id="save-browser-btn">Save Now in Browser</button>
        <button type="button" class="btn btn-good" id="save-html-copy-btn">Save Updated App File (AnchorDesk.html)</button>
        <button type="button" class="btn" id="export-json-btn">Export Data Backup (.json)</button>
        <label class="btn" style="justify-content:center;">
          Load Data Backup (.json)
          <input type="file" id="import-json-input" accept=".json,application/json" style="display:none;" />
        </label>
      </div>
    </div>
  </div>

  <script id="anchordesk-embedded-data" type="application/json">${safeJson}</script>
  <script>
    (function() {
      var STORAGE_KEY = 'anchordesk_standalone_v2';
      var TABS = [
        { id: 'today', label: 'Today' },
        { id: 'plan', label: 'Plan Tomorrow' },
        { id: 'focus', label: 'Focus' },
        { id: 'phone', label: 'Phone' },
        { id: 'review', label: 'Review' },
        { id: 'dashboard', label: 'Dashboard' }
      ];

      function toDateKey(dt) {
        return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
      }
      function addDays(dk, n) {
        var p = dk.split('-').map(Number);
        var d = new Date(p[0], (p[1] || 1) - 1, p[2] || 1);
        d.setDate(d.getDate() + n);
        return toDateKey(d);
      }
      function fmtHm(mins) {
        var m = Math.max(0, Math.round(mins || 0));
        var h = Math.floor(m / 60), r = m % 60;
        if (h === 0) return r + 'm';
        if (r === 0) return h + 'h';
        return h + 'h ' + r + 'm';
      }
      function fmtClock(sec) {
        var s = Math.max(0, Math.floor(sec));
        return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
      }
      function esc(str) {
        return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      }

      var embeddedRaw = document.getElementById('anchordesk-embedded-data').textContent;
      var embeddedData = JSON.parse(embeddedRaw);
      var state = embeddedData;
      var storageWorking = true;
      try {
        var saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          var parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed.mustDos)) state = parsed;
        }
      } catch (e) {
        storageWorking = false;
      }

      var activeTab = 'today';
      var reviewMode = 'daily';
      var focusTaskId = null;
      var focusPreset = '45/10';
      var focusMins = 45;
      var breakMins = 10;
      var phase = 'focus';
      var secondsLeft = 45 * 60;
      var timerRunning = false;
      var timerHandle = null;
      var phoneOutChecked = false;
      var notifOffChecked = false;
      var lastSavedMsg = '';

      function persist() {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
          storageWorking = true;
          lastSavedMsg = 'Saved at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
          storageWorking = false;
        }
      }

      function applyTheme() {
        if (state.theme === 'dark') {
          document.documentElement.classList.add('dark');
          document.getElementById('theme-btn').textContent = 'Light';
        } else {
          document.documentElement.classList.remove('dark');
          document.getElementById('theme-btn').textContent = 'Dark';
        }
      }

      function renderNav() {
        var dNav = document.getElementById('nav-desktop');
        var mNav = document.getElementById('nav-mobile');
        dNav.innerHTML = '';
        mNav.innerHTML = '';
        TABS.forEach(function(t) {
          [dNav, mNav].forEach(function(container) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'tab-btn' + (activeTab === t.id ? ' active' : '');
            b.textContent = t.label;
            b.onclick = function() { activeTab = t.id; render(); };
            container.appendChild(b);
          });
        });
      }

      function streakCount(todayKey, pred) {
        var cursor = pred(todayKey) ? todayKey : addDays(todayKey, -1);
        var count = 0;
        for (var i = 0; i < 60; i++) {
          if (!pred(cursor)) break;
          count++;
          cursor = addDays(cursor, -1);
        }
        return count;
      }

      function render() {
        applyTheme();
        renderNav();
        var todayKey = toDateKey(new Date());
        var tomorrowKey = addDays(todayKey, 1);
        var main = document.getElementById('app-main');

        if (activeTab === 'today') {
          var mustDos = state.mustDos.filter(function(t) { return t.dateKey === todayKey; });
          var doneCount = mustDos.filter(function(t) { return t.completed; }).length;
          var rate = mustDos.length ? Math.round((doneCount / mustDos.length) * 100) : 0;
          var smalls = state.smallTasks.filter(function(s) { return s.dateKey === todayKey; });

          main.innerHTML =
            '<div class="stack">' +
              '<section class="card">' +
                '<div class="row"><div><div class="muted">' + esc(todayKey) + '</div><h1>Hard thing first. Phone away.</h1></div>' +
                '<div style="text-align:right;"><strong class="tabular" style="font-size:1.1rem;color:var(--accent);">' + (mustDos.length ? doneCount + '/' + mustDos.length + ' must-dos done' : 'No must-dos yet') + '</strong><div class="muted tabular">' + rate + '% complete</div></div></div>' +
                '<div class="progress-track"><div class="progress-fill" style="width:' + rate + '%"></div></div>' +
              '</section>' +
              '<section class="card">' +
                '<div class="row" style="margin-bottom:0.5rem;"><h2>Today\\'s Must-Dos</h2><button type="button" class="btn" id="go-plan-btn">Plan Tomorrow</button></div>' +
                (mustDos.length === 0 ? '<p class="muted">No must-dos set for today yet. Add 1–3 in Plan Tomorrow.</p>' :
                  '<div class="divider-list">' + mustDos.map(function(t) {
                    return '<div class="row">' +
                      '<label style="display:flex;align-items:flex-start;gap:0.75rem;cursor:pointer;flex:1;">' +
                        '<input type="checkbox" data-toggle-md="' + esc(t.id) + '" ' + (t.completed ? 'checked' : '') + ' style="width:18px;height:18px;margin-top:2px;" />' +
                        '<div><div class="' + (t.completed ? 'strike' : '') + '" style="font-weight:500;">' + esc(t.description) + '</div>' +
                        '<div class="muted tabular">' + esc(t.category) + ' · ' + t.estimatedMinutes + 'm · ' + esc(t.timeSlot) + '</div></div>' +
                      '</label>' +
                      '<div style="display:flex;gap:0.4rem;">' +
                        (!t.completed ? '<button type="button" class="btn" data-focus-id="' + esc(t.id) + '">Focus</button>' : '') +
                        '<button type="button" class="btn btn-danger" data-del-md="' + esc(t.id) + '">Delete</button>' +
                      '</div></div>';
                  }).join('') + '</div>') +
              '</section>' +
              '<section class="card card-muted">' +
                '<div class="row"><h2>Small Tasks Batch</h2><span class="muted tabular">' + smalls.filter(function(s){return s.completed;}).length + '/' + smalls.length + '</span></div>' +
                '<div class="divider-list">' + smalls.map(function(s) {
                  return '<div class="row">' +
                    '<label style="display:flex;align-items:center;gap:0.65rem;cursor:pointer;flex:1;">' +
                      '<input type="checkbox" data-toggle-st="' + esc(s.id) + '" ' + (s.completed ? 'checked' : '') + ' />' +
                      '<span class="' + (s.completed ? 'strike' : '') + '">' + esc(s.title) + '</span>' +
                    '</label>' +
                    '<button type="button" class="btn btn-danger" data-del-st="' + esc(s.id) + '">Delete</button>' +
                  '</div>';
                }).join('') + '</div>' +
                '<form id="today-small-form" style="display:flex;gap:0.5rem;margin-top:0.75rem;">' +
                  '<input type="text" id="today-small-input" placeholder="Quick add small task..." />' +
                  '<button type="submit" class="btn">Add</button>' +
                '</form>' +
              '</section>' +
            '</div>';

          document.getElementById('go-plan-btn').onclick = function() { activeTab = 'plan'; render(); };
          main.querySelectorAll('[data-toggle-md]').forEach(function(el) {
            el.onchange = function() {
              var id = el.getAttribute('data-toggle-md');
              state.mustDos = state.mustDos.map(function(t) { return t.id === id ? Object.assign({}, t, { completed: !t.completed }) : t; });
              persist(); render();
            };
          });
          main.querySelectorAll('[data-del-md]').forEach(function(el) {
            el.onclick = function() {
              var id = el.getAttribute('data-del-md');
              state.mustDos = state.mustDos.filter(function(t) { return t.id !== id; });
              persist(); render();
            };
          });
          main.querySelectorAll('[data-focus-id]').forEach(function(el) {
            el.onclick = function() {
              focusTaskId = el.getAttribute('data-focus-id');
              activeTab = 'focus';
              render();
            };
          });
          main.querySelectorAll('[data-toggle-st]').forEach(function(el) {
            el.onchange = function() {
              var id = el.getAttribute('data-toggle-st');
              state.smallTasks = state.smallTasks.map(function(s) { return s.id === id ? Object.assign({}, s, { completed: !s.completed }) : s; });
              persist(); render();
            };
          });
          main.querySelectorAll('[data-del-st]').forEach(function(el) {
            el.onclick = function() {
              var id = el.getAttribute('data-del-st');
              state.smallTasks = state.smallTasks.filter(function(s) { return s.id !== id; });
              persist(); render();
            };
          });
          document.getElementById('today-small-form').onsubmit = function(e) {
            e.preventDefault();
            var val = document.getElementById('today-small-input').value.trim();
            if (val.length < 2) return;
            state.smallTasks.push({ id: 'st-' + Date.now(), dateKey: todayKey, title: val, completed: false, createdAt: new Date().toISOString() });
            persist(); render();
          };
        } else if (activeTab === 'plan') {
          var tmList = state.mustDos.filter(function(t) { return t.dateKey === tomorrowKey; });
          var tmSmalls = state.smallTasks.filter(function(s) { return s.dateKey === tomorrowKey; });
          var atLimit = tmList.length >= 3;

          main.innerHTML =
            '<div class="stack">' +
              '<section class="card"><div class="row"><div><div class="muted">Nightly Planning · ' + esc(tomorrowKey) + '</div><h1>Choose 1–3 Must-Do Tasks</h1></div>' +
              '<strong class="tabular">' + tmList.length + '/3 must-dos</strong></div></section>' +
              '<div class="grid-2">' +
                '<section class="card">' +
                  '<h2>Add Must-Do</h2><p class="muted" style="margin-top:0.25rem;">Be specific: \\'Solve 15 problems from ch. 4\\', not \\'study chemistry\\'</p>' +
                  (atLimit ? '<div class="status-warn">Hard limit of 3 must-dos reached. Remove one below or add to Small Tasks.</div>' :
                    '<form id="tm-form">' +
                      '<div class="field-group"><label class="field-label" for="tm-desc">Concrete description</label><input type="text" id="tm-desc" placeholder="e.g., Solve 15 problems from ch. 4" /></div>' +
                      '<div class="grid-3">' +
                        '<div class="field-group"><label class="field-label" for="tm-cat">Category</label><select id="tm-cat"><option value="study">Study</option><option value="health">Health</option><option value="project">Project</option><option value="personal">Personal</option></select></div>' +
                        '<div class="field-group"><label class="field-label" for="tm-est">Est. min</label><input type="number" id="tm-est" value="45" min="5" max="360" /></div>' +
                        '<div class="field-group"><label class="field-label" for="tm-slot">Time slot</label><input type="text" id="tm-slot" value="09:00 – 09:45" /></div>' +
                      '</div>' +
                      '<label style="display:flex;gap:0.5rem;align-items:flex-start;margin-bottom:0.75rem;font-size:0.88rem;"><input type="checkbox" id="tm-glad" /><span>If I only did this one thing tomorrow, would I be glad?</span></label>' +
                      '<div id="tm-err" class="error-msg"></div>' +
                      '<button type="submit" class="btn btn-primary" style="margin-top:0.5rem;">Confirm Must-Do (' + tmList.length + '/3)</button>' +
                    '</form>') +
                  '<div class="divider-list" style="margin-top:1rem;">' + tmList.map(function(t) {
                    return '<div class="row"><div><div style="font-weight:500;">' + esc(t.description) + '</div><div class="muted">' + esc(t.category) + ' · ' + t.estimatedMinutes + 'm · ' + esc(t.timeSlot) + '</div></div>' +
                    '<div style="display:flex;gap:0.35rem;"><button type="button" class="btn" data-move-today="' + esc(t.id) + '">Today</button><button type="button" class="btn btn-danger" data-del-tm="' + esc(t.id) + '">Remove</button></div></div>';
                  }).join('') + '</div>' +
                '</section>' +
                '<section class="card card-muted">' +
                  '<h2>Tomorrow\\'s Small Tasks Batch</h2><p class="muted">Keep emails, errands, and admin separate from must-dos.</p>' +
                  '<div class="divider-list">' + tmSmalls.map(function(s) {
                    return '<div class="row"><span>' + esc(s.title) + '</span><button type="button" class="btn btn-danger" data-del-tms="' + esc(s.id) + '">Remove</button></div>';
                  }).join('') + '</div>' +
                  '<form id="tms-form" style="display:flex;gap:0.5rem;margin-top:0.75rem;"><input type="text" id="tms-input" placeholder="Add errand or email..." /><button type="submit" class="btn">Add</button></form>' +
                '</section>' +
              '</div>' +
            '</div>';

          var tmForm = document.getElementById('tm-form');
          if (tmForm) {
            tmForm.onsubmit = function(e) {
              e.preventDefault();
              var desc = document.getElementById('tm-desc').value.trim();
              var cat = document.getElementById('tm-cat').value;
              var est = Number(document.getElementById('tm-est').value);
              var slot = document.getElementById('tm-slot').value.trim();
              var glad = document.getElementById('tm-glad').checked;
              var err = document.getElementById('tm-err');
              if (desc.length < 5) { err.textContent = 'Enter a concrete description (at least 5 chars).'; return; }
              if (!glad) { err.textContent = 'Confirm: "If I only did this one thing tomorrow, would I be glad?"'; return; }
              state.mustDos.push({ id: 'md-' + Date.now(), dateKey: tomorrowKey, description: desc, category: cat, estimatedMinutes: est || 45, timeSlot: slot || '09:00', confirmedGladIfOnlyThis: true, completed: false, createdAt: new Date().toISOString() });
              if (state.plannedNightBeforeDates.indexOf(todayKey) === -1) state.plannedNightBeforeDates.push(todayKey);
              persist(); render();
            };
          }
          main.querySelectorAll('[data-move-today]').forEach(function(el) {
            el.onclick = function() {
              var id = el.getAttribute('data-move-today');
              state.mustDos = state.mustDos.map(function(t) { return t.id === id ? Object.assign({}, t, { dateKey: todayKey }) : t; });
              persist(); render();
            };
          });
          main.querySelectorAll('[data-del-tm]').forEach(function(el) {
            el.onclick = function() {
              var id = el.getAttribute('data-del-tm');
              state.mustDos = state.mustDos.filter(function(t) { return t.id !== id; });
              persist(); render();
            };
          });
          main.querySelectorAll('[data-del-tms]').forEach(function(el) {
            el.onclick = function() {
              var id = el.getAttribute('data-del-tms');
              state.smallTasks = state.smallTasks.filter(function(s) { return s.id !== id; });
              persist(); render();
            };
          });
          document.getElementById('tms-form').onsubmit = function(e) {
            e.preventDefault();
            var val = document.getElementById('tms-input').value.trim();
            if (val.length < 2) return;
            state.smallTasks.push({ id: 'st-' + Date.now(), dateKey: tomorrowKey, title: val, completed: false, createdAt: new Date().toISOString() });
            persist(); render();
          };
        } else if (activeTab === 'focus') {
          var linkTasks = state.mustDos.filter(function(t){return t.dateKey===todayKey;}).map(function(t){return {id:t.id, label:t.description};})
            .concat(state.smallTasks.filter(function(s){return s.dateKey===todayKey;}).map(function(s){return {id:s.id, label:s.title};}));
          if (!linkTasks.length) linkTasks = [{ id: 'general', label: 'Deep study block' }];
          var activeT = linkTasks.find(function(t){return t.id === focusTaskId;}) || linkTasks[0];
          var todaySess = state.focusSessions.filter(function(s){return s.dateKey === todayKey;});
          var todayFocusSum = todaySess.reduce(function(acc, s){return acc + s.focusMinutes;}, 0);

          main.innerHTML =
            '<div class="grid-2">' +
              '<section class="card stack">' +
                '<div class="row"><h2>Focus Timer</h2>' +
                  '<div style="display:flex;gap:0.25rem;">' +
                    ['25/5','45/10','60/10','custom'].map(function(p){
                      return '<button type="button" class="btn ' + (focusPreset===p ? 'btn-primary':'') + '" data-preset="' + p + '">' + p + '</button>';
                    }).join('') +
                  '</div></div>' +
                (focusPreset === 'custom' ? '<div class="grid-2"><div><label class="field-label">Focus min</label><input type="number" id="c-f" value="' + focusMins + '" min="5" max="180" /></div><div><label class="field-label">Break min</label><input type="number" id="c-b" value="' + breakMins + '" min="1" max="60" /></div></div>' : '') +
                '<div><label class="field-label" for="f-task">Linked task</label><select id="f-task">' + linkTasks.map(function(t){
                  return '<option value="' + esc(t.id) + '"' + (t.id===activeT.id?' selected':'') + '>' + esc(t.label) + '</option>';
                }).join('') + '</select></div>' +
                '<div class="card card-muted" style="text-align:center;">' +
                  '<div class="muted">' + (phase === 'focus' ? 'Focus Phase' : 'Break Phase') + '</div>' +
                  '<div class="timer-display tabular" id="timer-readout">' + fmtClock(secondsLeft) + '</div>' +
                '</div>' +
                '<div>' +
                  '<label style="display:flex;gap:0.5rem;align-items:center;margin-bottom:0.4rem;"><input type="checkbox" id="chk-reach" ' + (phoneOutChecked?'checked':'') + ' /> Phone out of reach?</label>' +
                  '<label style="display:flex;gap:0.5rem;align-items:center;"><input type="checkbox" id="chk-notif" ' + (notifOffChecked?'checked':'') + ' /> Notifications off?</label>' +
                '</div>' +
                '<div class="row">' +
                  '<div style="display:flex;gap:0.5rem;">' +
                    '<button type="button" class="btn btn-primary" id="start-timer-btn" ' + (phase==='focus' && !(phoneOutChecked && notifOffChecked) ? 'disabled' : '') + '>' + (timerRunning ? 'Pause' : 'Start Focus') + '</button>' +
                    '<button type="button" class="btn" id="reset-timer-btn">Reset</button>' +
                  '</div>' +
                  '<button type="button" class="btn btn-good" id="complete-sess-btn">Complete &amp; Log</button>' +
                '</div>' +
              '</section>' +
              '<section class="card stack">' +
                '<div><div class="muted">Total Focus Today</div><div style="font-size:1.75rem;font-weight:700;" class="tabular">' + fmtHm(todayFocusSum) + '</div></div>' +
                '<h2>Completed Sessions Today</h2>' +
                (todaySess.length === 0 ? '<p class="muted">No sessions completed yet today.</p>' :
                  '<div class="divider-list">' + todaySess.map(function(s){
                    return '<div class="row"><span>' + esc(s.taskTitle) + '</span><strong class="tabular">+' + s.focusMinutes + 'm</strong></div>';
                  }).join('') + '</div>') +
              '</section>' +
            '</div>';

          main.querySelectorAll('[data-preset]').forEach(function(btn){
            btn.onclick = function() {
              focusPreset = btn.getAttribute('data-preset');
              timerRunning = false; clearInterval(timerHandle); phase = 'focus';
              if (focusPreset === '25/5') { focusMins = 25; breakMins = 5; }
              else if (focusPreset === '45/10') { focusMins = 45; breakMins = 10; }
              else if (focusPreset === '60/10') { focusMins = 60; breakMins = 10; }
              secondsLeft = focusMins * 60; render();
            };
          });
          var cf = document.getElementById('c-f'), cb = document.getElementById('c-b');
          if (cf && cb) {
            cf.onchange = function(){ focusMins = Math.max(5, Math.min(180, Number(cf.value)||25)); secondsLeft = focusMins * 60; render(); };
            cb.onchange = function(){ breakMins = Math.max(1, Math.min(60, Number(cb.value)||5)); render(); };
          }
          document.getElementById('f-task').onchange = function(e) { focusTaskId = e.target.value; };
          document.getElementById('chk-reach').onchange = function(e) { phoneOutChecked = e.target.checked; render(); };
          document.getElementById('chk-notif').onchange = function(e) { notifOffChecked = e.target.checked; render(); };
          document.getElementById('start-timer-btn').onclick = function() {
            if (timerRunning) { timerRunning = false; clearInterval(timerHandle); render(); }
            else {
              timerRunning = true;
              timerHandle = setInterval(function() {
                if (secondsLeft <= 1) { secondsLeft = 0; timerRunning = false; clearInterval(timerHandle); }
                else { secondsLeft--; }
                var ro = document.getElementById('timer-readout');
                if (ro) ro.textContent = fmtClock(secondsLeft);
              }, 1000);
              render();
            }
          };
          document.getElementById('reset-timer-btn').onclick = function() { timerRunning = false; clearInterval(timerHandle); secondsLeft = focusMins * 60; render(); };
          document.getElementById('complete-sess-btn').onclick = function() {
            timerRunning = false; clearInterval(timerHandle);
            var elapsed = Math.max(1, Math.round((focusMins * 60 - secondsLeft) / 60) || focusMins);
            state.focusSessions.unshift({ id: 'fs-' + Date.now(), dateKey: todayKey, taskId: activeT.id, taskTitle: activeT.label, focusMinutes: elapsed, breakMinutes: breakMins, presetLabel: focusPreset, phoneChecklistConfirmed: phoneOutChecked && notifOffChecked, completedAt: new Date().toISOString() });
            phase = 'break'; secondsLeft = breakMins * 60; persist(); render();
          };
        } else if (activeTab === 'phone') {
          var pLog = state.phoneLogs[todayKey] || { dateKey: todayKey, screenTimeMinutes: 0, topDrainApps: [], habits: { phoneOutOfReachFirstBlock: false, noPhoneFirst30Min: false, noPhoneBeforeSleep: false } };
          var over = pLog.screenTimeMinutes > state.dailyPhoneLimitMinutes;
          main.innerHTML =
            '<div class="stack">' +
              '<section class="card">' +
                '<div class="row"><div><h1>Phone Usage &amp; Habits</h1><div class="muted">Daily goal: ' + fmtHm(state.dailyPhoneLimitMinutes) + '</div></div>' +
                '<div style="width:120px;"><label class="field-label">Goal (min)</label><input type="number" id="p-limit" value="' + state.dailyPhoneLimitMinutes + '" min="15" max="480" /></div></div>' +
                (pLog.screenTimeMinutes > 0 ? '<div style="margin-top:0.85rem;" class="' + (over ? 'status-warn' : 'status-good') + '">' + (over ? 'Over goal today: ' + fmtHm(pLog.screenTimeMinutes) + ' logged.' : 'Under goal today: ' + fmtHm(pLog.screenTimeMinutes) + ' logged.') + '</div>' : '') +
              '</section>' +
              (over ? '<section class="status-warn"><strong>Try a 5-minute replacement instead of scrolling:</strong><div style="margin-top:0.4rem;">' + state.replacementActivities.map(esc).join(' · ') + '</div></section>' : '') +
              '<div class="grid-2">' +
                '<section class="card stack">' +
                  '<form id="phone-form">' +
                    '<h2>Log Today\\'s Screen Time</h2>' +
                    '<div class="grid-2" style="margin-top:0.75rem;">' +
                      '<div class="field-group"><label class="field-label">Hours</label><input type="number" id="p-hrs" value="' + Math.floor(pLog.screenTimeMinutes/60) + '" min="0" max="16" /></div>' +
                      '<div class="field-group"><label class="field-label">Minutes</label><input type="number" id="p-mins" value="' + (pLog.screenTimeMinutes%60) + '" min="0" max="59" /></div>' +
                    '</div>' +
                    '<div class="field-group"><label class="field-label">Top 2–3 draining apps</label><input type="text" id="p-apps" value="' + esc(pLog.topDrainApps.join(', ')) + '" placeholder="Instagram, YouTube" /></div>' +
                    '<button type="submit" class="btn btn-primary">Save Screen Time</button>' +
                  '</form>' +
                  '<div class="divider-list">' +
                    '<label style="display:flex;gap:0.5rem;"><input type="checkbox" data-hab="phoneOutOfReachFirstBlock" ' + (pLog.habits.phoneOutOfReachFirstBlock?'checked':'') + ' /> Phone out of reach during first study block</label>' +
                    '<label style="display:flex;gap:0.5rem;"><input type="checkbox" data-hab="noPhoneFirst30Min" ' + (pLog.habits.noPhoneFirst30Min?'checked':'') + ' /> No phone first 30 min after waking</label>' +
                    '<label style="display:flex;gap:0.5rem;"><input type="checkbox" data-hab="noPhoneBeforeSleep" ' + (pLog.habits.noPhoneBeforeSleep?'checked':'') + ' /> No phone before sleep</label>' +
                  '</div>' +
                '</section>' +
                '<section class="card">' +
                  '<h2>Replacement Activities</h2>' +
                  '<div class="divider-list">' + state.replacementActivities.map(function(a, i){
                    return '<div class="row"><span>' + esc(a) + '</span><button type="button" class="btn btn-danger" data-del-act="' + i + '">Remove</button></div>';
                  }).join('') + '</div>' +
                  '<form id="act-form" style="display:flex;gap:0.5rem;margin-top:0.75rem;"><input type="text" id="act-input" placeholder="Add activity..." /><button type="submit" class="btn">Add</button></form>' +
                '</section>' +
              '</div>' +
            '</div>';

          document.getElementById('p-limit').onchange = function(e) {
            state.dailyPhoneLimitMinutes = Math.max(15, Math.min(480, Number(e.target.value) || 90));
            persist(); render();
          };
          document.getElementById('phone-form').onsubmit = function(e) {
            e.preventDefault();
            var mins = (Number(document.getElementById('p-hrs').value) || 0) * 60 + (Number(document.getElementById('p-mins').value) || 0);
            var apps = document.getElementById('p-apps').value.split(',').map(function(s){return s.trim();}).filter(Boolean).slice(0,3);
            state.phoneLogs[todayKey] = Object.assign({}, pLog, { dateKey: todayKey, screenTimeMinutes: mins, topDrainApps: apps });
            persist(); render();
          };
          main.querySelectorAll('[data-hab]').forEach(function(el) {
            el.onchange = function() {
              var k = el.getAttribute('data-hab');
              var nextH = Object.assign({}, pLog.habits);
              nextH[k] = !nextH[k];
              state.phoneLogs[todayKey] = Object.assign({}, pLog, { habits: nextH });
              persist(); render();
            };
          });
          main.querySelectorAll('[data-del-act]').forEach(function(el) {
            el.onclick = function() {
              var idx = Number(el.getAttribute('data-del-act'));
              state.replacementActivities.splice(idx, 1);
              persist(); render();
            };
          });
          document.getElementById('act-form').onsubmit = function(e) {
            e.preventDefault();
            var v = document.getElementById('act-input').value.trim();
            if (v.length >= 2) { state.replacementActivities.push(v); persist(); render(); }
          };
        } else if (activeTab === 'review') {
          var exD = state.dailyReviews[todayKey] || { finishedSummary: '', distractions: '', energyLevel: 3, oneWin: '' };
          var keys7 = [];
          for (var i = 6; i >= 0; i--) keys7.push(addDays(todayKey, -i));
          var wkMustDos = state.mustDos.filter(function(t){return keys7.indexOf(t.dateKey)!==-1;});
          var wkDone = wkMustDos.filter(function(t){return t.completed;}).length;
          var wkFocus = state.focusSessions.filter(function(s){return keys7.indexOf(s.dateKey)!==-1;}).reduce(function(a,s){return a+s.focusMinutes;},0);

          main.innerHTML =
            '<div class="stack">' +
              '<section class="card row"><h1>Reflect &amp; Calibrate</h1><div style="display:flex;gap:0.4rem;">' +
                '<button type="button" class="btn ' + (reviewMode==='daily'?'btn-primary':'') + '" id="rev-d-btn">End-of-Day</button>' +
                '<button type="button" class="btn ' + (reviewMode==='weekly'?'btn-primary':'') + '" id="rev-w-btn">Weekly</button>' +
              '</div></section>' +
              (reviewMode === 'daily' ?
                '<section class="card"><form id="daily-rev-form">' +
                  '<div class="field-group"><label class="field-label">What did I finish?</label><textarea id="dr-fin" rows="2">' + esc(exD.finishedSummary) + '</textarea></div>' +
                  '<div class="field-group"><label class="field-label">What distracted me?</label><input type="text" id="dr-dis" value="' + esc(exD.distractions) + '" /></div>' +
                  '<div class="field-group"><label class="field-label">Energy level (1–5)</label><select id="dr-eng">' + [1,2,3,4,5].map(function(n){return '<option value="'+n+'"'+(exD.energyLevel===n?' selected':'')+'>'+n+'</option>';}).join('') + '</select></div>' +
                  '<div class="field-group"><label class="field-label">One win from today</label><input type="text" id="dr-win" value="' + esc(exD.oneWin) + '" /></div>' +
                  '<button type="submit" class="btn btn-primary">Save Today\\'s Review</button>' +
                '</form></section>' :
                '<section class="card stack">' +
                  '<div class="grid-3">' +
                    '<div class="card card-muted"><div class="muted">Must-Dos</div><strong class="tabular">' + wkDone + '/' + wkMustDos.length + '</strong></div>' +
                    '<div class="card card-muted"><div class="muted">Focus Hours</div><strong class="tabular">' + (wkFocus/60).toFixed(1) + ' hrs</strong></div>' +
                    '<div class="card card-muted"><div class="muted">Phone-Free Streak</div><strong class="tabular">' + streakCount(todayKey, function(dk){return Boolean(state.phoneLogs[dk] && state.phoneLogs[dk].habits.phoneOutOfReachFirstBlock);}) + 'd</strong></div>' +
                  '</div>' +
                  '<form id="weekly-rev-form">' +
                    '<div class="field-group"><label class="field-label">What mattered most this week?</label><textarea id="wr-mat" rows="2"></textarea></div>' +
                    '<div class="field-group"><label class="field-label">What wasted my time?</label><textarea id="wr-was" rows="2"></textarea></div>' +
                    '<div class="field-group"><label class="field-label">What one thing will I change next week?</label><input type="text" id="wr-chg" /></div>' +
                    '<button type="submit" class="btn btn-primary">Save Weekly Reflection</button>' +
                  '</form>' +
                '</section>') +
            '</div>';

          document.getElementById('rev-d-btn').onclick = function(){ reviewMode = 'daily'; render(); };
          document.getElementById('rev-w-btn').onclick = function(){ reviewMode = 'weekly'; render(); };
          var df = document.getElementById('daily-rev-form');
          if (df) df.onsubmit = function(e) {
            e.preventDefault();
            state.dailyReviews[todayKey] = { dateKey: todayKey, finishedSummary: document.getElementById('dr-fin').value.trim(), distractions: document.getElementById('dr-dis').value.trim(), energyLevel: Number(document.getElementById('dr-eng').value)||3, oneWin: document.getElementById('dr-win').value.trim(), savedAt: new Date().toISOString() };
            persist(); render();
          };
          var wf = document.getElementById('weekly-rev-form');
          if (wf) wf.onsubmit = function(e) {
            e.preventDefault();
            var m = document.getElementById('wr-mat').value.trim(), c = document.getElementById('wr-chg').value.trim();
            if (!m || !c) return;
            state.weeklyReviews.unshift({ id: 'wr-'+Date.now(), weekOfDateKey: keys7[0], matteredMost: m, wastedTime: document.getElementById('wr-was').value.trim(), oneChangeNextWeek: c, savedAt: new Date().toISOString() });
            persist(); render();
          };
        } else if (activeTab === 'dashboard') {
          var keys = [];
          for (var j = 6; j >= 0; j--) keys.push(addDays(todayKey, -j));
          var sPlan = streakCount(todayKey, function(dk){return state.plannedNightBeforeDates.indexOf(dk)!==-1;});
          var sPhone = streakCount(todayKey, function(dk){return Boolean(state.phoneLogs[dk] && state.phoneLogs[dk].habits.phoneOutOfReachFirstBlock);});
          var sMust = streakCount(todayKey, function(dk){var l = state.mustDos.filter(function(t){return t.dateKey===dk;}); return l.length>0 && l.every(function(t){return t.completed;});});
          var maxF = Math.max(60, Math.max.apply(null, keys.map(function(dk){return state.focusSessions.filter(function(s){return s.dateKey===dk;}).reduce(function(a,s){return a+s.focusMinutes;},0);})));
          var maxP = Math.max(state.dailyPhoneLimitMinutes + 30, Math.max.apply(null, keys.map(function(dk){return state.phoneLogs[dk] ? state.phoneLogs[dk].screenTimeMinutes : 0;})));

          main.innerHTML =
            '<div class="stack">' +
              '<section class="card"><h1>Progress Dashboard</h1><p class="muted">Small, calm steps compound faster than perfect days.</p></section>' +
              '<div class="grid-3">' +
                '<div class="card"><div class="muted">Planning Night Before</div><strong class="tabular" style="font-size:1.5rem;">' + sPlan + 'd</strong></div>' +
                '<div class="card"><div class="muted">Phone-Free First Block</div><strong class="tabular" style="font-size:1.5rem;">' + sPhone + 'd</strong></div>' +
                '<div class="card"><div class="muted">Must-Dos Completed</div><strong class="tabular" style="font-size:1.5rem;">' + sMust + 'd</strong></div>' +
              '</div>' +
              '<div class="grid-2">' +
                '<section class="card"><h2>Focus Time (7 days)</h2><div class="chart-bars">' + keys.map(function(dk){
                  var mins = state.focusSessions.filter(function(s){return s.dateKey===dk;}).reduce(function(a,s){return a+s.focusMinutes;},0);
                  return '<div class="chart-col"><span class="muted tabular">' + mins + 'm</span><div class="bar-wrap"><div class="bar" style="height:' + Math.max(4, Math.round(mins/maxF*100)) + '%"></div></div><span class="muted">' + dk.slice(5) + '</span></div>';
                }).join('') + '</div></section>' +
                '<section class="card"><h2>Must-Do Completion %</h2><div class="chart-bars">' + keys.map(function(dk){
                  var list = state.mustDos.filter(function(t){return t.dateKey===dk;});
                  var pct = list.length ? Math.round(list.filter(function(t){return t.completed;}).length/list.length*100) : 0;
                  return '<div class="chart-col"><span class="muted tabular">' + (list.length?pct+'%':'—') + '</span><div class="bar-wrap"><div class="bar bar-green" style="height:' + (list.length?Math.max(6,pct):4) + '%;opacity:' + (list.length?1:0.2) + '"></div></div><span class="muted">' + dk.slice(5) + '</span></div>';
                }).join('') + '</div></section>' +
                '<section class="card"><div class="row"><h2>Phone Time (7 days)</h2><span class="muted tabular">Goal: ' + fmtHm(state.dailyPhoneLimitMinutes) + '</span></div><div class="chart-bars">' + keys.map(function(dk){
                  var log = state.phoneLogs[dk];
                  var pm = log ? log.screenTimeMinutes : null;
                  var pct = pm !== null ? Math.max(6, Math.round(pm/maxP*100)) : 4;
                  var color = pm !== null && pm <= state.dailyPhoneLimitMinutes ? 'background:#16a34a;' : (pm !== null ? 'background:#d97706;' : 'opacity:0.2;');
                  return '<div class="chart-col"><span class="muted tabular">' + (pm!==null?fmtHm(pm):'—') + '</span><div class="bar-wrap"><div class="bar" style="height:' + pct + '%;' + color + '"></div></div><span class="muted">' + dk.slice(5) + '</span></div>';
                }).join('') + '</div></section>' +
                '<section class="card"><h2>Energy Levels (1–5)</h2><div class="chart-bars">' + keys.map(function(dk){
                  var dr = state.dailyReviews[dk];
                  var eng = dr ? dr.energyLevel : null;
                  var pct = eng !== null ? Math.max(10, Math.round(eng/5*100)) : 4;
                  return '<div class="chart-col"><span class="muted tabular">' + (eng!==null?eng+'/5':'—') + '</span><div class="bar-wrap"><div class="bar" style="height:' + pct + '%;opacity:' + (eng!==null?1:0.2) + '"></div></div><span class="muted">' + dk.slice(5) + '</span></div>';
                }).join('') + '</div></section>' +
              '</div>' +
              '<section class="card row"><div><h2>Backup &amp; Reset</h2><p class="muted" style="margin:0.2rem 0 0;">Save an updated AnchorDesk.html or clear data for a fresh start.</p></div><div style="display:flex;gap:0.5rem;flex-wrap:wrap;"><button type="button" class="btn btn-primary" id="dash-save-btn">Save / Backup</button><button type="button" class="btn btn-danger" id="dash-reset-btn">Reset All Data</button></div></section>' +
            '</div>';

          document.getElementById('dash-save-btn').onclick = openSaveModal;
          document.getElementById('dash-reset-btn').onclick = function() {
            state = {
              theme: state.theme || 'light',
              dailyPhoneLimitMinutes: 90,
              mustDos: [],
              smallTasks: [],
              focusSessions: [],
              phoneLogs: {},
              replacementActivities: ['Walk for 10 minutes without earbuds', 'Stretch shoulders and neck', 'Read 10 pages of a book'],
              dailyReviews: {},
              weeklyReviews: [],
              plannedNightBeforeDates: []
            };
            persist();
            render();
          };
        }
      }

      function openSaveModal() {
        var box = document.getElementById('save-status-box');
        box.textContent = storageWorking
          ? (lastSavedMsg || 'Browser auto-save is active on this device.')
          : 'Browser storage is restricted in this context — use "Save Updated App File" or "Export Data Backup (.json)" before closing.';
        box.className = storageWorking ? 'status-good' : 'status-warn';
        document.getElementById('save-modal').classList.remove('hidden');
      }

      document.getElementById('theme-btn').onclick = function() {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        persist(); render();
      };
      document.getElementById('open-save-btn').onclick = openSaveModal;
      document.getElementById('close-save-btn').onclick = function() {
        document.getElementById('save-modal').classList.add('hidden');
      };
      document.getElementById('save-browser-btn').onclick = function() {
        persist();
        openSaveModal();
      };
      document.getElementById('export-json-btn').onclick = function() {
        var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = 'anchordesk-backup-' + toDateKey(new Date()) + '.json';
        a.click(); URL.revokeObjectURL(url);
      };
      document.getElementById('import-json-input').onchange = function(e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function() {
          try {
            var p = JSON.parse(String(reader.result));
            if (p && Array.isArray(p.mustDos)) {
              state = p; persist(); render(); openSaveModal();
            }
          } catch (err) {}
        };
        reader.readAsText(file);
      };
      document.getElementById('save-html-copy-btn').onclick = async function() {
        var clone = document.documentElement.cloneNode(true);
        var dataNode = clone.querySelector('#anchordesk-embedded-data');
        if (dataNode) {
          var closeTagRegex = new RegExp('<' + '/script>', 'gi');
          dataNode.textContent = JSON.stringify(state).replace(closeTagRegex, '<\\\\/script>');
        }
        var modalNode = clone.querySelector('#save-modal');
        if (modalNode) modalNode.classList.add('hidden');
        var htmlOut = '<!doctype html>\\n' + clone.outerHTML;
        if (window.showSaveFilePicker) {
          try {
            var handle = await window.showSaveFilePicker({
              suggestedName: 'AnchorDesk.html',
              types: [{ description: 'HTML Application', accept: { 'text/html': ['.html'] } }]
            });
            var writable = await handle.createWritable();
            await writable.write(htmlOut);
            await writable.close();
            lastSavedMsg = 'Saved directly into AnchorDesk.html';
            openSaveModal();
            return;
          } catch (err) {
            if (err && err.name === 'AbortError') return;
          }
        }
        var blob = new Blob([htmlOut], { type: 'text/html;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = 'AnchorDesk.html';
        a.click(); URL.revokeObjectURL(url);
      };

      render();
    })();
  </script>
</body>
</html>`;
}
