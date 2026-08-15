# OmniChat Backoffice — Architecture

## Overview

OmniChat Backoffice is a dual-app polyrepo (NestJS API + Angular web) that mirrors the folder layout of OmniChat (`src/api`, `src/web`, `deployments/`, `Jenkinsfile`).

It manages Profile → Company → User, RBAC, packages/subscriptions, usage limits, invoices, expiration jobs, notifications, audit logs, and a staff dashboard.

## Separate databases

```
Backoffice Web  →  Backoffice API  →  MongoDB `omnichat-backoffice*`
                         │
                         └── HTTP provision/sync → OmniChat API → MongoDB `omnichat*`
```

- Backoffice **never** reads/writes OmniChat collections directly.
- Link fields: `companies.omnichatCompanyId`, `users.omnichatUserId`.
- Adapter: `src/api/src/modules/omnichat-integration/` (no-op when `OMNICHAT_API_TOKEN` is empty).

## Folder map

```
Omnichat-Backoffice/
├── Jenkinsfile
├── deployments/{development,production}-{client,server}.yaml
├── docs/ARCHITECTURE.md
└── src/
    ├── api/   # NestJS 11 — port 3100
    └── web/   # Angular 19 + PrimeNG 19 + Tailwind
```

## Domain model

- **Profile** — tenant group with `companyLimit` / `userLimit`, dates, status
- **Company** — belongs to Profile; optional package; Omnichat link id
- **User** — Backoffice identity; `companyIds[]`, `roleIds[]`; Omnichat link id
- **Role / Permission** — Backoffice RBAC (`module.action`), independent from OmniChat chat roles
- **Package / Subscription** — commercial plans and assignments
- **Invoice** — billing documents (`INV-YYYYMMDD-XXXX`)
- **Notification** — in-app first; channel enum ready for Email/LINE/SMS
- **AuditLog** — append-only action history

## API

- Global prefix: `/api`
- Domain routes: `/api/backoffice/...`
- Auth: `/api/backoffice/auth/login`, `/me`, `/logout`
- Health: `/api/health` (public)
- Swagger: `/api/docs`

Security: JWT + PermissionsGuard, Helmet, Throttler, ValidationPipe (`whitelist` / `forbidNonWhitelisted`), bcrypt passwords, CORS from env.

## Background jobs (BullMQ + Redis)

Queues: `expiration-check`, `invoice-reminder`, `usage-check`, `notification`, `cleanup`

If Redis is unavailable at startup, scheduling is skipped with a warning (API still serves HTTP).

## Frontend routes

Under `/backoffice/*`: dashboard, profiles, companies, users, roles, permissions, packages, subscriptions, invoices, notifications, audit-logs, usage.

## Local run

```bash
# API
cd src/api
cp .env.example .env.local   # if needed
npm install
npm run seed
npm run start:local          # :3100

# Web
cd src/web
npm install
npm start                    # :4200 → proxies /api to :3100
```

Seed: `admin@backoffice.local` / `admin123`

## Env naming

| Env | DB example |
|-----|------------|
| local | `omnichat-backoffice-local` |
| development / production | `omnichat-backoffice` |

Do not reuse OmniChat `MONGO_URI` / JWT secrets. Backoffice uses `MONGO_URI_BACKOFFICE`.

## Phases delivered

0. Scaffold + deploy manifests + Jenkins  
1. Auth + Profile + Company + User + limits + Omnichat ids  
2. Roles/Permissions + Package + Subscription + Usage  
3. Invoice + BullMQ jobs + Notifications  
4. Dashboard + Audit logs  
5. Security/performance hardening (Helmet, throttle, indexes, Redis resilience) — no unit tests
