# PRD: UrunanKuy — Split Bill Web App untuk Circle Traveling

**Author:** Fariz Albab
**Status:** Draft v0.2
**Tanggal:** 14 Juli 2026

---

## 1. Latar Belakang & Problem Statement

Splitwise (kompetitor acuan) membatasi free tier menjadi ±3 expense/hari plus ads, dan mengunci fitur seperti receipt scanning, currency conversion, serta expense charts di balik Splitwise Pro ($4.99/bulan). Alternatif yang ada di pasar (Splitt, Settle Up, GoodShare) menunjukkan ada demand nyata untuk versi bebas-limit, tapi kebanyakan solo-app dengan fitur terbatas.

**Masalah yang mau diselesaikan:** mencatat pengeluaran bersama saat traveling dengan circle tertentu dan menghitung siapa-utang-berapa-ke-siapa, tanpa batasan jumlah entri harian — pain point utama Splitwise justru muncul saat trip, ketika banyak expense (sarapan, transport, tiket, makan malam) numpuk dalam satu hari dan kena limit di momen paling gak tepat.

**Tujuan proyek (disepakati eksplisit, bukan diasumsikan):**
Dual-purpose — **(1) portfolio piece** yang menunjukkan kemampuan full-stack (pola sama seperti JastipKuy: Next.js + Supabase, real data model, real users) dan **(2) dipakai nyata oleh circle traveling milik Fariz**. Kombinasi ini valid karena ada validasi dari real usage, bukan cuma dummy data. Konsekuensinya: MVP harus cukup solid untuk dipakai beneran di trip nyata, bukan sekadar demo — tapi TIDAK perlu di-scope sebagai produk komersial multi-tenant.

---

## 2. Goals & Non-Goals

### Goals (MVP)

- User bisa buat **trip** (bukan grup generik — trip punya nama, tanggal mulai/selesai, dan anggota), undang anggota, catat pengeluaran, dan lihat saldo (siapa utang ke siapa) tanpa limit harian.
- Support input banyak expense dalam waktu singkat tanpa friksi (ini pain point utama yang mau dijawab — bukan sekadar "bisa input", tapi "cepat input" pas lagi di jalan).
- Split merata, persentase, dan nominal manual (exact amount).
- Algoritma debt simplification (minimalkan jumlah transaksi settle-up), sama seperti fitur inti Splitwise.
- Settle-up per trip — begitu trip selesai, ada flow jelas untuk "kelarin semua utang trip ini", bukan saldo yang ngambang tanpa batas waktu.
- Bisa diakses via browser (web/PWA), tanpa install app store.

### Non-Goals (MVP — eksplisit di-exclude)

- Multi-currency & auto conversion. **Catatan:** kalau circle traveling Fariz sering ke luar negeri, ini perlu naik jadi P1 — perlu dikonfirmasi. Kalau domestik saja, tetap aman di sini.
- Receipt scanning (OCR).
- Payment gateway integration (settle langsung via app).
- Native mobile app (iOS/Android store).
- Multi-tenant SaaS dengan billing sendiri.

---

## 3. Target User & Constraint Realistis

- **Primary:** Fariz + circle traveling-nya (teman jalan, bukan roommate/rutin bulanan).
- **Constraint kunci yang HARUS diakui di awal:** aplikasi split-bill hanya berguna kalau _semua anggota trip_ mau pakai. Ini bukan masalah teknis, ini masalah adopsi. MVP harus meminimalkan friksi onboarding (idealnya: join trip via link, tanpa wajib install apapun, opsional tanpa perlu bikin password di awal — penting karena saat traveling, orang gak mau ribet daftar-daftar di tengah jalan).

---

## 4. Tech Stack Rekomendasi

Mengikuti stack yang sudah dikuasai dari JastipKuy — bukan alasan sentimental, tapi supaya waktu development gak kebuang belajar tools baru di tengah masa job-hunting:

