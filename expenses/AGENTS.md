# Expenses PWA

React 18 + TypeScript + Vite PWA (`vite-plugin-pwa`). SCSS in `src/App.scss` (CSS vars: `--accent-color`, `--bg-color`, …). Charts: Highcharts. Icons: `lucide-react`. State: React context + IndexedDB offline sync.

Live: `https://marjina-constantin.github.io/expenses`  
API: `https://dev-expenses-api.pantheonsite.io` (Google login, then `JWT-Authorization: Bearer …`)

## Commands (from `expenses/`)

- `yarn` — install
- `yarn start` — Vite on port 3000
- `yarn build` — production build; output is moved to `home/` (CI publishes this; **do not commit `home/`**)
- `yarn lint` — ESLint

`package.json` `homepage` is `https://marjina-constantin.github.io/expenses`. `vite.config.ts` `base` is `/expenses/`. Routes are prefixed `/expenses/...` (`src/config/routes.ts`).

## Layout (`src/`)

- Pages: Home, Charts, Income, Add transaction, Profile, Assistant — `pages/`
- Routes: `config/routes.ts` (all prefixed `/expenses/...`)
- Types: `types/types.ts`. Item: `{ id, dt, sum, type: 'transaction' | 'incomes', cat?, dsc?, cr, updated }`
- Data: `GET /api/expenses` → IndexedDB → `processData` worker → `DataContext` (`context/`)
- UI kit: `components/ui/` (`StatCard`, `Modal`, `NumberDisplay`). Feature folders sit beside it
- Styles: single file `App.scss`, CSS variables. Do not add a new stylesheet
- Constants / API host: `utils/constants.ts` (`ROOT_URL`)
- The GitHub Pages bundle is public. Do not put API keys in frontend env/`VITE_*`

Look at a neighbor file in the same folder before adding anything. `.cursor/rules/` has DRY/KISS, this map, and a hard stop on sync/offline/fetch/totals — do not edit those unless the user asked.

## Git

This folder is not its own repo. It lives in `marjina-constantin.github.io`. See the root `AGENTS.md` for branches, CI, and `prod`.
