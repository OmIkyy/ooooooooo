-- =======================================================================
-- SQL SCRIPT UNTUK SUPABASE DATABASE
-- LAYANAN E-BILLING INTERNET - KOMINDO NETWORK
-- =======================================================================
--
-- CARA PENGGUNAAN:
-- 1. Masuk ke Dashboard Supabase Anda (https://supabase.com).
-- 2. Pilih Project Anda: "krmcerakwutsunuyuhku".
-- 3. Buka menu "SQL Editor" dari panel sebelah kiri.
-- 4. Klik "+ New Query" untuk membuat lembar kerja SQL baru.
-- 5. Salin (copy) seluruh kode di bawah ini dan tempel (paste) di editor tersebut.
-- 6. Klik tombol "Run" di kanan bawah.
--
-- =======================================================================

-- =======================================================================
-- OPSIONAL: BERSIHKAN / RESET TABEL SEBELUMNYA (JIKA INGIN START DARI AWAL)
-- Hapus tanda "--" di 3 baris di bawah ini jika Anda ingin menghapus data lama 
-- dan membuat tabel baru yang benar-benar bersih.
-- =======================================================================
-- DROP TABLE IF EXISTS customers CASCADE;
-- DROP TABLE IF EXISTS templates CASCADE;
-- DROP TABLE IF EXISTS settings CASCADE;


-- 1. TABEL CUSTOMERS (DATA PELANGGAN)
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  "package" TEXT NOT NULL,
  "dueDate" TEXT NOT NULL,
  "lastH1SentDate" TEXT,
  "wa_reminder_sent" BOOLEAN DEFAULT false,
  "wa_reminder_sent_at" TEXT,
  "last_wa_message_id" TEXT,
  "receipt_url" TEXT,
  "receipt_uploaded_at" TEXT
);

-- Mengaktifkan Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Drop Policy jika sudah ada untuk menghindari error "already exists"
DROP POLICY IF EXISTS "Allow public read and write on customers" ON customers;

-- Buat ulang policy yang mengizinkan semua akses publik (Read, Write, Update, Delete)
CREATE POLICY "Allow public read and write on customers" ON customers
  FOR ALL USING (true) WITH CHECK (true);


-- 2. TABEL TEMPLATES (TEMPLATE PESAN BOT WHATSAPP)
CREATE TABLE IF NOT EXISTS templates (
  key TEXT PRIMARY KEY DEFAULT 'default',
  "tagihanActive" BOOLEAN DEFAULT true,
  "tagihanTemplate" TEXT NOT NULL,
  "psbActive" BOOLEAN DEFAULT false,
  "psbTemplate" TEXT NOT NULL
);

-- Mengaktifkan Row Level Security (RLS)
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Drop Policy jika sudah ada untuk menghindari error "already exists"
DROP POLICY IF EXISTS "Allow public read and write on templates" ON templates;

-- Buat ulang policy
CREATE POLICY "Allow public read and write on templates" ON templates
  FOR ALL USING (true) WITH CHECK (true);


-- 3. TABEL SETTINGS (SETTING ALAMAT LINK PEMBAYARAN DAN REDIRECT CHAT)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY DEFAULT 'default',
  "paymentLink" TEXT NOT NULL,
  "basicLink" TEXT NOT NULL,
  "silverLink" TEXT NOT NULL,
  "goldLink" TEXT NOT NULL,
  "cronIntervalMinutes" INTEGER DEFAULT 10,
  "reminderTimingDays" INTEGER DEFAULT 1
);

-- Mengaktifkan Row Level Security (RLS)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop Policy jika sudah ada untuk menghindari error "already exists"
DROP POLICY IF EXISTS "Allow public read and write on settings" ON settings;

-- Buat ulang policy
CREATE POLICY "Allow public read and write on settings" ON settings
  FOR ALL USING (true) WITH CHECK (true);


-- =======================================================================
-- DATA SEED AWAL (OTOMATIS DI-INSERT JIKA BELUM ADA)
-- Menggunakan format E'...' untuk memproses karakter newline (\n) di Postgres
-- =======================================================================

INSERT INTO templates (key, "tagihanActive", "tagihanTemplate", "psbActive", "psbTemplate")
VALUES (
  'default',
  true,
  E'Ini adalah pesan otomatis dari sistem e-billing layanan *KOMINDO NETWORK*\n\nHalo *{nama}*,\nPaket : {paket}\nJatuh Tempo : {jatuhTempo}\nLink Pembayaran : {linkPembayaran}\n\nMohon segera melakukan pembayaran sebelum masa jatuh tempo habis agar layanan internet Anda tidak terputus secara otomatis oleh sistem. Terima kasih.',
  false,
  E'Ini adalah pesan otomatis dari sistem e-billing layanan *KOMINDO NETWORK*\n\n*Pembayaran Biaya Aktivasi Pemasangan Baru Wifi*\n\nHalo *{nama}*,\nBiaya : {paket}\nJatuh Tempo : {jatuhTempo}\nLink Pembayaran : {linkPembayaran}\n\nMohon melakukan pembayaran biaya aktivasi pendaftaran baru sebesar 300K. Terima kasih!'
) ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, "paymentLink", "basicLink", "silverLink", "goldLink")
VALUES (
  'default',
  'https://e.ebilling.id/tagihan/?account=5379',
  'https://wa.me/6282181144800',
  'https://wa.me/6282181144800',
  'https://wa.me/6282181144800'
) ON CONFLICT (key) DO NOTHING;


