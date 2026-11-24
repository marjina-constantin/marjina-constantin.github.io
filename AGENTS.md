# marjina-constantin.github.io

GitHub Pages user site. The product that matters is the React PWA in `expenses/`. Other folders (`node-*`, `sites/`, root `index.html`, etc.) are a static Drupal export — do not edit them unless explicitly asked.

## Git and deploy

- Repo: `marjina-constantin/marjina-constantin.github.io`
- Default branch: **`master`** (not `main`)
- Live site: `https://marjina-constantin.github.io/expenses`
- GitHub Pages serves the **`prod`** branch. **Never commit to `prod` and never force-push it.** CI owns that branch.

On every **push to `master`**, `.github/workflows/node.js.yml` does:

```
cd expenses && yarn && yarn build
cp home/index.html ../404.html && mv home/* .
force-push the result to origin/prod
```

Source on `master` → CI build → `prod` → live. The agent does not deploy; merging/pushing to `master` does.

## Workflow

1. Change only what the task needs, almost always under `expenses/`.
2. Work on a feature branch. Open a PR into `master`.
3. For small phone experiments, pushing directly to `master` is allowed if the user asks — still never touch `prod`.
4. After merge to `master`, wait for **Node.js CI**. Do not push build output yourself.

## Do not commit

- `expenses/home/` (Vite `dist` renamed by `yarn build`)
- `expenses/node_modules/`
- `expenses/dist/`
- secrets, `.env*`, tokens

Do not hand-edit root `404.html` — CI copies it from the expenses build.

## Cursor Cloud specific instructions

- App lives in `expenses/` (`base: '/expenses/'`). From repo root: `cd expenses && yarn` then `yarn start` (Vite, port 3000) or `yarn build` to verify.
- Backend is **not** in this repo. Drupal on Pantheon: `https://dev-expenses-api.pantheonsite.io`. Do not try to deploy Pantheon from here.
- No need to run the Drupal stack to change UI. Auth/API calls will fail in the cloud VM without a logged-in browser; `yarn build` is the main check.
- Do not create a new GitHub Pages or Vercel deploy. Existing CI is the only frontend deploy path.
