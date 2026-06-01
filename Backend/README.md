# Backend — API reference & frontend integration

This document describes how the FastAPI backend is reached from a frontend: base URL, headers, bodies, responses, errors, and examples. It matches the current code in this repository.

---

## Base URL

| Environment | Example base URL |
|-------------|------------------|
| Local default (`uvicorn main:app --host 127.0.0.1 --port 8000`) | `http://127.0.0.1:8000` |
| Same machine, alternate host | `http://localhost:8000` |

All paths below are **relative to that origin** (no `/api` prefix unless you add one behind a reverse proxy).

**Frontend env pattern:** define a single variable and join paths, e.g.:

```env
# Vite
VITE_API_BASE_URL=http://127.0.0.1:8000

# Create React App
REACT_APP_API_BASE_URL=http://127.0.0.1:8000
```

```typescript
const API_BASE = import.meta.env.VITE_API_BASE_URL; // Vite
// const API_BASE = process.env.REACT_APP_API_BASE_URL; // CRA
```

---

## Required headers

| Endpoint type | Typical headers |
|---------------|----------------|
| JSON `GET` / `POST` | `Accept: application/json` (optional; default is JSON) |
| JSON `POST` | `Content-Type: application/json` |
| **`POST /resume/analyze`** | **Do not** set `Content-Type` manually — the browser sets `multipart/form-data` with a boundary when using `FormData` |

There is **no** `Authorization` header and **no API key** passed from the client today.

---

## Authentication

**None.** All listed endpoints are public. If you add JWT or session cookies later, document token issuance and attach `Authorization: Bearer <token>` (or cookie policy) consistently.

Submitting quiz results optionally sends `user_id` in the JSON body (`POST /quiz/submit`) — that is **not** verified against a login in the current backend; treat it as a future hook for authenticated users only.

---

## Response standardization

Responses are **not** fully uniform.

| Pattern | Used by |
|---------|---------|
| `{ "success": true, ... }` | `POST /resume/analyze`, `GET /resume/analyses`, `GET /resume/analyses/{id}` |
| `{ "success": true, ... }` | `POST /quiz/submit` |
| No `success` / `message` / `data` envelope | `GET /health`, `GET /quiz/questions`, `GET /quiz/submissions/{id}` (Pydantic models define the top-level keys) |
| `GET /` | `{ "message": "..." }` only |

There is **no** global wrapper like `{ success, message, data }`.

---

## Error response format

Two shapes appear, depending on what failed.

### 1. `HTTPException` (most business / handler errors)

FastAPI returns JSON:

```json
{ "detail": <value> }
```

`<value>` is either:

- A **string** (e.g. `"Analysis not found"`, `"Submission not found"`), or  
- An **object** with fields such as `message`, `allowed`, `received`, `error`, `missing_question_ids`, etc.

### 2. Request validation (Pydantic / FastAPI, e.g. invalid JSON body)

Typical **422** shape:

```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "answers"],
      "msg": "Field required",
      "input": null
    }
  ]
}
```

### 3. Missing required file on `POST /resume/analyze`

If the multipart field is absent, FastAPI can respond with **422** and a `detail` array describing the missing `resume` field (same array style as above).

---

## File uploads

| Item | Behavior in this project |
|------|---------------------------|
| **Supported types** | **PDF** (`.pdf`), **Word** (`.docx`) only |
| **Multipart field name** | **`resume`** (required) |
| **Max size** | **Not enforced in application code** — depends on `uvicorn`/Starlette defaults and any reverse proxy (e.g. nginx `client_max_body_size`). Plan for typical resume sizes (e.g. 1–10 MB) unless you add explicit limits. |
| **Validation** | Extension must be `pdf` or `docx` (case-insensitive); filename must contain a `.` suffix; decoded text length after strip must be **≥ 20** characters. |

---

## Pagination

Only **`GET /resume/analyses`** is paginated.

| Query param | Type | Default | Constraints |
|-------------|------|---------|--------------|
| `limit` | integer | `20` | `1` … `100` |
| `offset` | integer | `0` | `≥ 0` |

The response includes **`count`**, meaning **number of rows in this response** (`items.length`). It does **not** include total row count across the database. To infer “there may be more,” request `limit + 1` or add a totals endpoint later.

---

## OpenAPI (Swagger)

When the server is running:

