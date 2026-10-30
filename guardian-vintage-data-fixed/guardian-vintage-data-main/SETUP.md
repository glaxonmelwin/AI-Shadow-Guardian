# Getting this running locally

I checked the project end-to-end: `npm install`, `tsc -b`, and `vite build`
all complete with **zero errors** — every source file the app imports is
present, so nothing in `src/` was actually broken or missing.

The one thing that *was* missing is environment configuration, which this
zip didn't include (it was originally set up on vly.ai's cloud sandbox,
which injects these for you — see `README.md`'s "Environment Variables"
section). There was also no `.gitignore`, so `node_modules`/`dist` would
get swept into version control/zips. Both are fixed here.

## What was added
- `.env.local.example` — template for the required `VITE_CONVEX_URL`
- `.gitignore` — keeps `node_modules`, `dist`, and `.env*` out of the repo

## How to run

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up a Convex backend (this project needs one — it's the app's
   database + auth layer):
   ```bash
   npx convex dev
   ```
   This logs you into Convex, creates/links a deployment, writes
   `CONVEX_DEPLOYMENT` and `VITE_CONVEX_URL` into a `.env.local` file for
   you automatically, and pushes the functions in `src/convex/`. Leave
   this command running in its own terminal — it watches for backend
   changes.
3. In a second terminal, start the frontend:
   ```bash
   npm run dev
   ```
4. Open the printed local URL (typically http://localhost:5173).

If you'd rather not use `npx convex dev`'s auto-setup, copy
`.env.local.example` to `.env.local` and fill `VITE_CONVEX_URL` in yourself
from an existing Convex deployment's dashboard.

### Build for production
```bash
npm run build   # runs tsc -b && vite build, outputs to dist/
npm run preview # serve the production build locally
```
This also requires `VITE_CONVEX_URL` to be set at build time, since Convex
client URL is baked in by Vite.
