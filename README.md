# OmniChat Backoffice

Staff/client backoffice for OmniChat (separate MongoDB, integrate via HTTP).

Frontend: Angular 19 + PrimeNG 19. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [Readme.Full.md](Readme.Full.md).

## Quick start

```bash
# API (http://localhost:3100)
cd src/api && npm install && npm run seed && npm run start:local

# Web (http://localhost:4200)
cd src/web && npm install && npm start
```

Default admin: `admin@backoffice.local` / `admin123`  
Swagger: http://localhost:3100/api/docs
