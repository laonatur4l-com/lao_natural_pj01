# 🌿 Lao Natural Essentials

E-commerce platform for Lao Natural Essentials, featuring natural skincare products, bilingual/trilingual interface (Lao, Thai, English), BCEL One QR payments, distributor locator, and real-time order processing.

---

## 🚀 Hosting & Deployment Guide

For complete, detailed instructions on hosting and deploying this project to production (Vercel, Render, Supabase, Google Cloud), please see the dedicated handover guide:

👉 **[HOSTING_HANDOVER_GUIDE.md](./HOSTING_HANDOVER_GUIDE.md)**

---

## 🛠 Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons, React Router v7. Hosted on **Vercel**.
- **Backend:** Node.js 20+, Express (ESM), Helmet, Rate Limiter, Multer. Hosted on **Render**.
- **Database & Storage:** PostgreSQL 15, Supabase Auth & Storage. Hosted on **Supabase**.
- **Authentication:** Google OAuth 2.0 (Google Cloud Platform) + Staff Role-Based Access.

---

## 💻 Local Development Setup

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
