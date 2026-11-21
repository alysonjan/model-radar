# Deploying

The build is a plain static `dist/` (relative asset paths, no server code), so any static host
works. A ready-made GitHub Actions workflow lives at `deploy/pages.yml`.

## GitHub Pages

Pages is free for **public** repos; a **private** repo needs GitHub Pro/Team. The workflow's deploy
job is guarded by `github.event.repository.has_pages`, so it skips cleanly while Pages is off and
the build job still runs on every push.

One-time switch:

```bash
# the workflow must sit in .github/workflows, which needs the `workflow` token scope
gh auth refresh -s workflow
mkdir -p .github/workflows && cp deploy/pages.yml .github/workflows/pages.yml
git add .github/workflows/pages.yml && git commit -m "Enable Pages deploy" && git push

gh repo edit --visibility public --accept-visibility-change-consequences
gh api -X POST repos/alysonjan/model-radar/pages -f build_type=workflow
```

The site lands at `https://alysonjan.github.io/model-radar/`. `base: './'` in
`vite.config.ts` means the same `dist/` also works from a subpath or a file:// open.

## Anywhere else

`npm ci && npm run build`, then upload `dist/`. No env vars, no rewrites, no runtime — the only
network call the page makes is the OpenRouter catalogue fetch in the Live wire panel.
