# CLAUDE.md — GMP Health Vietnam CRM

Context file for Claude Code / any AI assistant working on this repo. Read this first.

> The owner prefers to be addressed as **Sam** on this project. Prefer quality over speed:
> confirm the plan and ask clarifying questions before making non-trivial changes.

---

## 1. What this is

A **client-management CRM** for **GMP Health Vietnam**, a company selling supplement/health
programs. Consultants (internally **TVV** — *tư vấn viên*) use it to onboard clients and track them
through **90-day** (also 30/60/120-day) health programs, replacing an Excel-based workflow.

- **UI language: Vietnamese only.** All labels, statuses, and copy are Vietnamese. Keep it that way.
- **Users are staff, not customers.** Clients (khách hàng) do not log in; TVVs manage records on their behalf.
- **Products (6):** `NIASOM`, `HEMKY-D`, `HEMKY`, `HETIK`, `GUEVA`, `FEMAKUL`. Each client can be tagged with multiple.
- Single shared workspace: **every signed-in staff account currently sees every client** (no per-TVV isolation yet).

Related planning docs live one level **up** from this repo, in the project folder
(`../PROJECT_PLAN.md`, `../RESEARCH_similar-repos.md`) — useful background, not required to build.

GitHub: `sammyduong1311-a11y/gmp-health-crm`. Deployed on Vercel (PWA-installable).

---

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **React 19** via **Create React App** (`react-scripts` 5) | Plain JavaScript, **not** TypeScript |
| Styling | **Inline style objects** | No Tailwind, no CSS modules. Two shared style consts: `inputStyle`, `labelStyle` |
| State | Local `useState` / `useEffect` | No Redux/Zustand/Context; no router |
| Backend | **Supabase** (Postgres + Auth) | `@supabase/supabase-js` v2 |
| Hosting | **Vercel** | Auto-deploys from GitHub main |
| Mobile | **PWA** | `public/service-worker.js`, `public/manifest.json` |

There is **no router** — screens are toggled with a `view` state variable.

### Commands
```bash
npm install        # install deps
npm start          # dev server at http://localhost:3000
npm run build      # production build -> build/
npm test           # CRA/Jest test runner (only the CRA default smoke test exists)
```

### Environment / secrets
Supabase is configured in `src/supabase.js`. It reads env vars with hardcoded fallbacks:
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY` (the **publishable / anon** key — client-safe, safe to ship)

On Vercel these are set as env vars. **Never put the Supabase service-role/secret key in this repo** —
the frontend only ever uses the anon/publishable key, and access must be enforced by Postgres RLS.

---

## 3. File map

```
gmp-health-crm/
├── CLAUDE.md                 # this file
├── README.md
├── package.json
├── public/
│   ├── index.html
│   ├── manifest.json         # PWA manifest
│   └── service-worker.js     # PWA service worker
└── src/
    ├── index.js              # React entry
    ├── supabase.js           # Supabase client (URL + anon key, env-var driven)
    ├── App.js                # ⭐ THE ENTIRE APP lives here (~1120 lines)
    ├── App.css / index.css   # minimal global styles
    └── *.test.js             # CRA default smoke test only
