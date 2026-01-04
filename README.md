# Pastebin-Lite

Pastebin-Lite is a simple Pastebin-style web application that allows users to create text pastes and share them via a unique URL.

Each paste can optionally expire based on:
- Time (TTL)
- Number of views

The project is backend-focused, intentionally minimal on UI, and designed to behave **correctly under automated tests and concurrent access**.

---

## Features

- Create a paste containing arbitrary text
- Generate a shareable URL for each paste
- View pastes via browser or API
- Optional expiration:
  - Time-based expiry (TTL)
  - View-count limit
- Deterministic expiry logic for automated testing
- Safe rendering of paste content (no script execution)
- Correct behavior under concurrent access

---

## Tech Stack

- **Backend:** Node.js, Express
- **Database:** PostgreSQL (raw SQL, no ORM)
- **Frontend:** Plain HTML + minimal JavaScript
- **Deployment:** Designed for Render or similar platforms

---

## API Endpoints

### Health Check

**GET** `/api/healthz`

**Response**
```json
{ "ok": true }
```
### Create Paste

**POST** `/api/pastes`

**Request body:**
```json
{
  "content": "string",
  "ttl_seconds": 60,
  "max_views": 5
}
```

**Rules:**
- content is required and must be a non-empty string
- ttl_seconds is optional, integer ≥ 1
- max_views is optional, integer ≥ 1

**Response:**
```json
{
  "id": "string",
  "url": "/p/<id>"
}
```

### Fetch Paste (API)

**GET** `/api/pastes/:id`

**Response:**
```json
{
  "content": "string",
  "remaining_views": 4,
  "expires_at": "2026-01-01T00:00:00.000Z"
}
```
Unavailable pastes (missing, expired, or view-limit exceeded) return 404.

### View Paste (HTML)

**GET** `/p/:id`

- Returns HTML containing the paste content
- Returns HTTP 404 if the paste is unavailable
- Paste content is rendered safely

### Frontend Usage
- Visit / to create a new paste using a simple web form
- After creation, a shareable link is displayed
- Visit /p/:id to view the paste in the browser
UI styling is intentionally minimal; functionality is prioritized.

### Deterministic Time Support
For automated testing, deterministic expiry logic is supported.

If the environment variable is set:
```
TEST_MODE=1
```
Then the request header:
```
x-test-now-ms: <milliseconds since epoch>
```
is treated as the current time for expiry logic only.
If the header is absent, real system time is used.

### Persistence Layer
The application uses PostgreSQL as the **persistent** layer.
- All paste data is stored in a `pastes` table
- View count and expiry checks are handled at the database level
- Atomic transactions are used to ensure correctness under concurrent access
- No in-memory storage is used

### Running Locally
**Prerequisites**
- Node.js (v18+ recommended)
- PostgreSQL database

**Setup**
1. Clone the repository
2. Install dependencies
```
npm install
```
3. Create a `.env` file:
```
DATABASE_URL=postgres://user:password@host:port/dbname
PORT=3000
TEST_MODE=0
```
4. Create the database table:
```
node src/migrate.js
```
5. Start the server:
```
npm run dev
```

The app will be available at:
```
http://localhost:3000
```

### Notes on Design Decisions
- Express + PostgreSQL were chosen to keep the architecture simple and predictable
- Server-side logic avoids global mutable state
- Database transactions are used to prevent race conditions
- Database transactions are used to prevent race conditions

