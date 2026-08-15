# Backoffice Playwright tests

E2E coverage for:

- Access: **Roles**, **Users**
- Billing / tenants: **Packages**, **Profiles**, **Subscriptions**

Requires:

- API on `http://localhost:3100` (`cd src/api && npm run start:local`)
- Web on `http://localhost:4200` (`cd src/web && npm start`)
- Seeded admin `admin@backoffice.local` / `admin123`

```bash
cd src/robot
npm install
npx playwright install chromium
npx playwright test
```

Optional env:

- `BASE_URL` (default `http://localhost:4200`)
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
