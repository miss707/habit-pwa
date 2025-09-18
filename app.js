/* Tiny offline Habit PWA - localStorage only */
const STORAGE_KEY = "habitDataV1";
const WEEKDAY_CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const WEEKDAY_NAMES = {
  SU: "Sunday",
  MO: "Monday",
  TU: "Tuesday",
  WE: "Wednesday",
  TH: "Thursday",
  FR: "Friday",
  SA: "Saturday",
};
const ICS_PRODID = "-//Habit Spark//Schedule Export//EN";

let swReadyPromise = Promise.resolve(null);
if ("serviceWorker" in navigator) {
  swReadyPromise = navigator.serviceWorker.ready.catch(() => null);
  navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
}

const PRESET_HABITS = [
  {
    id: "hydrate-more",
    name: "Drink more water",
    category: "Build",
    defaultTarget: 8,
    description: "Track each glass so hydration becomes a daily non-negotiable.",
    motivation: "You’re choosing energy and clarity with every sip—cheers to feeling amazing!",
    expectedBenefits: [
      "Steadier energy and improved focus through the afternoon",
      "Healthier skin and easier recovery after workouts",
      "Fewer headaches caused by dehydration dips",
    ],
    tips: [
      "Keep a bottle within reach and refill it when you log a glass.",
      "Front-load the day with water to make hitting your target easier.",
    ],
    goalPrompts: [
      {
        id: "hydration-goal",
        label: "Daily water goal (oz)",
        type: "number",
        placeholder: "e.g. 80",
        defaultValue: "80",
      },
    ],
  },
  {
    id: "morning-movement",
    name: "Morning movement",
    category: "Build",
    defaultTarget: 1,
    description: "Carve out time to move your body before the day takes over.",
    motivation: "Strong mornings build unstoppable momentum for everything else.",
    expectedBenefits: [
      "A brighter mood thanks to endorphins first thing",
      "More consistent progress toward strength or mobility goals",
    ],
    tips: [
      "Lay your gear out the night before so it’s a zero-decision morning.",
      "Log even short sessions—showing up matters more than perfection.",
    ],
    goalPrompts: [
      {
        id: "movement-focus",
        label: "What’s your current focus?",
        placeholder: "e.g. build core strength",
      },
      {
        id: "movement-duration",
        label: "Minimum session length",
        placeholder: "e.g. 20 minutes",
      },
    ],
  },
  {
    id: "strength-training",
    name: "Strength workouts",
    category: "Build",
    defaultTarget: 1,
    description: "Log every strength session so you can celebrate consistency.",
    motivation: "Every rep is a vote for the stronger version of you—keep stacking wins!",
    expectedBenefits: [
      "Noticeable strength gains and body recomposition",
      "Better posture and fewer nagging aches",
    ],
    tips: [
      "Plan the lifts you’ll tackle before stepping into the gym.",
      "Track how you feel—progress isn’t only about weight on the bar.",
    ],
    goalPrompts: [
      {
        id: "target-weight",
        label: "Target body weight or PR to chase",
        placeholder: "e.g. 185 lb deadlift",
      },
      {
        id: "weekly-frequency",
        label: "Sessions you want each week",
        placeholder: "e.g. 3 strength days",
      },
    ],
  },
  {
    id: "mindful-minutes",
    name: "Mindful minutes",
    category: "Balance",
    defaultTarget: 1,
    description: "Check in with yourself using meditation, breathwork, or quiet time.",
    motivation: "Grounding yourself for a few minutes keeps the rest of the day calmer.",
    expectedBenefits: [
      "Less reactivity when stress shows up",
      "Better sleep thanks to a softer nervous system",
    ],
    tips: [
      "Pair mindfulness with an existing habit, like morning coffee.",
      "Try guided sessions if silence feels intimidating at first.",
    ],
    goalPrompts: [
      {
        id: "mindful-duration",
        label: "Minutes you’d like to sit",
        type: "number",
        placeholder: "e.g. 10",
        defaultValue: "10",
      },
    ],
  },
  {
    id: "sleep-by-11",
    name: "Sleep before 11",
    category: "Balance",
    defaultTarget: 1,
    description: "Protect your bedtime and unlock steadier mornings.",
    motivation: "Rest is a superpower—honor it and everything else gets easier.",
    expectedBenefits: [
      "Clearer thinking and better mood regulation",
      "More consistent energy for workouts and hobbies",
    ],
    tips: [
      "Set a wind-down alarm 45 minutes before lights out.",
      "Keep your bedroom screen-free to cue your brain for rest.",
    ],
    goalPrompts: [
      {
        id: "bedtime-ritual",
        label: "Wind-down ritual",
        placeholder: "e.g. tea + journaling",
      },
    ],
  },
  {
    id: "gratitude-notes",
    name: "Gratitude notes",
    category: "Build",
    defaultTarget: 1,
    description: "Capture one thing you’re grateful for to train your brain on the good.",
    motivation: "A grateful mind spots possibilities others miss—keep collecting the wins!",
    expectedBenefits: [
      "A more optimistic baseline mood",
      "Stronger relationships as you notice the people who support you",
    ],
    tips: [
      "Pair gratitude journaling with brushing your teeth or bedtime.",
      "Include gratitude for yourself—celebrate the effort you’re putting in.",
    ],
  },
  {
    id: "evening-reading",
    name: "Read before bed",
    category: "Balance",
    defaultTarget: 1,
    description: "Trade a scroll session for a few focused pages at night.",
    motivation: "Books open new rooms in your mind—this is the doorway.",
    expectedBenefits: [
      "Easier time falling asleep without blue light",
      "Steady progress through your reading list",
    ],
    tips: [
      "Leave your current book on the pillow as a physical cue.",
      "Set a page or time minimum so “done” feels clear.",
    ],
    goalPrompts: [
      {
        id: "reading-minutes",
        label: "Minutes or pages per session",
        placeholder: "e.g. 15 minutes",
      },
    ],
  },
  {
    id: "screen-curfew",
    name: "Screen-free hour",
    category: "Balance",
    defaultTarget: 1,
    description: "Protect an hour offline to recharge without notifications.",
    motivation: "Creating intentional quiet time gives your brain the break it craves.",
    expectedBenefits: [
      "Deeper focus during work hours",
      "Better sleep thanks to less late-night stimulation",
    ],
    tips: [
      "Pick a daily slot and schedule something enjoyable in it.",
      "Charge devices outside the bedroom to remove temptation.",
    ],
    goalPrompts: [
      {
        id: "curfew-start",
        label: "When does your screen-free window start?",
        placeholder: "e.g. 8:30 PM",
      },
    ],
  },
  {
    id: "alcohol-free",
    name: "Alcohol-free days",
    category: "Break",
    defaultTarget: 1,
    description: "Celebrate every day you choose sobriety.",
    motivation: "Welcome to the rest of your life—each day sober is proof you can rewrite your story.",
    expectedBenefits: [
      "Sleep quality rebounds within the first week",
      "Mood stabilizes and cravings quieten as dopamine resets",
      "Your body begins repairing liver and immune function",
    ],
    tips: [
      "Plan a replacement ritual for the times you usually drank.",
      "Reach out to a supporter when a craving hits—connection keeps you grounded.",
      "Track how your mornings feel as motivation when it’s hard.",
    ],
    goalPrompts: [
      {
        id: "sober-milestone",
        label: "Milestone you’re aiming for",
        placeholder: "e.g. 30 consecutive days",
      },
    ],
  },
  {
    id: "smoke-free",
    name: "Smoke-free streak",
    category: "Break",
    defaultTarget: 1,
    description: "Track every tobacco-free day and watch your streak climb.",
    motivation: "Your lungs, heart, and future self are cheering for every smoke-free sunrise.",
    expectedBenefits: [
      "Breathing becomes easier within a few days",
      "Sense of taste and smell sharpen after a couple of weeks",
      "Long-term disease risk drops with every month you stay smoke-free",
    ],
    tips: [
      "Keep quit reasons visible—screenshot them and set as your phone wallpaper.",
      "Move or breathe deeply when urges peak; cravings usually pass in minutes.",
    ],
    goalPrompts: [
      {
        id: "quit-support",
        label: "Support tools you’ll lean on",
        placeholder: "e.g. nicotine gum, accountability buddy",
      },
    ],
  },
  {
    id: "sugar-reset",
    name: "Sugar reset",
    category: "Break",
    defaultTarget: 1,
    description: "Count the days you choose foods that keep your energy steady.",
    motivation: "You’re teaching your body to crave what fuels you—every choice counts.",
    expectedBenefits: [
      "Smoother energy without the crash",
      "Clearer skin and improved digestion",
    ],
    tips: [
      "Meal prep snacks that satisfy without added sugar.",
      "Notice mood changes when you stabilize blood sugar—it’s powerful motivation.",
    ],
    goalPrompts: [
      {
        id: "sugar-flex",
        label: "What does success look like?",
        placeholder: "e.g. dessert only on Saturdays",
      },
    ],
  },
  {
    id: "budget-checkin",
    name: "Budget check-in",
    category: "Build",
    defaultTarget: 1,
    description: "Review spending so money supports the life you’re building.",
    motivation: "Every check-in is proof you’re steering your finances on purpose.",
    expectedBenefits: [
      "Fewer surprise expenses because you catch trends early",
      "Progress toward savings goals you actually care about",
    ],
    tips: [
      "Pair the check-in with payday or another weekly rhythm.",
      "Celebrate small wins—transferring even a little to savings counts.",
    ],
    goalPrompts: [
      {
        id: "savings-goal",
        label: "Savings or debt goal",
        placeholder: "e.g. build $1,000 emergency fund",
      },
    ],
  },
  {
    id: "creative-time",
    name: "Creative session",
    category: "Build",
    defaultTarget: 1,
    description: "Protect focused time for art, writing, or music that feeds you.",
    motivation: "Your creativity needs room to breathe—show up and let it flow.",
    expectedBenefits: [
      "A stronger creative identity and body of work",
      "A healthier outlet for stress and emotions",
    ],
    tips: [
      "Schedule sessions like any other appointment—you’re worth the slot.",
      "End by jotting what’s next so future-you can start quickly.",
    ],
    goalPrompts: [
      {
        id: "creative-project",
        label: "Project you’re nurturing",
        placeholder: "e.g. finish 3-song EP",
      },
      {
        id: "creative-cadence",
        label: "Weekly cadence",
        placeholder: "e.g. 4 sessions a week",
      },
    ],
  },
];

