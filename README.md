# 🌐 KOMINDO NETWORK — Billing & WhatsApp Gateway Automation

Sistem pengelolaan tagihan internet (Billing) terintegrasi dengan **WhatsApp Gateway & Automation** untuk mempermudah pengecekan tagihan pelanggan secara mandiri dan pengiriman pengingat otomatis sebelum jatuh tempo.

---

## 📋 Fitur Utama

1. **Dashboard Billing Real-Time**: Antarmuka modern untuk admin melacak data pelanggan, status pembayaran, dan riwayat log interaksi gateway.
2. **WhatsApp Auto-Reply Webhook**: Auto-responder interaktif yang otomatis membalas chat pelanggan saat mereka mengirimkan ID Pelanggan atau Nama mereka.
3. **Automated H-1 Reminder Engine**: Pemeriksaan otomatis di latar belakang (*background worker*) setiap jam untuk mengirimkan pesan pengingat tagihan tepat 1 hari sebelum tanggal jatuh tempo (H-1).
4. **Pengecekan Tagihan Mandiri**: Halaman web publik agar pelanggan dapat memeriksa tagihan dan langsung diarahkan ke link pembayaran (QRIS, Bank, E-Wallet, dll.).
5. **Realtime System Monitoring & Disaster Recovery**: Monitoring CPU, Memory, Uptime, Error, Auto-Backup Database, dan Restore instan.

---

## 🗄️ Panduan Penyambungan Database (Supabase)

Aplikasi ini mendukung **Dual-Database Mode** yang sangat fleksibel:
- **Default (Local JSON)**: Jika tidak ada konfigurasi database eksternal atau tabel belum siap, sistem akan menyimpan data di file lokal `/src/local_database.json` secara otomatis agar aplikasi langsung siap digunakan tanpa setup yang rumit (hanya untuk mode development / simulasi).
- **Produksi (Supabase)**: Direkomendasikan dan diwajibkan untuk live produksi di VPS agar penyimpanan data bersifat awet (*persistent*), aman, dan terintegrasi langsung dengan cloud.

### Langkah Menyambungkan Database Supabase:
1. Hubungkan akun Supabase Anda atau buat project baru.
2. Dapatkan informasi koneksi di bagian **Project Settings > API**:
   - `VITE_SUPABASE_PROJECT_ID` (ID Project Anda)
   - `VITE_SUPABASE_URL` (URL Project Anda, misal `https://your-project.supabase.co`)
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (Anon/Public API key)
3. Buat file `.env` di root direktori atau tambahkan variabel berikut:
   ```env
   NODE_ENV="production"
   PORT=3000
   VITE_SUPABASE_PROJECT_ID="your-project-id"
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   ```
4. Masuk ke **SQL Editor** di dashboard Supabase Anda, lalu jalankan perintah SQL berikut untuk membuat tabel-tabel yang diperlukan:
   ```sql
   CREATE TABLE IF NOT EXISTS customers (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     phone TEXT NOT NULL,
     package TEXT NOT NULL,
     "dueDate" TEXT NOT NULL,
     "lastH1SentDate" TEXT,
     "address" TEXT,
     "email" TEXT,
     "status" TEXT DEFAULT 'Aktif',
     "billingAmount" NUMERIC DEFAULT 0,
     "lastH1Sent" BOOLEAN DEFAULT false,
     "lastH1SentAt" TEXT,
     "paymentStatus" TEXT DEFAULT 'Belum Bayar',
     "paymentUrl" TEXT,
     "receiptUrl" TEXT,
     "receipt_uploaded_at" TEXT
   );

   CREATE TABLE IF NOT EXISTS templates (
     key TEXT PRIMARY KEY DEFAULT 'default',
     "tagihanActive" BOOLEAN DEFAULT true,
     "tagihanTemplate" TEXT NOT NULL,
     "psbActive" BOOLEAN DEFAULT false,
     "psbTemplate" TEXT NOT NULL
   );

   CREATE TABLE IF NOT EXISTS settings (
     key TEXT PRIMARY KEY DEFAULT 'default',
     "paymentLink" TEXT NOT NULL,
     "basicLink" TEXT NOT NULL,
     "silverLink" TEXT NOT NULL,
     "goldLink" TEXT NOT NULL,
     "csPhone" TEXT DEFAULT '628123456789',
     "companyName" TEXT DEFAULT 'Komindo Network',
     "reminderTimingDays" INTEGER DEFAULT 1
   );
   ```

---

## 📁 DAFTAR FILE & FOLDER YANG WAJIB DI-UPLOAD KE SERVER / VPS

Sistem ini adalah **Full-Stack Application** (Express.js Backend + React Frontend + WhatsApp Baileys Engine + Supabase Sync). **Ini BUKAN sekadar file HTML/CSS static biasa**, melainkan memiliki server Node.js aktif untuk menangani API, pengingat otomatis (cron scheduler), dan WhatsApp Gateway.

### Option A: Upload Seluruh Project (Sangat Direkomendasikan)
Unggah seluruh folder project ke VPS (bisa via Git/GitHub, SFTP, FileZilla, atau cPanel File Manager).
Pilih file/folder berikut saat upload:

