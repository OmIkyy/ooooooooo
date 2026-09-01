# 📱 KOMINDO ADMIN CONTROL CENTER & WHATSAPP GATEWAY DOCUMENTATION

Dokumentasi resmi ini memuat panduan lengkap konfigurasi, cara pengujian (Command Testing), dan pengaturan variabel lingkungan (Environment Variables) untuk **Sistem Admin Control Center via WhatsApp** (Baileys Engine) pada layanan billing internet KOMINDO NETWORK.

---

## 🌐 1. Konfigurasi WhatsApp Gateway (Baileys Engine)

Sistem menggunakan **Baileys Engine** secara langsung untuk koneksi WhatsApp real-time. Anda cukup memindai QR Code melalui menu **WhatsApp Gateway** pada website admin KOMINDO.

### Langkah-langkah Koneksi:
1. Buka dashboard Admin KOMINDO NETWORK.
2. Navigasikan ke tab **WhatsApp Gateway**.
3. Klik tombol **Generate QR Code**.
4. Pindai (Scan) QR Code menggunakan aplikasi WhatsApp pada HP admin Anda.
5. Setelah terhubung (`Status: CONNECTED`), sistem siap membalas pesan otomatis dan mengirim pengingat tagihan.

---

## 🛠️ 2. Pengaturan Environment Variables di Server Production

Guna memastikan sistem berjalan aman, terhubung ke database Supabase yang sesungguhnya (tanpa local fallback), dan mengizinkan nomor WhatsApp admin tertentu, konfigurasikan variabel lingkungan berikut di platform hosting Anda:

| Nama Variabel | Wajib/Opsional | Deskripsi & Contoh |
| :--- | :--- | :--- |
| `NODE_ENV` | Wajib | Set ke `production` untuk mengaktifkan validasi database ketat. |
| `FORCE_SUPABASE` | Opsional | Set ke `true` jika Anda ingin memaksa penggunaan database cloud Supabase. |
| `VITE_SUPABASE_URL` | Wajib | URL Endpoint Supabase Anda (e.g. `https://krmcerakwutsunuyuhku.supabase.co`). |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Wajib | Kunci Publik Supabase anonim Anda. |
| `ADMIN_WHATSAPP_NUMBERS` | Wajib | Daftar nomor WhatsApp admin yang dipisahkan koma (e.g. `628123456789,628987654321`). |
| `WEBHOOK_SECRET` | Sangat Dianjurkan | Token keamanan acak untuk memvalidasi request masuk. |
| `CRON_SECRET` | Sangat Dianjurkan | Token keamanan acak untuk mengamankan pemicu otomatisasi tagihan `/api/cron/reminders`. |

---

## 🧪 3. Pengujian Fitur Admin Control (Command Testing)

Sistem ini memvalidasi setiap nomor pengirim pesan yang dikirim ke WhatsApp Webhook. Hanya nomor yang terdaftar di `ADMIN_WHATSAPP_NUMBERS` yang dapat menjalankan perintah berawalan `/`.

### Skenario Pengujian 1: Verifikasi Hak Akses (Non-Admin)
1. Kirim pesan `/help` menggunakan nomor yang **tidak terdaftar** di variabel `ADMIN_WHATSAPP_NUMBERS`.
2. **Ekspektasi Balasan Bot:**
   ```text
   ❌ Akses ditolak.

   Anda tidak memiliki izin untuk menggunakan fitur Admin Control WhatsApp.
   ```

### Skenario Pengujian 2: Melihat Panduan Perintah (Admin)
1. Kirim pesan `/help` menggunakan nomor admin Anda.
2. **Ekspektasi Balasan Bot:**
   Menampilkan daftar lengkap seluruh perintah admin yang tersedia beserta contoh penggunaannya.

### Skenario Pengujian 3: Memeriksa Status Sistem Terkini
1. Kirim pesan `/status` dari nomor admin Anda.
2. **Ekspektasi Balasan Bot:**
   ```text
   🟢 SERVER: ONLINE
   🟢 DATABASE: CONNECTED
   🟢 WHATSAPP: CONNECTED
   🟢 AUTO REMINDER: ACTIVE
   👥 TOTAL CUSTOMER: 12
   ```

### Skenario Pengujian 4: Pencarian Data Customer
1. Kirim pesan `/cari Budi` atau `/cari PL3.01.ALI` dari nomor admin.
2. **Ekspektasi Balasan Bot:**
   - Jika ditemukan satu: Menampilkan detail paket, jatuh tempo, biaya, dan status menunggak/aktif.
   - Jika ditemukan banyak: Menampilkan daftar pencarian ringkas beserta ID masing-masing.

### Skenario Pengujian 5: Memeriksa Ringkasan Tagihan (Dashboard Finansial)
1. Kirim pesan `/tagihan` dari nomor admin.
2. **Ekspektasi Balasan Bot:**
   Menampilkan ringkasan keuangan meliputi:
   * Total Pelanggan & Total Nominal Tagihan.
   * Jumlah & Nominal Pelanggan yang Lunas.
   * Jumlah & Nominal Pelanggan yang Menunggu Verifikasi Bukti Bayar.
   * Jumlah & Nominal Pelanggan yang Belum Bayar / Overdue.

### Skenario Pengujian 6: Memeriksa Tagihan Hari Ini
1. Kirim pesan `/tagihan hari ini` dari nomor admin.
2. **Ekspektasi Balasan Bot:**
   Menampilkan rincian daftar pelanggan yang jatuh tempo per hari ini dan belum lunas, beserta nominal akumulatifnya.

### Skenario Pengujian 7: Memeriksa Pelanggan Menunggak (Overdue)
1. Kirim pesan `/overdue` dari nomor admin.
2. **Ekspektasi Balasan Bot:**
   Menampilkan daftar lengkap pelanggan yang telah melewati batas jatuh tempo namun belum membayar, lengkap dengan nominal masing-masing dan total tertunggak.

### Skenario Pengujian 8: Statistik Pemicu Otomatis (Auto Reminder)
1. Kirim pesan `/reminder` dari nomor admin.
2. **Ekspektasi Balasan Bot:**
   Menampilkan status aktif sistem auto reminder, rincian tanggal pengecekan terakhir, serta kuantitas pelanggan yang berada di setiap gerbang pengingat (`H-7`, `H-3`, `H-1`, `Hari H`, `Overdue`).

---

## 🔒 4. Keamanan & Penanganan Kegagalan (Fail-Safe & Idempotency)

Sistem ini didesain dengan tingkat kehandalan production yang tinggi:
1. **Idempotensi Pengiriman**: Setiap event pengingat (`H-1`, `H-3`, dll.) hanya akan dikirim maksimal 1 kali dalam sehari untuk pelanggan yang sama demi menghindari pengiriman ganda (spamming).
2. **Anti-Fallback di Production**: Di bawah mode `production`, sistem akan melemparkan kesalahan eksplisit (*Database Exception*) apabila koneksi ke Supabase gagal, mencegah terjadinya penyimpanan lokal palsu (`local_database.json`) yang merusak sinkronisasi data utama.
3. **Penyimpanan Error**: Apabila pesan gagal dikirim melalui WhatsApp Gateway, status kesalahan akan direkam langsung pada baris customer di database Supabase untuk pemantauan admin.
4. **Rate-Limiting Webhook**: Webhook dilindungi pembatas laju (rate-limiter) internal sebesar 15 request per menit per pengirim, menangkal serangan spamming dan infinite loop percakapan bot.