| Layer      | Pilihan                                                            | Alasan                                                                                                                                                                                                  |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend   | Next.js (React)                                                    | Sudah dipakai di JastipKuy                                                                                                                                                                              |
| Backend/DB | Supabase (Postgres)                                                | Auth built-in, realtime, sudah familiar                                                                                                                                                                 |
| Auth       | Supabase Auth (email magic link) + opsi guest-join via invite link | Kurangi friksi onboarding anggota grup                                                                                                                                                                  |
| Hosting    | Netlify (frontend) + Supabase cloud (backend)                      | Free tier cukup untuk skala circle kecil. **Catatan:** Supabase free tier auto-pause project setelah ±1 minggu tanpa aktivitas — perlu reactivate manual sebelum dipakai/demo kalau app jarang diakses. |
| Export     | SheetJS (xlsx)                                                     | Sudah dipakai di JastipKuy untuk laporan                                                                                                                                                                |

---

## 5. Data Model (garis besar)

```
users (id, name, email, avatar_url, created_at)
trips (id, name, start_date, end_date, created_by, created_at, invite_code, status[active|settled])
trip_members (trip_id, user_id, joined_at, role)
expenses (id, trip_id, description, amount, paid_by, category, date, created_at)
expense_splits (expense_id, user_id, share_amount, share_type[equal|percentage|exact])
settlements (id, trip_id, from_user, to_user, amount, settled_at)
```

Debt simplification dihitung on-the-fly dari `expenses` + `expense_splits` dikurangi `settlements` (net balance per user per trip), bukan disimpan sebagai state statis — supaya konsisten dan gampang di-audit. `trips.status` dipakai untuk trigger flow "settle-up semua utang trip ini" begitu trip ditandai selesai.

---

## 6. Fitur — Prioritas

### P0 (MVP, wajib jalan sebelum dianggap "selesai")

1. Auth (email magic link) + join trip via invite link tanpa harus daftar dulu (guest bisa lihat, wajib daftar untuk input).
2. CRUD trip (buat, invite, keluar trip, tandai selesai).
3. Tambah expense: nominal, siapa yang bayar, split ke siapa aja (equal/percentage/exact) — flow harus cepat, idealnya <15 detik per entry, karena ini dipakai on-the-go saat trip.
4. Halaman saldo trip: net balance per anggota.
5. Algoritma simplify debt (minimal transaksi settle-up).
6. Flow "settle-up trip selesai" — tandai semua utang trip sebagai lunas sekaligus, bukan satu-satu.
7. Riwayat transaksi per trip (list, bukan chart).

### P1 (setelah MVP jalan & dipakai di minimal 1 trip nyata)

8. Export riwayat trip ke xlsx (reuse pattern dari JastipKuy) — cocok buat kenang-kenangan/laporan trip.
9. Kategori pengeluaran + filter.
10. Notifikasi (email) saat ada expense baru / reminder settle-up di akhir trip.
11. Multi-currency — **naik prioritas ke sini kalau circle traveling sering ke luar negeri** (perlu dikonfirmasi ke Fariz).

### P2 (nice-to-have, bukan prioritas)

12. Grafik pengeluaran per kategori/trip.
13. Recurring expense (relevan kalau nanti dipakai juga buat non-trip, misal patungan bulanan).
14. Receipt scanning (OCR) — kompleksitas tinggi, defer jauh ke belakang.

---

## 7. Non-Functional Requirements

- **Keamanan data finansial:** ini bukan opsional. RLS (Row Level Security) Supabase wajib aktif per trip — user hanya bisa akses data trip yang dia jadi anggota. Karena app ini menyimpan data keuangan orang lain (teman traveling), kebocoran data adalah risiko reputasi, bukan cuma risiko teknis.
- **Tanpa daily limit** — ini core value proposition dibanding Splitwise free tier, jadi jangan sampai justru diri sendiri bikin bottleneck lewat rate limiting yang berlebihan di awal.
- Responsive (mobile-first, wajib — expense diinput on-the-go di tengah trip, bukan di depan laptop).
- Offline-first **dipertimbangkan untuk P1**, bukan P0 — sinyal internet gak selalu bagus saat traveling (pegunungan, luar kota). Kalau ini jadi keluhan nyata di trip pertama, naikkan prioritas.

