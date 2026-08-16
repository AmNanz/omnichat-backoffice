# OmniChat Backoffice — Architecture

## Overview

OmniChat Backoffice is a dual-app polyrepo (NestJS API + Angular web) that mirrors the folder layout of OmniChat (`src/api`, `src/web`, `deployments/`, `Jenkinsfile`).

It manages Profile → Company → User, RBAC, packages/subscriptions, usage limits, invoices, expiration jobs, notifications, audit logs, and a staff dashboard.

## Separate databases

- Backoffice MongoDB (`MONGO_URI_BACKOFFICE`): Profile, Company, User, packages, billing.
- Frontoffice MongoDB (`MONGO_URI_FRONTOFFICE`): OmniChat **`users`**, **`companies`**, and **`roles`**. Creating a Profile also creates a login account, a company, an **Admin** role (`slug: administrator`, full chat permissions, scoped by `profileId`), and company membership. `users.profileId` / `companies.profileId` / `roles.profileId` → backoffice Profile `_id`. Profile stores `accountId` → `users._id`. Backoffice company stores `omnichatCompanyId`.
- OmniChat HTTP adapter still provisions companies/users (`omnichatCompanyId` / `omnichatUserId`) when `OMNICHAT_API_TOKEN` is set.

```
Backoffice Web  →  Backoffice API  →  MongoDB `omnichat-backoffice*`  (profiles, companies, users, …)
                         │
                         ├── MongoDB `omnichat*`  (users as Account)
                         └── HTTP provision/sync → OmniChat API
```

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

- **Profile** — tenant group; 1:1 with a frontoffice **user** and default **company**. Frontoffice **roles/permissions** are scoped by `profileId` (shared across companies in that profile).
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

Do not reuse OmniChat JWT secrets. Backoffice uses `MONGO_URI_BACKOFFICE` plus `MONGO_URI_FRONTOFFICE` for Account records.

## Phases delivered

0. Scaffold + deploy manifests + Jenkins  
1. Auth + Profile + Company + User + limits + Omnichat ids  
2. Roles/Permissions + Package + Subscription + Usage  
3. Invoice + BullMQ jobs + Notifications  
4. Dashboard + Audit logs  
5. Security/performance hardening (Helmet, throttle, indexes, Redis resilience) — no unit tests
