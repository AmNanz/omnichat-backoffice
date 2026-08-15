# Security & Performance Review (Phase 5)

Date: 2026-08-13  
Scope: OmniChat Backoffice API + Web (no unit/integration tests per plan)

## Security

| Control | Status |
|---------|--------|
| JWT auth (separate secret from OmniChat) | Implemented — global `JwtAuthGuard` + `@Public()` |
| RBAC `PermissionsGuard` + `module.action` | On all backoffice controllers |
| Password hashing (bcrypt) | Users create / reset / seed |
| Input validation | Global `ValidationPipe` whitelist + forbidNonWhitelisted |
| Rate limiting | `@nestjs/throttler` from `THROTTLE_*` env |
| HTTP headers | `helmet()` in `main.ts` |
| CORS | Explicit `CORS_ORIGIN` |
| Secrets | `.env.*` gitignored; use `.env.example` |
| Separate MongoDB | `omnichat-backoffice*` only — no chat DB access |
| Omnichat provision | Token optional; no-op without `OMNICHAT_API_TOKEN` |

## Performance

| Item | Status |
|------|--------|
| Pagination on list APIs | Yes |
| Compound indexes (profile/status, audit, invoices, notifications) | Yes on schemas |
| Invoice number uniqueness | Counter collection + unique index |
| BullMQ | Redis-backed; scheduler fails soft if Redis down |
| Redis key prefix | `REDIS_PREFIX` isolates from other apps |

## Follow-ups (ops)

- Rotate JWT / Mongo credentials before production
- Run Redis in each environment for expiration/invoice jobs
- Restrict CORS and throttle limits in production env files
- Provision OmniChat internal APIs before enabling live sync
