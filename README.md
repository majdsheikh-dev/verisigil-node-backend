# Verisigil Node Backend

Node.js API backend for Verisigil. It owns authentication, company workflows, upload handling, persistence, and the integration point between the React frontend and the FastAPI AI service.

## Tech Stack

- Node.js
- Express 5
- Prisma
- PostgreSQL
- JWT
- Multer
- Zod
- Axios
- Helmet
- Express Rate Limit

## Setup

```powershell
cd C:\Users\mjd\Desktop\verisigil-node-backend
npm install
Copy-Item .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run seed:user
```

## Environment Variables

```env
PORT=4000
NODE_ENV=development
APP_NAME=Verisigil Node Backend
FRONTEND_URL=http://localhost:5174
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,https://your-frontend-domain.com
JWT_SECRET=replace-with-strong-secret
JWT_EXPIRES_IN=7d
JWT_ISSUER=
JWT_AUDIENCE=
DATABASE_URL="postgresql://postgres:password@localhost:5432/verisigil_db?schema=public"
AI_SERVICE_URL=http://127.0.0.1:8000
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=10
JSON_BODY_LIMIT=100kb
URLENCODED_BODY_LIMIT=100kb
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
AUTH_RATE_LIMIT_MAX=20
ANALYSIS_RATE_LIMIT_MAX=60
```

Never commit real secrets or production database URLs.

## Run Locally

```powershell
npm run dev
```

The API runs on `http://localhost:4000/api` by default.

## Important Endpoints

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/logos/check`
- `GET /api/logos/history`
- `GET /api/logos/:id`
- `GET /api/company/profile`
- `GET /api/company/dashboard`
- `GET /api/company/dashboard/stats`
- `GET /api/company/logos`
- `POST /api/company/logos/upload`
- `POST /api/company/violations/report`
- `GET /api/company/violations`
- `GET /api/health`
- `GET /api/ready`

The backend calls the AI service at `POST /ai/full-analysis` and sends multipart field `image`.

## Testing Steps

```powershell
npm run dev
```

Then test:

```powershell
Invoke-RestMethod http://localhost:4000/api/health
Invoke-RestMethod http://localhost:4000/api/ready
```

Manual integration checks:

- Login with the seeded user.
- Upload an image through the frontend `/check` page.
- Open history and details.
- Open company dashboard.
- Upload an authentic logo.
- Submit a violation report.

## Current Limitations

- There is no automated backend test suite yet.
- Uploaded files are served as public static files.
- The current JWT flow does not include refresh tokens or HttpOnly cookies.
- The AI service is currently expected to be running separately on `AI_SERVICE_URL`.

## Future Improvements

- Add automated API tests for auth, uploads, and dashboard flows.
- Move production auth to HttpOnly cookies with refresh-token rotation.
- Make uploaded assets private or serve them through signed URLs.
- Add structured audit logging for sensitive company actions.
- Add CI checks for linting, build, and dependency scanning.
