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
---

## 🛠️ 5. Troubleshooting: Native Module Mismatch

If you see an error like `better-sqlite3 was compiled against a different Node.js version`:

1.  **Remove `node_modules` from Git**: This error occurs because local `node_modules` were uploaded to GitHub.
    ```bash
    git rm -r --cached .
    git add .
    git commit -m "chore: remove tracked node_modules"
    git push
    ```
2.  **Ensure `.gitignore` is present**: I have created a `.gitignore` in your root directory to prevent this in the future.
3.  **tsx Dependency**: I have moved `tsx` to `dependencies` in `backend/package.json` so it is available on Render without devDependencies.

---

## 🛠️ 6. Troubleshooting: "Failed to Fetch" (CORS/URL)

If you get a "Failed to Fetch" error in production:

1.  **Check Protocols**: Ensure both `VITE_API_URL` (on Vercel) and `CORS_ORIGIN` (on Render) start with `https://`.
2.  **Trailing Slashes**: Do not include a trailing slash in `VITE_API_URL` (e.g., use `https://api.render.com` not `https://api.render.com/`).
3.  **Multiple Origins**: If you use Vercel preview deployments, you can pass multiple origins to `CORS_ORIGIN` separated by commas.

## ✅ 4. Post-Deployment Checklist

1.  **CORS Check**: Ensure the Render backend logs show it's accepting requests from your Vercel domain.
2.  **Wallet Connection**: Verify Pera Wallet connects and shows the correct balance on the production URL.
3.  **Activity Feed**: Perform a test listing to ensure the backend logs it and the frontend displays it.
