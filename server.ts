import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { dbService } from "./src/db";
import { waGateway } from "./src/services/waGateway";
import { whatsappManager } from "./src/services/whatsappManager";
import { generateReminderMessage, getCustomerBiaya } from "./src/services/messageGenerator";

// Load environment variables
dotenv.config();

// Simple in-memory array to store gateway interactions/activity logs
interface GatewayLog {
  timestamp: string;
  sender: string;
  incoming: string;
  reply: string;
  status: "success" | "not_found" | "ignored";
}
const botLogs: GatewayLog[] = [];
let lastAutoCheckTime = "Belum dijalankan";
const webhookRateLimitMap = new Map<string, { count: number; lastReset: number }>();

const app = express();
const PORT = 3000;

// Enable proxy trust for Cloudflare and reverse proxies to reliably extract client IP
app.set("trust proxy", 1);

// Brute-force protection map for sensitive admin endpoints
const adminLoginAttempts = new Map<string, { count: number; lockedUntil: number }>();

// Initialize DB Service (Supabase or Local File Fallback) in background
dbService.ensureInitialized().then(() => {
  console.log("📂 Supabase / Local database initialization completed.");
});

// Middleware for parsing JSON and urlencoded data
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// General API Rate Limiting & Anti-Caching Middleware
const apiRateLimitMap = new Map<string, { count: number; resetTime: number }>();
app.use("/api/", (req, res, next) => {
  // Prevent any proxy, CDN, Cloudflare, or mobile browser from serving stale API cache
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");

  const clientIp = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 150; // max 150 req/min per IP

  const record = apiRateLimitMap.get(clientIp) || { count: 0, resetTime: now + windowMs };
  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + windowMs;
  }
  record.count++;
  apiRateLimitMap.set(clientIp, record);

  if (record.count > maxRequests) {
    return res.status(429).json({ error: "Terlalu banyak permintaan API. Silakan tunggu beberapa saat." });
  }
  next();
});

