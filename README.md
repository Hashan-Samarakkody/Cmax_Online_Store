# Cmax Online Store

A full-stack e-commerce platform with separate Admin, Frontend, and Backend applications.

## Repository Structure

```
.
├── admin/               # Admin Panel (React + Vite)
├── Backend/             # API server (Node.js + Express)
├── Frontend/            # Customer-facing store (React + Vite)
├── .gitignore
└── README.md            # ← You are here
```

## Features

- Admin Panel  
  • Manage products, categories, users, and reports.  
  • Real-time updates via WebSocket notifications.  
  • Export reports (CSV).

- Frontend Store  
  • Browse products, collections, cart, wishlist, orders.  
  • User authentication (signup, login).  
  • Reviews, ratings, and customer dashboards.

- Backend API  
  • RESTful endpoints for auth, products, orders, reviews, etc.  
  • PDF/CSV report generation (`Backend/utils/generatePDF.js`).  
  • Image uploads via Cloudinary (`Backend/config/cloudinary.js`).

## Getting Started

### Prerequisites

- Node.js v14+  
- npm (or Yarn)  
- Git

### Environment

Each sub-project has its own `.env` file. Copy the example and set your values:

```bash
# In admin/, Frontend/ or Backend/:
cp .env.example .env
# then edit .env with your DB, API keys, etc.
```

### Install Dependencies

Run from repo root to bootstrap all:

```bash
# Admin Panel
cd admin && npm install

# Frontend Store
cd Frontend && npm install

# Backend API
cd Backend && npm install
```

### Running Locally

Open three terminals:

1. Admin Panel  
   ```bash
   cd admin
   npm run dev
   # ➜ http://localhost:5173
   ```

2. Frontend Store  
   ```bash
   cd Frontend
   npm run dev
   # ➜ http://localhost:5173 (or another port)
   ```

3. Backend API  
   ```bash
   cd Backend
   npm run start
   # ➜ http://localhost:5000 (default)
   ```

## Project Details

- Admin Panel: [admin/src/pages](admin/src/pages), [admin/vite.config.js]  
- Frontend Store: [Frontend/src/pages](Frontend/src/pages), [Frontend/vite.config.js]  
- Backend API: [Backend/server.js], [Backend/routes], [Backend/utils/generatePDF.js]

## Scripts

### Admin & Frontend

- `npm run dev` – Start Vite dev server  
- `npm run build` – Produce a production build  
- `npm run lint` – Run ESLint  

### Backend

- `npm run start` – Run server with Node  
- `npm run dev` – Run server with nodemon  
- `npm run lint` – Run ESLint  

## Deployment

1. Build Frontend & Admin:
   ```bash
   cd admin && npm run build
   cd Frontend && npm run build
   ```
2. Serve static files and backend on your production host.  
3. Configure environment variables for production.

## Contributing

1. Fork the repo  
2. Create a feature branch  
3. Submit a pull request  

