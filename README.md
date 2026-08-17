# TeamFlow

TeamFlow is a workspace-scoped project and task manager with departments, invitations, and role-based access.

## Local setup

Install Node 20 and run `npm ci`. Copy `.env.example` to `.env`, configure a Supabase Postgres database, then run `npx prisma migrate dev --name init` only for local development. Use `npm run dev` locally or `npm run build && npm start` to run the production server.

## Environment

`DATABASE_URL` is the pooled Supabase URL; `DIRECT_URL` is its direct URL for migrations. `JWT_SECRET` must be a long random production value (`openssl rand -base64 48`). Set `CORS_ORIGIN` to the exact frontend origin and `FRONTEND_URL` for invitation links. Production invitations require `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, and `EMAIL_FROM`.

## Migrations and deployment

Commit `prisma/migrations`. Create migrations locally using `npx prisma migrate dev --name <name>`. Production runs only `prisma migrate deploy`; never `prisma db push`. Set all environment variables on the host, build with `npm run build`, deploy, then confirm `/api/health` returns `database: connected`.

## Backup and recovery

Enable Supabase point-in-time recovery and scheduled backups. Regularly restore a backup into an isolated database and validate it. During recovery, stop writes, restore to a new database, verify integrity, update `DATABASE_URL` and `DIRECT_URL`, then redeploy.
