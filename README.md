# UrunanKuy — Split Bill untuk Circle Traveling

> Alternatif Splitwise gratis tanpa limit harian — catat pengeluaran bareng, hitung siapa utang ke siapa, settle up saat trip selesai.

**Live demo:** *(coming soon)*

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript |
| Backend/DB | Supabase (PostgreSQL + Auth) |
| Styling | Vanilla CSS (custom design system) |
| Hosting | Netlify (frontend) + Supabase cloud |

---

## Fitur

- 🔐 **Auth tanpa password** — magic link via email
- 🗺️ **CRUD Trip** — buat trip, invite anggota via link
- 🔗 **Join via invite link** — tanpa perlu install atau daftar dulu
- ⚡ **Input expense cepat** — <15 detik per entry, didesain untuk on-the-go
- ⚖️ **Split 3 cara** — rata, persentase, atau nominal manual
- 🧮 **Debt simplification** — algoritma greedy yang meminimalkan jumlah transaksi
- ✅ **Settle-up flow** — tutup trip dan tandai semua utang lunas sekaligus
- 📋 **Riwayat + search + filter** — cari expense per kategori
- 📱 **PWA** — bisa di-add ke home screen, tanpa install

---

## Setup

### 1. Clone & Install

```bash
git clone https://github.com/your-username/urunan-kuy.git
cd urunan-kuy
npm install
```

### 2. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com)
2. Jalankan SQL dari `supabase/schema.sql` di **SQL Editor** Supabase
3. Copy credentials dari **Settings → API**

### 3. Environment Variables

```bash
cp .env.example .env.local
# Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 4. Supabase Auth Settings

Di **Authentication → URL Configuration**:
- **Site URL**: `http://localhost:3000` (dev) / URL Netlify kamu (prod)
- **Redirect URLs**: tambahkan `http://localhost:3000/auth/callback`

### 5. Jalankan

```bash
npm run dev
# Buka http://localhost:3000
```

---

## Deploy ke Netlify

1. Push ke GitHub
2. Connect repo di [netlify.com](https://netlify.com)
3. Set environment variables di Netlify Dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Update Supabase Auth Settings:
   - **Site URL** → `https://your-app.netlify.app`
   - **Redirect URLs** → tambahkan `https://your-app.netlify.app/auth/callback`

---

## Struktur Project

```
app/
├── page.tsx                    # Landing page
├── login/                      # Auth magic link
├── auth/callback/              # OAuth callback
├── profile/                    # User profile
├── join/[inviteCode]/          # Join trip via invite link
└── trips/
    ├── page.tsx                # List trips
    ├── new/                    # Buat trip baru
    └── [tripId]/
        ├── page.tsx            # Trip overview
        ├── balance/            # Net balance + debt simplification
        ├── settle/             # Settle-up flow
        ├── history/            # Riwayat pengeluaran
        └── expenses/           # Add / detail expense

lib/
├── debt-simplifier.ts          # Greedy debt simplification algorithm
├── split-calculator.ts         # Equal / percentage / exact split logic
└── supabase/                   # Supabase clients (browser + server)

supabase/
└── schema.sql                  # Database schema + RLS policies
```

---

## Made with ☕ by Fariz Albab