const REWARD_DEFS = [
  {
    id: "first-win",
    label: "First Win",
    description: "Logged your first successful day",
    check: (habit) => daysMeetingTarget(habit) >= 1,
  },
  {
    id: "streak-3",
    label: "3-Day Streak",
    description: "Kept your streak alive for three days",
    check: (habit) => computeStreak(habit) >= 3,
  },
  {
    id: "streak-7",
    label: "One-Week Streak",
    description: "Seven days in a row—consistency is building",
    check: (habit) => computeStreak(habit) >= 7,
  },
  {
    id: "streak-30",
    label: "30-Day Streak",
    description: "A full month of keeping promises to yourself",
    check: (habit) => computeStreak(habit) >= 30,
  },
  {
    id: "progress-50",
    label: "50 Logs",
    description: "Logged this habit fifty times",
    check: (habit) => totalCompletions(habit) >= 50,
  },
  {
    id: "ontrack-25",
    label: "25 On-Track Days",
    description: "Hit your daily target on 25 different days",
    check: (habit) => daysMeetingTarget(habit) >= 25,
  },
];

const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => [...el.querySelectorAll(sel)];

function handleServiceWorkerMessage(event) {
  const data = event.data || {};
  if (data.type !== "habit-response") return;
  const { habitId, date, action } = data;
  if (!habitId || !date) return;
  const state = load();
  const habit = state.habits.find((h) => h.id === habitId);
  if (!habit) return;

  normalizeSchedule(habit);

  if (action === "complete") {
    const target = habit.target || 1;
    setCountFor(habit, target, date);
    if (habit.schedule?.missedPrompts) {
      habit.schedule.missedPrompts = habit.schedule.missedPrompts.filter((d) => d !== date);
    }
  }

  save(state);
  render();
}

