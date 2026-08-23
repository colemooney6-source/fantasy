# Fantasy Draft Helper

A live draft assistant: pulls NFL player rankings from ESPN's public fantasy
football API, and as you type in each pick (yours and everyone else's),
surfaces the best available pick for your team each round.

## How it works

- **`server/`** — a small Express proxy that fetches ESPN's fantasy player
  pool (rankings by scoring format, position, team, bye week) and normalizes
  it into clean JSON. A proxy is used instead of calling ESPN directly from
  the browser to avoid CORS issues and keep ESPN's response shape (which is
  undocumented and can shift) isolated in one place.
- **`client/`** — a React app. You set up your league (team count, draft
  slot, roster spots, scoring format), then track the draft pick by pick:
  search for whichever player was just taken and click "Mark drafted." The
  app tracks snake-draft order automatically and highlights when it's your
  turn.
- **`client/api/`** — the same ESPN-fetching logic, adapted as Vercel
  serverless functions, so the whole app (frontend + API) deploys as a
  single Vercel project. This is what's used in production; `server/` is
  kept around purely as a convenience for local development without needing
  the Vercel CLI.

### Recommendation algorithm

For each available player, a score is computed from:
- **Rank** — ESPN's overall draft rank for the selected scoring format.
- **Roster need** — a bonus if the player fills an open starting slot on
  your roster (bigger bonus), your FLEX spot (medium), or is bench depth
  (small).
- **Scarcity** — if the next-best available player at that position is a
  significant rank drop-off (a "cliff"), the player right before that cliff
  gets a boost, since waiting a round could mean missing the whole tier.
- **Positional runs** — if 3+ of the last 5 picks (by anyone) were the same
  position and you still need that position, it's flagged.

Each recommendation lists the specific reasons behind it, so you can use
your own judgment rather than following the score blindly.

Since ESPN doesn't expose full season point projections through this free
endpoint, this uses rank-based value-over-replacement rather than
projected-points-based value. It's a solid heuristic, not gospel — treat the
top few recommendations as your shortlist, not an auto-pick.

## Running it locally

```bash
# terminal 1 — the proxy server (default port 4000)
cd server
npm install
npm run dev

# terminal 2 — the React app (default port 5173, proxies /api to :4000)
cd client
npm install
npm run dev
```

Then open http://localhost:5173.

## Deploying to Vercel

The `client/` folder is a self-contained Vercel project: `client/api/*.ts`
becomes serverless functions automatically, and `client/vercel.json` handles
the SPA rewrite so client-side routing works. No other config is needed.

**Option A — Vercel dashboard (recommended for ongoing deploys on every push):**
1. Go to [vercel.com/new](https://vercel.com/new) and import this GitHub repo.
2. When it asks for the project's **Root Directory**, set it to `client`.
   Vercel auto-detects the Vite framework preset from there.
3. No environment variables are required. Click **Deploy**.
4. Every future push to this branch (or whichever branch you set as
   production) will auto-deploy.

**Option B — Vercel CLI, from your own machine (requires `vercel login`):**
```bash
cd client
npx vercel        # first run links/creates the project, deploys a preview
npx vercel --prod # promotes to your production URL
```

## Notes / caveats

- ESPN's player endpoint is **undocumented and unofficial**. It's the same
  one their own draft tools use, but the shape could change without notice.
  If player data stops loading, `server/src/espn.ts` is the place to look —
  the request shape and field mappings (`positions.ts`, `proTeams.ts`) are
  isolated there.
- Bye weeks are fetched from ESPN's schedule data; if that call fails for
  any reason, the app still works — bye weeks just show as unavailable.
- Draft state (settings + picks) is saved to your browser's local storage,
  so a refresh mid-draft won't lose your place. "Reset draft" clears it.
