# Habit Spark (PWA)

A tiny, offline-first habit counter with streaks. Works on your phone and can be installed like an app.

## What it does (v1)
- Add habits with a daily target (e.g., 8 glasses of water).
- Tap + / − to track your count for **today**.
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

## Roadmap ideas (optional)
- Cloud sync (Supabase or Firebase auth + database).
- Weekly targets and analytics.
- Share/export your data as CSV or JSON.
- Notifications (requires a server unless you only do local reminders).

Enjoy! 🎉