function normalizeDateString(value) {
  if (!value) return "";
  const match = /^([0-9]{4}-[0-9]{2}-[0-9]{2})/.exec(String(value));
  return match ? match[1] : "";
}

function isoToDate(iso) {
  const clean = normalizeDateString(iso);
  if (!clean) return null;
  const [y, m, d] = clean.split("-").map((part) => parseInt(part, 10));
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatMonthDay(iso) {
  const date = isoToDate(iso);
  if (!date) return iso;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatLongDate(iso) {
  const date = isoToDate(iso);
  if (!date) return iso || "today";
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function formatWeekdayShort(iso) {
  const code = isoWeekdayCode(iso);
  if (!code) return "";
  return (WEEKDAY_NAMES[code] || code).slice(0, 3);
}

function isoWeekdayCode(iso) {
  const date = isoToDate(iso);
  if (!date) return WEEKDAY_CODES[1];
  return WEEKDAY_CODES[date.getDay()];
}

function normalizeWeekdayCode(code) {
  if (!code) return null;
  const upper = String(code).slice(0, 2).toUpperCase();
  return WEEKDAY_CODES.includes(upper) ? upper : null;
}

function defaultSchedule(start=todayISO()) {
  const startDate = normalizeDateString(start) || todayISO();
  return {
    frequency: "daily",
    startDate,
    eventDate: "",
    weekdays: [],
    missedPrompts: [],
  };
}

function normalizeSchedule(habit) {
  const prev = habit.schedule && typeof habit.schedule === "object" ? habit.schedule : {};
  const existing = { ...prev };
  const fallback = normalizeDateString(habit.createdAt) || todayISO();
  let frequency = existing.frequency || (existing.eventDate ? "once" : "daily");
  if (!["daily", "weekly", "once"].includes(frequency)) frequency = "daily";
  let startDate = normalizeDateString(existing.startDate) || fallback;
  let eventDate = normalizeDateString(existing.eventDate);
  let weekdays = Array.isArray(existing.weekdays)
    ? existing.weekdays.map(normalizeWeekdayCode).filter(Boolean)
    : [];
  let missedPrompts = Array.isArray(existing.missedPrompts)
    ? existing.missedPrompts.map(normalizeDateString).filter(Boolean)
    : [];

  if (frequency === "once") {
    if (!eventDate) eventDate = startDate || fallback;
    if (!startDate) startDate = eventDate || fallback;
  } else {
    if (!startDate) startDate = fallback;
    eventDate = "";
    if (frequency === "weekly" && !weekdays.length) {
      weekdays = [isoWeekdayCode(startDate)];
    }
    if (frequency !== "weekly") weekdays = [];
  }

  const keepSet = new Set();
  const today = todayISO();
  const cutoffDate = isoToDate(today);
  if (cutoffDate) {
    const oldest = new Date(cutoffDate);
    oldest.setDate(oldest.getDate() - 30);
    const oldestISO = oldest.toISOString().slice(0, 10);
    missedPrompts.forEach((date) => {
      if (date && date >= oldestISO) keepSet.add(date);
    });
  }
  missedPrompts = [...keepSet];

  const changed =
    prev.frequency !== frequency ||
    prev.startDate !== startDate ||
    prev.eventDate !== eventDate ||
    JSON.stringify(prev.weekdays || []) !== JSON.stringify(weekdays) ||
    JSON.stringify(prev.missedPrompts || []) !== JSON.stringify(missedPrompts);

  habit.schedule = { ...existing, frequency, startDate, eventDate, weekdays, missedPrompts };
  return changed;
}

function describeSchedule(schedule) {
  if (!schedule) return "Daily";
  if (schedule.frequency === "once") {
    const date = schedule.eventDate || schedule.startDate;
    return `One-time check-in on ${formatLongDate(date)}`;
  }
  if (schedule.frequency === "weekly") {
    const days = (schedule.weekdays || []).map((code) => (WEEKDAY_NAMES[code] || code).slice(0, 3));
    const dayLabel = days.length ? days.join(", ") : "every day";
    return `Weekly on ${dayLabel} starting ${formatLongDate(schedule.startDate)}`;
  }
  return `Every day starting ${formatLongDate(schedule.startDate)}`;
}

function isDateScheduled(schedule, iso) {
  const clean = normalizeDateString(iso);
  if (!schedule || !clean) return false;
  if (schedule.frequency === "once") {
    const eventDate = normalizeDateString(schedule.eventDate) || normalizeDateString(schedule.startDate);
    return clean === eventDate;
  }
  const start = normalizeDateString(schedule.startDate);
  if (!start || clean < start) return false;
  if (schedule.frequency === "daily") return true;
  if (schedule.frequency === "weekly") {
    const days = (schedule.weekdays || []).length ? schedule.weekdays : WEEKDAY_CODES;
    return days.includes(isoWeekdayCode(clean));
  }
  return false;
}

function buildTimeline(habit) {
  const schedule = habit.schedule || defaultSchedule();
  const startISO = schedule.frequency === "once"
    ? normalizeDateString(schedule.eventDate) || normalizeDateString(schedule.startDate)
    : normalizeDateString(schedule.startDate);
  const startDate = isoToDate(startISO);
  if (!startDate) return { schedule, items: [] };
  const todayStr = todayISO();
  const todayDate = isoToDate(todayStr) || new Date();
  const end = new Date(todayDate);
  end.setDate(end.getDate() + 14);

  const items = [];
  const maxItems = 30;
  const pointer = new Date(startDate);
  let iterations = 0;
  const maxIterations = 730;

  while (pointer <= end && iterations < maxIterations) {
    iterations++;
    const iso = pointer.toISOString().slice(0, 10);
    if (isDateScheduled(schedule, iso)) {
      const count = getCountFor(habit, iso);
      const target = habit.target || 1;
      let status = "upcoming";
      if (count >= target) status = "complete";
      else if (iso < todayStr) status = "missed";
      else if (iso === todayStr) status = "pending";

      items.push({
        date: iso,
        weekday: formatWeekdayShort(iso),
        label: formatMonthDay(iso),
        status,
        isToday: iso === todayStr,
      });

      if (schedule.frequency === "once") break;
    }
    pointer.setDate(pointer.getDate() + 1);
    if (schedule.frequency === "once" && pointer > startDate) break;
  }

  if (items.length > maxItems) {
    return { schedule, items: items.slice(-maxItems) };
  }
  return { schedule, items };
}

function collectMissedScheduledDates(habit) {
  const schedule = habit.schedule;
  if (!schedule) return { dates: [], changed: false };
  const todayStr = todayISO();
  const todayDate = isoToDate(todayStr);
  if (!todayDate) return { dates: [], changed: false };
  const startISO = schedule.frequency === "once"
    ? normalizeDateString(schedule.eventDate) || normalizeDateString(schedule.startDate)
    : normalizeDateString(schedule.startDate);
  const startDate = isoToDate(startISO);
  if (!startDate) return { dates: [], changed: false };

  const lookback = new Date(todayDate);
  lookback.setDate(lookback.getDate() - 7);
  const pointer = startDate > lookback ? new Date(startDate) : new Date(lookback);

  const toNotify = [];
  let changed = false;
  const seen = new Set(schedule.missedPrompts || []);
  const target = habit.target || 1;
  let iterations = 0;

  while (pointer < todayDate && iterations < 60) {
    iterations++;
    const iso = pointer.toISOString().slice(0, 10);
    if (isDateScheduled(schedule, iso)) {
      const already = getCountFor(habit, iso);
      if (already < target && !seen.has(iso)) {
        toNotify.push(iso);
        seen.add(iso);
        changed = true;
      }
    }
    pointer.setDate(pointer.getDate() + 1);
    if (schedule.frequency === "once" && pointer > startDate) break;
  }

  const filtered = [...seen].filter((iso) => iso <= todayStr);
  if (filtered.length !== (schedule.missedPrompts || []).length) changed = true;
  schedule.missedPrompts = filtered;

  return { dates: toNotify, changed };
}

function notifyMissed(habit, dateISO) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission === "denied") return;

  const send = () => {
    swReadyPromise.then((reg) => {
      const message = {
        type: "habit-missed",
        habitId: habit.id,
        name: habit.name,
        date: dateISO,
        target: habit.target || 1,
      };
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(message);
      } else if (reg?.active) {
        reg.active.postMessage(message);
      }
    }).catch(() => {});
  };

  if (Notification.permission === "granted") {
    send();
  } else if (Notification.permission === "default") {
    Notification.requestPermission().then((perm) => {
      if (perm === "granted") send();
    });
  }
}

