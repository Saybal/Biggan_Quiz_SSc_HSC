# বিজ্ঞান কুইজ — Full-Stack (React + Express + MongoDB)

A production-grade quiz platform with a React frontend, Express backend,
MongoDB database, and AI-powered PDF → quiz conversion.

---

## 🗂️ Monorepo Structure

```
quiz-fullstack/
│
├── package.json              ← root workspace (runs both with concurrently)
│
├── server/                   ← Express + MongoDB backend
│   ├── package.json
│   ├── .env.example          ← copy to .env and fill in
│   └── src/
│       ├── index.js          ← app entry, auto-seeder on first run
│       ├── config/
│       │   └── db.js         ← Mongoose connection
│       ├── models/
│       │   ├── Subject.js
│       │   ├── Level.js
│       │   ├── Question.js   ← compound index subjectId+levelId
│       │   ├── Result.js     ← denormalised for fast leaderboard
│       │   └── Settings.js   ← singleton (timerMin, quizOptions, etc.)
│       ├── middleware/
│       │   ├── auth.js       ← JWT requireAdmin guard
│       │   └── errorHandler.js
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── subjectController.js
│       │   ├── levelController.js
│       │   ├── questionController.js ← CRUD + bulkCreate + export
│       │   ├── resultController.js   ← save + leaderboard + admin
│       │   ├── settingsController.js
│       │   └── pdfController.js      ← multer → pdfParser → JSON
│       ├── services/
│       │   └── pdfParser.js  ← pdf-parse + GPT-4o-mini → MCQ array
│       └── routes/
│           ├── authRoutes.js
│           ├── publicRoutes.js   ← no auth
│           └── adminRoutes.js    ← all behind requireAdmin
│
└── client/                   ← React + Vite + Tailwind + react-router v7
    ├── package.json
    ├── vite.config.js        ← /api proxy → localhost:5000
    ├── tailwind.config.js
    └── src/
        ├── main.jsx          ← RouterProvider entry
        ├── api/
        │   ├── axios.js      ← instance + JWT interceptor + 401 redirect
        │   └── index.js      ← authAPI, subjectsAPI, levelsAPI,
        │                        questionsAPI, resultsAPI, settingsAPI, pdfAPI
        ├── context/
        │   └── QuizContext.jsx  ← API-powered global state (no localStorage for data)
        ├── router/
        │   └── index.jsx     ← createBrowserRouter, loaders, guards
        ├── layouts/
        │   ├── RootLayout.jsx    ← QuizProvider + Navbar + Toast
        │   ├── PublicLayout.jsx
        │   ├── QuizFlowLayout.jsx
        │   └── AdminLayout.jsx
        ├── routes/
        │   ├── public/
        │   │   ├── HomePage.jsx
        │   │   └── LeaderboardPage.jsx   ← fetches from /api/results/leaderboard
        │   ├── quiz/
        │   │   ├── SelectSubjectPage.jsx
        │   │   ├── SelectLevelPage.jsx
        │   │   ├── JoinPage.jsx
        │   │   ├── QuizPage.jsx          ← POSTs result to /api/results
        │   │   └── ResultPage.jsx
        │   ├── admin/
        │   │   ├── AdminLoginPage.jsx    ← POST /api/auth/login → JWT
        │   │   └── AdminPage.jsx         ← 6 tabs including PDF Upload
        │   ├── NotFoundPage.jsx
        │   └── ErrorPage.jsx
        ├── components/
        │   ├── layout/   ← SciBg, SelBg, ScientistPortraits (visual only)
        │   └── shared/   ← Navbar, Toast, StepTracker
        ├── hooks/
        │   └── useTimer.js
        ├── utils/
        │   └── helpers.js
        └── styles/
            └── global.css
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- OpenAI API key (for PDF parsing)

### 2. Clone and install
```bash
git clone <repo>
cd quiz-fullstack
npm install          # installs root + both workspaces
```

### 3. Configure the server
```bash
cp server/.env.example server/.env
# Edit server/.env:
#   MONGODB_URI=mongodb://localhost:27017/quiz_app
#   JWT_SECRET=your_long_random_secret_here
#   OPENAI_API_KEY=sk-...
#   ADMIN_PASSWORD=admin123
```

### 4. Run both servers together
```bash
npm run dev          # starts both server (port 5000) and client (port 5173)
```

Or individually:
```bash
npm run dev:server   # Express on :5000
npm run dev:client   # Vite on :5173
```

### 5. First run
On first start, the server **auto-seeds** MongoDB with:
- Default subjects (গণিত, পদার্থ, রসায়ন)
- Default levels (SSC, HSC, Admission)
- Sample questions
- Admin settings with hashed password

Visit `http://localhost:5173` to see the app.
Admin panel: `http://localhost:5173/admin/login` — default password: `admin123`

