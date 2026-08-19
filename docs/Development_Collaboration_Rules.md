# Stock Management System — Development & Collaboration Rules v2

Welcome, team! To deliver a high-fidelity prototype in just 7 days, we must work with precision. This document defines the rules for our code structure, Git workflow, and task management. Strict adherence ensures we avoid conflicts and stay on schedule.

## 1. Kanban Board & Task Management

Our progress is tracked via GitHub Projects. Every intern must follow this daily routine:

- **Morning Stand-up:** Every morning, check the Kanban board. Move one task from "Ready for Dev" to "In Progress" and assign it to yourself.
- **WIP Limit:** No intern may have more than one card in "In Progress" at a time. Finish your task before starting a new one.
- **Moving Tasks:** Once your code is complete and tested locally, move the card to "In Review" and open a Pull Request (PR). Once merged, move it to "Done."

## 2. Codebase Directory Structure

To avoid conflicts, we are using a strict Monorepo structure. You are only permitted to work within your assigned directories:

- `/frontend` (React + Vite):
  - `src/components/`: Reusable UI components.
  - `src/pages/`: Page-level views (e.g., Model 19 form).
  - `src/services/`: API call logic.
- `/backend` (Node.js + Express):
  - `src/routes/`: API endpoint definitions.
  - `src/controllers/`: Business logic and calculations.
  - `src/models/`: Database schemas.
  - `src/mock-data/`: Mock JSON for frontend testing.

## 3. Git Branching Strategy & Automation

Never push directly to main. Follow this workflow to enable automation:

1. **Update:** `git checkout main && git pull origin main` (Do this every morning).
2. **Branch:** `git checkout -b <type>/<team>/<task-name>` (e.g., `feat/frontend/model-19-form`).
3. **Work:** Write code, commit locally: `git commit -m "Descriptive message here"`.
4. **Sync:** Periodically pull main into your branch: `git fetch origin` then `git merge origin/main`.
5. **Push & PR:** Push your branch to GitHub and open a Pull Request.
   - **Mandatory:** In the Pull Request description, write `Closes #<issue-number>` (where the number is the ID of your Kanban card).
   - **Result:** This automatically links your PR to the Kanban card and moves it to "Done" when merged.

## 4. Daily "Merge Party" Rule

Code will only be merged into main during the end-of-day review sessions. Leads will review all PRs, ensure they do not break the build, and approve them. Keep your local environments clean and ready for these sessions.

## 5. Communication

If you are blocked, do not spend hours struggling alone. Raise the issue immediately during the morning stand-up or ask for help in our Telegram group: https://t.me/+uk-WnxNk_80zZmQ8

Swarming on blockers is encouraged to ensure we hit our 7-day target.
