# UserOps

![UserOps — User Operations Platform](public/og-image.png)

**UserOps** is a role-based user operations platform for managing accounts, access, activity, and operational analytics in one workspace.

[![Live application](https://img.shields.io/badge/Live-userops.vercel.app-111827?style=flat&logo=vercel&logoColor=white)](https://userops.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-App%20Router-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

## What it includes

- **Role-scoped user management** with account creation, role assignment, and account status controls.
- **Analytics** for account, activity, login, and engagement data, with selectable date ranges.
- **Activity timeline** with date and user filters, pagination, and audit events.
- **Authentication and account recovery** using secure HTTP-only session cookies and recovery codes.
- **Audit logging** for important authentication and user-management actions.
- **Responsive application shell** with settings, navigation, and smooth scrolling.

## Roles and access

Access is enforced by the application and its API. Data visibility follows the signed-in user's role and ownership scope.

| Role | Access scope |
| --- | --- |
| **Super Admin** | Platform-wide users and activity. |
| **Admin** | Their managed organization, including managers and users under those managers. |
| **Manager** | Users they manage. |
| **User** | Their own account and personal activity. |

Users created by a manager or admin receive a generated temporary password and recovery code. These credentials are shown once when the account is created; share them securely with the new user.

## Technology

- [Next.js](https://nextjs.org/) App Router and Route Handlers
- TypeScript and React
- MongoDB with Mongoose
- JWT authentication in HTTP-only cookies
- Zod request and form validation
- Tailwind CSS, Framer Motion, GSAP, and Lenis

## Getting started

### Requirements

- Node.js compatible with the version required by the installed Next.js release
- npm
- A MongoDB database (local or MongoDB Atlas)

### Install and run

```bash
git clone <repository-url>
cd userops
npm install
```

Create `.env.local` from the example file:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Set the database connection and a long, random JWT secret in `.env.local`:

```dotenv
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
JWT_ACCESS_SECRET=<long-random-secret>
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Initial account

Use the account creation flow to create the initial account. The first account is provisioned as the platform Super Admin. After setup, Super Admins and other permitted management roles can create accounts from the Users page.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server. |
| `npm run build` | Create a production build. |
| `npm run start` | Serve the production build. |
| `npm run lint` | Run ESLint. |

## API

The application serves its API under `/api/v1`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/health` | Health check. |
| `POST` | `/api/v1/auth/bootstrap` | Bootstrap the first Super Admin. |
| `POST` | `/api/v1/auth/register` | Register an account when registration is available. |
| `POST` | `/api/v1/auth/login` | Authenticate a user. |
| `POST` | `/api/v1/auth/logout` | End the current session. |
| `GET` | `/api/v1/auth/me` | Get the current user's session profile. |
| `POST` | `/api/v1/auth/forgot-password` | Start account recovery with a recovery code. |
| `POST` | `/api/v1/auth/reset-password` | Complete a password reset. |
| `POST` | `/api/v1/auth/change-password/verify` | Verify credentials before a password change. |
| `POST` | `/api/v1/auth/change-password/complete` | Complete a verified password change. |
| `GET` | `/api/v1/users` | List users in the caller's permitted scope. |
| `POST` | `/api/v1/users` | Create a user, subject to role permissions. |
| `GET` | `/api/v1/users/me` | Get the current user's profile. |
| `PATCH` | `/api/v1/users/:id/status` | Update a user's account status. |
| `PATCH` | `/api/v1/users/:id/role` | Update a user's role. |
| `GET` | `/api/v1/analytics` | Get role-scoped analytics for a selected period. |
| `GET` | `/api/v1/audit-logs` | Get role-scoped, filterable activity records. |

API endpoints that require a signed-in user use the application's HTTP-only session cookie and enforce role and ownership checks on the server.

## Deployment

UserOps is a single Next.js application. To deploy it to Vercel, import the repository with the repository root as the project root, then configure:

- `MONGODB_URI`
- `JWT_ACCESS_SECRET`
- `NODE_ENV=production`

No separate Express service, backend deployment, or CORS configuration is required.

## Social preview image

The app's Open Graph and X/Twitter metadata use [`public/og-image.png`](public/og-image.png). Next.js serves this image at `https://userops.vercel.app/og-image.png`; the same asset is displayed at the top of this README.

## License

No license file is currently included in this repository. All rights are reserved unless a license is added.
