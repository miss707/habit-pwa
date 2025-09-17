/* Tiny offline Habit PWA - localStorage only */
const STORAGE_KEY = "habitDataV1";

const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => [...el.querySelectorAll(sel)];

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { habits: [] };
  } catch (e) {
    return { habits: [] };
  }
}

function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid() { return Math.random().toString(36).slice(2, 10); }
function todayISO() { return new Date().toISOString().slice(0,10); }

function getCountFor(habit, dateISO=todayISO()) {
  return (habit.history && habit.history[dateISO]) || 0;
}

function setCountFor(habit, val, dateISO=todayISO()) {
  habit.history = habit.history || {};
  habit.history[dateISO] = Math.max(0, val);
}

function computeStreak(habit, dateISO=todayISO()) {
  const target = habit.target || 1;
  let streak = 0;
  let d = new Date(dateISO);
  for (let i=0; i<9999; i++) {
    const key = d.toISOString().slice(0,10);
    if ((habit.history?.[key] || 0) >= target) {
      streak++;
      d.setDate(d.getDate()-1);
    } else break;
  }
  return streak;
}

function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2000);
}

function render() {
  const state = load();
  const wrap = $("#habits");
  wrap.innerHTML = "";
  if (!state.habits.length) {
    const empty = document.createElement("div");
    empty.className = "card";
    empty.innerHTML = "<p>No habits yet. Add your first one above.</p>";
    wrap.appendChild(empty);
    return;
  }

  state.habits.forEach(h => {
    const count = getCountFor(h);
    const target = h.target || 1;
    const progressPct = Math.min(100, Math.round((count / target) * 100));

    const card = document.createElement("article");
    card.className = "habit";

    const title = document.createElement("h3");
    title.textContent = h.name;
    card.appendChild(title);

    const controls = document.createElement("div");
    controls.className = "controls";
    const dec = document.createElement("button");
    dec.className = "icon-btn";
    dec.setAttribute("aria-label","decrease");
    dec.textContent = "−";

    const countEl = document.createElement("div");
    countEl.className = "count";
    countEl.textContent = count;

    const inc = document.createElement("button");
    inc.className = "icon-btn";
    inc.setAttribute("aria-label","increase");
    inc.textContent = "+";

    controls.append(dec, countEl, inc);
    card.appendChild(controls);

    const prog = document.createElement("div");
    prog.className = "progress";
    const bar = document.createElement("span");
    bar.style.width = progressPct + "%";
    prog.appendChild(bar);
    card.appendChild(prog);

    const meta = document.createElement("div");
    meta.className = "meta";
    const targetEl = document.createElement("span");
    targetEl.innerHTML = `Target <span class="badge">{target}</span>`;
    const streak = computeStreak(h);
    const streakEl = document.createElement("span");
    streakEl.innerHTML = `🔥 <strong>{streak}</strong> day streak`;
    meta.append(targetEl, streakEl);
    card.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "actions";
    const reset = document.createElement("button");
    reset.className = "link";
    reset.textContent = "Reset today";
    const del = document.createElement("button");
    del.className = "link";
    del.style.color = "var(--danger)";
    del.textContent = "Delete habit";
    actions.append(reset, del);
    card.appendChild(actions);

    inc.addEventListener("click", () => {
      const s = load();
      const hh = s.habits.find(x => x.id === h.id);
      const c = getCountFor(hh) + 1;
      setCountFor(hh, c);
      save(s);
      // hit target celebration
      if (c === target) toast(`Nice! You hit your “${hh.name}” target 🎉`);
      render();
    });

    dec.addEventListener("click", () => {
      const s = load();
      const hh = s.habits.find(x => x.id === h.id);
      const c = Math.max(0, getCountFor(hh) - 1);
      setCountFor(hh, c);
      save(s);
      render();
    });

    reset.addEventListener("click", () => {
      const s = load();
      const hh = s.habits.find(x => x.id === h.id);
      setCountFor(hh, 0);
      save(s);
      render();
    });

    del.addEventListener("click", () => {
      const s = load();
      s.habits = s.habits.filter(x => x.id !== h.id);
      save(s);
      render();
    });

    wrap.appendChild(card);
  });
}

$("#add-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("#name").value.trim();
  const target = Math.max(1, parseInt($("#target").value,10) || 1);
  if (!name) return;

  const state = load();
  state.habits.push({
    id: uid(),
    name,
    target,
    createdAt: new Date().toISOString(),
    history: {},
  });
  save(state);

  $("#name").value = "";
  $("#target").value = "1";
  render();
});

// seed with example if first launch
(function init(){
  const state = load();
  if (!state.habits.length) {
    state.habits.push({
      id: uid(),
      name: "Drink water",
      target: 8,
      createdAt: new Date().toISOString(),
      history: {"2025-09-17": 0},
    });
    state.habits.push({
      id: uid(),
      name: "Walk",
      target: 1,
      createdAt: new Date().toISOString(),
      history: {"2025-09-17": 0},
    });
    save(state);
  }
  render();
})();
