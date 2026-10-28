# ⚙️ Matram AI / CivicAI — Backend REST API

Production-ready Express.js, TypeScript, and MongoDB Atlas backend API for **Matram AI (CivicAI)**.

## 🚀 Features

- **MongoDB Atlas Integration**: Primary database with automatic local persistent store fallback.
- **Auto-Seeding**: Seeds sample civic issues across Tamil Nadu and South India with Before & After visual evidence on server startup.
- **RESTful Endpoints**: Complete CRUD support for civic issues, comments, upvotes/downvotes, status updates, and field officer proof resolution.
- **Resilient Fallback**: Designed to run seamlessly offline or online with zero process crashes.

---

## 🛠️ Technology Stack

- **Runtime**: Node.js & TypeScript (`tsx` watch dev server)
- **Framework**: Express.js
- **Database**: MongoDB Atlas / Mongoose (with Local Memory Store fallback)
- **CORS & Middleware**: Express JSON parser & CORS enabled

---

## 📡 API Endpoints

### 1. Civic Issues
- `GET /api/issues` — Fetch civic issues with optional filtering (`category`, `severity`, `status`, `state`, `district`, `search`, `limit`).
- `GET /api/issues/:id` — Fetch single civic issue dossier by ID.
- `POST /api/issues` — Create a new civic issue complaint.
- `POST /api/issues/:id/vote` — Upvote or downvote an issue (`{ direction: "up" | "down" }`).
- `POST /api/issues/:id/comments` — Add citizen comment (`{ userName, text }`).
- `POST /api/issues/:id/resolve` — Field officer resolution with After photo proof (`{ afterImageUrl, notes, officerName }`).

### 2. Analytics & Health
- `GET /api/stats/summary` — Aggregate platform statistics (total, resolved, in-progress, resolution rate).
- `GET /api/health` — API service health check status.

---

## 💻 Setup & Running

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Start development server
npm run dev

# Seed database manually (optional - auto-seeds on start)
npm run seed
```

---

## 🔑 Environment Variables (`backend/.env`)

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.zgnq98j.mongodb.net/matram_ai?retryWrites=true&w=majority
```
