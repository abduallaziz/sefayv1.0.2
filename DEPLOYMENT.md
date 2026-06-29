# Deploying to Vercel

This is a Next.js app. `vercel.json` is already configured for the standard Next.js build.

## Steps

1. Push this branch (`claude/verify-addition-8ual9f`) to GitHub (already done).
2. In Vercel: **Add New → Project** → import `abduallaziz/sefayv1.0.2` → set **Branch** to `claude/verify-addition-8ual9f` (Vercel defaults to deploying that branch as a Preview deployment unless you change the Production Branch in Project Settings — that's fine for testing without touching `main`).
3. Set this environment variable in **Vercel → Project Settings → Environment Variables**:
   - `NEXT_PUBLIC_API_URL` = `https://<your-railway-app>.up.railway.app/api/v1`
     (use the Railway backend URL from `apiv1.0.2`'s `DEPLOYMENT.md`, with `/api/v1` appended)
4. Deploy. Vercel runs `next build` automatically.
5. Once deployed, go back to the Railway backend and set its `FRONTEND_URL` variable to this Vercel URL (for CORS/redirects), then redeploy the backend.

No merge into `main`/`master` is performed by any of this — Vercel deploys directly from the feature branch as a preview URL.