**Interactive docs:** [`http://127.0.0.1:8000/docs`](http://127.0.0.1:8000/docs)  

**OpenAPI JSON:** [`http://127.0.0.1:8000/openapi.json`](http://127.0.0.1:8000/openapi.json)

---

## CORS

Configured in `main.py` via **`CORS_ORIGINS`** (comma-separated). Default includes common dev ports (`3000`, `5173`).

**Requirements for browser frontends:**

1. Your SPA origin must appear exactly (scheme + host + port) in `CORS_ORIGINS` inside **`Backend/.env`** (see `Backend/.env.example`).
2. Example:

   ```env
   CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000
   ```

3. With `allow_credentials=True`, avoid `*` origins; list explicit URLs.

After changing `.env`, restart **uvicorn**.

---

## Server environment variables (backend)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Optional full SQLAlchemy URL; overrides discrete MySQL vars if set |
| `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE` | MySQL connection when `DATABASE_URL` is unset |
| `CORS_ORIGINS` | Allowed browser origins (comma-separated) |

Copy `Backend/.env.example` → `Backend/.env` and adjust.

---

## Endpoints

### 1. `GET /health`

**Purpose:** Liveness and database connectivity check.

**Request body:** none  

**Query params:** none  

**Success — `200`**

```json
{
  "status": "ok",
  "database": "reachable"
}
```

**Failure — `503`** (DB connection or query error)

```json
{
  "status": "unhealthy",
  "database": "unreachable",
  "detail": "<driver / SQL error message string>"
}
```

---

### 2. `POST /resume/analyze`

**Content type:** `multipart/form-data`  

**Form field name:** **`resume`** (type: file)

**Example (curl)**

```bash
curl -X POST "http://127.0.0.1:8000/resume/analyze" \
  -F "resume=@/path/to/resume.pdf"
```

**Success — `200`**  
Body is the same object **after** a successful DB insert (no separate “save” response). The row id is included as `analysis_id`.

```json
{
  "success": true,
  "analysis_id": 42,
  "file_name": "resume.pdf",
  "ai_analysis": {
    "ATS Score": "85/100",
    "Strengths": [
      "Good project experience",
      "Strong communication skills",
      "Clean resume structure"
    ],
    "Weaknesses": [
      "Missing GitHub portfolio",
      "Need more technical keywords"
    ],
    "Missing Skills": ["Docker", "AWS", "CI/CD"],
    "Suggestions": [
      "Add GitHub profile",
      "Add more measurable achievements",
      "Improve ATS keywords"
    ]
  }
}
```

**Note:** `ai_analysis` keys and types may change if you replace the stub in `app/resume_services/ai_resume_analyzer.py` with a real model; the DB stores this object as JSON text.

**Validation & error status codes**

| Code | When | `detail` shape |
|------|------|----------------|
| `400` | Upload has no filename | `{ "message": "Missing filename; send a PDF or DOCX resume." }` |
| `415` | Not `.pdf` / `.docx` | `{ "message": "...", "allowed": ["docx","pdf"], "received": "<ext or unknown>" }` |
| `422` | Extracted text shorter than 20 characters | `{ "message": "...", "extracted_character_count": <number> }` |
| `422` | Missing `resume` part (FastAPI) | `detail`: array of validation errors |
| `500` | DB insert fails | `{ "message": "... confirm table resume_analysis ...", "error": "<string>" }` |

---

### 3. `GET /resume/analyses`

**Query params**

| Name | Type | Default | Meaning |
|------|------|---------|---------|
| `limit` | int | `20` | Page size (`1`–`100`) |
| `offset` | int | `0` | Rows to skip from newest |
| `include_ai_preview` | boolean | `true` | Include parsed `ai_analysis` on each item when possible |

**`include_ai_preview`**

- `true`: each item may include **`ai_analysis`** — object parsed from DB JSON — good for dashboard cards **without** N detail requests.
- If the stored JSON is invalid: **`ai_analysis`: `null`** and **`ai_analysis_parse_error`: `true`**.
- `false`: **`ai_analysis` is omitted** from each item — only **`analysis_id`**, **`file_name`**, **`created_at`** (lighter payloads).

**Success — `200`**

```json
{
  "success": true,
  "count": 2,
  "items": [
    {
      "analysis_id": 42,
      "file_name": "resume.pdf",
      "created_at": "2026-05-10T12:34:56",
      "ai_analysis": {
        "ATS Score": "85/100",
        "Strengths": [],
        "Weaknesses": [],
        "Missing Skills": [],
        "Suggestions": []
      }
    },
    {
      "analysis_id": 41,
      "file_name": "older.docx",
      "created_at": "2026-05-09T10:00:00",
      "ai_analysis": null,
      "ai_analysis_parse_error": true
    }
  ]
}
```

**Errors**

| Code | `detail` |
|------|-----------|
| `500` | `{ "message": "Failed to list analyses", "error": "<string>" }` |

---

### 4. `GET /resume/analyses/{analysis_id}`

**Path param:** `analysis_id` (integer)

**Success — `200`** — fields **always** present on success:

| Field | Type | Notes |
|-------|------|--------|
| `success` | boolean | `true` |
| `analysis_id` | int | Same as path |
| `file_name` | string | Original upload name |
| `extracted_text` | string \| null | Full extracted text from file |
| `ai_analysis` | object \| null | Parsed JSON; `null` if DB value is not valid JSON |
| `created_at` | string \| null | ISO 8601 from DB timestamp |

**Example**

```json
{
  "success": true,
  "analysis_id": 42,
  "file_name": "resume.pdf",
  "extracted_text": "John Doe\nSoftware Engineer\n...",
  "ai_analysis": {
    "ATS Score": "85/100",
    "Strengths": [],
    "Weaknesses": [],
    "Missing Skills": [],
    "Suggestions": []
  },
  "created_at": "2026-05-10T12:34:56"
}
```

**Errors**

| Code | `detail` |
|------|-----------|
| `404` | `"Analysis not found"` (string) |
| `500` | `{ "message": "Failed to load analysis", "error": "<string>" }` |

---

### 5. Quiz APIs

#### `GET /quiz/questions`

**Query params**

| Name | Type | Default | Constraints |
|------|------|---------|-------------|
| `limit` | int | `10` | Clamped to `1` … `50` server-side |

**Success — `200`**

```json
{
  "questions": [
    {
      "question_id": 1,
      "question_text": "What does REST stand for in web APIs?",
      "options": {
        "A": "Remote Execution State Transfer",
        "B": "Representational State Transfer",
        "C": "Relational Structured Transfer",
        "D": "Reusable Service Transport"
      },
      "marks": 1
    }
  ]
}
```

Correct answers are **not** returned.

---

#### `POST /quiz/submit`

**Content-Type:** `application/json`

**Body schema**

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `answers` | object | yes | Map **question id →** selected option **`"A"`–`"D"`** (case-insensitive). JSON keys are strings, e.g. `"1"`. |
| `user_id` | integer \| null | no | Optional; must exist in `users.user_id` or insert may fail with **500** (FK). |

**Example**

```json
{
  "answers": {
    "1": "B",
    "2": "C"
  },
  "user_id": null
}
```

**Success — `200`**

```json
{
  "success": true,
  "submission_id": 99,
  "score_obtained": 2,
  "max_score": 3,
  "percentage": 66.67
}
```

**Errors**

| Code | Typical `detail` |
|------|------------------|
| `400` | `{ "message": "'answers' must not be empty" }` |
| `400` | `{ "message": "Some question IDs are invalid", "missing_question_ids": [7, 8] }` |
| `422` | Invalid answer key type or option not A–D (`detail` object with `message`, sometimes `received` or `hint`) |
| `500` | DB / FK (`detail` with `message`, `error`) |

---

#### `GET /quiz/submissions/{submission_id}`

**Success — `200`**

```json
{
  "submission_id": 99,
  "user_id": null,
  "score_obtained": 2,
  "max_score": 3,
  "percentage": 66.67,
  "created_at": "2026-05-10T15:00:00"
}
```

**Errors**

| Code | `detail` |
|------|-----------|
| `404` | `"Submission not found"` (string) |

---

## Sample frontend requests

### `fetch` — health

```typescript
const res = await fetch(`${API_BASE}/health`);
const data = await res.json();
if (!res.ok) {
  console.error(data);
  throw new Error('Health check failed');
}
```

### `fetch` — analyze resume

```typescript
async function analyzeResume(file: File) {
  const form = new FormData();
  form.append('resume', file); // exact field name required

  const res = await fetch(`${API_BASE}/resume/analyze`, {
    method: 'POST',
    body: form,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data?.detail ?? res.statusText), { status: res.status, body: data });
  return data;
}
```

### `axios` — list analyses with pagination

```typescript
import axios from 'axios';

const client = axios.create({ baseURL: API_BASE });

const { data } = await client.get('/resume/analyses', {
  params: { limit: 10, offset: 0, include_ai_preview: true },
});
// data.success, data.count, data.items
```

### `axios` — quiz submit

```typescript
const { data } = await client.post('/quiz/submit', {
  answers: { '1': 'B', '2': 'C' },
  user_id: null,
});
// data.success, data.submission_id, data.score_obtained, ...
```

---

## Related docs

- Module overview (schema, workflow): `../Resume-Analysis-README.md` (repo root)

---

## Run the server locally

```powershell
cd Backend
.\.venv\Scripts\Activate.ps1
py -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Then open **Swagger:** `http://127.0.0.1:8000/docs`.
