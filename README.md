# Talent Nation Project Hub

A home for the projects, ideas and portfolios built by Talent Nation fellows across our campuses.

Fellows submit their projects, campus mentors review and approve them, and approved work is showcased publicly by campus, category and fellow. Mentors and Heads of Campus share portfolios, and key events send Discord notifications.

## Features

- **Explore projects:** browse and search approved projects by campus, category, status and technology.
- **Fellow profiles:** each fellow has a public profile listing their skills, links and projects.
- **Project submission:** fellows submit projects (with cover image, links and team collaborators) for review.
- **Review workflow:** mentors of a campus approve or decline its submitted projects, with an optional reason.
- **Campuses:** campus pages show their fellows, projects and mentors; Heads of Campus can add or remove mentors.
- **Mentors and portfolios:** Coding Mentors and Heads of Campus share portfolios instead of projects.
- **Head of Campus requests:** users can request to become a Head of Campus; site owners approve requests.
- **Discord notifications:** DMs for new submissions, approvals/declines and Head of Campus requests.
- **Anchors:** profiles of the people behind Talent Nation.

## Tech stack

| Part | Tool |
|---|---|
| Frontend | [React 19](https://react.dev) (JavaScript + JSX) |
| Build tool / dev server | [Vite](https://vite.dev) |
| Backend (database, auth, storage, functions) | [Supabase](https://supabase.com) |
| Icons | [lucide-react](https://lucide.dev) |
| Charts | [Recharts](https://recharts.org) |
| Notifications | Discord bot via a Supabase Edge Function |

There is no separate backend server: the React app talks to Supabase directly, and access rules are enforced in the database (Row Level Security policies and triggers).

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) 20.19+ or 22.12+ (required by Vite), and npm
- Access to the project's Supabase project (ask a maintainer for the URL and anon key)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/joywuese74-web/Talent-Nation-Project-Hub.git
cd Talent-Nation-Project-Hub

# 2. Install dependencies
npm install

# 3. Create your local environment file and fill in the Supabase values
cp .env.example .env

# 4. Start the dev server
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

### Environment variables

| Variable | What it is |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL (Supabase → Project Settings → API) |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon (public) key, from the same page |

> **Note:** If these are missing or invalid, the app falls back to a local **mock database** stored in your browser (see `src/supabaseClient.js`). This is handy for working on the UI, but nothing you do in that mode reaches the real database. If you see sample data and changes don't appear for others, check your `.env`.

Never commit your `.env` file. It is already listed in `.gitignore`.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the local dev server with hot reload |
| `npm run build` | Build the production version into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Check the code with ESLint |

## Project structure

```
src/
├── App.jsx              # App shell: session, data loading and which page is shown
├── main.jsx             # Entry point that mounts <App />
├── supabaseClient.js    # Supabase client (plus the mock fallback used without a .env)
├── components/          # Shared pieces: NavBar, Footer, ProjectCard, MentorCard, ui.jsx
├── pages/               # One file per page (Home, Explore, ProjectDetail, Fellows, ...)
├── lib/
│   ├── data.js          # Campuses, categories, statuses and sample data
│   ├── theme.js         # Colours and fonts
│   ├── constants.js     # Shared constants (e.g. Discord Edge Function name)
│   └── passwordStrength.js
└── assets/              # Images bundled with the app
public/                  # Static files (logo, favicon, anchor photos)
docs/                    # Feature documentation (see below)
```

## User roles

| Role | Can do |
|---|---|
| Visitor | Browse projects, fellows, campuses, mentors and anchors |
| Fellow | Submit and edit their own projects, edit their profile, connect Discord |
| Coding Mentor | Upload portfolios; approve or decline projects from their campus |
| Head of Campus | Everything a mentor can, plus add/remove mentors for their campus |
| Site owner / admin | Approve Head of Campus requests and access the admin dashboard |

Permissions are enforced by Supabase, not just hidden in the UI.

## Backend overview (Supabase)

Main tables: `profiles`, `projects`, `campuses`, `campus_mentors`, `head_requests`, `site_owners`, `member_private`, `anchors`.

- **Storage:** project cover images are stored in the `project_image` bucket.
- **Database functions (RPC):** `add_campus_mentor`, `remove_campus_mentor`, `list_head_requests`, `delete_my_account`.
- **Edge Function:** handles Discord OAuth and DMs. Its secrets live in Supabase → Edge Functions → Secrets.

The database schema is currently managed in the Supabase dashboard and is not stored in this repo.

## Documentation

- [Project review workflow](docs/project-review.md)
- [Mentors, Heads of Campus and portfolios](docs/mentors-and-portfolios.md)
- [Discord notifications](docs/discord-notifications.md)

