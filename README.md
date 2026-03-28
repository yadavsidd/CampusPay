# CampusPay: Algorand Student Wallet

A decentralized campus ecosystem for students to send/receive ALGO, trade on a marketplace, post gigs, and split expenses.

## Project Structure

```
├── frontend/     # React + Vite + TailwindCSS
├── backend/      # Express + SQLite + Algorand SDK
├── contracts/    # Algorand smart contracts (TEALScript)
└── .env.example  # Environment variable reference
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Backend

```bash
cd backend
npm install
npm run dev
```

Runs on `http://localhost:3001`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`

### Environment Variables

Copy `.env.example` and create:
- `frontend/.env` — set `VITE_API_URL` to your backend URL
- `backend/.env` (optional) — set `PORT` and `CORS_ORIGIN`

### Production Build

```bash
# Build frontend static files
cd frontend && npm run build

# Start backend in production mode
cd backend && npm start
```

## Tech Stack

- **Frontend**: React 19, Vite 6, TailwindCSS 4, Framer Motion
- **Backend**: Express 4, better-sqlite3, algosdk
- **Blockchain**: Algorand Testnet, Pera Wallet
