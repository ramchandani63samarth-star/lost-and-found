# Community Lost & Found Management System

A full-stack college/community Lost & Found platform — SDG 11 & SDG 16 project.

**Stack:** HTML · CSS · Vanilla JS · Node.js · Express · MySQL · JWT + bcrypt

---

## Quick Start

### 1. Database
```bash
mysql -u root -p
SOURCE database/schema.sql;
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MySQL credentials and a JWT secret
npm run dev
```
API runs at `http://localhost:5000`

### 3. Frontend
```bash
cd frontend
npx serve .
```
Open the URL shown. Make sure `js/config.js` points to `http://localhost:5000/api`.

### 4. Make yourself admin
```sql
UPDATE users SET role='admin' WHERE email='your@email.com';
```

---

## Project Structure

```
community-lost-found/
├── frontend/
│   ├── index.html          Landing page
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html      User home — reports + pending claim review
│   ├── report.html         New lost/found report form
│   ├── items.html          Browse & search all items
│   ├── item.html           Item detail + claim form + match suggestions
│   ├── claims.html         Full claims history (submitted + received)
│   ├── admin.html          Admin dashboard (stats + tables)
│   ├── css/style.css
│   └── js/
│       ├── config.js       API_BASE — change this for deployment
│       ├── api.js          fetch wrapper, auth helpers, nav
│       ├── common.js       escapeHtml, itemCard, toast, spinner
│       ├── auth.js         login + register form logic
│       ├── items.js        browse/search page
│       ├── item.js         item detail, claim form, matches
│       ├── claims-page.js  dedicated claims page
│       ├── dashboard.js    dashboard data + inline claim review
│       ├── report.js       new report form
│       └── admin.js        admin stats + tables
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── db.js
│   ├── middleware/auth.js
│   └── routes/
│       ├── auth.js
│       ├── items.js
│       ├── claims.js
│       └── admin.js
└── database/schema.sql
```

---

## What was fixed (v2)

### Critical bug fixes
| # | Issue | Fix |
|---|-------|-----|
| 1 | **Route ordering bug** — `/items/mine/reports` was registered *after* `/:id`, so Express matched "mine" as an item ID and returned a 404 or wrong result | Moved `/mine/reports` to the top of items routes, before `/:id` |
| 2 | **Matches required auth** — `item.html` called `/items/:id/matches` which needed a JWT token, causing console errors for logged-out visitors | Removed `auth` middleware from the matches endpoint |
| 3 | **No duplicate claim prevention** — users could spam the same claim button and create multiple pending claims on the same item | Added a DB check: if a pending claim already exists from that user, returns 409 |
| 4 | **Admin page null guard** — `admin.js` accessed `user.role` before checking if `user` was null, crashing if not logged in | Added null guard + redirect before role check |
| 5 | **Future dates allowed** — the date field had no `max` attribute, so users could report a "lost" item dated next year | Set `max = today` on the date input in both frontend and backend validation |
| 6 | **No file type validation on image upload** — multer accepted any file type | Added `fileFilter` to only allow `image/*` MIME types |

### UX improvements
- Loading spinners appear while API calls are in progress
- Toast messages animate in/out smoothly (no abrupt pop)
- "Reset filters" button on the browse page
- Claim button toggles — clicking again closes the form
- After a successful claim submit, a confirmation message replaces the form instead of just a toast
- Dashboard shows pending claims inline with Approve/Reject buttons (no need to go to a separate page)
- Item cards have a hover lift effect
- Responsive mobile nav hides text links gracefully

### Code quality
- All JS files are properly formatted and commented
- CSS is readable (no more single-line minification)
- `escapeHtml` now handles non-string inputs safely
- Server returns meaningful 404 for unknown `/api/*` routes
- Multer errors (file size, wrong type) are caught in the global error handler and returned as clean JSON

---

## Deployment

| Part | Where |
|------|-------|
| Frontend | Vercel / Netlify — deploy `frontend/` folder |
| Backend | Render / Railway / Fly.io |
| Database | PlanetScale / Clever Cloud / Railway MySQL |

Change `API_BASE` in `frontend/js/config.js` to your deployed backend URL.

---

## SDG Context
- **SDG 11 – Sustainable Cities and Communities:** Reduces waste and anxiety from lost items through organised community recovery.
- **SDG 16 – Peace, Justice, and Strong Institutions:** Provides a transparent, accountable verification workflow so items are returned to rightful owners.
