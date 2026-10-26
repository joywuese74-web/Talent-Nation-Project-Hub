# Contributing to Talent Nation Project Hub

Thanks for helping build the hub! This guide explains how we work together so changes stay easy to review and safe to ship.

For setup instructions (installing, `.env`, running the app), see the [README](README.md).

## Workflow at a glance

1. Pick or open an issue
2. Create a branch from `main`
3. Make your change and check it locally
4. Open a pull request and link the issue
5. Get a review, then merge

## 1. Issues

- Every change should start from a [GitHub issue](https://github.com/joywuese74-web/Talent-Nation-Project-Hub/issues).
- Before starting, comment on the issue (or assign yourself) so two people don't work on the same thing.
- If an issue is unclear, ask in the issue thread before building.
- Found a bug or have an idea? Open a new issue with a clear title and a short description of what you expected and what happened.

## 2. Branches

Always branch from an up-to-date `main`:

```bash
git checkout main
git pull origin main
git checkout -b feat/short-description
```

Name branches by type:

| Prefix | Use for | Example |
|---|---|---|
| `feat/` | New features | `feat/project-ratings` |
| `fix/` | Bug fixes | `fix/fellowname-import` |
| `docs/` | Documentation only | `docs/readme` |
| `refactor/` | Code changes that don't change behaviour | `refactor/split-app` |
| `chore/` | Tooling, dependencies, clean-up | `chore/lint-cleanup` |

Never commit directly to `main`.

## 3. Making changes

- Keep each branch focused on **one issue or change**.
- Follow the existing code style: React function components, files in `src/pages`, `src/components` and `src/lib`.
- Before pushing, run:

```bash
npm run lint
npm run build
```

  The build must pass. Try not to add new lint errors.
- Check your change in the browser with `npm run dev`.

### Commit messages

Use a short prefix and a clear summary:

```
feat: show project counts by status on fellow cards
fix: import fellowName in App.jsx
docs: add contributing guide
```

## 4. Pull requests

- Open a pull request from your branch into `main`.
- Write a description that covers:
  - **What** changed and **why**
  - **How to test** it
  - A **screenshot** if the change affects what users see
- Link the issue using the **Development** section in the PR sidebar, or write `Closes #<issue number>` in the description.
- Vercel builds a preview of every pull request. Check that it shows **Ready**.

## 5. Reviews and merging

- Every pull request needs at least **one approval** from another collaborator before merging.
- Reviewers: check the code, test the change, and leave clear comments. Approve, or request changes with a reason.
- Authors: respond to every review comment, push fixes to the same branch, and re-request review.
- After merging, delete the branch and check that the linked issue was closed.

## 6. Database changes (migrations)

Database changes are SQL files in `migrations/`. When a migration is merged into `main`, a GitHub Action runs it on the **live database automatically**, and it **cannot be undone**. So:

- Add a new numbered file, e.g. `migrations/003_short_description.sql`. Never edit a migration that has already been merged.
- Write SQL that is safe to run more than once (`IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP POLICY IF EXISTS` and so on).
- Enable Row Level Security on every new table and add policies for who can read and write.
- Test it locally first with `npm run migrate` (needs `DATABASE_URL` in your `.env`).
- Explain the migration clearly in the PR so reviewers can check the SQL before it reaches `main`.
- Do not re-run old setup SQL from the Supabase dashboard; it can break Discord notifications.

## 7. Secrets and security

- Never commit `.env` files, passwords, API keys or tokens.
- Only the public Supabase anon key belongs in the frontend.
- Server secrets (Discord bot token, service role key, `DATABASE_URL`) live only in Supabase or GitHub secrets.
- If a secret is ever committed or shared by mistake, tell the team immediately so it can be rotated.

## Need help?

Ask in the issue or pull request thread, or reach out to the team on Discord.