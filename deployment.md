# 🚀 Deployment Guide: CampusPay

This guide provides step-by-step instructions for deploying the CampusPay monorepo to production.

---

## 🏗️ 1. Backend Deployment (Render)

**Render** is ideal for the Express backend. However, note that SQLite is ephemeral by default on Render.

### **Steps:**
1.  **Create a New Web Service**: Connect your GitHub repository.
2.  **Root Directory**: Set this to `backend`.
3.  **Environment**: select `Node`.
4.  **Build Command**: `npm install`
5.  **Start Command**: `npm start`
6.  **Environment Variables**:
    -   `PORT`: `3001` (or your preferred port)
    -   `CORS_ORIGIN`: Your frontend URL (e.g., `https://campuspay.vercel.app`)

> [!WARNING]
> **SQLite Persistence**: Render's disk is ephemeral. To persist your `campus_marketplace.db`, you must go to **Settings > Disks** and create a persistent disk mounted at `/home/render/project/backend/data`, then update `database.ts` to point there. Alternatively, switch to **Render PostgreSQL** for a production-grade database.

---

## ⚡ 2. Frontend Deployment (Vercel)

**Vercel** is the best choice for Vite + React applications.

### **Steps:**
1.  **Create New Project**: Connect your GitHub repository.
2.  **Root Directory**: Set this to `frontend`.
3.  **Framework Preset**: Select `Vite`.
4.  **Build Command**: `npm run build`
5.  **Output Directory**: `dist`
6.  **Environment Variables**:
    -   `VITE_API_URL`: Your backend URL from Render (e.g., `https://campuspay-api.onrender.com`)

---

## ⚙️ 3. Algorand Network Configuration

By default, the app is configured for **Algorand Testnet**.

- **To stay on Testnet**: No changes needed. Ensure `USDC_ID` is `10458941`.
- **To move to Mainnet**:
    1.  Update `ALGOD_SERVER` in `algorandService.ts` to a Mainnet node (e.g., `https://mainnet-api.algonode.cloud`).
    2.  Change `USDC_ID` to the Mainnet USDC ID (`31566704`).
    3.  Update the `chainId` in Pera Wallet config to `416001`.

---

## ✅ 4. Post-Deployment Checklist

1.  **CORS Check**: Ensure the Render backend logs show it's accepting requests from your Vercel domain.
2.  **Wallet Connection**: Verify Pera Wallet connects and shows the correct balance on the production URL.
3.  **Activity Feed**: Perform a test listing to ensure the backend logs it and the frontend displays it.
