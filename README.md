# UserOps

UserOps is now a single Next.js application containing both the frontend and backend.

## Architecture

- Next.js App Router
- Next.js Route Handlers for the API
- MongoDB Atlas + Mongoose
- JWT authentication in an httpOnly cookie
- Role-based access control
- Audit logging
- Lenis smooth scrolling
- Tailwind CSS

## API

The existing API prefix is preserved:

- `GET /api/v1/health`
- `POST /api/v1/auth/bootstrap`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/users`
- `POST /api/v1/users`
- `PATCH /api/v1/users/:id/status`
- `PATCH /api/v1/users/:id/role`
- `GET /api/v1/audit-logs`

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Set `MONGODB_URI` and a strong `JWT_ACCESS_SECRET` in `.env.local`.

Then open `http://localhost:3000`.

## Vercel

Import this repository as a Next.js project.

Do not configure a separate backend/root directory. The repository root is the Vercel project root.

Add these environment variables in Vercel:

- `MONGODB_URI`
- `JWT_ACCESS_SECRET`
- `NODE_ENV=production`

No `PORT`, Express server, CORS setup, or separate backend deployment is required.
