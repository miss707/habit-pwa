# Habit Spark (PWA)

A tiny, offline-first habit counter with streaks. Works on your phone and can be installed like an app.

## What it does
- Add habits with a daily target (e.g., 8 glasses of water).
- Choose a cadence (every day, specific weekdays, or a one-time event) and see it laid out on each habit’s timeline.
- Tap + / − to track your count for **today** and keep the timeline in sync.
- Missed scheduled days trigger an optional notification prompt (✅/❌) if you’ve allowed notifications.
- Export the cadence as an `.ics` calendar file so you can subscribe in your calendar app.
- Shows a 🔥 day streak when you meet the target across consecutive days.
- Fully offline (data stored locally on your device via localStorage).
- Installable PWA (Add to Home Screen).

## Quick start
1. **Create a new GitHub repo** called `habit-pwa` (or any name).
2. **Upload these files** to the repo root:
   - `index.html`
   - `app.css`
   - `app.js`
   - `service-worker.js`
   - `manifest.webmanifest`
   - `icons/icon-192.png`
   - `icons/icon-512.png`
3. **Enable GitHub Pages**: Settings → Pages → Select branch: `main` (or `master`) and `/(root)` and save.
4. Wait for the page to build, then open your site: `https://<your-username>.github.io/<repo-name>/`.
5. On your phone, open the link in Chrome (Android) or Safari (iOS) and **Add to Home Screen**.

> Tip: If you see an older version after changing files, hard refresh or clear the site data because service workers cache files.

## Customize
- Edit `index.html` labels and colors in `app.css`.
- In `app.js`, adjust the simple data model or add features like weekly targets or reminders.

## Timeline & prompts
- Each habit now renders a mini calendar that highlights completed, pending (today), upcoming and missed check-ins.
- Missed days within the last week will ping the service worker, which raises a “Did you complete…?” notification. Tapping ✅ logs the day at your target; ❌ dismisses the prompt for that day.
- “Add to calendar” downloads an `.ics` file with your habit cadence (daily RRULE, weekly BYDAY, or one-off). Subscribe to stay synced across devices.
- One-off events disappear from the timeline once their day passes—log them or mark them from the notification to keep your history tidy.

## Roadmap ideas (optional)
- Cloud sync (Supabase or Firebase auth + database).
- Weekly targets and analytics.
- Share/export your data as CSV or JSON.
- Notifications (requires a server unless you only do local reminders).

Enjoy! 🎉