// Ensure public/uploads directory exists and serve it statically
try {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err: any) {
  console.warn("⚠️ Warning: Could not create upload directory (expected on read-only environments like Vercel):", err.message);
}
app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

  // ====================================================
  // 🕒 VERCEL COMPATIBLE AUTOMATED REMINDER CRON ENDPOINT
  // ====================================================

  // Automated billing checks cron trigger (supports GET & POST for Vercel Cron compatibility)
  app.get("/api/cron/reminders", async (req, res) => {
    // CRON_SECRET Verification
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const incomingSecret = req.headers["x-cron-secret"] || req.query.secret || req.body.secret;
      if (incomingSecret !== cronSecret) {
        console.warn(`🔒 Unauthorized cron access attempt from IP: ${req.ip}`);
        return res.status(401).json({ success: false, error: "Unauthorized: Invalid cron secret" });
      }
    }

    try {
      console.log("🕒 [Vercel Cron] Triggered via GET /api/cron/reminders");
      const { h1Res, overdueRes } = await runAllAutoBillingChecks();
      res.json({
        success: true,
        message: "Automated billing checks triggered successfully",
        timestamp: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
        results: {
          h1: h1Res,
          overdue: overdueRes
        }
      });
    } catch (err: any) {
      console.error("❌ [Vercel Cron] Error during cron reminders execution:", err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/cron/reminders", async (req, res) => {
    // CRON_SECRET Verification
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const incomingSecret = req.headers["x-cron-secret"] || req.query.secret || req.body.secret;
      if (incomingSecret !== cronSecret) {
        console.warn(`🔒 Unauthorized cron access attempt from IP: ${req.ip}`);
        return res.status(401).json({ success: false, error: "Unauthorized: Invalid cron secret" });
      }
    }

    try {
      console.log("🕒 [Vercel Cron] Triggered via POST /api/cron/reminders");
      const { h1Res, overdueRes } = await runAllAutoBillingChecks();
      res.json({
        success: true,
        message: "Automated billing checks triggered successfully",
        timestamp: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
        results: {
          h1: h1Res,
          overdue: overdueRes
        }
      });
    } catch (err: any) {
      console.error("❌ [Vercel Cron] Error during cron reminders execution:", err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });


  // ====================================================
  // 📱 UNIFIED ADMIN WHATSAPP REAL-TIME PAIRING FLOW
  // ====================================================

  // List all WhatsApp sessions
  app.get("/api/admin/whatsapp/sessions", (req, res) => {
    res.json(whatsappManager.getAllSessions());
  });

  // Check status of a specific session (defaults to 'default')
  app.get("/api/admin/whatsapp/status", async (req, res) => {
    const sessionId = (req.query.session as string) || "default";
    const session = whatsappManager.getSession(sessionId);
    if (!session) {
      return res.json({
        status: "disconnected",
        number: null,
        name: "WhatsApp Gateway (Baileys)",
        message: "Session belum diinisialisasi"
      });
    }

    return res.json({
      status: session.status,
      number: session.phoneNumber,
      name: session.name || "Connected Device",
      message: session.status === "connected" ? "Terhubung (Baileys)" : `Status: ${session.status}`,
      qr: session.qr
    });
  });

  // Fetch QR status or real QR base64 code for a session
  app.get("/api/admin/whatsapp/qr", (req, res) => {
    const sessionId = (req.query.session as string) || "default";
    const session = whatsappManager.getSession(sessionId);
    if (!session) {
      return res.json({
        success: false,
        status: "disconnected",
        message: "Session tidak ditemukan"
      });
    }

    if (session.status === "connected") {
      return res.json({
        success: true,
        status: "connected",
        message: "WhatsApp Gateway Connected!"
      });
    }

    if (session.qr) {
      return res.json({
        success: true,
        status: "qr",
        qr: session.qr,
        message: "Scan QR Code ini untuk menghubungkan perangkat Anda"
      });
    }

    return res.json({
      success: true,
      status: "connecting",
      message: "Sedang menyiapkan QR Code, harap tunggu beberapa detik..."
    });
  });

  // Disconnect/logout a WhatsApp session
  app.post("/api/admin/whatsapp/disconnect", async (req, res) => {
    const sessionId = (req.body.session as string) || "default";
    const success = await whatsappManager.logoutSession(sessionId);
    if (success) {
      // Re-create the session as disconnected empty so it automatically starts waiting for QR scan
      await whatsappManager.createSession(sessionId);
      return res.json({
        success: true,
        message: `Koneksi session "${sessionId}" berhasil diputus.`
      });
    } else {
      return res.json({
        success: false,
        message: `Gagal memutuskan session "${sessionId}".`
      });
    }
  });

  // Reconnect/restart a WhatsApp session
  app.post("/api/admin/whatsapp/reconnect", async (req, res) => {
    const sessionId = (req.body.session as string) || "default";
    await whatsappManager.logoutSession(sessionId);
    await whatsappManager.createSession(sessionId);
    return res.json({
      success: true,
      message: `Session "${sessionId}" berhasil di-reconnect.`
    });
  });


  // ====================================================
  // 💳 BILLING AND CUSTOMER ADMINISTRATION ENDPOINTS
  // ====================================================

  // 1. Get system & database status
  app.get("/api/status", (req, res) => {
    res.json(dbService.getConnectionStatus());
  });

  // 2. Customers Endpoints
  app.get("/api/customers", async (req, res) => {
    try {
      const list = await dbService.getCustomers();
      const updatedList = list.map((c) => {
        const safeId = c.id.replace(/[^A-Za-z0-9]/g, "_");
        const receiptPathPng = path.join(process.cwd(), "public", "uploads", `receipt_${safeId}.png`);
        const receiptPathJpg = path.join(process.cwd(), "public", "uploads", `receipt_${safeId}.jpg`);
        
        let receipt_url: string | undefined = undefined;
        let receipt_uploaded_at: string | undefined = undefined;

        if (fs.existsSync(receiptPathPng)) {
          receipt_url = `/uploads/receipt_${safeId}.png`;
          receipt_uploaded_at = fs.statSync(receiptPathPng).mtime.toISOString();
        } else if (fs.existsSync(receiptPathJpg)) {
          receipt_url = `/uploads/receipt_${safeId}.jpg`;
          receipt_uploaded_at = fs.statSync(receiptPathJpg).mtime.toISOString();
        }

        return {
          ...c,
          receipt_url,
          receipt_uploaded_at
        };
      });
      res.json(updatedList);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const cust = await dbService.getCustomerByIdOrName(req.params.id);
      if (!cust) {
        return res.status(404).json({ error: "Customer tidak ditemukan" });
      }
      const safeId = cust.id.replace(/[^A-Za-z0-9]/g, "_");
      const receiptPathPng = path.join(process.cwd(), "public", "uploads", `receipt_${safeId}.png`);
      const receiptPathJpg = path.join(process.cwd(), "public", "uploads", `receipt_${safeId}.jpg`);
      
      let receipt_url: string | undefined = undefined;
      let receipt_uploaded_at: string | undefined = undefined;

      if (fs.existsSync(receiptPathPng)) {
        receipt_url = `/uploads/receipt_${safeId}.png`;
        receipt_uploaded_at = fs.statSync(receiptPathPng).mtime.toISOString();
      } else if (fs.existsSync(receiptPathJpg)) {
        receipt_url = `/uploads/receipt_${safeId}.jpg`;
        receipt_uploaded_at = fs.statSync(receiptPathJpg).mtime.toISOString();
      }

      res.json({
        ...cust,
        receipt_url,
        receipt_uploaded_at
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Save/Create/Update Customer with Automatic WA Notification Triggers
  app.post("/api/customers", async (req, res) => {
    try {
      const { id, name, phone, package: pkg, dueDate, oldId } = req.body;
      if (!id || !name || !phone || !pkg) {
        return res.status(400).json({ error: "Mohon lengkapi seluruh data customer" });
      }

      // Check if this is an update or create
      const existing = await dbService.getCustomerByIdOrName(id);
      const isUpdate = !!existing || (oldId && oldId.trim().toUpperCase() !== id.trim().toUpperCase());
      
      // If oldId is provided and differs from new id, delete the old customer record
      if (oldId && oldId.trim().toUpperCase() !== id.trim().toUpperCase()) {
        await dbService.deleteCustomer(oldId);
      }

      const saved = await dbService.saveCustomer({
        id: id.trim().toUpperCase(),
        name: name.trim().toUpperCase(),
        phone: phone.trim(),
        package: pkg,
        dueDate: dueDate || "01/06/2026",
        // Reset status otomatis ketika tagihan baru dibuat/diubah oleh admin atau karyawan
        wa_reminder_sent: false,
        wa_reminder_sent_at: undefined,
        last_wa_message_id: undefined,
        lastH1SentDate: undefined // Reset sent stages so today's reminder can fire automatically if due
      });

      // Dispatch Automatic WhatsApp Notification (Tagihan dibuat / Tagihan diperbarui)
      const templates = await dbService.getTemplates();
      const settings = await dbService.getSettings();

      let waWarning = "";
      if (templates.tagihanActive) {
        const message = generateReminderMessage(saved, "new_invoice", settings.paymentLink || "https://e.ebilling.id/tagihan/?account=5379");

        const prefix = isUpdate ? "⚠️ *[TAGIHAN DIPERBARUI]*" : "🆕 *[TAGIHAN BARU DIBUAT]*";
        const fullMessage = `${prefix}\n\n${message}`;

        const waRes = await waGateway.sendMessage(saved.phone, fullMessage);
        console.log(`🤖 Auto-notification sent for ${saved.name}. Success: ${waRes.success}, Message:`, waRes.message);
        if (!waRes.success) {
          waWarning = waRes.message;
        }
      }

      res.json({ ...saved, waWarning });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/customers/bulk", async (req, res) => {
    try {
      const { customers } = req.body;
      if (!Array.isArray(customers)) {
        return res.status(400).json({ error: "Data harus berupa array customers" });
      }

      const savedList = [];
      for (const item of customers) {
        let { id, name, phone, package: pkg, dueDate } = item;
        if (!name || !phone || !pkg) {
          continue; // skip incomplete ones
        }

        const trimmedName = name.trim().toUpperCase();
        let finalId = id ? id.trim().toUpperCase() : "";
        if (!finalId) {
          const cleanName = trimmedName
            .replace(/[^A-Z0-9]/g, ".")
            .replace(/\.+/g, ".")
            .replace(/^\.|\.$/g, "");
          finalId = `PL4.GEN.${cleanName}`;
        }

        const saved = await dbService.saveCustomer({
          id: finalId,
          name: trimmedName,
          phone: String(phone).trim(),
          package: pkg.trim().toUpperCase(),
          dueDate: (dueDate || "01/06/2026").trim()
        });
        savedList.push(saved);
      }
      res.json({ success: true, count: savedList.length, saved: savedList });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const deleted = await dbService.deleteCustomer(req.params.id);
      res.json({ success: deleted });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/customers/clear-all", async (req, res) => {
    try {
      const success = await dbService.clearAllCustomers();
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Message Templates Endpoints
  app.get("/api/templates", async (req, res) => {
    try {
      const t = await dbService.getTemplates();
      res.json(t);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const { tagihanActive, tagihanTemplate, psbActive, psbTemplate } = req.body;
      const updated = await dbService.saveTemplates({
        tagihanActive: !!tagihanActive,
        tagihanTemplate: tagihanTemplate || "",
        psbActive: !!psbActive,
        psbTemplate: psbTemplate || ""
      });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. App Settings Endpoints
  app.get("/api/settings", async (req, res) => {
    try {
      const s = await dbService.getSettings();
      // Also check if public/assets/links.json exists for custom link overrides
      const assetsLinksPath = path.join(process.cwd(), "public", "assets", "links.json");
      if (fs.existsSync(assetsLinksPath)) {
        try {
          const linksContent = JSON.parse(fs.readFileSync(assetsLinksPath, "utf-8"));
          if (linksContent.youtubeLink) s.youtubeLink = linksContent.youtubeLink;
          if (linksContent.paymentLink) s.paymentLink = linksContent.paymentLink;
          if (linksContent.basicPackageLink || linksContent.basicLink) s.basicLink = linksContent.basicPackageLink || linksContent.basicLink;
          if (linksContent.silverPackageLink || linksContent.silverLink) s.silverLink = linksContent.silverPackageLink || linksContent.silverLink;
          if (linksContent.goldPackageLink || linksContent.goldLink) s.goldLink = linksContent.goldPackageLink || linksContent.goldLink;
        } catch (e) {
          console.warn("Could not parse public/assets/links.json:", e);
        }
      }
      res.json(s);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const { paymentLink, youtubeLink, basicLink, silverLink, goldLink, cronIntervalMinutes, reminderTimingDays } = req.body;
      const updated = await dbService.saveSettings({
        paymentLink: paymentLink || "",
        youtubeLink: youtubeLink || "https://youtube.com/@komindo_network?si=uM1XCOSYa72IKZ6y",
        basicLink: basicLink || "",
        silverLink: silverLink || "",
        goldLink: goldLink || "",
        cronIntervalMinutes: cronIntervalMinutes ? parseInt(cronIntervalMinutes, 10) : 10,
        reminderTimingDays: reminderTimingDays !== undefined ? parseInt(reminderTimingDays, 10) : 1
      });

      // Sync settings to public/assets/links.json
      try {
        const assetsDir = path.join(process.cwd(), "public", "assets");
        if (!fs.existsSync(assetsDir)) {
          fs.mkdirSync(assetsDir, { recursive: true });
        }
        const linksFile = path.join(assetsDir, "links.json");
        const linksData = {
          youtubeLink: updated.youtubeLink || "https://youtube.com/@komindo_network?si=uM1XCOSYa72IKZ6y",
          paymentLink: updated.paymentLink || "https://e.ebilling.id/tagihan/?account=5379",
          adminWhatsAppLink: updated.basicLink || "https://wa.me/6282181144800",
          basicPackageLink: updated.basicLink || "https://wa.me/6282181144800",
          silverPackageLink: updated.silverLink || "https://wa.me/6282181144800",
          goldPackageLink: updated.goldLink || "https://wa.me/6282181144800",
          instructions: "Anda dapat mengedit link-link di dalam file JSON ini secara langsung (di folder assets). Link ini terhubung otomatis ke seluruh fitur website KOMINDO NETWORK."
        };
        fs.writeFileSync(linksFile, JSON.stringify(linksData, null, 2), "utf-8");
      } catch (err: any) {
        console.warn("Could not write public/assets/links.json:", err.message);
      }

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4b. Packages Endpoints (Realtime & Cloud Persistent)
  app.get("/api/packages", async (req, res) => {
    try {
      const packages = await dbService.getPackages();
      res.json({ packages });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/packages", async (req, res) => {
    try {
      const { packages } = req.body;
      if (!Array.isArray(packages)) {
        return res.status(400).json({ error: "Packages must be an array" });
      }
      const updated = await dbService.savePackages(packages);
      res.json({ success: true, packages: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4c. Admin Authentication & Password Change Endpoints
  app.get("/api/admin/auth-status", async (req, res) => {
    try {
      const creds = await dbService.getAdminCredentials();
      res.json({
        username: creds.username,
        hasCustomPassword: creds.password !== "adminkomindo" && creds.password !== "admin",
        updated_at: creds.updated_at
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/login", async (req, res) => {
    try {
      const clientIp = String(req.ip || req.socket.remoteAddress || "unknown");
      const now = Date.now();

      // Check brute-force lockout status
      const attemptData = adminLoginAttempts.get(clientIp);
      if (attemptData && attemptData.lockedUntil > now) {
        const remainingMinutes = Math.ceil((attemptData.lockedUntil - now) / 60000);
        return res.status(429).json({
          success: false,
          error: `Terlalu banyak percobaan login yang gagal. Akun dikunci sementara. Silakan coba lagi dalam ${remainingMinutes} menit.`
        });
      }

      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, error: "Username dan password wajib diisi." });
      }

      const creds = await dbService.getAdminCredentials();
      const inputUser = String(username).trim().toLowerCase();
      const inputPass = String(password).trim();
      const dbUser = String(creds.username || "admin").trim().toLowerCase();
      const dbPass = String(creds.password || "").trim();

      // Check if custom password is configured
      const hasCustomPassword = dbPass && dbPass !== "adminkomindo" && dbPass !== "admin";
      let isValid = false;

      if (hasCustomPassword) {
        isValid = inputUser === dbUser && inputPass === dbPass;
      } else {
        isValid = (inputUser === dbUser && (inputPass === dbPass || inputPass === "adminkomindo" || inputPass === "admin")) ||
                  (inputUser === "admin" && (inputPass === "adminkomindo" || inputPass === "admin"));
      }

      if (isValid) {
        // Reset failed attempt counter on success
        adminLoginAttempts.delete(clientIp);
        res.json({ success: true, message: "Login berhasil", username: creds.username });
      } else {
        // Increment failed attempts and apply lockout if threshold reached (5 attempts)
        const currentCount = (attemptData && attemptData.lockedUntil <= now) ? 0 : (attemptData?.count || 0);
        const newCount = currentCount + 1;
        const lockUntil = newCount >= 5 ? now + 5 * 60 * 1000 : 0; // Lock 5 minutes

        adminLoginAttempts.set(clientIp, { count: newCount, lockedUntil: lockUntil });

        if (newCount >= 5) {
          return res.status(429).json({
            success: false,
            error: "5 kali percobaan gagal. Akun administrator dikunci sementara selama 5 menit demi keamanan."
          });
        }

        res.status(401).json({
          success: false,
          error: "Username atau password salah."
        });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/admin/change-password", async (req, res) => {
    try {
      const { currentPassword, newUsername, newPassword } = req.body;
      if (!newPassword || String(newPassword).trim().length < 4) {
        return res.status(400).json({ success: false, error: "Password baru minimal 4 karakter." });
      }

      const creds = await dbService.getAdminCredentials();
      const inputCurrentPass = String(currentPassword || "").trim();
      const dbPass = String(creds.password || "").trim();
      const hasCustomPassword = dbPass && dbPass !== "adminkomindo" && dbPass !== "admin";

      // Verify current password
      let isCurrentValid = false;
      if (hasCustomPassword) {
        isCurrentValid = inputCurrentPass === dbPass;
      } else {
        isCurrentValid = inputCurrentPass === dbPass || inputCurrentPass === "adminkomindo" || inputCurrentPass === "admin";
      }

      if (!isCurrentValid) {
        return res.status(400).json({ success: false, error: "Password lama tidak sesuai." });
      }

      const updated = await dbService.saveAdminCredentials({
        username: (newUsername && String(newUsername).trim()) ? String(newUsername).trim() : creds.username,
        password: String(newPassword).trim()
      });

      res.json({
        success: true,
        message: "Username dan Password Admin berhasil diperbarui!",
        username: updated.username
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. WhatsApp Outgoing API Sender proxy (Upgraded to integrate with waGateway)
  app.post("/api/whatsapp/send", async (req, res) => {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ error: "Missing phone or message" });
    }

    const waRes = await waGateway.sendMessage(phone, message);
    return res.json({
      success: waRes.success,
      message: waRes.message,
      result: waRes.response
    });
  });

  // 6. WhatsApp Inbound Webhook (Interactive Auto-Responder & Admin Control Center)
  app.post("/api/whatsapp/webhook", async (req, res) => {
    console.log("📥 Incoming WhatsApp Webhook received:", JSON.stringify(req.body));

    // A. Webhook Secret Verification (via Header, Query Param, or Request Body)
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (webhookSecret) {
      const incomingSecret = req.headers["x-webhook-secret"] || req.query.secret || req.body.secret;
      if (incomingSecret !== webhookSecret) {
        console.warn(`🔒 Unauthorized webhook access attempt from IP: ${req.ip}`);
        return res.status(401).json({ status: false, error: "Unauthorized: Invalid webhook secret" });
      }
    }

    // B. Webhook Payload Extraction & Validation
    const rawSender = req.body.sender || req.body.from || req.body.phone || req.body.contact;
    const rawMessage = req.body.message || req.body.msg || req.body.text || req.body.body;

    if (!rawSender || String(rawSender).trim().toLowerCase() === "unknown") {
      console.warn("⚠️ Invalid Webhook payload: Missing or unknown sender");
      return res.status(400).json({ status: false, error: "Missing sender phone number" });
    }

    const sender = String(rawSender).trim();
    const incomingMessage = String(rawMessage || "").trim();

    if (!incomingMessage) {
      return res.json({ status: false, error: "Empty message" });
    }

    // C. Webhook Rate Limiting to prevent spam/loops
    const rateLimitKey = sender.replace(/[^0-9]/g, "");
    const nowMs = Date.now();
    const limitData = webhookRateLimitMap.get(rateLimitKey) || { count: 0, lastReset: nowMs };
    if (nowMs - limitData.lastReset > 60000) {
      limitData.count = 0;
      limitData.lastReset = nowMs;
    }
    limitData.count++;
    webhookRateLimitMap.set(rateLimitKey, limitData);

    if (limitData.count > 15) {
      console.warn(`⚠️ Webhook rate limit exceeded for sender ${rateLimitKey} (${limitData.count} requests/min)`);
      return res.status(429).json({ status: false, error: "Too many requests. Please wait a moment." });
    }

    const timestamp = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
    let replyText = "";
    let status: "success" | "not_found" | "ignored" = "ignored";

    // Utility functions isolated within the webhook
    function normalizePhoneNumber(phone: string): string {
      let cleaned = String(phone).trim().replace(/[^0-9]/g, "");
      if (cleaned.startsWith("0")) {
        cleaned = "62" + cleaned.substring(1);
      }
      return cleaned;
    }

    function parseBiayaToNumber(biayaStr: string): number {
      const clean = biayaStr.replace(/[^0-9]/g, "");
      return parseInt(clean, 10) || 0;
    }

    function parseDate(dStr: string): Date | null {
      if (!dStr) return null;
      const clean = dStr.replace(/[-]/g, "/").trim();
      const parts = clean.split("/");
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
          return new Date(y, m, d);
        }
      }
      return null;
    }

    function getDiffDays(dueDateStr: string): number | null {
      const custDate = parseDate(dueDateStr);
      if (!custDate) return null;
      custDate.setHours(0, 0, 0, 0);
      const jDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
      jDate.setHours(0, 0, 0, 0);
      const diffTime = custDate.getTime() - jDate.getTime();
      return Math.round(diffTime / (1000 * 60 * 60 * 24));
    }

    const lowerMsg = incomingMessage.toLowerCase();

    // Check if the message matches the SNAP SHEET data input format
    const hasNama = /nama\s*:/i.test(incomingMessage);
    const hasPaket = /paket\s*:/i.test(incomingMessage);
    const hasHargaOrBiaya = /(harga|biaya)\s*:/i.test(incomingMessage);
    const hasTempo = /(tempo|due|tanggal)\s*:/i.test(incomingMessage);

    const isSnapSheet = hasNama && hasPaket && hasHargaOrBiaya && hasTempo;

    if (isSnapSheet) {
      const normalizedSender = normalizePhoneNumber(sender);
      const adminNumbersEnv = process.env.ADMIN_WHATSAPP_NUMBERS || "";
      const adminNumbers = adminNumbersEnv
        .split(",")
        .map(num => normalizePhoneNumber(num))
        .filter(Boolean);

      const isAdmin = adminNumbers.includes(normalizedSender);

      if (!isAdmin) {
        replyText = `❌ Akses ditolak.\n\nAnda tidak memiliki izin untuk menginput data melalui WhatsApp.`;
        status = "success";
      } else {
        try {
          const lines = incomingMessage.split(/\r?\n/);
          let pName = "";
          let pPhone = "";
          let pPackage = "";
          let pPrice = "";
          let pDueDate = "";

          for (const line of lines) {
            const parts = line.split(":");
            if (parts.length >= 2) {
              const key = parts[0].trim().toLowerCase();
              const value = parts.slice(1).join(":").trim();

              if (key.includes("nama") || key === "name") {
                pName = value;
              } else if (key.includes("hp") || key.includes("phone") || key.includes("telepon") || key.includes("whatsapp") || key.includes("nomor")) {
                pPhone = value;
              } else if (key.includes("paket") || key === "package") {
                pPackage = value;
              } else if (key.includes("harga") || key.includes("biaya") || key === "price") {
                pPrice = value;
              } else if (key.includes("tempo") || key.includes("due") || key.includes("tanggal")) {
                pDueDate = value;
              }
            }
          }

          if (!pName) {
            replyText = `⚠️ Gagal menyimpan data: Kolom 'Nama' wajib diisi.`;
            status = "success";
          } else {
            let finalPhone = "";
            if (pPhone) {
              finalPhone = normalizePhoneNumber(pPhone);
            } else {
              finalPhone = "628" + Math.floor(1000000000 + Math.random() * 9000000000);
            }

            let finalDueDate = pDueDate;
            const parsedDay = parseInt(pDueDate.replace(/[^0-9]/g, ""), 10);
            if (!isNaN(parsedDay) && parsedDay >= 1 && parsedDay <= 31) {
              const now = new Date();
              const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
              const currentYear = now.getFullYear();
              finalDueDate = `${String(parsedDay).padStart(2, "0")}/${currentMonth}/${currentYear}`;
            } else if (!pDueDate) {
              const now = new Date();
              const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
              const currentYear = now.getFullYear();
              finalDueDate = `01/${currentMonth}/${currentYear}`;
            }

            const numericPrice = pPrice.replace(/[^0-9]/g, "");
            let displayPrice = "";
            if (numericPrice) {
              const val = parseInt(numericPrice, 10);
              if (val < 1000) {
                displayPrice = `${val}K`;
              } else {
                displayPrice = `${val / 1000}K`;
              }
            } else {
              displayPrice = "200K";
            }

            const cleanPackageName = pPackage ? pPackage.toUpperCase() : "BASIC";
            const finalPackageStr = `${cleanPackageName} ${displayPrice}`;

            const cleanNameForId = pName.toUpperCase().replace(/[^A-Z0-9]/g, "");
            const finalId = `PL4.GEN.${cleanNameForId.substring(0, 10)}.${Math.floor(100 + Math.random() * 900)}`;

            const newCust = {
              id: finalId,
              name: pName.toUpperCase(),
              phone: finalPhone,
              package: finalPackageStr,
              dueDate: finalDueDate,
              wa_reminder_sent: false
            };

            const saved = await dbService.saveCustomer(newCust);

            replyText = `✅ *DATA CUSTOMER BERHASIL DISIMPAN*

📌 *ID Pelanggan:* ${saved.id}
👤 *Nama:* ${saved.name}
📱 *WhatsApp:* ${saved.phone}
📦 *Paket:* ${saved.package}
📅 *Jatuh Tempo:* ${saved.dueDate}

_Data kini telah disinkronkan ke database utama dan muncul secara realtime di website!_`;
            status = "success";
          }
        } catch (err: any) {
          console.error("❌ Failed to parse/save WhatsApp snap sheet customer:", err);
          replyText = `❌ Terjadi kesalahan internal saat menyimpan data customer: ${err.message}`;
          status = "success";
        }
      }
    } else if (incomingMessage.startsWith("/")) {
      const normalizedSender = normalizePhoneNumber(sender);
      const adminNumbersEnv = process.env.ADMIN_WHATSAPP_NUMBERS || "";
      const adminNumbers = adminNumbersEnv
        .split(",")
        .map(num => normalizePhoneNumber(num))
        .filter(Boolean);

      const isAdmin = adminNumbers.includes(normalizedSender);

      if (!isAdmin) {
        replyText = `❌ Akses ditolak.\n\nAnda tidak memiliki izin untuk menggunakan fitur Admin Control WhatsApp.`;
        status = "success";
      } else {
        const cmdParts = incomingMessage.split(" ");
        const cmd = cmdParts[0].toLowerCase(); // e.g. "/cari", "/status", "/help"

        try {
          if (cmd === "/help") {
            replyText = `📱 *KOMINDO ADMIN CONTROL CENTER*

Daftar perintah yang tersedia:

1. */help*
   Menampilkan daftar perintah ini.

2. */status*
   Menampilkan status sistem (Server, Database, WhatsApp, Auto Reminder, Total Customer).

3. */cari [nama atau nomor]*
   Mencari data customer berdasarkan nama, nomor WhatsApp, atau ID.
   Contoh: \`/cari Budi\`

4. */customer [ID]*
   Menampilkan detail lengkap customer berdasarkan ID.
   Contoh: \`/customer PL3.01.ALI.001\`

5. */tagihan*
   Menampilkan ringkasan statistik tagihan (Total Pelanggan, Total Tagihan, Lunas, Menunggu Verifikasi, Belum Bayar/Overdue).

6. */tagihan hari ini*
   Menampilkan daftar customer yang jatuh tempo hari ini dan belum membayar.

7. */overdue*
   Menampilkan daftar customer yang melewati jatuh tempo dan belum membayar beserta nominal tagihannya.

8. */reminder*
   Menampilkan status dan rincian statistik sistem Auto Reminder (H-7, H-3, H-1, Hari H, Overdue).`;
            status = "success";
          } else if (cmd === "/status") {
            const dbDisplay = dbService.isUsingSupabase() ? "🟢 DATABASE: CONNECTED" : "🔴 DATABASE: DISCONNECTED (Local Fallback)";
            
            const waStatusData = await waGateway.checkStatus();
            const waDisplay = waStatusData.status === "online" ? "🟢 WHATSAPP: CONNECTED" : "🔴 WHATSAPP: DISCONNECTED";
            
            const templates = await dbService.getTemplates();
            const autoReminderDisplay = templates.tagihanActive ? "🟢 AUTO REMINDER: ACTIVE" : "🔴 AUTO REMINDER: INACTIVE";
            
            const customers = await dbService.getCustomers();
            const totalCust = customers.length;
            
            replyText = `🟢 SERVER: ONLINE
${dbDisplay}
${waDisplay}
${autoReminderDisplay}
👥 TOTAL CUSTOMER: ${totalCust}`;
            status = "success";
          } else if (cmd === "/cari") {
            const query = incomingMessage.substring(5).trim().toLowerCase();
            if (!query) {
              replyText = `⚠️ *FORMAT SALAH*\n\nGunakan format: */cari [nama atau nomor atau ID]*\nContoh: \`/cari Budi\``;
            } else {
              const customers = await dbService.getCustomers();
              const matched = customers.filter(c => {
                const idMatch = c.id.toLowerCase().includes(query);
                const nameMatch = c.name.toLowerCase().includes(query);
                const phoneClean = c.phone.replace(/[^0-9]/g, "");
                const queryClean = query.replace(/[^0-9]/g, "");
                const phoneMatch = queryClean ? phoneClean.includes(queryClean) : false;
                return idMatch || nameMatch || phoneMatch;
              });
              
              if (matched.length === 0) {
                replyText = `❌ *PENCARIAN TIDAK DITEMUKAN*\n\nPelanggan dengan kata kunci *"${query}"* tidak ditemukan di database kami.`;
              } else if (matched.length === 1) {
                const customer = matched[0];
                const biaya = getCustomerBiaya(customer.package);
                const diff = getDiffDays(customer.dueDate);
                const statusLabel = (diff !== null && diff < 0) ? "Menunggak (Overdue)" : "Aktif";
                replyText = `👤 DETAIL CUSTOMER

Nama: ${customer.name}
ID: ${customer.id}
📱 WhatsApp: ${customer.phone}
📦 Paket: ${customer.package}
💰 Harga: ${biaya}
📅 Jatuh Tempo: ${customer.dueDate}
📊 Status: ${statusLabel}`;
              } else {
                replyText = `🔍 *HASIL PENCARIAN (${matched.length})*\n\nDitemukan beberapa pelanggan dengan kata kunci *"${query}"*:\n\n`;
                matched.forEach((c, idx) => {
                  replyText += `${idx + 1}. *${c.name}* (${c.id})\n   Paket: ${c.package} | JT: ${c.dueDate}\n\n`;
                });
                replyText += `Gunakan command \`/customer [ID]\` untuk melihat detail lengkap salah satu pelanggan di atas.`;
              }
            }
            status = "success";
          } else if (cmd === "/customer") {
            const query = incomingMessage.substring(9).trim().toUpperCase();
            if (!query) {
              replyText = `⚠️ *FORMAT SALAH*\n\nGunakan format: */customer [ID]*\nContoh: \`/customer PL3.01.ALI.001\``;
            } else {
              const customer = await dbService.getCustomerByIdOrName(query);
              if (customer && customer.id.toUpperCase() === query) {
                const biaya = getCustomerBiaya(customer.package);
                const diff = getDiffDays(customer.dueDate);
                const statusLabel = (diff !== null && diff < 0) ? "Menunggak (Overdue)" : "Aktif";
                replyText = `👤 DETAIL CUSTOMER

Nama: ${customer.name}
ID: ${customer.id}
📱 WhatsApp: ${customer.phone}
📦 Paket: ${customer.package}
💰 Harga: ${biaya}
📅 Jatuh Tempo: ${customer.dueDate}
📊 Status: ${statusLabel}
🔔 Pengingat Terakhir: ${customer.wa_reminder_sent_at || "Belum pernah"}
📄 Bukti Bayar: ${customer.receipt_url ? "Tersedia (Pending Approval)" : "Tidak ada"}`;
              } else {
                replyText = `❌ *CUSTOMER TIDAK DITEMUKAN*\n\nPelanggan dengan ID *"${query}"* tidak ditemukan di database.`;
              }
            }
            status = "success";
          } else if (cmd === "/tagihan") {
            const isHariIni = incomingMessage.toLowerCase().includes("hari ini");
            const customers = await dbService.getCustomers();

            if (isHariIni) {
              const dueToday = customers.filter(c => getDiffDays(c.dueDate) === 0 && !c.receipt_url);
              
              if (dueToday.length > 0) {
                let listText = "";
                let totalSum = 0;
                dueToday.forEach((c, idx) => {
                  const biayaStr = getCustomerBiaya(c.package);
                  const cost = parseBiayaToNumber(biayaStr);
                  totalSum += cost;
                  listText += `${idx + 1}. *${c.name}* (${c.id})\n   Paket: ${c.package} | ${biayaStr}\n\n`;
                });
                
                replyText = `📅 *TAGIHAN JATUH TEMPO HARI INI*

Total Pelanggan: ${dueToday.length} Customer

${listText}*Total Nominal Tagihan:*
Rp ${totalSum.toLocaleString("id-ID")}`;
              } else {
                replyText = `✅ *Hebat!* Tidak ada customer yang jatuh tempo hari ini yang belum membayar.`;
              }
            } else {
              // General summary
              let totalNominalTagihan = 0;
              let countSudahBayar = 0;
              let nominalSudahBayar = 0;
              let countMenunggu = 0;
              let nominalMenunggu = 0;
              let countBelumBayar = 0;
              let nominalBelumBayar = 0;

              customers.forEach(c => {
                const biayaStr = getCustomerBiaya(c.package);
                const cost = parseBiayaToNumber(biayaStr);
                totalNominalTagihan += cost;

                const diff = getDiffDays(c.dueDate);
                if (c.receipt_url) {
                  countMenunggu++;
                  nominalMenunggu += cost;
                } else if (diff !== null && diff <= 0) {
                  countBelumBayar++;
                  nominalBelumBayar += cost;
                } else {
                  countSudahBayar++;
                  nominalSudahBayar += cost;
                }
              });

              replyText = `📊 *RINGKASAN TAGIHAN BILLING*

👥 *Total Pelanggan:* ${customers.length}
💰 *Total Nominal Tagihan:* Rp ${totalNominalTagihan.toLocaleString("id-ID")}

✅ *SUDAH BAYAR / LUNAS:*
• Jumlah: ${countSudahBayar} Pelanggan
• Nominal: Rp ${nominalSudahBayar.toLocaleString("id-ID")}

⏳ *MENUNGGU VERIFIKASI (UPLOAD BUKTI):*
• Jumlah: ${countMenunggu} Pelanggan
• Nominal: Rp ${nominalMenunggu.toLocaleString("id-ID")}

⚠️ *BELUM BAYAR / OVERDUE:*
• Jumlah: ${countBelumBayar} Pelanggan
• Nominal: Rp ${nominalBelumBayar.toLocaleString("id-ID")}

_Gunakan perintah berikut untuk melihat rincian:_
- Untuk jatuh tempo hari ini: \`/tagihan hari ini\`
- Untuk pelanggan menunggak: \`/overdue\``;
            }
            status = "success";
          } else if (cmd === "/overdue") {
            const customers = await dbService.getCustomers();
            const overdue = customers.filter(c => {
              const diff = getDiffDays(c.dueDate);
              return diff !== null && diff < 0 && !c.receipt_url;
            });
            
            if (overdue.length > 0) {
              let listText = "";
              let totalSum = 0;
              overdue.forEach((c, idx) => {
                const biayaStr = getCustomerBiaya(c.package);
                const cost = parseBiayaToNumber(biayaStr);
                totalSum += cost;
                listText += `${idx + 1}. ${c.name}
   Tagihan: ${biayaStr}\n\n`;
              });
              
              replyText = `⚠️ CUSTOMER MENUNGGAK

Total: ${overdue.length} Customer

${listText}Total tagihan tertunggak:
Rp ${totalSum.toLocaleString("id-ID")}`;
            } else {
              replyText = `✅ Hebat! Tidak ada customer yang menunggak saat ini.`;
            }
            status = "success";
          } else if (cmd === "/reminder") {
            const customers = await dbService.getCustomers();
            const templates = await dbService.getTemplates();
            
            let countH7 = 0;
            let countH3 = 0;
            let countH1 = 0;
            let countH0 = 0;
            let countOverdue = 0;
            
            customers.forEach(c => {
              const diff = getDiffDays(c.dueDate);
              if (diff === 7) countH7++;
              else if (diff === 3) countH3++;
              else if (diff === 1) countH1++;
              else if (diff === 0) countH0++;
              else if (diff !== null && diff < 0) countOverdue++;
            });
            
            const reminderStatusLabel = templates.tagihanActive ? "ACTIVE" : "INACTIVE";
            
            replyText = `🔔 AUTO REMINDER

Status: ${reminderStatusLabel}
Last Check: ${lastAutoCheckTime}
H-7: ${countH7} Customer
H-3: ${countH3} Customer
H-1: ${countH1} Customer
Hari H: ${countH0} Customer
Overdue: ${countOverdue} Customer`;
            status = "success";
          } else {
            replyText = `❌ Perintah tidak dikenal.

Ketik /help untuk melihat daftar command.`;
            status = "not_found";
          }
        } catch (err: any) {
          const errMsg = err.message ? String(err.message).toLowerCase() : "";
          if (errMsg.includes("supabase") || errMsg.includes("postgres") || errMsg.includes("db") || errMsg.includes("database")) {
            replyText = `❌ Database sedang mengalami masalah.`;
          } else if (errMsg.includes("wa") || errMsg.includes("whatsapp")) {
            replyText = `❌ WhatsApp service sedang mengalami masalah.`;
          } else {
            replyText = `❌ Terjadi kesalahan saat memproses perintah.`;
          }
          status = "not_found";
        }
      }
    } else {
      // Regular customer self-service checking via dynamic Bot WhatsApp Gateway
      try {
        const botSettings = await dbService.getBotSettings();
        
        if (!botSettings.status) {
          // If Bot is OFF, ignore regular customer messages
          replyText = "";
          status = "ignored";
          console.log(`ℹ️ [WhatsApp Webhook] Bot is OFF. Message from ${sender} ignored.`);
        } else {
          const cleanMsg = lowerMsg.trim();
          // Remove punctuation and extra spaces for resilient keyword matching
          const normMsg = cleanMsg.replace(/[^\w\s]/gi, "").trim().replace(/\s+/g, " ");

          console.log(`📥 [WhatsApp Webhook] Received message from ${sender}: "${incomingMessage}"`);
          console.log(`🔍 [Keyword Search] Clean: "${cleanMsg}", Normalized: "${normMsg}"`);

          const keywords = await dbService.getBotKeywords();
          const templates = await dbService.getTemplates();
          const settings = await dbService.getSettings();

          // Dynamic Date and Time for Asia/Jakarta
          const nowJakarta = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
          const tglJakarta = nowJakarta.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
          const jamJakarta = nowJakarta.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).replace(/\./g, ":");

          // Standard Welcome / Menu Card Response
          const welcomeMenu = `🌐 *KOMINDO NETWORK - BOT SERVICE*
📅 Tanggal: ${tglJakarta} | ⏰ Jam: ${jamJakarta} WIB
-----------------------------------------
Halo 👋 Selamat datang di layanan otomatis *Komindo Network*.

Silakan ketik nomor atau kata kunci layanan berikut:

1️⃣ *CEK TAGIHAN*
   ketik: *1* atau *CEK TAGIHAN*

2️⃣ *CARA PEMBAYARAN*
   ketik: *BAYAR TAGIHAN* atau *CARA PEMBAYARAN*

3️⃣ *PAKET INTERNET*
   ketik: *3* atau *PAKET INTERNET*

4️⃣ *DAFTAR PASANG BARU*
   ketik: *2* atau *DAFTAR INTERNET*

5️⃣ *LAPOR GANGGUAN*
   ketik: *4* atau *LAPOR GANGGUAN*

6️⃣ *HUBUNGI ADMIN*
   ketik: *5* atau *HUBUNGI ADMIN*

-----------------------------------------
💡 *Info:* Anda juga dapat ketik langsung *ID Pelanggan* (contoh: *PL3.01.ALI.001*) atau *Nama* Anda untuk cek tagihan.`;

          // Standard Pembayaran Response
          const caraPembayaranText = `💳 *PANDUAN & CARA PEMBAYARAN - KOMINDO NETWORK*

Untuk melakukan pembayaran tagihan internet, Anda dapat menonton video tutorial singkat berikut:
📺 *Video Tutorial YouTube Cara Pembayaran:*
${settings.youtubeLink || "https://youtube.com/@komindo_network?si=uM1XCOSYa72IKZ6y"}

1. *Melalui E-Billing Link:*
   Kunjungi link pembayaran resmi kami:
   ${settings.paymentLink || "https://e.ebilling.id/tagihan/?account=5379"}

2. *Transfer Bank / E-Wallet:*
   • Bank Mandiri / BCA / BRI / DANA (Sesuai Invoice E-Billing)
   • Cantumkan *ID Pelanggan* pada catatan transfer.

3. *Konfirmasi Pembayaran:*
   Kirimkan foto/bukti transfer ke WhatsApp Admin:
   https://wa.me/6282181144800

Butuh bantuan lebih lanjut? Ketik *HUBUNGI ADMIN*.`;

          let matchedRule = "";

          // 1. Try finding direct match or trigger match in DB keywords table
          const dbKeywordMatch = keywords.find(k => {
            if (!k.keyword) return false;
            // Support multiple comma/pipe separated keywords per rule (e.g. "1, cek tagihan, tagihan")
            const triggers = k.keyword.split(/[,|]/).map(t => t.trim().toLowerCase()).filter(Boolean);
            
            return triggers.some(trig => {
              const trigNorm = trig.replace(/[^\w\s]/gi, "").trim().replace(/\s+/g, " ");
              if (!trigNorm) return false;

              // Exact match
              if (cleanMsg === trig || normMsg === trigNorm) return true;

              // Substring match
              if (trigNorm.length >= 2 && normMsg.includes(trigNorm)) return true;
              if (normMsg.length >= 2 && trigNorm.includes(normMsg)) return true;

              return false;
            });
          });

          // Define alias sets for fallback matching
          const isMenuAlias = ["menu", "halo", "hi", "helo", "hello", "start", "ping", "p", "bantuan", "info", "bot", "pilihan", "layanan"].includes(normMsg);
          const isTagihanAlias = ["cek tagihan", "tagihan", "1", "cek tagihan saya", "info tagihan", "biaya", "cek"].includes(normMsg);
          const isBayarAlias = ["bayar tagihan", "cara pembayaran", "bayar", "cara bayar", "pembayaran", "rekening", "transfer", "bukti bayar"].includes(normMsg);
          const isDaftarAlias = ["daftar internet", "2", "daftar", "pasang baru", "registrasi", "pendaftaran"].includes(normMsg);
          const isPaketAlias = ["paket internet", "3", "paket", "harga paket", "list paket"].includes(normMsg);
          const isGangguanAlias = ["lapor gangguan", "4", "gangguan", "lapor", "lemot", "internet mati", "rusak", "komplain"].includes(normMsg);
          const isAdminAlias = ["hubungi admin", "5", "admin", "cs", "kontak", "help"].includes(normMsg);

          if (dbKeywordMatch) {
            matchedRule = `DB Keyword (${dbKeywordMatch.keyword})`;
            if (dbKeywordMatch.reply === "CEK_TAGIHAN_DYNAMIC") {
              const normalizedSender = normalizePhoneNumber(sender);
              const customers = await dbService.getCustomers();
              const customerByPhone = customers.find(c => normalizePhoneNumber(c.phone) === normalizedSender);

              if (customerByPhone) {
                if (templates.tagihanActive) {
                  replyText = templates.tagihanTemplate
                    .replace(/{nama}/g, customerByPhone.name)
                    .replace(/{paket}/g, customerByPhone.package)
                    .replace(/{jatuhTempo}/g, customerByPhone.dueDate)
                    .replace(/{id}/g, customerByPhone.id)
                    .replace(/{linkPembayaran}/g, settings.paymentLink || "https://e.ebilling.id/tagihan/?account=5379");
                } else {
                  replyText = `Halo *${customerByPhone.name}*, tagihan Anda untuk Paket *${customerByPhone.package}* (ID: *${customerByPhone.id}*) jatuh tempo pada *${customerByPhone.dueDate}*. Link pembayaran: ${settings.paymentLink || "https://e.ebilling.id/tagihan/?account=5379"}`;
                }
              } else {
                replyText = `Halo 👋 Nomor WhatsApp Anda (*${sender}*) belum terdaftar otomatis di sistem billing kami.\n\nAnda tetap dapat cek tagihan dengan mengetik langsung *ID Pelanggan* (contoh: *PL3.01.ALI.KASIM.001*) atau *Nama* Anda.\n\nAtau ketik *MENU* untuk pilihan layanan lainnya.`;
              }
            } else if (dbKeywordMatch.reply === "CARA_PEMBAYARAN_DYNAMIC") {
              replyText = caraPembayaranText;
            } else if (dbKeywordMatch.reply === "WELCOME_MENU_DYNAMIC") {
              replyText = welcomeMenu;
            } else {
              // Replace dynamic tags in custom replies if present
              const normalizedSender = normalizePhoneNumber(sender);
              const customers = await dbService.getCustomers();
              const cust = customers.find(c => normalizePhoneNumber(c.phone) === normalizedSender);

              replyText = dbKeywordMatch.reply
                .replace(/{nama}/g, cust ? cust.name : "Pelanggan")
                .replace(/{id}/g, cust ? cust.id : "-")
                .replace(/{paket}/g, cust ? cust.package : "-")
                .replace(/{jatuhTempo}/g, cust ? cust.dueDate : "-")
                .replace(/{linkPembayaran}/g, settings.paymentLink || "https://e.ebilling.id/tagihan/?account=5379")
                .replace(/{youtubeLink}/g, settings.youtubeLink || "https://youtube.com/@komindo_network?si=uM1XCOSYa72IKZ6y");
            }
            status = "success";
          } else if (isMenuAlias) {
            matchedRule = "Menu Alias";
            replyText = welcomeMenu;
            status = "success";
          } else if (isTagihanAlias) {
            matchedRule = "Cek Tagihan Alias";
            const normalizedSender = normalizePhoneNumber(sender);
            const customers = await dbService.getCustomers();
            const customerByPhone = customers.find(c => normalizePhoneNumber(c.phone) === normalizedSender);

            if (customerByPhone) {
              if (templates.tagihanActive) {
                replyText = templates.tagihanTemplate
                  .replace(/{nama}/g, customerByPhone.name)
                  .replace(/{paket}/g, customerByPhone.package)
                  .replace(/{jatuhTempo}/g, customerByPhone.dueDate)
                  .replace(/{id}/g, customerByPhone.id)
                  .replace(/{linkPembayaran}/g, settings.paymentLink || "https://e.ebilling.id/tagihan/?account=5379");
              } else {
                replyText = `Halo *${customerByPhone.name}*, tagihan Anda untuk Paket *${customerByPhone.package}* (ID: *${customerByPhone.id}*) jatuh tempo pada *${customerByPhone.dueDate}*. Link pembayaran: ${settings.paymentLink || "https://e.ebilling.id/tagihan/?account=5379"}`;
              }
            } else {
              replyText = `Halo 👋 Nomor WhatsApp Anda (*${sender}*) belum terdaftar langsung di database billing kami.\n\nSilakan ketik langsung *ID Pelanggan* Anda (contoh: *PL3.01.ALI.KASIM.001*) atau ketik *Nama* Anda secara langsung untuk mengecek tagihan.`;
            }
            status = "success";
          } else if (isBayarAlias) {
            matchedRule = "Bayar Tagihan Alias";
            replyText = caraPembayaranText;
            status = "success";
          } else if (isDaftarAlias) {
            matchedRule = "Daftar Internet Alias";
            replyText = "Silakan hubungi admin kami melalui WhatsApp di https://wa.me/6282181144800 untuk pendaftaran pasang baru wifi Komindo Network.";
            status = "success";
          } else if (isPaketAlias) {
            matchedRule = "Paket Internet Alias";
            replyText = "Berikut adalah daftar paket internet KOMINDO NETWORK yang tersedia:\n\n1. PAKET BASIC 200K - Rp 200.000\n2. PAKET SILVER 250K - Rp 250.000\n3. PAKET GOLD 300K - Rp 300.000\n4. PAKET DIAMOND 350K - Rp 350.000\n5. PSB (Biaya Registrasi) - Rp 300.000\n6. PAKET PRO BISNIS 500K - Rp 500.000\n7. CSR FREE - Rp 0";
            status = "success";
          } else if (isGangguanAlias) {
            matchedRule = "Lapor Gangguan Alias";
            replyText = "Laporan gangguan Anda telah kami terima. Tim teknisi Komindo Network akan segera mengecek koneksi Anda. Mohon pastikan modem wifi tetap menyala.";
            status = "success";
          } else if (isAdminAlias) {
            matchedRule = "Hubungi Admin Alias";
            replyText = "Hubungi admin kami di nomor berikut: 6282181144800 untuk info billing, registrasi, dan penawaran lainnya.";
            status = "success";
          } else {
            // Try direct customer lookup by ID or Name
            const customer = await dbService.getCustomerByIdOrName(incomingMessage.trim());

            if (customer) {
              matchedRule = `Customer Lookup (${customer.name})`;
              if (templates.tagihanActive) {
                replyText = templates.tagihanTemplate
                  .replace(/{nama}/g, customer.name)
                  .replace(/{paket}/g, customer.package)
                  .replace(/{jatuhTempo}/g, customer.dueDate)
                  .replace(/{id}/g, customer.id)
                  .replace(/{linkPembayaran}/g, settings.paymentLink || "https://e.ebilling.id/tagihan/?account=5379");
              } else {
                replyText = `Halo *${customer.name}*, data billing Anda ditemukan.\nID: *${customer.id}*\nPaket: *${customer.package}*\nJatuh Tempo: *${customer.dueDate}*\nLink Pembayaran: ${settings.paymentLink || "https://e.ebilling.id/tagihan/?account=5379"}`;
              }
              status = "success";
            } else {
              if (incomingMessage.trim().length >= 2) {
                matchedRule = "Default Reply Fallback";
                replyText = `${botSettings.default_reply}\n\n${welcomeMenu}`;
                status = "success";
              } else {
                matchedRule = "Ignored (Too Short)";
                replyText = "";
                status = "ignored";
              }
            }
          }

          console.log(`🎯 [Keyword Match] Matched Rule: "${matchedRule}", Status: "${status}"`);
          console.log(`📤 [Response Prepared] Length: ${replyText.length} chars`);

          // Log bot chat to database
          if (status !== "ignored") {
            try {
              const timeParts = timestamp.split(" ");
              const tanggal = timeParts[0] || tglJakarta;
              const jam = timeParts[1] || jamJakarta;

              // Find customer name if possible to log it correctly
              const allCusts = await dbService.getCustomers();
              const matchedCust = allCusts.find(c => normalizePhoneNumber(c.phone) === normalizePhoneNumber(sender));
              const customerName = matchedCust ? matchedCust.name : "Customer";

              const chatLog = {
                id: "log_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
                phone: sender,
                name: customerName,
                message: incomingMessage,
                reply: replyText || "(Tidak Menjawab)",
                status: status === "success" ? "success" : "failed",
                tanggal,
                jam
              };

              // Save to database
              await dbService.addBotChat(chatLog);
            } catch (logErr: any) {
              console.error("❌ Error saving bot chat log:", logErr.message);
            }
          }
        }
      } catch (err: any) {
        console.error("❌ Exception during Bot WhatsApp execution:", err.message);
        replyText = `❌ Layanan WhatsApp Bot sedang mengalami pemeliharaan.`;
        status = "not_found";
      }
    }

    if (status !== "ignored") {
      botLogs.unshift({ timestamp, sender, incoming: incomingMessage, reply: replyText, status });
      if (botLogs.length > 100) botLogs.pop();

      // Actively forward reply through Baileys WhatsApp Gateway
      if (replyText) {
        waGateway.sendMessage(sender, replyText).then(sendRes => {
          console.log(`🤖 [WA Gateway Outbound] Sent reply to ${sender}. Success: ${sendRes.success}`);
        }).catch(err => {
          console.error(`❌ [WA Gateway Outbound] Failed to send reply to ${sender}:`, err.message);
        });
      }
    }

    return res.json({
      status: true,
      sender: sender,
      reply: replyText,
      message: replyText,
      text: replyText
    });
  });

  // Get WhatsApp Live Gateway logs inside the Admin Dashboard
  app.get("/api/whatsapp/logs", (req, res) => {
    res.json(botLogs);
  });

  // Clear WhatsApp live logs
  app.post("/api/whatsapp/logs/clear", (req, res) => {
    botLogs.length = 0;
    res.json({ success: true });
  });

  // ==========================================
  // 🤖 BOT WHATSAPP CORE API ENDPOINTS
  // ==========================================

  // Get bot settings
  app.get("/api/bot/settings", async (req, res) => {
    try {
      const settings = await dbService.getBotSettings();
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Save bot settings
  app.post("/api/bot/settings", async (req, res) => {
    try {
      const { status, default_reply } = req.body;
      const payload = {
        status: !!status,
        default_reply: String(default_reply || "").trim()
      };
      const saved = await dbService.saveBotSettings(payload);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get all bot keywords
  app.get("/api/bot/keywords", async (req, res) => {
    try {
      const keywords = await dbService.getBotKeywords();
      res.json(keywords);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Save or update bot keyword
  app.post("/api/bot/keywords", async (req, res) => {
    try {
      const { id, keyword, reply } = req.body;
      if (!keyword || !reply) {
        return res.status(400).json({ error: "Kolom kata kunci dan balasan wajib diisi" });
      }
      const payload = {
        id: id || "kw_" + Math.random().toString(36).substring(2, 11),
        keyword: String(keyword).trim(),
        reply: String(reply).trim()
      };
      const saved = await dbService.saveBotKeyword(payload);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete bot keyword
  app.delete("/api/bot/keywords/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await dbService.deleteBotKeyword(id);
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Test keyword matching simulation
  app.post("/api/bot/test-keyword", async (req, res) => {
    try {
      const { message, senderPhone } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Pesan simulasi wajib diisi" });
      }

      const keywords = await dbService.getBotKeywords();
      const settings = await dbService.getSettings();
      const templates = await dbService.getTemplates();
      const botSettings = await dbService.getBotSettings();

      const incomingMessage = String(message).trim();
      const lowerMsg = incomingMessage.toLowerCase();
      const cleanMsg = lowerMsg.trim();
      const normMsg = cleanMsg.replace(/[^\w\s]/gi, "").trim().replace(/\s+/g, " ");

      const dbKeywordMatch = keywords.find(k => {
        if (!k.keyword) return false;
        const triggers = k.keyword.split(/[,|]/).map(t => t.trim().toLowerCase()).filter(Boolean);
        return triggers.some(trig => {
          const trigNorm = trig.replace(/[^\w\s]/gi, "").trim().replace(/\s+/g, " ");
          if (!trigNorm) return false;
          if (cleanMsg === trig || normMsg === trigNorm) return true;
          if (trigNorm.length >= 2 && normMsg.includes(trigNorm)) return true;
          if (normMsg.length >= 2 && trigNorm.includes(normMsg)) return true;
          return false;
        });
      });

      let replyText = "";
      let matchedRule = "";

      if (dbKeywordMatch) {
        matchedRule = `Rule Custom DB: "${dbKeywordMatch.keyword}"`;
        if (dbKeywordMatch.reply === "CEK_TAGIHAN_DYNAMIC") {
          replyText = `[Cek Tagihan Dinamis System] Query otomatis database billing untuk pengirim ${senderPhone || "08xxx"}`;
        } else if (dbKeywordMatch.reply === "CARA_PEMBAYARAN_DYNAMIC") {
          replyText = `[Cara Pembayaran System] Mengirimkan panduan e-billing (${settings.paymentLink}) & tutorial YouTube (${settings.youtubeLink})`;
        } else if (dbKeywordMatch.reply === "WELCOME_MENU_DYNAMIC") {
          replyText = `[Menu Utama System] Mengirimkan daftar menu layanan Komindo Network`;
        } else {
          const customers = await dbService.getCustomers();
          const cust = customers[0]; // sample for preview
          replyText = dbKeywordMatch.reply
            .replace(/{nama}/g, cust ? cust.name : "Pelanggan")
            .replace(/{id}/g, cust ? cust.id : "PL4.01.DEMO.001")
            .replace(/{paket}/g, cust ? cust.package : "BASIC 200K")
            .replace(/{jatuhTempo}/g, cust ? cust.dueDate : "01/08/2026")
            .replace(/{linkPembayaran}/g, settings.paymentLink || "https://e.ebilling.id/tagihan/?account=5379")
            .replace(/{youtubeLink}/g, settings.youtubeLink || "https://youtube.com/@komindo_network?si=uM1XCOSYa72IKZ6y");
        }
      } else {
        matchedRule = "Pesan Umum / Fallback Bot";
        replyText = `${botSettings.default_reply || "Maaf, pesan tidak dikenali."}\n\n[Ketik MENU untuk bantuan]`;
      }

      res.json({
        success: true,
        incomingMessage,
        matchedRule,
        replyText,
        isBotActive: botSettings.status
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get bot chat logs (riwayat chat)
  app.get("/api/bot/chats", async (req, res) => {
    try {
      const chats = await dbService.getBotChats();
      res.json(chats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Clear bot chat logs
  app.delete("/api/bot/chats", async (req, res) => {
    try {
      await dbService.clearBotChats();
      res.json({ message: "Riwayat chat bot berhasil dibersihkan." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 9. Payment simulation endpoint for frontend triggers (Pembayaran Sukses/Gagal)
  app.post("/api/payments/simulate", async (req, res) => {
    const { customerId, status } = req.body;
    if (!customerId || !status) {
      return res.status(400).json({ error: "Parameter 'customerId' dan 'status' wajib diisi" });
    }

    try {
      const customer = await dbService.getCustomerByIdOrName(customerId);
      if (!customer) {
        return res.status(404).json({ error: "Customer tidak ditemukan" });
      }

      const templates = await dbService.getTemplates();
      const settings = await dbService.getSettings();

      let replyMessage = "";
      if (status === "success") {
        replyMessage = generateReminderMessage(customer, "payment_success", settings.paymentLink || "https://e.ebilling.id/tagihan/?account=5379");
        
        // Reset status otomatis ke belum dikirim & majukan jatuh tempo 1 bulan
        customer.wa_reminder_sent = false;
        customer.wa_reminder_sent_at = undefined;
        customer.last_wa_message_id = undefined;

        if (customer.dueDate) {
          const separator = customer.dueDate.includes("-") ? "-" : "/";
          const parts = customer.dueDate.split(/[-/]/);
          if (parts.length === 3) {
            let d = parseInt(parts[0], 10);
            let m = parseInt(parts[1], 10);
            let y = parseInt(parts[2], 10);
            
            m += 1;
            if (m > 12) {
              m = 1;
              y += 1;
            }
            customer.dueDate = `${String(d).padStart(2, '0')}${separator}${String(m).padStart(2, '0')}${separator}${y}`;
          }
        }
        await dbService.saveCustomer(customer);

        // Delete receipt file upon successful payment confirmation
        const safeId = customer.id.replace(/[^A-Za-z0-9]/g, "_");
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        const pathPng = path.join(uploadDir, `receipt_${safeId}.png`);
        const pathJpg = path.join(uploadDir, `receipt_${safeId}.jpg`);
        if (fs.existsSync(pathPng)) fs.unlinkSync(pathPng);
        if (fs.existsSync(pathJpg)) fs.unlinkSync(pathJpg);
      } else {
        replyMessage = `❌ *PEMBAYARAN GAGAL*\n\nTransaksi pembayaran tagihan internet KOMINDO NETWORK Anda untuk ID *${customer.id}* (Paket *${customer.package}*) dilaporkan *GAGAL/DITOLAK* oleh bank/gerbang pembayaran.\n\nMohon periksa kembali saldo atau metode pembayaran Anda. Hubungi CS Komindo Network jika memerlukan bantuan.`;
      }

      const waRes = await waGateway.sendMessage(customer.phone, replyMessage);

      // Log transaction simulation to botLogs
      const logTimestamp = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
      botLogs.unshift({
        timestamp: logTimestamp,
        sender: `PAYMENT SANDBOX (${status.toUpperCase()})`,
        incoming: `Simulasi Transaksi: ${customer.name}`,
        reply: replyMessage,
        status: status === "success" ? "success" : "not_found"
      });
      if (botLogs.length > 100) botLogs.pop();

      res.json({
        success: true,
        message: `Simulasi pembayaran ${status} berhasil diproses`,
        waResult: waRes,
        customer
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 9b. Upload payment receipt endpoint
  app.post("/api/payments/upload-receipt", async (req, res) => {
    const { customerId, receiptBase64 } = req.body;
    if (!customerId || !receiptBase64) {
      return res.status(400).json({ error: "Parameter 'customerId' dan 'receiptBase64' wajib diisi" });
    }

    try {
      const customer = await dbService.getCustomerByIdOrName(customerId);
      if (!customer) {
        return res.status(404).json({ error: "Customer tidak ditemukan" });
      }

      // Parse base64 string
      const matches = receiptBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: "Format file gambar base64 tidak valid" });
      }

      const mimeType = matches[1].toLowerCase();
      const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
      if (!allowedMimeTypes.includes(mimeType)) {
        return res.status(400).json({ error: "Format file tidak didukung. Harap unggah gambar PNG, JPG, JPEG, atau WEBP." });
      }

      const buffer = Buffer.from(matches[2], 'base64');
      if (buffer.length > 5 * 1024 * 1024) {
        return res.status(400).json({ error: "Ukuran file bukti pembayaran terlalu besar. Maksimal 5 MB." });
      }
      
      let ext = "png";
      if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
        ext = "jpg";
      } else if (mimeType.includes("webp")) {
        ext = "webp";
      }

      const safeId = path.basename(customer.id.replace(/[^A-Za-z0-9_-]/g, "_"));
      let receiptUrl = receiptBase64; // Default fallback to direct Base64 string

      try {
        // Ensure upload directory exists
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Delete old files to prevent conflicts
        const pathPng = path.join(uploadDir, `receipt_${safeId}.png`);
        const pathJpg = path.join(uploadDir, `receipt_${safeId}.jpg`);
        if (fs.existsSync(pathPng)) {
          try { fs.unlinkSync(pathPng); } catch (e) {}
        }
        if (fs.existsSync(pathJpg)) {
          try { fs.unlinkSync(pathJpg); } catch (e) {}
        }

        const filePath = path.join(uploadDir, `receipt_${safeId}.${ext}`);
        fs.writeFileSync(filePath, buffer);
        receiptUrl = `/uploads/receipt_${safeId}.${ext}`;
      } catch (fsErr: any) {
        console.warn("⚠️ Filesystem is read-only. Using direct Base64 url fallback for payment receipt:", fsErr.message);
      }

      // Send automatic confirmation WhatsApp to customer
      const msg = `📥 *BUKTI PEMBAYARAN DITERIMA*\n\nHalo *${customer.name}* (ID: *${customer.id}*),\n\nBukti pembayaran Anda telah berhasil diunggah dan diterima oleh sistem e-billing KOMINDO NETWORK.\n\nTim Admin kami akan memverifikasi pembayaran Anda dalam waktu dekat. Terima kasih! Jaringan internet Anda tetap berstatus aktif/diproses.`;
      
      await waGateway.sendMessage(customer.phone, msg);

      // Log upload to botLogs
      const logTimestamp = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
      botLogs.unshift({
        timestamp: logTimestamp,
        sender: "SYSTEM (RECEIPT UPLOAD)",
        incoming: `Upload Bukti Pembayaran: ${customer.name}`,
        reply: msg,
        status: "success"
      });
      if (botLogs.length > 100) botLogs.pop();

      const receiptUploadedAt = new Date().toISOString();

      customer.receipt_url = receiptUrl;
      customer.receipt_uploaded_at = receiptUploadedAt;
      await dbService.saveCustomer(customer);

      res.json({
        success: true,
        message: "Bukti pembayaran berhasil diunggah!",
        receipt_url: receiptUrl,
        receipt_uploaded_at: receiptUploadedAt
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 10. Manual send/retry reminder endpoint for single customer
  app.post("/api/whatsapp/send-manual", async (req, res) => {
    const { customerId } = req.body;
    if (!customerId) {
      return res.status(400).json({ error: "Missing customerId" });
    }

    try {
      const customer = await dbService.getCustomerByIdOrName(customerId);
      if (!customer) {
        return res.status(404).json({ error: "Customer tidak ditemukan" });
      }

      const templates = await dbService.getTemplates();
      const settings = await dbService.getSettings();

      if (!templates.tagihanActive) {
        return res.status(400).json({ error: "Template tagihan sedang dinonaktifkan oleh admin." });
      }

      const message = templates.tagihanTemplate
        .replace(/{nama}/g, customer.name)
        .replace(/{paket}/g, customer.package)
        .replace(/{jatuhTempo}/g, customer.dueDate)
        .replace(/{id}/g, customer.id)
        .replace(/{linkPembayaran}/g, settings.paymentLink || "https://e.ebilling.id/tagihan/?account=5379");

      const logTimestamp = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
      const newMsgId = "msg_" + Math.random().toString(36).substring(2, 11);

      // Validate number format first
      const validation = waGateway.validatePhoneNumber(customer.phone);
      if (!validation.isValid) {
        botLogs.unshift({
          timestamp: logTimestamp,
          sender: "RETRY MANUAL",
          incoming: `Kirim Manual ke ${customer.name} (${customer.phone})`,
          reply: `Gagal: Nomor tidak valid (${validation.error})`,
          status: "not_found"
        });
        if (botLogs.length > 100) botLogs.pop();
        return res.status(400).json({ error: `Nomor WhatsApp tidak valid: ${validation.error}` });
      }

      const waRes = await waGateway.sendMessage(customer.phone, message);

      if (waRes.success) {
        customer.wa_reminder_sent = true;
        customer.wa_reminder_sent_at = logTimestamp;
        customer.last_wa_message_id = newMsgId;
        await dbService.saveCustomer(customer);

        botLogs.unshift({
          timestamp: logTimestamp,
          sender: "RETRY MANUAL",
          incoming: `Kirim Manual ke ${customer.name}`,
          reply: message,
          status: "success"
        });
        if (botLogs.length > 100) botLogs.pop();

        res.json({ success: true, message: `Pesan pengingat manual berhasil dikirim ke ${customer.name}!`, data: { id: newMsgId }, customer });
      } else {
        botLogs.unshift({
          timestamp: logTimestamp,
          sender: "RETRY MANUAL",
          incoming: `Kirim Manual ke ${customer.name}`,
          reply: `Error: ${waRes.message}`,
          status: "not_found"
        });
        if (botLogs.length > 100) botLogs.pop();

        res.status(500).json({ error: `Gagal mengirim pesan: ${waRes.message}` });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 12. Reset WhatsApp reminder status for a customer
  app.post("/api/whatsapp/reset-reminder", async (req, res) => {
    const { customerId } = req.body;
    if (!customerId) {
      return res.status(400).json({ error: "Missing customerId" });
    }
    try {
      const customer = await dbService.getCustomerByIdOrName(customerId);
      if (!customer) {
        return res.status(404).json({ error: "Customer tidak ditemukan" });
      }
      customer.wa_reminder_sent = false;
      customer.wa_reminder_sent_at = undefined;
      customer.last_wa_message_id = undefined;
      await dbService.saveCustomer(customer);
      res.json({ success: true, customer });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 13. Test Spintax/Random Message generation for all stages
  app.post("/api/whatsapp/test-spintax", async (req, res) => {
    const { customerId } = req.body;
    try {
      let customer = null;
      if (customerId) {
        customer = await dbService.getCustomerByIdOrName(customerId);
      }
      // If no customer specified, use a realistic mock customer for demonstration/testing
      if (!customer) {
        customer = {
          id: "PL3.01.ALI.KASIM.001",
          name: "ALI KASIM",
          phone: "6281234567890",
          package: "Paket Gold (50 Mbps)",
          dueDate: "25/07/2026"
        };
      }

      const settings = await dbService.getSettings();
      const link = settings.paymentLink || "https://e.ebilling.id/tagihan/?account=5379";

      const stages = ["h7", "h3", "h1", "h0", "overdue", "new_invoice", "payment_success"];
      const results: Record<string, string> = {};

      for (const stage of stages) {
        results[stage] = generateReminderMessage(customer, stage, link);
      }

      res.json({
        success: true,
        customer,
        results
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // ====================================================
  // 🕒 AUTOMATED BOT BACKGROUND WORKERS (H-1 & OVERDUE)
  // ====================================================

  // ====================================================
  // 🕒 AUTOMATED BOT BACKGROUND WORKERS (H-7, H-3, H-1, Hari H, and Overdue)
  // ====================================================

  // Unified background checkers
  async function runAllAutoBillingChecks() {
    console.log("🕒 [Background Worker] Running automated billing reminders...");
    const sentList: { name: string; phone: string; id: string; status: string }[] = [];
    const h1Res: typeof sentList = [];
    const overdueRes: typeof sentList = [];

    try {
      const customers = await dbService.getCustomers();
      const templates = await dbService.getTemplates();
      const settings = await dbService.getSettings();

      lastAutoCheckTime = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) + " WIB";

      const waStatus = await waGateway.checkStatus();
      if (waStatus.status !== "online") {
        console.log("ℹ️ [Background Worker] WhatsApp Gateway belum terhubung (Perlu Scan QR Code). Pengingat otomatis ditunda.");
        return { h1Res, overdueRes };
      }

      if (!templates.tagihanActive) {
        console.log("⚠️ [Auto Bot] Tagihan templates are currently disabled in settings.");
        return { h1Res, overdueRes };
      }

      const jakartaDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
      const todayStr = jakartaDate.getFullYear() + "-" + String(jakartaDate.getMonth() + 1).padStart(2, '0') + "-" + String(jakartaDate.getDate()).padStart(2, '0');

      function parseDate(dStr: any): Date | null {
        if (!dStr) return null;
        const str = String(dStr).trim();
        if (!str) return null;

        const currYear = jakartaDate.getFullYear();
        const currMonth = jakartaDate.getMonth(); // 0-indexed

        // Pure day number: e.g. "27" or 27 (day of current month)
        if (/^\d{1,2}$/.test(str)) {
          const day = parseInt(str, 10);
          if (day >= 1 && day <= 31) {
            return new Date(currYear, currMonth, day);
          }
        }

        const clean = str.replace(/[-]/g, "/").trim();
        const parts = clean.split("/").map(p => p.trim());

        if (parts.length === 3) {
          let d = 0, m = 0, y = 0;
          if (parts[0].length === 4) {
            // YYYY/MM/DD or YYYY-MM-DD (ISO Format from HTML5 date pickers)
            y = parseInt(parts[0], 10);
            m = parseInt(parts[1], 10) - 1;
            d = parseInt(parts[2], 10);
          } else {
            // DD/MM/YYYY or DD-MM-YYYY
            d = parseInt(parts[0], 10);
            m = parseInt(parts[1], 10) - 1;
            y = parseInt(parts[2], 10);
            if (y < 100) y += 2000;
          }
          if (!isNaN(d) && !isNaN(m) && !isNaN(y) && d >= 1 && d <= 31 && m >= 0 && m <= 11) {
            return new Date(y, m, d);
          }
        } else if (parts.length === 2) {
          // DD/MM or DD-MM
          const d = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          if (!isNaN(d) && !isNaN(m) && d >= 1 && d <= 31 && m >= 0 && m <= 11) {
            return new Date(currYear, m, d);
          }
        }

        return null;
      }

      function getDiffDays(dueDateStr: string): number | null {
        const custDate = parseDate(dueDateStr);
        if (!custDate) return null;
        custDate.setHours(0, 0, 0, 0);
        const jDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
        jDate.setHours(0, 0, 0, 0);
        const diffTime = custDate.getTime() - jDate.getTime();
        return Math.round(diffTime / (1000 * 60 * 60 * 24));
      }

      for (const customer of customers) {
        const diffDays = getDiffDays(customer.dueDate);
        if (diffDays === null) continue;

        let stageKey = "";
        let stageLabel = "";

        if (diffDays === 7) {
          stageKey = "h7";
          stageLabel = "H-7 Sebelum Jatuh Tempo";
        } else if (diffDays === 3) {
          stageKey = "h3";
          stageLabel = "H-3 Sebelum Jatuh Tempo";
        } else if (diffDays === 1) {
          stageKey = "h1";
          stageLabel = "H-1 Sebelum Jatuh Tempo";
        } else if (diffDays === 0) {
          stageKey = "h0";
          stageLabel = "Hari H Jatuh Tempo";
        } else if (diffDays < 0) {
          stageKey = "overdue";
          stageLabel = "Lewat Jatuh Tempo (Overdue)";
        } else {
          // Not in target reminder windows
          continue;
        }

        // Parse existing sent stages
        let sentStages: Record<string, string> = {};
        if (customer.lastH1SentDate) {
          try {
            sentStages = JSON.parse(customer.lastH1SentDate);
          } catch (e) {
            // Backward compatibility
            if (customer.lastH1SentDate.includes("-")) {
              sentStages = { "h1": customer.lastH1SentDate };
            }
          }
        }

        // Check if already sent today for this stage
        if (sentStages[stageKey] === todayStr) {
          const skipItem = { name: customer.name, phone: customer.phone, id: customer.id, status: `Already Sent ${stageLabel} Today` };
          sentList.push(skipItem);
          if (stageKey === "overdue") overdueRes.push(skipItem);
          else h1Res.push(skipItem);
          continue;
        }

        // Skip sending if customer has uploaded a receipt (pending admin review/approval)
        if (customer.receipt_url) {
          const skipItem = { name: customer.name, phone: customer.phone, id: customer.id, status: `Skip - Receipt Uploaded (Pending)` };
          sentList.push(skipItem);
          if (stageKey === "overdue") overdueRes.push(skipItem);
          else h1Res.push(skipItem);
          continue;
        }

        // Validate customer phone number
        const validation = waGateway.validatePhoneNumber(customer.phone);
        if (!validation.isValid) {
          const logTimestamp = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
          botLogs.unshift({
            timestamp: logTimestamp,
            sender: `SISTEM OTOMATIS (${stageLabel})`,
            incoming: `Pesan Otomatis: ${customer.name}`,
            reply: `Gagal: Nomor WhatsApp tidak valid (${validation.error})`,
            status: "not_found"
          });
          if (botLogs.length > 100) botLogs.pop();
          const invalidItem = { name: customer.name, phone: customer.phone, id: customer.id, status: "Invalid Phone Number" };
          sentList.push(invalidItem);
          if (stageKey === "overdue") overdueRes.push(invalidItem);
          else h1Res.push(invalidItem);
          continue;
        }

        const finalMsg = generateReminderMessage(
          customer, 
          stageKey, 
          settings.paymentLink || "https://e.ebilling.id/tagihan/?account=5379",
          settings.youtubeLink || "https://youtube.com/@komindo_network?si=uM1XCOSYa72IKZ6y"
        );

        const waRes = await waGateway.sendMessage(customer.phone, finalMsg);

        const logTimestamp = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
        if (waRes.success) {
          // Extract message ID from WhatsApp Gateway response if available, fallback to unique random string
          let messageId = "msg_auto_" + Math.random().toString(36).substring(2, 11);
          if (waRes.response && waRes.response.id) {
            messageId = Array.isArray(waRes.response.id) 
              ? waRes.response.id.join(",") 
              : String(waRes.response.id);
          }

          botLogs.unshift({
            timestamp: logTimestamp,
            sender: `SISTEM OTOMATIS (${stageLabel})`,
            incoming: `Sistem Otomatis Pengingat: ${customer.name}`,
            reply: finalMsg,
            status: "success"
          });
          if (botLogs.length > 100) botLogs.pop();

          // Mark this stage as sent today
          sentStages[stageKey] = todayStr;
          customer.lastH1SentDate = JSON.stringify(sentStages);
          customer.wa_reminder_sent = true;
          customer.wa_reminder_sent_at = logTimestamp;
          customer.last_wa_message_id = messageId;
          await dbService.saveCustomer(customer);

          const successItem = { name: customer.name, phone: customer.phone, id: customer.id, status: `Success Reminded ${stageLabel}` };
          sentList.push(successItem);
          if (stageKey === "overdue") overdueRes.push(successItem);
          else h1Res.push(successItem);
        } else {
          // Record the failure/error back to the customer record in the database
          const errorMsg = waRes.message || "Unknown WhatsApp Gateway sending error";
          customer.last_wa_message_id = `ERROR: ${errorMsg.substring(0, 100)}`;
          customer.wa_reminder_sent = false;
          customer.wa_reminder_sent_at = logTimestamp;
          await dbService.saveCustomer(customer);

          botLogs.unshift({
            timestamp: logTimestamp,
            sender: `SISTEM OTOMATIS (${stageLabel})`,
            incoming: `Sistem Otomatis Pengingat: ${customer.name}`,
            reply: `Gagal mengirim ke ${customer.phone}: ${errorMsg}`,
            status: "not_found"
          });
          if (botLogs.length > 100) botLogs.pop();

          const failedItem = { name: customer.name, phone: customer.phone, id: customer.id, status: `Failed to Send ${stageLabel} (${errorMsg})` };
          sentList.push(failedItem);
          if (stageKey === "overdue") overdueRes.push(failedItem);
          else h1Res.push(failedItem);
        }
      }
    } catch (err: any) {
      console.error(`❌ [Auto Bot] Error in unified background task:`, err.message);
    }

    return { h1Res, overdueRes };
  }

  // 11. Endpoint to trigger automated checks manually
  app.post("/api/whatsapp/auto-check", async (req, res) => {
    try {
      const { h1Res, overdueRes } = await runAllAutoBillingChecks();
      res.json({ success: true, results: [...h1Res, ...overdueRes] });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Run initial checks 5 seconds after startup
  setTimeout(() => {
    runAllAutoBillingChecks().then(res => {
      console.log(`🤖 [Background Worker] Initial automated checks completed.`);
    });
  }, 5000);

  // Dynamic background worker poller running every 1 minute
  let minutesSinceLastCheck = 0;
  let hoursSinceLastBackup = 0;
  setInterval(async () => {
    try {
      const settings = await dbService.getSettings();
      const interval = settings.cronIntervalMinutes || 10;
      minutesSinceLastCheck++;
      if (minutesSinceLastCheck >= interval) {
        minutesSinceLastCheck = 0;
        console.log(`🤖 [Background Scheduler] Cron trigger: running automated billing checks every ${interval} minutes...`);
        await runAllAutoBillingChecks();
      }

      // Automated backup every 12 hours (720 minutes)
      hoursSinceLastBackup++;
      if (hoursSinceLastBackup >= 720) {
        hoursSinceLastBackup = 0;
        console.log(`💾 [Disaster Recovery Scheduler] Creating automated periodic backup snapshot...`);
        await dbService.createBackup('automatic');
      }
    } catch (e: any) {
      console.error("❌ [Background Scheduler] Error in periodic poller:", e.message);
    }
  }, 60000); // 1 minute in milliseconds

  // Initial auto backup check on startup (create initial snapshot if backups list is empty)
  setTimeout(async () => {
    try {
      const backups = await dbService.getBackups();
      if (!backups || backups.length === 0) {
        console.log("💾 Creating initial Disaster Recovery backup snapshot...");
        await dbService.createBackup('automatic');
      }
    } catch (err: any) {
      console.warn("⚠️ Initial backup snapshot notice:", err.message);
    }
  }, 10000);

  // ====================================================
  // 🛡️ DISASTER RECOVERY & SYSTEM HEALTH MONITOR API ROUTES
  // ====================================================

  // 1. Health Monitor & Realtime System Metrics Endpoint
  app.get("/api/system/health", async (req, res) => {
    try {
      const dbStatus = dbService.getConnectionStatus();
      const backups = await dbService.getBackups();
      const settings = await dbService.getSettings();
      const customers = await dbService.getCustomers();
      const botChats = await dbService.getBotChats();
      const waLogs = waGateway.getLogs();
      const waSessions = whatsappManager.getAllSessions();
      const activeSession = waSessions.find(s => s.status === "connected");

      const memoryUsage = process.memoryUsage();
      const uptimeSec = Math.floor(process.uptime());

      // Format uptime string
      const days = Math.floor(uptimeSec / (3600 * 24));
      const hours = Math.floor((uptimeSec % (3600 * 24)) / 3600);
      const minutes = Math.floor((uptimeSec % 3600) / 60);
      const seconds = uptimeSec % 60;
      const uptimeFormatted = `${days > 0 ? `${days}d ` : ""}${hours}h ${minutes}m ${seconds}s`;

      const heapUsedMb = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const heapTotalMb = Math.round(memoryUsage.heapTotal / 1024 / 1024);
      const rssMb = Math.round(memoryUsage.rss / 1024 / 1024);
      const memoryUsagePercent = Math.min(100, Math.round((heapUsedMb / Math.max(1, heapTotalMb)) * 100));

      let cpuLoad = 0.15;
      if (typeof process.cpuUsage === "function") {
        const cpu = process.cpuUsage();
        cpuLoad = parseFloat(((cpu.user + cpu.system) / 100000000).toFixed(2));
      }

      const paidCustomersCount = customers.filter(c => !!c.receipt_url).length;
      const jakartaToday = new Date().toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" });

      const todayErrorsFromWaLogs = waLogs.filter(l => l.type === "ERROR" && l.timestamp.includes(jakartaToday));
      const todayErrorsFromBotLogs = botLogs.filter(l => l.status !== "success" && l.timestamp.includes(jakartaToday));
      const todayErrorsCount = todayErrorsFromWaLogs.length + todayErrorsFromBotLogs.length;

      const recentErrorMessages: string[] = [];
      todayErrorsFromWaLogs.slice(0, 5).forEach(e => {
        recentErrorMessages.push(`[WhatsApp Gateway Error] ${e.message} ${e.details ? `(${e.details})` : ""}`);
      });
      todayErrorsFromBotLogs.slice(0, 5).forEach(e => {
        recentErrorMessages.push(`[Bot Interaction Alert] ${e.sender}: ${e.reply || "Gagal memproses pesan"}`);
      });

      let lastActivity = lastAutoCheckTime;
      if (botLogs.length > 0) {
        lastActivity = botLogs[0].timestamp;
      } else if (botChats.length > 0 && botChats[0].tanggal) {
        lastActivity = `${botChats[0].tanggal} ${botChats[0].jam || ""}`;
      }

      const lastBackup = backups.length > 0 ? backups[0] : null;

      res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        backend: {
          status: "OK",
          uptimeSeconds: uptimeSec,
          uptimeFormatted,
          memoryMb: heapUsedMb,
          heapTotalMb,
          rssMb,
          memoryUsagePercent
        },
        database: {
          status: dbStatus.connected ? "ONLINE" : "OFFLINE",
          connected: dbStatus.connected,
          mode: dbStatus.mode,
          details: dbStatus.details,
          error: dbStatus.error
        },
        whatsapp: {
          status: activeSession ? "CONNECTED" : "DISCONNECTED",
          connected: !!activeSession,
          phoneNumber: activeSession ? activeSession.phoneNumber : null,
          name: activeSession ? activeSession.name : null,
          sessionStatus: activeSession ? activeSession.status : "disconnected"
        },
        scheduler: {
          status: "ACTIVE",
          cronIntervalMinutes: settings.cronIntervalMinutes || 10,
          reminderTimingDays: settings.reminderTimingDays || 1,
          lastAutoCheckTime: lastAutoCheckTime
        },
        api: {
          status: "OK",
          activeEndpointsCount: 22
        },
        metrics: {
          cpuUsagePercent: Math.min(100, Math.round(cpuLoad * 10)),
          memoryUsageMb: heapUsedMb,
          memoryTotalMb: heapTotalMb,
          memoryUsagePercent,
          uptimeFormatted
        },
        activity: {
          lastActivity,
          lastReminder: lastAutoCheckTime,
          lastBackup: lastBackup ? lastBackup.created_at : null
        },
        totals: {
          totalCustomers: customers.length,
          totalInvoices: customers.length,
          totalPembayaran: paidCustomersCount,
          totalPesanWhatsApp: botChats.length + botLogs.length,
          errorsToday: todayErrorsCount
        },
        recentErrors: recentErrorMessages,
        disasterRecovery: {
          lastBackupTimestamp: lastBackup ? lastBackup.created_at : null,
          lastBackupFilename: lastBackup ? lastBackup.filename : null,
          lastBackupType: lastBackup ? lastBackup.type : null,
          lastBackupRecordsCount: lastBackup ? lastBackup.records_count : 0,
          totalBackupsStored: backups.length
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Get Backup List
  app.get("/api/backups", async (req, res) => {
    try {
      const backups = await dbService.getBackups();
      res.json({ success: true, backups });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Trigger Manual Backup
  app.post("/api/backups/create", async (req, res) => {
    try {
      const backup = await dbService.createBackup("manual");
      res.json({ success: true, backup, message: "Snapshot backup berhasil dibuat!" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Download Backup File
  app.get("/api/backups/:id/download", async (req, res) => {
    try {
      const backup = await dbService.getBackupById(req.params.id);
      if (!backup) {
        return res.status(404).json({ error: "Berkas backup tidak ditemukan." });
      }
      const jsonContent = JSON.stringify(backup.data || backup, null, 2);
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="${backup.filename || 'komindo_backup.json'}"`);
      res.send(jsonContent);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. Delete Backup
  app.delete("/api/backups/:id", async (req, res) => {
    try {
      const deleted = await dbService.deleteBackup(req.params.id);
      if (deleted) {
        res.json({ success: true, message: "Backup berhasil dihapus." });
      } else {
        res.status(404).json({ error: "Backup tidak ditemukan." });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. Restore Backup from Payload or Upload
  app.post("/api/backups/restore", async (req, res) => {
    try {
      const { backupData, backupId, mode = "overwrite" } = req.body;
      let payloadToRestore = backupData;

      if (!payloadToRestore && backupId) {
        const found = await dbService.getBackupById(backupId);
        if (!found) {
          return res.status(404).json({ error: "Data backup tidak ditemukan di database." });
        }
        payloadToRestore = found.data;
      }

      if (!payloadToRestore) {
        return res.status(400).json({ error: "Payload data backup tidak boleh kosong." });
      }

      const result = await dbService.restoreBackup(payloadToRestore, mode);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // ====================================================
  // 🖥️ VITE DEV SERVER OR STATIC SERVING IN PRODUCTION
  // ====================================================
  async function startServer() {
    const isProduction = process.env.NODE_ENV === "production" && fs.existsSync(path.join(process.cwd(), "dist", "index.html"));

    if (!isProduction && !process.env.VERCEL) {
      try {
        const { createServer: createViteServer } = await import("vite");
        const vite = await createViteServer({
          server: {
            middlewareMode: true,
            hmr: false,
            ws: false,
          },
          appType: "spa",
        });
        app.use(vite.middlewares);
      } catch (viteErr: any) {
        console.error("⚠️ Failed to initialize Vite middleware, falling back to static files:", viteErr.message);
        const distPath = path.join(process.cwd(), "dist");
        if (fs.existsSync(distPath)) {
          app.use(express.static(distPath));
          app.get("*", (req, res) => {
            res.sendFile(path.join(distPath, "index.html"));
          });
        }
      }
    } else {
      const distPath = path.join(process.cwd(), "dist");
      // Serve public/assets dynamically so dynamic user uploads are available instantly without rebuilding
      app.use("/assets", express.static(path.join(process.cwd(), "public", "assets")));
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    // Bind to 0.0.0.0 and PORT 3000 if not on Vercel
    if (!process.env.VERCEL) {
      const server = app.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 [KOMINDO BILLING SYSTEM] Server is running on http://0.0.0.0:${PORT}`);
        console.log(`📡 [KOMINDO GATEWAY] Baileys Multi-Session WhatsApp Gateway initializing...`);
        whatsappManager.init().then(() => {
          console.log(`✅ [KOMINDO GATEWAY] Baileys Gateway initialized successfully.`);
        }).catch(err => {
          console.error(`❌ [KOMINDO GATEWAY] Failed to initialize Baileys Gateway:`, err.message);
        });
      });

      server.on("error", (err: any) => {
        if (err.code === "EADDRINUSE") {
          console.error(`❌ [KOMINDO BILLING SYSTEM] Port ${PORT} is already in use. Retrying in 1s...`);
          setTimeout(() => {
            server.close();
            app.listen(PORT, "0.0.0.0");
          }, 1000);
        } else {
          console.error("❌ [KOMINDO BILLING SYSTEM] Server error:", err);
        }
      });
    }
  }

  startServer().catch((err) => {
    console.error("❌ Failed to start server:", err);
  });

export default app;
