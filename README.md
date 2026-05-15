# Visitor Registration Via Voice

A starter repository for a voice-enabled visitor registration system with CRM integration.

## Repository Structure

- `backend/` — Node.js + Express API that validates registration data and forwards it to a CRM endpoint.
- `frontend/` — React + Vite voice registration UI using browser STT/TTS.
- `.github/workflows/` — CI and GitHub Pages deployment pipelines.

## Local development

### Backend

1. `cd backend`
2. `npm install`
3. Copy `.env.example` to `.env` and update `CRM_ENDPOINT` and `MONGODB_URI`
4. `npm run dev`

### Frontend

1. `cd frontend`
2. `npm install`
3. `npm run dev`

## MongoDB

The backend now persists visitor records to MongoDB before forwarding the data to the CRM. Set `MONGODB_URI` to your MongoDB Atlas or Render-connected MongoDB instance.

## Frontend configuration

The frontend supports an optional `VITE_API_BASE` environment variable to point to the backend service URL.

Example frontend config:

- `VITE_API_BASE=https://visitor-registration-backend.onrender.com`

If `VITE_API_BASE` is not set, the frontend will use a relative request path (`/api/visitor/voice-register`).

## Render deployment

This repository includes `render.yaml` for Render deployment:

- `visitor-registration-backend` as a Node web service
- `visitor-registration-frontend` as a static site

### Render setup

1. Create a Render account and connect this GitHub repository.
2. Create a new `web_service` using the `visitor-registration-backend` service in `render.yaml`.
3. Add the required backend environment variables in Render:
   - `MONGODB_URI`
   - `CRM_ENDPOINT`
   - `PORT` (optional)
4. Create a new `static_site` using `visitor-registration-frontend` and set:
   - `VITE_API_BASE` to the backend URL
5. Deploy both services and verify the frontend can reach the backend.

If you use a Render internal service hostname, set `VITE_API_BASE` accordingly.

## GitHub deployment

This repository includes GitHub Actions to:

- build the frontend on every push and pull request
- publish the frontend to GitHub Pages from the `gh-pages` branch

After pushing to `main`, the workflow will automatically build and deploy the static site.

## Notes

- The frontend currently sends form submissions to `/api/visitor/voice-register`.
- For full MERN integration, connect the backend to MongoDB and a real CRM endpoint.

