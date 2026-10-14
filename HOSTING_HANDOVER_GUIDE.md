# 🌿 Lao Natural Essentials — Production Hosting Handover Dossier

**Target Audience:** DevOps / Cloud Hosting / System Administrator  
**Project:** Lao Natural Essentials E-Commerce Platform  
**Repository:** `https://github.com/laonatur4l-com/lao_natural_pj01`  
**Production Branch:** `main`  
**Master Administrative Account Email:** `Laonatur4l@gmail.com`  
*(All platform accounts — GitHub, Supabase, Vercel, Render, and Google Cloud Console — are registered under and managed with this email address).*

---

## 1. System Architecture Overview

```
                      ┌──────────────────────────────────────────┐
                      │             Custom Domain                │
                      │     (e.g., https://laonatural.com)       │
                      └─────────────────────┬────────────────────┘
                                            │
                       ┌────────────────────┴───────────────────┐
                       ▼                                        ▼
             ┌───────────────────┐                    ┌───────────────────┐
             │  Vercel Frontend  │                    │   Render Backend  │
             │   (React + Vite)  │────── API calls ──▶│  (Node.js Express)│
             └─────────┬─────────┘                    └─────────┬─────────┘
                       │                                        │
                       │           ┌──────────────────┐         │
                       ├──────────▶│     Supabase     │◀────────┤
                       │  Client   │   (PostgreSQL &  │  Admin  │
                       │  Session  │ Storage Buckets) │ (Service│
                       │           └──────────────────┘   Role) │
                       │                                        │
                       ▼                                        │
             ┌───────────────────┐                              │
             │ Google Cloud Auth │◀─────────────────────────────┘
             │  (OAuth 2.0 Web)  │
             └───────────────────┘
```

The system is organized as a monorepo containing two core services:
* **Frontend (`/frontend`):** React 19 Single Page Application built with Vite, Tailwind CSS, Lucide icons, and React Router v7. Hosted on **Vercel**.
* **Backend (`/backend`):** Node.js 20+ Express API with Helmet, rate limiting, and CORS protection. Hosted on **Render**.
* **Database & Storage:** Managed PostgreSQL 15 and Object Storage buckets hosted on **Supabase**.
* **Authentication:** Hybrid model (Customer Google OAuth via Supabase client SDK; Employee/Admin password authentication via backend API).

---

## 2. Master Account & Platform Credentials Summary

All cloud provider accounts are tied to the unified master email:

| Platform | Role | Registered Email | Dashboard URL |
| :--- | :--- | :--- | :--- |
| **GitHub** | Source code & Version control | `Laonatur4l@gmail.com` | `https://github.com/laonatur4l-com/lao_natural_pj01` |
| **Vercel** | Frontend Web Hosting | `Laonatur4l@gmail.com` | `https://vercel.com/laonatur4l-com/lao-natural-pj01` |
| **Render** | Backend API Web Service | `Laonatur4l@gmail.com` | `https://dashboard.render.com` |
| **Supabase** | Database & Object Storage | `Laonatur4l@gmail.com` | `https://supabase.com/dashboard/project/rstapddufiwagvrsphqr` |
| **Google Cloud** | Google OAuth 2.0 Client | `Laonatur4l@gmail.com` | `https://console.cloud.google.com` |

---

## 3. Platform Configuration & Environment Variables

### A. Frontend Service (Vercel)

* **Project Name:** `lao-natural-pj01`
* **Root Directory:** `frontend`
* **Framework Preset:** `Vite`
* **Build Command:** `npm run build`
* **Output Directory:** `dist`
* **Node.js Version:** `20.x`
* **SPA Routing:** Ensure all client-side routes rewrite to `/index.html`.

#### Frontend Environment Variables (Configured on Vercel Dashboard):
| Variable Name | Production Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://lao-natural-backend.onrender.com/api` *(or custom API subdomain)* | Base URL for backend Express API |
| `VITE_SUPABASE_URL` | `https://rstapddufiwagvrsphqr.supabase.co` | Supabase API endpoint for Auth & media URLs |
| `VITE_SUPABASE_ANON_KEY` | *(Supabase Project API Public Anon Key)* | Safe public key for browser Google OAuth session |

> ⚠️ **Security Notice:** Do **NOT** delete or alter these 3 variables on Vercel. Never place `SUPABASE_SERVICE_ROLE_KEY` in Vercel.

---

### B. Backend Service (Render)

