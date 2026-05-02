# Verisigil Manual Testing Checklist

Use this checklist after local setup or before handing the project to another developer.

## Services

- Start PostgreSQL and confirm the Verisigil database exists.
- Start the AI service:
  `cd C:\Users\mjd\Desktop\verisigil-ai-service`
  `.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload`
- Start the Node backend:
  `cd C:\Users\mjd\Desktop\verisigil-node-backend`
  `npm run dev`
- Start the React frontend:
  `cd C:\Users\mjd\Desktop\mjd-junior-front`
  `npm run dev`

## Health Checks

- Backend health:
  `GET http://localhost:4000/api/health`
- Backend readiness:
  `GET http://localhost:4000/api/ready`
- AI health:
  `GET http://127.0.0.1:8000/health`

## Frontend Login

- Open the frontend local URL, usually `http://localhost:5173`.
- Navigate to `/login`.
- Login with the seeded company user.
- Confirm redirect to `/dashboard`.
- Confirm authenticated dashboard requests do not return `401`.

## Guest Logo Check

- Logout or open a fresh guest session.
- Navigate to `/check`.
- Upload a valid PNG, JPG, JPEG, or SVG image.
- Confirm analysis succeeds.
- Confirm the request reaches Node through `POST /api/logos/check`.
- Confirm Node reaches AI through `POST /ai/full-analysis`.

## Guest History

- After a guest logo check, navigate to `/history`.
- Confirm the analysis appears.
- Refresh the page and confirm the same browser still sees guest history.

## Analysis Details

- Click a history item.
- Confirm `/history/:id` opens.
- Confirm status, confidence, brand, notes, source, and created date render.

## Company Dashboard

- Login as a company user.
- Open `/dashboard`.
- Confirm stats load.
- Confirm recent analyses render.
- Confirm reported violations count is visible.

## Upload Authentic Logo

- On `/dashboard`, enter a brand name.
- Upload a valid image.
- Confirm upload succeeds.
- Confirm the logo appears in the company logo list/dashboard data after refresh.

## Report Violation

- On `/dashboard`, submit a violation report.
- Confirm the request succeeds.
- Refresh dashboard.
- Confirm reported violation count updates.

## Logout

- Click logout.
- Confirm the session clears.
- Confirm protected routes redirect to `/login`.

## Validation Commands

Frontend:

```powershell
cd C:\Users\mjd\Desktop\mjd-junior-front
npm run lint
npm run build
```

Node backend:

```powershell
cd C:\Users\mjd\Desktop\verisigil-node-backend
npm run dev
```

AI service:

```powershell
cd C:\Users\mjd\Desktop\verisigil-ai-service
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

## Known Manual Checks

- A missing AI service should show a clear analysis error, not crash the backend.
- Invalid uploads should return user-friendly validation errors.
- Guest flow should work without login.
- Company flow should still work with JWT login.