- 📂 `src/` (Source code frontend & logika database)
- 📂 `public/` (Aset statis, upload bukti transfer)
- 📂 `supabase/` (Skema database Supabase)
- 📄 `server.ts` (Backend Express & Cron Scheduler)
- 📄 `package.json` & `package-lock.json` (Daftar library)
- 📄 `vite.config.ts` & `tsconfig.json` (Konfigurasi build)
- 📄 `ecosystem.config.cjs` (File konfigurasi PM2)
- 📄 `.env.example` / `.env` (Environment variables)

> 💡 **Di VPS, tinggal jalankan:**
> ```bash
> npm install
> npm run build
> pm2 start ecosystem.config.cjs
> ```

---

### Option B: Upload Versi Hasil Build Saja (Pre-built Deployment)
Jika Anda sudah menjalankan `npm run build` di komputer lokal, Anda hanya perlu mengunggah file hasil kompilasi berikut ke VPS untuk menghemat space upload:

- 📂 `dist/` (Berisi `server.cjs` dan bundle frontend HTML/CSS/JS)
- 📂 `public/` (Aset gambar/bukti bayar)
- 📄 `package.json` (Untuk instalasi dependency runtime)
- 📄 `ecosystem.config.cjs` (Konfigurasi PM2)
- 📄 `.env` (File rahasia kredensial)

> 💡 **Di VPS, tinggal jalankan:**
> ```bash
> npm install --omit=dev
> pm2 start ecosystem.config.cjs
> ```

---

## 🚀 PANDUAN LENGKAP RUNNING DENGAN PM2 DI SERVER / VPS

**PM2** adalah Process Manager untuk Node.js yang memastikan aplikasi Anda terus berjalan 24 jam nonstop, otomatis restart jika server/VPS direboot, dan mengelola log aktivitas.

### Langkah 1: Persiapan Server / VPS (Ubuntu/Debian)

1. **Install Node.js (v18 atau v20+)**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Install PM2 Secara Global**:
   ```bash
   sudo npm install -g pm2
   ```

---

### Langkah 2: Setup Environment Variable di Server (`.env`)

Buat file `.env` di direktori project VPS Anda:
```bash
nano .env
```

Isi variabel `.env` dengan kredensial produksi Anda:
```env
NODE_ENV=production
PORT=3000

# Database Supabase
VITE_SUPABASE_PROJECT_ID=project_id_supabase_anda
VITE_SUPABASE_URL=https://project_id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOi...
```

---

### Langkah 3: Build & Jalankan Aplikasi dengan PM2

1. **Install Dependensi & Build Project**:
   ```bash
   npm install
   npm run build
   ```

2. **Jalankan Aplikasi Menggunakan Ecosystem File PM2**:
   ```bash
   pm2 start ecosystem.config.cjs
   ```
   *Atau langsung jalankan file server:*
   ```bash
   pm2 start dist/server.cjs --name "komindo-billing-bot"
   ```

3. **Simpan State PM2 Agar Auto-Restart Saat VPS Reboot**:
   ```bash
   pm2 save
   pm2 startup
   ```
   *(Salin dan jalankan perintah yang dimunculkan oleh `pm2 startup` di terminal)*

---

### 🕹️ Perintah-Perintah Penting PM2 yang Wajib Diketahui

| Perintah | Kegunaan |
| :--- | :--- |
| `pm2 status` | Melihat status aplikasi (Online / Errored / Stopped) |
| `pm2 logs` | Melihat log realtime (output console & error server) |
| `pm2 restart komindo-billing-bot` | Merestart aplikasi |
| `pm2 stop komindo-billing-bot` | Menghentikan sementara aplikasi |
| `pm2 delete komindo-billing-bot` | Menghapus aplikasi dari daftar PM2 |
| `pm2 monit` | Membuka dashboard pemantauan CPU & Memory di terminal |

---

## 🌐 Konfigurasi Domain & Nginx Reverse Proxy (Opsional)

Agar aplikasi dapat diakses melalui domain (contoh: `https://billing.domainanda.com`) tanpa menyebutkan port `:3000`, gunakan Nginx:

1. **Install Nginx**:
   ```bash
   sudo apt update
   sudo apt install nginx -y
   ```

2. **Buat File Konfigurasi Nginx**:
   ```bash
   sudo nano /etc/nginx/sites-available/billing
   ```

3. **Isi Konfigurasi Nginx**:
   ```nginx
   server {
       listen 80;
       server_name billing.domainanda.com;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```

4. **Aktifkan Konfigurasi & Restart Nginx**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/billing /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

5. **Pasang SSL Gratis (Certbot)**:
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d billing.domainanda.com
   ```

---

## 📂 Struktur Utama File Project

- `/server.ts` : Server utama Express, API routes, security rate limiting, scheduler & backup manager.
- `/ecosystem.config.cjs` : File konfigurasi resmi PM2 untuk deployment produksi.
- `/src/db.ts` : Client database Supabase dengan sistem fallback otomatis.
- `/src/App.tsx` : Dashboard admin & antarmuka publik pelanggan.
- `/dist/server.cjs` : File bundle server produksi hasil kompilasi.
- `/dist/` : File aset frontend (HTML, CSS, JS) hasil build produksi.

