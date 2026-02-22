# Habit Tracker

A fully local, offline-first desktop habit tracker built with Electron, React, TypeScript, better-sqlite3, Tailwind CSS, and Recharts.

## Features

- **Daily Check-in** — Track daily habits with notes, auto-locking at midnight
- **Weekly Spreadsheet View** — Full spreadsheet-style grid to see your entire week at a glance
- **History** — Browse past days, see what was completed/missed, and log reasons for missed habits
- **Analytics Dashboard** — Streaks, completion rates, GitHub-style heatmap, weekly bar charts, best/worst days, per-habit trend lines
- **Dark / Light Mode** — Toggle with persistent preference
- **Data Export** — Export all habit log data to CSV
- **End-of-Day Notification** — Desktop reminder at 11:30 PM for incomplete habits

## Tech Stack

- **Electron** — Desktop app shell
- **React + TypeScript** — UI framework
- **better-sqlite3** — Local SQLite database (all data stays on your machine)
- **Tailwind CSS** — Utility-first styling
- **Recharts** — Charts and visualizations
- **date-fns** — Date manipulation
- **electron-builder** — Packaging

## Setup

```bash
npm install
npm run dev
```

The app will open in an Electron window. All data is stored locally in a SQLite database in your system's app data directory.

## Building for Production

```bash
npm run build
```

This creates a distributable package in the `release/` folder.

## Project Structure

```
src/
├── main/              # Electron main process
│   ├── index.ts       # App entry, window creation, notifications
│   ├── preload.ts     # Context bridge / IPC exposure
│   ├── database/
│   │   └── db.ts      # SQLite setup and all queries
│   └── ipc/
│       └── handlers.ts  # IPC handler registration
└── renderer/          # React renderer
    ├── App.tsx        # Root component with routing
    ├── pages/         # Page components
    ├── components/    # UI components
    ├── hooks/         # Custom React hooks
    └── styles/        # Global CSS / Tailwind
```