* **Service Name:** `lao-natural-backend`
* **Service Type:** Web Service
* **Root Directory:** `backend`
* **Environment:** `Node`
* **Build Command:** `npm install`
* **Start Command:** `npm start`
* **Health Check Endpoint:** `/health` (Returns HTTP 200 `{"status": "ok"}`)
* **Auto-Deploy:** Enabled on push to `main` branch.
* **Instance Tier Recommendation:** Paid Starter ($7/mo) — Avoid the Free Tier in production to eliminate cold-start sleep delays for shopping customers.

#### Backend Environment Variables (Configured on Render Dashboard):
| Variable Name | Recommended Production Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production security & suppresses stack traces |
| `PORT` | `10000` *(Render sets this automatically)* | Port on which the Express server listens |
| `SUPABASE_URL` | `https://rstapddufiwagvrsphqr.supabase.co` | Supabase project API URL |
| `SUPABASE_ANON_KEY` | *(Supabase Project API Public Anon Key)* | Fallback anonymous client key |
| `SUPABASE_SERVICE_ROLE_KEY` | *(Supabase Project Settings ➜ API ➜ service_role)* | **CRITICAL:** High-privilege secret key for server-side uploads & RLS bypass |
| `ALLOWED_ORIGINS` | `https://lao-natural-pj01.vercel.app,https://yourcustomdomain.com` | Comma-separated CORS allowed origins |
| `OWNER_EMAILS` | `superadmin@laonatural.com,owner@laonatural.com,Laonatur4l@gmail.com` | Comma-separated emails granted administrative access |
| `RATE_LIMIT_WINDOW_MS` | `900000` (15 minutes) | DDoS / brute-force protection window |
| `RATE_LIMIT_MAX_REQUESTS` | `300` | Max requests per IP window |

---

### C. Database & Storage (Supabase)

* **Project Reference:** `rstapddufiwagvrsphqr`
* **Region:** Southeast Asia (`ap-southeast-1` Singapore recommended for Laos & Thailand users)
* **Tables:**
  * `products`, `categories`, `promotions`, `exchange_rates` (Catalog & Promotions)
  * `orders`, `order_items` (Order lifecycle & BCEL One slip uploads)
  * `distributors`, `banners` (Store locations & homepage hero slides)
  * `profiles` (User metadata & contact information)
* **Storage Buckets (Public Read Enabled):**
  * `products` — Product photos & gallery
  * `banners` — Promotional homepage carousel images
  * `distributors` — Distributor branch logos & store fronts
  * `screenshots` — Customer payment transfer slips (BCEL One)

---

### D. Google Cloud Platform (OAuth 2.0 Web Client)

* **Project:** Lao Natural Essentials
* **Consent Screen Configuration:**
  * **Publishing Status:** Must be set to **In Production** (otherwise only test users can log in).
  * **App Name:** `Lao Natural Essentials`
  * **App Logo:** Upload `lao_logo.png` (located in `frontend/public/lao_logo.png`) so the Google login popup displays the authentic Lao Natural brand logo.
  * **Support & Developer Contact Email:** `Laonatur4l@gmail.com`
* **Credentials (OAuth 2.0 Web Client ID):**
  * **Authorized JavaScript Origins:**
    * `https://rstapddufiwagvrsphqr.supabase.co`
    * `https://lao-natural-pj01.vercel.app`
    * `https://yourcustomdomain.com` *(When custom domain is live)*
  * **Authorized Redirect URIs:**
    * `https://rstapddufiwagvrsphqr.supabase.co/auth/v1/callback`

---

## 4. Pre-Launch Verification Checklist for the Hosting Professional

- [ ] **Custom Domain Setup:** Add your custom domain (e.g. `laonatural.com` and `www.laonatural.com`) in Vercel Domains and configure DNS A/CNAME records with SSL certificate verification.
- [ ] **CORS & Redirect URIs:** When the custom domain is active, add it to:
  1. `ALLOWED_ORIGINS` in Render's environment variables.
  2. Authorized JavaScript origins in Google Cloud Console.
  3. Additional Redirect URLs in Supabase Auth Settings.
- [ ] **Supabase Automated Backups:** Verify that automated daily backups are turned on under *Supabase ➜ Project Settings ➜ Database ➜ Backups*.
- [ ] **Secret Verification:** Confirm that `SUPABASE_SERVICE_ROLE_KEY` is present and valid in Render's environment variables to prevent storage upload permission errors.
- [ ] **End-to-End Test Pass:**
  1. Customer Google OAuth sign-in on live domain.
  2. Add items to cart (verify Buy-One-Get-One promotion calculations).
  3. Checkout with BCEL One QR payment and upload slip.
  4. Log into Employee/Owner portal, inspect the order slip, and verify the approval/rejection modal functions properly.
