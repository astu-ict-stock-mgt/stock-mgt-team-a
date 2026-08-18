#!/usr/bin/env python3
"""
Bulk-create GitHub issues from backend_150_tasks_kanban.csv and add them to a
GitHub Project (v2) board.

Prereqs:
  1. Install GitHub CLI (gh) and run `gh auth login`.
  2. Create the repo and the Project (Kanban board) in GitHub first.
  3. Edit the CONFIG block below.

Usage:
  pip install --break-system-packages nothing-needed   # stdlib only
  python3 create_github_issues.py
"""
import csv
import subprocess
import sys

# ---------------- CONFIG: edit these ----------------
REPO = "astu-ict-stock-mgt/stock-mgt-team-a"     # owner/repo
PROJECT_OWNER = "astu-ict-stock-mgt"              # org or user that owns the Project
PROJECT_NUMBER = "1"                              # Project number, from its URL
CSV_FILE = "backend_150_tasks_kanban.csv"

OWNER_MAP = {
    "Dev-1 (Platform Lead)": "github-username-1",
    "Dev-2 (Auth/RBAC)": "github-username-2",
    "Dev-3": "github-username-3",
    "Dev-4": "github-username-4",
    "Dev-5": "github-username-5",
    "Dev-6": "github-username-6",
    "Dev-7": "github-username-7",
}
# ------------------------------------------------------

ALL_LABELS = (
    [f"day-{i}" for i in range(1, 8)]
    + [f"batch-{i}" for i in range(0, 10)]
    + ["setup", "schema", "service", "api", "tests", "backend"]
)


def run(cmd, capture=False):
    print("+", " ".join(cmd))
    result = subprocess.run(cmd, capture_output=capture, text=True)
    if result.returncode != 0:
        print(result.stderr, file=sys.stderr)
    return result


def ensure_labels():
    for lbl in ALL_LABELS:
        run(["gh", "label", "create", lbl, "--repo", REPO, "--color", "ededed"])


def main():
    ensure_labels()
    with open(CSV_FILE, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            title = row["Title"]
            body = row["Body"]
            labels = row["Labels"]
            owner = row["Owner"]
            gh_user = OWNER_MAP.get(owner, "")

            cmd = [
                "gh", "issue", "create",
                "--repo", REPO,
                "--title", title,
                "--body", body,
                "--label", labels,
            ]
            if gh_user:
                cmd += ["--assignee", gh_user]

            result = run(cmd, capture=True)
            url = (result.stdout or "").strip()
            if not url:
                print(f"  !! failed to create issue for {title}, skipping project add")
                continue

            run([
                "gh", "project", "item-add", PROJECT_NUMBER,
                "--owner", PROJECT_OWNER,
                "--url", url,
            ])

    print("Done. Open your Project board and arrange columns: Todo / In Progress / In Review / Done.")


if __name__ == "__main__":
    main()
