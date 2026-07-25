# Family Schedule

A mobile-first family schedule/calendar app. Family members can view, add, edit, and delete shared events in a list or calendar view, filtered by member.

## Tech Stack

| Layer          | Technology         ------------------|
| UI framework   | React 18 (`react`, `react-dom`)      |
| Build tool     | Vite 4 (`@vitejs/plugin-react`)      |
| Backend/DB     | Supabase (Postgres + REST API)       |
| Styling        | Inline JS style objects (no CSS framework) |
| State          | React `useState`/`useEffect` + `localStorage` (no external state library) |
| Routing        | None — single view, tab-based UI switching |

## Project Structure

```
family-schedule/
├── index.html          # HTML entry point, mounts #root
├── vite.config.js       # Vite config (React plugin only)
├── package.json         # Scripts & dependencies
└── src/
    ├── main.jsx          # React root render, wraps <App /> in StrictMode
    └── App.jsx           # Entire application (UI, data layer, business logic)
```

The app is intentionally a single component file (`src/App.jsx`) containing:
- **Data access helpers** — `sbGet`, `sbPost`, `sbPatch`, `sbDelete`: thin wrappers around `fetch` calling the Supabase REST endpoint (`/rest/v1/...`) directly, rather than the `@supabase/supabase-js` client SDK.
- **Presentational components** — `Modal`, `FormFields`, `EventCard`, defined outside `App` to avoid remounting/focus bugs.
- **`App`** — top-level component holding all state (events, members, filters, calendar cursor, modal state) and orchestrating CRUD calls.

## Backend / Infrastructure

- **Database & API**: [Supabase](https://supabase.com) (hosted Postgres). T                 |
|----------------|--------------------he app talks directly to Supabase's auto-generated REST API (PostgREST) at:
  ```
  https://kubuypsabeimcgqzwsgu.supabase.co/rest/v1/
  ```
- **Table**: `events` — expected columns: `id`, `member`, `date`, `time` (nullable), `note`. Sorted server-side via `?order=date.asc,time.asc`.
- **Auth**: No Supabase Auth is used. The `apikey`/`Authorization` headers use the public **anon key**, meaning data access is governed entirely by Supabase Row Level Security (RLS) policies on the `events` table (not visible in this repo).
- **Credentials**: The Supabase URL and anon key are hardcoded as constants in `src/App.jsx` rather than loaded from environment variables (`import.meta.env`). This is workable because the anon key is designed to be public, but it does mean the project has no `.env` file and no config layering between environments.
- **Local persistence**: Family `members` (name, emoji, color) are stored in the browser's `localStorage` under `fs_members`, not in Supabase — only `events` are server-backed.
- **Admin gate**: A hardcoded 4-digit PIN (`ADMIN_PIN` in `App.jsx`) gates access to the "Manage Members" settings modal. This is a UI-level deterrent only, not real authentication/authorization.

## Data Flow

1. On mount, `App` calls `loadEvents()` → `GET /rest/v1/events` → populates state.
2. Add/Edit/Delete perform optimistic-ish local state updates alongside `POST`/`PATCH`/`DELETE` calls to the same REST endpoint.
3. Member list is local-only (`localStorage`), edited through the PIN-protected settings modal.

## Scripts

| Command           | Description                          |
|--------------------|--------------------------------------|
| `npm run dev`      | Start Vite dev server                |
| `npm run build`    | Production build (output to `dist/`) |
| `npm run preview`  | Preview the production build locally |

## Deployment

This is a static Vite build (`dist/`) — it can be hosted on any static host (Netlify, Vercel, GitHub Pages, or served via XAMPP/Apache as static files) since all persistence happens client-side against Supabase's REST API. No custom server/backend process is required.

## Notes / Known Limitations

- No environment-based config — Supabase credentials and the admin PIN are hardcoded in source, so multiple environments (dev/staging/prod) would require code changes or a manual refactor to `import.meta.env` variables.
- No automated tests or linting configured.
- Security of `events` data depends entirely on Supabase RLS policies, since the anon key alone offers no per-user restriction in this codebase.