---

## 🌐 API Reference

### Public (no auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subjects` | All subjects |
| GET | `/api/levels` | All levels |
| GET | `/api/questions?subjectId=&levelId=` | Questions (filtered) |
| POST | `/api/results` | Save quiz attempt |
| GET | `/api/results/leaderboard?subjectId=&levelId=&limit=50` | Leaderboard |
| GET | `/api/health` | Health check |

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | `{ password }` → `{ token, timerMin, quizOptions }` |
| POST | `/api/auth/change-password` | `{ newPassword }` — requires JWT |

### Admin (all require `Authorization: Bearer <token>`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/subjects` | Create subject |
| PUT | `/api/admin/subjects/:id` | Update subject |
| DELETE | `/api/admin/subjects/:id` | Delete subject + its questions |
| POST | `/api/admin/levels` | Create level |
| PUT | `/api/admin/levels/:id` | Update level |
| DELETE | `/api/admin/levels/:id` | Delete level + its questions |
| POST | `/api/admin/questions` | Create one question |
| POST | `/api/admin/questions/bulk` | Bulk import `{ subjectId, levelId, questions[] }` |
| PUT | `/api/admin/questions/:id` | Update question |
| DELETE | `/api/admin/questions/:id` | Delete question |
| GET | `/api/admin/questions/export?subjectId=&levelId=` | Export as JSON |
| GET | `/api/admin/results` | All results + stats |
| DELETE | `/api/admin/results` | Clear all results |
| GET | `/api/admin/settings` | Get settings |
| PATCH | `/api/admin/settings` | Update settings |
| POST | `/api/admin/pdf/parse` | Upload PDF → AI → questions array |

### PDF Parse (`multipart/form-data`)
```
POST /api/admin/pdf/parse
Content-Type: multipart/form-data
field name: "pdf"
Returns: { questions: [...], count: N }
```

---

## 🔑 Key Architecture Decisions

### Why JWT instead of sessions?
Stateless — works across multiple server instances without shared session storage.
Token is stored in `localStorage`, attached to every request by the Axios interceptor.

### Why denormalise Result?
`subjectName`, `subjectEmoji`, `levelName` are copied into each Result document.
This makes the leaderboard query a single `find()` with no `$lookup` joins — fast at scale.

### How PDF parsing works
```
Admin uploads PDF
    ↓
multer stores in memory (no disk write)
    ↓
pdf-parse extracts raw text
    ↓
OpenAI GPT-4o-mini converts to MCQ JSON
    ↓
Server validates + normalises each question
    ↓
Returns preview to client
    ↓
Admin reviews, edits inline, removes bad ones
    ↓
Admin clicks "Save" → POST /api/admin/questions/bulk
    ↓
MongoDB insertMany
```

### localStorage usage (client)
| Key | Value | Purpose |
|-----|-------|---------|
| `admin_token` | JWT string | Auth for admin API calls |

Everything else (subjects, levels, questions, results, settings) lives in MongoDB, fetched via Axios on page load.

### sessionStorage usage (client)
| Key | Value | Purpose |
|-----|-------|---------|
| `qs_subjectId` | string | Quiz flow guard |
| `qs_levelId` | string | Quiz flow guard |
| `qs_session` | `'true'` | Quiz flow guard |
| `qs_result` | `'true'` | Quiz flow guard |
| `admin_authed` | `'true'` | Redundant UI guard |

---

## 🏗️ Production Deployment

### Server
```bash
cd server
node src/index.js     # or use PM2: pm2 start src/index.js
```

### Client
```bash
cd client
npm run build         # outputs to client/dist/
# Serve client/dist/ with nginx or Express static middleware
```

### Nginx example
```nginx
server {
    listen 80;
    root /path/to/client/dist;
    index index.html;

    # React SPA routing
    location / { try_files $uri /index.html; }

    # API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
    }
}
```