```

**Almost all work happens in `src/App.js`.** It has not yet been split into components (see roadmap).

---

## 4. `src/App.js` anatomy

Everything is one file. Rough top-to-bottom structure:

### Module-level constants
- `allProducts` — the 6 product names.
- `productColors` — per-product badge colors `{ bg, text }`.
- `statusConfig` — the 3 statuses with Vietnamese labels + colors:
  - `new` → "Khách mới", `active` → "Đang theo dõi", `follow-up` → "Cần tái khám".
- `PERIODS` — the 6 bi-weekly check-in labels: `"TUẦN 1-2"` … `"TUẦN 11-12"`.
- `inputStyle`, `labelStyle` — shared inline styles reused across all inputs.

### Module-level helpers
- `calculateBMI(weightKg, heightCm)` → `{ bmi, classification }`. Vietnamese WHO labels
  (Gầy / Bình thường / Thừa cân / Béo phì độ I–III).
- `assessWaist(waistCm, gender)` → Vietnamese waist-risk string, gender-aware (`"Nam"` / `"Nữ"`).
- `daysSince(dateStr)` → integer days. **Defined but currently UNUSED** — scaffolding for the
  planned "overdue check-in" flagging feature. Wire it up when building that.
- `ProgressBar({ label, current, start, goal, unit, color })` — small progress-toward-goal component.

### Components
- `LoginScreen({ onLogin })` — email/password **login + signup** (tab toggle) via Supabase Auth,
  with inline validation. Calls `onLogin(user)` on success.
- `ConfirmModal({ title, message, confirmLabel, danger, onConfirm, onCancel })` — reusable styled
  confirmation dialog. Used for all destructive actions (no native `window.confirm`).
- `App()` — the main component; holds all state and renders one of three screens.

### `App()` — state
- Auth: `user`, `authLoading`.
- List: `clients`, `loading`, `search`, `filterProduct`, `filterStatus`, `showForm`, `saving`.
- Navigation: `view` (`"list"` | `"detail"`), `activeClient`, `progressRecords`, `loadingProgress`, `showCheckInForm`.
- Edit/delete: `editingClientId`, `editingCheckInId`, `confirmState`.
- Forms: `form` (add/edit client), `checkIn` (add/edit check-in).
- `blankForm`, `blankCheckIn` — canonical empty states used to reset the forms.

### `App()` — functions
- `handleLogout`, `loadClients`, `loadProgress(clientId)`.
- `openClientDetail(client)`, `backToList()` — navigation; both clear transient edit state.
- `askConfirm(opts)` — sets `confirmState` to pop the modal.
- **Client CRUD:**
  - `openAddForm()` — open the form fresh for a new client.
  - `startEditClient(client)` — load a client into `form`, set `editingClientId`, open form in list view.
  - `handleSaveClient()` — **branches on `editingClientId`**: `insert` (adds `target_bmi:25`, `status:"new"`)
    vs `update` (preserves existing status + target_bmi, then returns to the detail view via `.select().single()`).
  - `handleDeleteClient(client)` — confirm → delete the client's `progress_records` first, then the client.
  - `updateClientStatus(newStatus)` — status dropdown on the detail view.
- **Check-in CRUD:**
  - `openCheckInForm()`, `startEditCheckIn(record)`.
  - `handleSaveCheckIn()` — **branches on `editingCheckInId`**: `insert` (sets `check_in_date`, auto-advances
    to the next period, and flips a `new` client to `active`) vs `update` (in place; keeps date, no status flip).
  - `handleDeleteCheckIn(record)` — confirm → delete by id.
- Derived: `filtered` (search+filter), `stats` (card counts), `formBMI`, `formWaist`, `setField`, `toggleProduct`.

### `App()` — render (screen selection order)
1. `if (authLoading)` → loading splash.
2. `if (!user)` → `<LoginScreen>`.
3. `if (view === "detail" && activeClient)` → **detail view** (client summary, progress bars, check-in
   add/edit form, history table, contact panel; header has Back, ✏️ Sửa, 🗑️ Xóa, status dropdown).
4. else → **list view** (header, stat cards, add/edit client form, search/filter bar, client card grid).

`ConfirmModal` is rendered at the top of both the detail and list returns, gated on `confirmState`.

---

## 5. Data model (Supabase Postgres)

Two tables. No `food_items` / `meal_plans` yet.

### `clients`
`id`, `created_at` (defaults) · `name`, `gender` (`"Nam"`/`"Nữ"`), `nickname`, `region`, `phone`,
`occupation`, `birth_year` · `height_cm`, `weight_kg`, `waist_cm`, `hip_cm` ·
`cholesterol`, `ldl`, `triglyceride`, `fatty_liver_grade` (0–3) · `treatment_days` (30/60/90/120) ·
`target_bmi` (hardcoded 25 on insert), `target_weight`, `target_waist` ·
`products` (text[] of product names) · `status` (`"new"`|`"active"`|`"follow-up"`) · `notes`.

### `progress_records`
`id`, `created_at` (defaults) · `client_id` (FK → clients.id) · `period` (one of the 6 `PERIODS`) ·
`check_in_date` · `weight_kg`, `waist_cm`, `hip_cm` · `water_litres`, `exercise_minutes`, `sleep_hours` ·
`meal_compliance` (`"Tốt"`|`"Khá"`|`"Kém"`) · `notes`.

**⚠️ RLS not verified.** Confirm row-level security policies before relying on them. The delete flow
assumes authenticated staff may delete rows; if delete is blocked by RLS it will fail silently-ish
(alerts the error). Deleting a client currently deletes its `progress_records` in app code — if the FK
has `ON DELETE CASCADE` that's redundant but harmless.

---

## 6. Conventions & gotchas

- **Vietnamese UI everywhere** — match existing tone/labels; don't introduce English strings.
- **Inline styles only** — no new CSS files or Tailwind; reuse `inputStyle` / `labelStyle` and the
  teal palette (primary `#0F766E` → `#14B8A6`, danger `#DC2626`, amber `#B45309`).
- **Destructive actions must use `ConfirmModal`**, never `window.confirm`/`alert` for confirmation.
- Form fields are stored as **strings** while editing and parsed (`parseFloat`/`parseInt`) on save;
  empty → `null`. When adding fields, follow that pattern and reset via `blankForm`/`blankCheckIn`.
- After any create/update/delete, call `loadClients()` and/or `loadProgress(activeClient.id)` to refresh.
- No TypeScript, no path aliases. Imports are relative.
- Single-file app: when it grows, extract components (see roadmap) rather than adding more inline blocks.

---

## 7. Roadmap / what's NOT built

Recently completed: **edit + delete for clients and check-ins** (this pass).

Open items, roughly in priority order:
1. **Verify Supabase RLS** (shared vs per-TVV) and the delete policy.
2. **Overdue flagging** on the dashboard — auto-badge clients with no check-in in >N days
   (use the existing `daysSince` helper); currently `follow-up` is set manually.
3. **Message/script generator** — 1-click Vietnamese consultation messages built from client data.
4. **Excel export** of clients / progress.
5. **Component refactor** — split `App.js` into `LoginScreen` (done), `ClientList`, `ClientForm`,
   `ClientDetail`, `CheckInForm`, etc. before adding much more.
6. **Meal-planning module** (food database, calorie/protein builder) — new data model needed.
7. **Per-consultant data isolation** if the team grows beyond a few trusted accounts.

Explicitly **out of scope (v1):** customer-facing portal, push/SMS/Zalo, automated scheduling,
multi-language, admin oversight panel, AI-generated meal plans.

---

## 8. Working agreement for AI assistants

- Address the owner as **Sam**. Confirm the plan and ask clarifying questions before non-trivial work.
- Prefer small, verifiable changes. After editing `App.js`, run `npm run build` (or at least
  `npx eslint`) to catch errors before handing back.
- Keep the app buildable and deployable at every step (source-only changes need no DB migration;
  data-model changes require a matching Supabase migration + RLS review).