function escapeICS(value="") {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function createICSContent(habit) {
  const schedule = habit.schedule || defaultSchedule();
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const startISO = schedule.frequency === "once"
    ? normalizeDateString(schedule.eventDate) || normalizeDateString(schedule.startDate)
    : normalizeDateString(schedule.startDate) || todayISO();
  const dtStart = (startISO || todayISO()).replace(/-/g, "");
  let rrule = "";
  if (schedule.frequency === "daily") {
    rrule = "RRULE:FREQ=DAILY";
  } else if (schedule.frequency === "weekly") {
    const days = (schedule.weekdays || []).length ? schedule.weekdays : WEEKDAY_CODES;
    rrule = `RRULE:FREQ=WEEKLY;BYDAY=${days.join(",")}`;
  }
  const summary = escapeICS(habit.name || "Habit");
  const descriptionParts = [];
  if (habit.motivation) descriptionParts.push(habit.motivation);
  if (habit.tips?.length) descriptionParts.push(`Tips: ${(Array.isArray(habit.tips) ? habit.tips.join("; ") : habit.tips)}`);
  const description = escapeICS(descriptionParts.join("\n\n"));

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${ICS_PRODID}`,
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${habit.id}@habit-spark.local`,
    `DTSTAMP:${now}`,
    `SUMMARY:${summary}`,
    `DTSTART;VALUE=DATE:${dtStart}`,
  ];
  if (rrule) lines.push(rrule);
  if (schedule.frequency === "once") {
    const end = normalizeDateString(schedule.eventDate) || startISO;
    if (end) {
      const endDate = isoToDate(end);
      if (endDate) {
        endDate.setDate(endDate.getDate() + 1);
        lines.push(`DTEND;VALUE=DATE:${endDate.toISOString().slice(0, 10).replace(/-/g, "")}`);
      }
    }
  }
  if (description) lines.push(`DESCRIPTION:${description}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

function exportHabitICS(habit) {
  const ics = createICSContent(habit);
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = (habit.name || "habit").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  link.href = url;
  link.download = `${safeName || "habit"}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

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

function totalCompletions(habit) {
  return Object.values(habit.history || {}).reduce((sum, val) => sum + (val || 0), 0);
}

function daysMeetingTarget(habit) {
  const target = habit.target || 1;
  return Object.values(habit.history || {}).filter(val => (val || 0) >= target).length;
}

function evaluateRewards(habit) {
  habit.achievements = habit.achievements || [];
  const unlockedIds = new Set(habit.achievements.map((a) => a.id));
  const newlyUnlocked = [];

  REWARD_DEFS.forEach((def) => {
    if (!unlockedIds.has(def.id) && def.check(habit)) {
      const reward = {
        id: def.id,
        label: def.label,
        description: def.description,
        unlockedOn: todayISO(),
      };
      habit.achievements.push(reward);
      newlyUnlocked.push(def.label);
    }
  });

  return newlyUnlocked;
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

  let mutated = false;
  const notificationsToSend = [];
  state.habits.forEach((habit) => {
    if (normalizeSchedule(habit)) mutated = true;
    const missed = collectMissedScheduledDates(habit);
    if (missed.changed) mutated = true;
    missed.dates.forEach((date) => notificationsToSend.push({ habit, date }));
    const newly = evaluateRewards(habit);
    if (newly.length) mutated = true;
  });
  if (mutated) save(state);
  notificationsToSend.forEach(({ habit, date }) => notifyMissed(habit, date));

  if (!state.habits.length) {
    const empty = document.createElement("div");
    empty.className = "card";
    empty.innerHTML = "<p>No habits yet. Choose a preset above to get started.</p>";
    wrap.appendChild(empty);
    return;
  }

  state.habits.forEach((h) => {
    const count = getCountFor(h);
    const target = h.target || 1;
    const progressPct = target ? Math.min(100, Math.round((count / target) * 100)) : 0;

    const card = document.createElement("article");
    card.className = "habit";

    const header = document.createElement("div");
    header.className = "habit-header";

    const title = document.createElement("h3");
    title.textContent = h.name;
    header.appendChild(title);

    if (h.category) {
      const catClass = `category-${h.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      const badge = document.createElement("span");
      badge.classList.add("category-badge", catClass);
      badge.textContent = h.category;
      header.appendChild(badge);
    }

    card.appendChild(header);

    if (h.description) {
      const description = document.createElement("p");
      description.className = "habit-description";
      description.textContent = h.description;
      card.appendChild(description);
    }

    const controls = document.createElement("div");
    controls.className = "controls";
    const dec = document.createElement("button");
    dec.className = "icon-btn";
    dec.setAttribute("aria-label", "decrease");
    dec.textContent = "−";

    const countEl = document.createElement("div");
    countEl.className = "count";
    countEl.textContent = count;

    const inc = document.createElement("button");
    inc.className = "icon-btn";
    inc.setAttribute("aria-label", "increase");
    inc.textContent = "+";

    controls.append(dec, countEl, inc);
    card.appendChild(controls);

    const prog = document.createElement("div");
    prog.className = "progress";
    const bar = document.createElement("span");
    bar.style.width = `${progressPct}%`;
    prog.appendChild(bar);
    card.appendChild(prog);

    const meta = document.createElement("div");
    meta.className = "meta";
    const targetEl = document.createElement("span");
    targetEl.innerHTML = `Target <span class="badge">${target}</span>`;
    const streak = computeStreak(h);
    const streakEl = document.createElement("span");
    streakEl.innerHTML = `🔥 <strong>${streak}</strong> day streak`;
    meta.append(targetEl, streakEl);
    const onTrackDays = daysMeetingTarget(h);
    if (onTrackDays) {
      const onTrackEl = document.createElement("span");
      onTrackEl.innerHTML = `✅ <strong>${onTrackDays}</strong> days on track`;
      meta.appendChild(onTrackEl);
    }
    card.appendChild(meta);

    const { schedule, items: timelineItems } = buildTimeline(h);
    const scheduleBlock = document.createElement("div");
    scheduleBlock.className = "schedule-block";
    const scheduleTitle = document.createElement("strong");
    scheduleTitle.textContent = "Timeline";
    scheduleBlock.appendChild(scheduleTitle);
    const scheduleDesc = document.createElement("p");
    scheduleDesc.className = "schedule-description";
    scheduleDesc.textContent = describeSchedule(schedule);
    scheduleBlock.appendChild(scheduleDesc);

    if (timelineItems.length) {
      const list = document.createElement("ol");
      list.className = "timeline";
      timelineItems.forEach((item) => {
        const li = document.createElement("li");
        const classes = ["timeline-item", item.status];
        if (item.isToday) classes.push("today");
        li.className = classes.join(" ");
        const dayEl = document.createElement("span");
        dayEl.className = "timeline-day";
        dayEl.textContent = item.weekday;
        const dateEl = document.createElement("strong");
        dateEl.textContent = item.label;
        const statusEl = document.createElement("span");
        statusEl.className = "timeline-status";
        let statusLabel = "Upcoming";
        if (item.status === "complete") statusLabel = "Done";
        else if (item.status === "missed") statusLabel = "Missed";
        else if (item.status === "pending") statusLabel = "Today";
        statusEl.textContent = statusLabel;
        li.append(dayEl, dateEl, statusEl);
        list.appendChild(li);
      });
      scheduleBlock.appendChild(list);
    } else {
      const emptyTimeline = document.createElement("p");
      emptyTimeline.className = "timeline-empty";
      emptyTimeline.textContent = "No scheduled check-ins yet.";
      scheduleBlock.appendChild(emptyTimeline);
    }
    card.appendChild(scheduleBlock);

    if (h.motivation) {
      const motivationEl = document.createElement("p");
      motivationEl.className = "motivation";
      motivationEl.textContent = h.motivation;
      card.appendChild(motivationEl);
    }

    const goalsListData = Array.isArray(h.goals) ? h.goals : [];
    if (goalsListData.some((goal) => goal && goal.value)) {
      const goalsBlock = document.createElement("div");
      goalsBlock.className = "goals";
      const goalsTitle = document.createElement("strong");
      goalsTitle.textContent = "Your goals";
      goalsBlock.appendChild(goalsTitle);
      const goalsList = document.createElement("ul");
      goalsListData.forEach((goal) => {
        if (!goal || !goal.value) return;
        const item = document.createElement("li");
        const label = goal.label || "Goal";
        item.innerHTML = `<span>${label}</span><strong>${goal.value}</strong>`;
        goalsList.appendChild(item);
      });
      if (goalsList.childElementCount) goalsBlock.appendChild(goalsList);
      card.appendChild(goalsBlock);
    }

    const expected = Array.isArray(h.expectedBenefits)
      ? h.expectedBenefits
      : h.expectedBenefits
      ? [h.expectedBenefits]
      : [];
    const tips = Array.isArray(h.tips) ? h.tips : h.tips ? [h.tips] : [];

    if (expected.length || tips.length) {
      const details = document.createElement("details");
      details.className = "guidance";
      const summary = document.createElement("summary");
      summary.textContent = "What to expect & tips";
      details.appendChild(summary);

      if (expected.length) {
        const expectTitle = document.createElement("h4");
        expectTitle.textContent = "What to expect";
        details.appendChild(expectTitle);
        const expectList = document.createElement("ul");
        expected.forEach((benefit) => {
          const item = document.createElement("li");
          item.textContent = benefit;
          expectList.appendChild(item);
        });
        details.appendChild(expectList);
      }

      if (tips.length) {
        const tipsTitle = document.createElement("h4");
        tipsTitle.textContent = "Tips to stay on track";
        details.appendChild(tipsTitle);
        const tipsList = document.createElement("ul");
        tips.forEach((tip) => {
          const item = document.createElement("li");
          item.textContent = tip;
          tipsList.appendChild(item);
        });
        details.appendChild(tipsList);
      }

      card.appendChild(details);
    }

    const achievements = (h.achievements || []).slice().sort((a, b) => {
      if (!a.unlockedOn) return 1;
      if (!b.unlockedOn) return -1;
      return a.unlockedOn < b.unlockedOn ? 1 : -1;
    });
    const rewardBlock = document.createElement("div");
    rewardBlock.className = "rewards";
    const rewardTitle = document.createElement("strong");
    rewardTitle.textContent = "Rewards";
    rewardBlock.appendChild(rewardTitle);

    if (achievements.length) {
      const list = document.createElement("ul");
      achievements.forEach((ach) => {
        const item = document.createElement("li");
        const date = ach.unlockedOn ? ` · ${ach.unlockedOn}` : "";
        item.innerHTML = `<span>${ach.label}</span><small>${ach.description}${date}</small>`;
        list.appendChild(item);
      });
      rewardBlock.appendChild(list);
    } else {
      const emptyReward = document.createElement("p");
      emptyReward.className = "muted";
      emptyReward.textContent = "Keep logging to unlock your first reward.";
      rewardBlock.appendChild(emptyReward);
    }

    const achievedIds = new Set(achievements.map((a) => a.id));
    const nextReward = REWARD_DEFS.find((def) => !achievedIds.has(def.id));
    if (nextReward) {
      const next = document.createElement("p");
      next.className = "upcoming";
      next.textContent = `Next: ${nextReward.label} — ${nextReward.description}`;
      rewardBlock.appendChild(next);
    }
    card.appendChild(rewardBlock);

    const actions = document.createElement("div");
    actions.className = "actions";
    const calendarBtn = document.createElement("button");
    calendarBtn.className = "link";
    calendarBtn.textContent = "Add to calendar";
    const reset = document.createElement("button");
    reset.className = "link";
    reset.textContent = "Reset today";
    const del = document.createElement("button");
    del.className = "link";
    del.style.color = "var(--danger)";
    del.textContent = "Delete habit";
    actions.append(calendarBtn, reset, del);
    card.appendChild(actions);

    calendarBtn.addEventListener("click", () => {
      const s = load();
      const hh = s.habits.find((x) => x.id === h.id);
      if (!hh) return;
      normalizeSchedule(hh);
      exportHabitICS(hh);
    });

    inc.addEventListener("click", () => {
      const s = load();
      const hh = s.habits.find((x) => x.id === h.id);
      const c = getCountFor(hh) + 1;
      setCountFor(hh, c);
      const newRewards = evaluateRewards(hh);
      save(s);
      const messages = [];
      const targetVal = hh.target || 1;
      if (c === targetVal) messages.push(`Nice! You hit your “${hh.name}” target 🎉`);
      if (newRewards.length) messages.push(`Unlocked: ${newRewards.join(", ")}`);
      if (messages.length) toast(messages.join(" • "));
      render();
    });

    dec.addEventListener("click", () => {
      const s = load();
      const hh = s.habits.find((x) => x.id === h.id);
      const c = Math.max(0, getCountFor(hh) - 1);
      setCountFor(hh, c);
      save(s);
      render();
    });

    reset.addEventListener("click", () => {
      const s = load();
      const hh = s.habits.find((x) => x.id === h.id);
      setCountFor(hh, 0);
      save(s);
      render();
    });

    del.addEventListener("click", () => {
      const s = load();
      s.habits = s.habits.filter((x) => x.id !== h.id);
      save(s);
      render();
    });

    wrap.appendChild(card);
  });
}

function splitLines(value="") {
  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function createHabitFromPreset(preset) {
  if (!preset) return null;
  const habit = {
    id: uid(),
    name: preset.name,
    target: preset.defaultTarget || 1,
    createdAt: new Date().toISOString(),
    history: {},
    schedule: defaultSchedule(todayISO()),
    presetId: preset.id,
    category: preset.category,
    description: preset.description,
    motivation: preset.motivation || "",
    expectedBenefits: (preset.expectedBenefits || []).slice(),
    tips: (preset.tips || []).slice(),
    goals: (preset.goalPrompts || [])
      .map((prompt) => ({
        id: prompt.id,
        label: prompt.label,
        value: prompt.defaultValue || "",
      }))
      .filter((goal) => goal.value),
    achievements: [],
  };
  return habit;
}

const addForm = $("#add-form");
const presetSelect = $("#preset");
const nameInput = $("#name");
const targetInput = $("#target");
const startDateInput = $("#start-date");
const frequencySelect = $("#schedule-frequency");
const weeklyPicker = $("#weekly-picker");
const eventDateRow = $("#event-date-row");
const eventDateInput = $("#event-date");
const motivationInput = $("#motivation");
const expectedInput = $("#expected");
const tipsInput = $("#tips");
const goalFields = $("#goal-fields");
const presetPreview = $("#preset-preview");
const presetCategory = $("#preset-category");
const presetDescription = $("#preset-description");

function getWeekdayInputs() {
  return weeklyPicker ? $$(".weekday-toggle input", weeklyPicker) : [];
}

function ensureWeeklySelection() {
  const inputs = getWeekdayInputs();
  if (!inputs.length) return [];
  const checked = inputs.filter((input) => input.checked);
  if (checked.length) return checked;
  const fallbackDay = isoWeekdayCode(startDateInput?.value || todayISO());
  const fallbackInput = inputs.find((input) => input.value === fallbackDay);
  if (fallbackInput) fallbackInput.checked = true;
  return fallbackInput ? [fallbackInput] : [];
}

function syncScheduleFields() {
  const freq = frequencySelect ? frequencySelect.value : "daily";
  if (weeklyPicker) weeklyPicker.classList.toggle("hidden", freq !== "weekly");
  if (eventDateRow) eventDateRow.classList.toggle("hidden", freq !== "once");
  if (eventDateInput) eventDateInput.required = freq === "once";
  if (freq === "weekly") ensureWeeklySelection();
  if (freq === "once" && eventDateInput && startDateInput && eventDateInput.value) {
    startDateInput.value = eventDateInput.value;
  }
}

function renderGoalInputs(preset) {
  if (!goalFields) return;
  goalFields.innerHTML = "";
  if (!preset || !Array.isArray(preset.goalPrompts) || !preset.goalPrompts.length) return;

  preset.goalPrompts.forEach((prompt) => {
    const wrapper = document.createElement("div");
    wrapper.className = "row column goal-field";
    const id = `goal-${prompt.id}`;

    const label = document.createElement("label");
    label.setAttribute("for", id);
    label.textContent = prompt.label || "Goal";

    const input = document.createElement("input");
    input.id = id;
    input.className = "goal-input";
    input.type = prompt.type || "text";
    input.placeholder = prompt.placeholder || "";
    input.value = prompt.defaultValue || "";
    input.dataset.goalId = prompt.id || id;
    input.dataset.goalLabel = prompt.label || "Goal";

    wrapper.append(label, input);

    if (prompt.helper) {
      const hint = document.createElement("small");
      hint.className = "muted";
      hint.textContent = prompt.helper;
      wrapper.appendChild(hint);
    }

    goalFields.appendChild(wrapper);
  });
}

function updatePresetPreview(preset) {
  if (!presetPreview) return;
  if (!preset) {
    presetPreview.classList.add("hidden");
    if (presetCategory) presetCategory.textContent = "";
    if (presetDescription) presetDescription.textContent = "";
    if (presetCategory) presetCategory.className = "badge category-badge";
    return;
  }

  const catClass = `category-${preset.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  presetPreview.classList.remove("hidden");
  if (presetCategory) {
    presetCategory.className = `badge category-badge ${catClass}`;
    presetCategory.textContent = preset.category;
  }
  if (presetDescription) {
    presetDescription.textContent = preset.description || "";
  }
}

function applyPresetToForm(preset) {
  if (preset) {
    if (nameInput) nameInput.value = preset.name;
    if (targetInput) targetInput.value = String(preset.defaultTarget || 1);
    if (motivationInput) motivationInput.value = preset.motivation || "";
    if (expectedInput) expectedInput.value = (preset.expectedBenefits || []).join("\n");
    if (tipsInput) tipsInput.value = (preset.tips || []).join("\n");
  } else {
    if (nameInput) nameInput.value = "";
    if (targetInput) targetInput.value = "1";
    if (motivationInput) motivationInput.value = "";
    if (expectedInput) expectedInput.value = "";
    if (tipsInput) tipsInput.value = "";
  }
  if (startDateInput) startDateInput.value = todayISO();
  if (eventDateInput) eventDateInput.value = "";
  if (frequencySelect) frequencySelect.value = "daily";
  getWeekdayInputs().forEach((input) => {
    input.checked = false;
  });
  syncScheduleFields();
  renderGoalInputs(preset || null);
  updatePresetPreview(preset || null);
}

function populatePresetOptions() {
  if (!presetSelect) return;
  presetSelect.innerHTML = "";
  const customOption = document.createElement("option");
  customOption.value = "";
  customOption.textContent = "Custom habit";
  presetSelect.appendChild(customOption);

  const categoryLabels = {
    Build: "Build new routines",
    Break: "Break old habits",
    Balance: "Balance & recovery",
  };

  const categories = [];
  PRESET_HABITS.forEach((preset) => {
    if (!categories.includes(preset.category)) categories.push(preset.category);
  });

  categories.forEach((category) => {
    const group = document.createElement("optgroup");
    group.label = categoryLabels[category] || category;
    PRESET_HABITS.filter((p) => p.category === category).forEach((preset) => {
      const option = document.createElement("option");
      option.value = preset.id;
      option.textContent = preset.name;
      group.appendChild(option);
    });
    presetSelect.appendChild(group);
  });
}

function handlePresetChange() {
  if (!presetSelect) return;
  const selectedId = presetSelect.value;
  const preset = PRESET_HABITS.find((p) => p.id === selectedId) || null;
  applyPresetToForm(preset);
}

if (presetSelect) {
  populatePresetOptions();
  handlePresetChange();
  presetSelect.addEventListener("change", handlePresetChange);
}

if (startDateInput && !startDateInput.value) {
  startDateInput.value = todayISO();
}
syncScheduleFields();

if (startDateInput) {
  startDateInput.addEventListener("change", () => {
    if (frequencySelect?.value === "weekly") ensureWeeklySelection();
    if (frequencySelect?.value === "once" && eventDateInput && !eventDateInput.value) {
      eventDateInput.value = startDateInput.value;
    }
  });
}

if (frequencySelect) {
  frequencySelect.addEventListener("change", () => {
    syncScheduleFields();
  });
}

if (eventDateInput) {
  eventDateInput.addEventListener("change", () => {
    if (frequencySelect?.value === "once" && startDateInput && eventDateInput.value) {
      startDateInput.value = eventDateInput.value;
    }
  });
}

if (addForm) {
  addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = nameInput ? nameInput.value.trim() : "";
    const target = Math.max(1, parseInt(targetInput?.value || "1", 10) || 1);
    if (!name) return;

    const preset = presetSelect ? PRESET_HABITS.find((p) => p.id === presetSelect.value) : null;
    const motivation = motivationInput ? motivationInput.value.trim() : "";
    const expectedBenefits = expectedInput ? splitLines(expectedInput.value) : [];
    const tips = tipsInput ? splitLines(tipsInput.value) : [];
    const goals = goalFields
      ? $$(".goal-input", goalFields)
          .map((input) => {
            const value = input.value.trim();
            if (!value) return null;
            return {
              id: input.dataset.goalId || uid(),
              label: input.dataset.goalLabel || "Goal",
              value,
            };
          })
          .filter(Boolean)
      : [];

    const scheduleFrequency = frequencySelect ? frequencySelect.value : "daily";
    const startDate = normalizeDateString(startDateInput?.value) || todayISO();
    const selectedWeekdays = scheduleFrequency === "weekly"
      ? getWeekdayInputs()
          .filter((input) => input.checked)
          .map((input) => input.value)
      : [];
    if (scheduleFrequency === "weekly" && !selectedWeekdays.length) {
      selectedWeekdays.push(isoWeekdayCode(startDate));
    }
    const eventDateValue = scheduleFrequency === "once"
      ? normalizeDateString(eventDateInput?.value) || startDate
      : "";
    const schedule = {
      frequency: scheduleFrequency,
      startDate: scheduleFrequency === "once" ? eventDateValue : startDate,
      eventDate: scheduleFrequency === "once" ? eventDateValue : "",
      weekdays: scheduleFrequency === "weekly" ? selectedWeekdays : [],
      missedPrompts: [],
    };

    const habit = {
      id: uid(),
      name,
      target,
      createdAt: new Date().toISOString(),
      history: {},
      schedule,
      motivation,
      expectedBenefits,
      tips,
      goals,
      achievements: [],
    };

    if (preset) {
      habit.presetId = preset.id;
      habit.category = preset.category;
      habit.description = preset.description;
      if (!habit.expectedBenefits.length && preset.expectedBenefits) habit.expectedBenefits = [...preset.expectedBenefits];
      if (!habit.tips.length && preset.tips) habit.tips = [...preset.tips];
      if (!habit.motivation && preset.motivation) habit.motivation = preset.motivation;
    }

    const state = load();
    state.habits.push(habit);
    save(state);

    addForm.reset();
    if (presetSelect) presetSelect.value = "";
    applyPresetToForm(null);
    render();
  });
}

// seed with example if first launch
(function init(){
  const state = load();
  if (!state.habits.length) {
    const starterIds = ["hydrate-more", "alcohol-free"];
    starterIds.forEach((id) => {
      const preset = PRESET_HABITS.find((p) => p.id === id);
      const habit = createHabitFromPreset(preset);
      if (habit) state.habits.push(habit);
    });
    save(state);
  }
  render();
})();
