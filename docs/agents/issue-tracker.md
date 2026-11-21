# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --json number,title,body,labels,comments`.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments` with appropriate filters.
- **Make an issue a sub-issue**: use `gh issue create --parent <parent>` or the platform's sub-issue API; otherwise put `Part of #<parent>` at the top of the child body.
- **Comment**: `gh issue comment <number> --body "..."`.
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`.
- **Close**: `gh issue close <number> --comment "..."`.

Infer the repo from `git remote -v`.

## Pull requests as a triage surface

**PRs as a request surface: no.**

GitHub shares one number space across issues and PRs, so resolve a bare `#42` before assuming its type.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Read it with `gh issue view`.

## Wayfinding operations

- **Map**: a single issue labelled `wayfinder:map`, with child tickets linked as sub-issues where available.
- **Blocking**: use GitHub's native issue dependencies; otherwise put `Blocked by: #<n>` at the top of the child body. A ticket is unblocked when every blocker is closed.
- **Frontier**: open children without open blockers or an assignee; first in map order wins.
- **Claim**: `gh issue edit <n> --add-assignee @me`.
- **Resolve**: comment with the outcome, close the issue, and append the context pointer to the map.