---

## 8. Success Metrics (buat validasi ke diri sendiri)

- App dipakai end-to-end (dari buat trip sampai settle-up) di minimal **1 trip nyata** dengan circle traveling Fariz — bukan cuma dummy data.
- Semua anggota trip beneran join dan input sendiri (bukan Fariz yang input-in semua atas nama orang lain — kalau ini terjadi, artinya onboarding masih terlalu ribet).
- Bisa didemokan end-to-end (buat trip → invite → input expense → lihat siapa-utang-siapa → settle) dalam <3 menit ke orang yang belum pernah lihat — penting untuk sisi portfolio.

---

## 9. Risks & Open Questions

| Risiko                                               | Dampak                                                                              | Mitigasi                                                                                       |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Network effect — anggota trip gak mau install/daftar | App gak kepake pas trip beneran jalan                                               | Guest-view tanpa akun, invite link simpel, minim friksi                                        |
| Tanpa deadline, trip nyata baru tahun depan          | Proyek gampang mangkrak — "poles dikit lagi" jadi alasan tanpa akhir selama setahun | **Deadline internal wajib dipasang, lepas dari kapan trip terjadi** (lihat keputusan di bawah) |
| Koneksi internet gak stabil saat trip                | User gagal input expense di lapangan, balik ke nyatet manual → app gak kepake       | Pastikan UI tetap ringan; evaluasi offline-first di P1 kalau jadi masalah nyata                |
| Supabase free tier auto-pause karena jarang dipakai  | Demo/testing keganggu, harus reactivate manual                                      | Wajar untuk sekarang; kalau mengganggu, evaluasi ping otomatis atau upgrade nanti              |
| Tanggung jawab data finansial orang lain             | Risiko reputasi/privasi kalau bocor                                                 | RLS wajib, jangan simpan data lebih dari yang perlu                                            |

**Keputusan yang sudah diambil (update dari draft sebelumnya):**

1. **Deadline P0: 8 minggu kerja aktif dari sekarang (target selesai: ±8 September 2026).** Trip besar tahun depan jadi milestone P1/polish, bukan milestone P0.
2. **Validasi lebih cepat:** sebelum trip besar, uji app ini di acara kecil yang lebih dekat (makan bareng, nongkrong, acara keluarga) supaya ada real usage data jauh sebelum setahun berlalu — sekaligus nge-tes bug lebih awal daripada nemu masalah pas lagi di tengah trip beneran.

**Milestone checkpoint (wajib, karena deadline ini self-imposed tanpa tekanan eksternal — checkpoint adalah satu-satunya cara ketahuan lebih awal kalau mulai molor):**

| Minggu | Target                            | Definisi "selesai"                                                                                           |
| ------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1-2    | Setup + Auth + CRUD trip          | Bisa buat trip, invite via link, anggota join — di-deploy ke Netlify/Supabase, bukan cuma jalan di localhost |
| 3-4    | Input expense + split logic       | Bisa nambah expense, split equal/percentage/exact, tersimpan bener di DB                                     |
| 5-6    | Saldo + debt simplification       | Halaman saldo nunjukin net balance yang benar, algoritma simplify jalan                                      |
| 7      | Settle-up flow + riwayat          | Flow "trip selesai, kelarin semua utang" jalan; riwayat transaksi muncul                                     |
| 8      | Testing dengan real data + buffer | Diuji pakai acara kecil nyata (bukan dummy data), bug fixing, deploy final                                   |

Kalau di akhir minggu ke-2 belum ada versi yang bisa diakses via link (bukan localhost), itu sinyal awal proyek mulai molor — cek ulang scope, jangan tunggu sampai minggu ke-8 baru sadar.

**Masih belum dijawab:** 3. **Domestik atau luar negeri?** Menentukan apakah multi-currency masuk P1 atau tetap P2.

---

## 10. Out of Scope (MVP)

- Payment/settlement langsung (transfer uang via app).
- Native mobile app.
- Billing/subscription system untuk multi-tenant.
- AI-based receipt parsing.
