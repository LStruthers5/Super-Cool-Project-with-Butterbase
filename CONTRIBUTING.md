# How we work

Two-person hackathon team. Keep it fast but don't clobber each other. `main` is protected — you **cannot** push to it directly; everything lands via Pull Request with 1 approval.

## One-time setup (each person)

```bash
git clone https://github.com/LStruthers5/Super-Cool-Project-with-Butterbase.git
cd Super-Cool-Project-with-Butterbase
cp .env.example .env   # then fill in your own secrets (never commit .env)
```

## The loop for every change

```bash
git switch main && git pull          # always start from latest main
git switch -c yourname/short-feature # e.g. luke/auth-screen
# ...write code...
git add -A && git commit -m "Add login screen"
git push -u origin yourname/short-feature
gh pr create --fill                  # opens a PR
```

Then the **other person** reviews and approves, and either of you clicks **Squash and merge**. Delete the branch after merge.

## Conventions

- **Branch names:** `yourname/what-it-does` — keep branches small and short-lived.
- **Commits:** present tense, what the change does ("Add cart total", not "added stuff").
- **Pull before you start, pull often.** Merge `main` into your branch if it drifts: `git switch main && git pull && git switch - && git merge main`.
- **Secrets** live in `.env` only. Add new keys to `.env.example` (with empty/placeholder values) so the other person knows they exist.
- **Talk before big refactors.** A 30-second "I'm about to change X" message saves an hour of merge pain.

## When you're racing the clock

Small, frequent PRs beat one giant PR at the end. Review each other's PRs within a few minutes so nobody is blocked.
