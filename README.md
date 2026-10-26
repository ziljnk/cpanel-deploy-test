This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deploy rehearsal

Small stand-in for exercising the linhouse cPanel deploy (build on the server, health check, rollback). `npm run build` runs `next build --webpack` with `experimental.cpus: 1`.

Copy `.env.example` to `.env.local`. No real secrets.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | MySQL on `127.0.0.1`. Unset: build and run with no database. |
| `APP_MODE` | `test` (default), `admin`, or `storefront`. `test` adds `noindex, nofollow` and `robots.txt` disallows `/`. |
| `NEXT_PUBLIC_COMMIT` or `GIT_COMMIT` | Commit id. Becomes `deploymentId` and the `commit` field on `/api/health`. Fallback `unknown`. |
| `UPLOADS_DIR` | Absolute folder served at `/uploads/...`. |
| `SHARP_SOURCE` | Optional image for `/api/thumb`. Default `assets/sample.png`. |
| `MOCK_BREAK` | Set to `health` at runtime. `/api/health` returns 500. |

Local MySQL:

```bash
mysql -h 127.0.0.1 -u root -p -e "CREATE DATABASE deploytest CHARACTER SET utf8mb4; CREATE USER 'deploytest'@'127.0.0.1' IDENTIFIED BY 'deploytest'; GRANT ALL ON deploytest.* TO 'deploytest'@'127.0.0.1';"
npm run db:migrate
npm run db:seed
NEXT_PUBLIC_COMMIT=$(git rev-parse --short HEAD) npm run build
npm start
```

`/api/health` is not cached. It returns `commit`, `appMode`, and `db` (`ok`, `skipped`, or `error`). Status is 200 when the database is up or unset, 503 when `DATABASE_URL` is set but MySQL cannot be reached.

With `DATABASE_URL` unset, the build still succeeds. The home page shows “Database not configured.” and does not open MySQL. `/api/health` returns `db: "skipped"` with status 200.

`/api/thumb` resizes an image with `sharp` (glibc check). A missing source file returns 404. If `sharp` fails to load, the route returns 500. `/uploads/...` reads `UPLOADS_DIR` on each request. linhouse does this in `app.js` (the lsnode startup file streams `public/` from disk, because `next start` only serves `public/` files that existed at build time). This mock uses a route handler instead, so the shared folder can live outside the release. If `UPLOADS_DIR` or the file is missing, the route returns 404. Neither failure affects the build or `/api/health`.

Copying the previous release’s `.next/cache` into the new release folder before `npm run build` speeds up the build.
