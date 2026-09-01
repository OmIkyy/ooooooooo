import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Types matching the frontend
export interface Customer {
  id: string;
  name: string;
  phone: string;
  package: string;
  dueDate: string;
  lastH1SentDate?: string;
  wa_reminder_sent?: boolean;
  wa_reminder_sent_at?: string;
  last_wa_message_id?: string;
  receipt_url?: string;
  receipt_uploaded_at?: string;
}

export interface InternetPackage {
  id: string;
  name: string;
  speed: string;
  price: string;
  period: string;
  tagline: string;
  badge?: string;
  isPopular?: boolean;
  features: string[];
  orderLink?: string;
}

export interface AdminCredentials {
  username: string;
  password: string;
  updated_at?: string;
}

export interface MessageTemplates {
  tagihanActive: boolean;
  tagihanTemplate: string;
  psbActive: boolean;
  psbTemplate: string;
}

export interface AppSettings {
  paymentLink: string;
  youtubeLink?: string;
  basicLink: string;
  silverLink: string;
  goldLink: string;
  cronIntervalMinutes?: number;
  reminderTimingDays?: number;
  packagesList?: string[];
  packages?: InternetPackage[];
  admin_credentials?: AdminCredentials;
}

export interface BotKeyword {
  id: string;
  keyword: string;
  reply: string;
}

export interface BotSettings {
  status: boolean;
  default_reply: string;
}

export interface BotChatLog {
  id: string;
  phone: string;
  name: string;
  message: string;
  reply: string;
  status: string;
  tanggal: string;
  jam: string;
  created_at?: string;
}

const SEED_CUSTOMERS: Customer[] = [];

const DEFAULT_TEMPLATES: MessageTemplates = {
  tagihanActive: true,
  tagihanTemplate: `🎉 SELAMAT DATANG DI KOMINDO NETWORK

Halo {nama},

Data Anda sudah terdaftar sebagai pelanggan kami.

📌 ID Pelanggan: {id}
📦 Paket: {paket}
📅 Jatuh Tempo: {jatuhTempo}

Terima kasih sudah memilih & mempercayai KOMINDO NETWORK. Semoga layanan internet kami selalu lancar menemani aktivitas Anda.

Salam hangat,
Tim KOMINDO NETWORK

▶️ Cara Pembayaran (Video Tutorial YouTube):
{youtubeLink}

🔗 Link Pembayaran Direct:
{linkPembayaran}`,
  psbActive: false,
  psbTemplate: `Ini adalah pesan otomatis dari sistem e-billing layanan *KOMINDO NETWORK*

*Pembayaran Biaya Aktivasi Pemasangan Baru Wifi*

Halo *{nama}*,
Biaya : {paket}
Jatuh Tempo : {jatuhTempo}

▶️ Cara Pembayaran (Video Tutorial YouTube):
{youtubeLink}

🔗 Link Pembayaran:
{linkPembayaran}

Mohon melakukan pembayaran biaya aktivasi pendaftaran baru sebesar 300K. Terima kasih!`
};

export const DEFAULT_PACKAGES: InternetPackage[] = [
  {
    id: "pkg_basic",
    name: "Basic",
    speed: "20 Mbps",
    price: "200K",
    period: "/bulan",
    tagline: "Perfect untuk keluarga kecil",
    badge: "Paling Populer",
    isPopular: true,
    features: [
      "Paket Basic (20 Mbps)",
      "Unlimited Tanpa FUP",
      "Instalasi Cepat",
      "Support Team Teknis dan Admin"
    ],
    orderLink: "https://wa.me/6282181144800"
  },
  {
    id: "pkg_silver",
    name: "Paket Silver",
    speed: "30 Mbps",
    price: "250K",
    period: "/bulan",
    tagline: "Ideal untuk work from home",
    badge: "",
    isPopular: false,
    features: [
      "Paket Silver (30 Mbps)",
      "Unlimited Tanpa FUP",
      "Instalasi Gratis",
      "Support Team Teknis dan Admin"
    ],
    orderLink: "https://wa.me/6282181144800"
  },
  {
    id: "pkg_gold",
    name: "Paket Gold",
    speed: "50 Mbps",
    price: "300K",
    period: "/bulan",
    tagline: "Untuk Rumah, bisnis dan kantor",
    badge: "",
    isPopular: false,
    features: [
      "Paket Gold (50 Mbps)",
      "Unlimited Tanpa FUP",
      "Instalasi Gratis",
      "Support Team Teknis dan Admin"
    ],
    orderLink: "https://wa.me/6282181144800"
  }
];

export const DEFAULT_ADMIN_CREDENTIALS: AdminCredentials = {
  username: "admin",
  password: "adminkomindo"
};

export const DEFAULT_PACKAGES_LIST = [
  "BASIC 200K",
  "SILVER 250K",
  "GOLD 300K"
];

const DEFAULT_SETTINGS: AppSettings = {
  paymentLink: "https://e.ebilling.id/tagihan/?account=5379",
  youtubeLink: "https://youtube.com/@komindo_network?si=uM1XCOSYa72IKZ6y",
  basicLink: "https://wa.me/6282181144800",
  silverLink: "https://wa.me/6282181144800",
  goldLink: "https://wa.me/6282181144800",
  cronIntervalMinutes: 10,
  reminderTimingDays: 1,
  packagesList: DEFAULT_PACKAGES_LIST,
  packages: DEFAULT_PACKAGES,
  admin_credentials: DEFAULT_ADMIN_CREDENTIALS
};

// File-based local database fallback
let LOCAL_DB_PATH = path.join(process.cwd(), "src", "local_database.json");
let inMemoryDb: any = null;

function readLocalDB() {
  if (inMemoryDb) {
    return inMemoryDb;
  }

  // Try to read from current LOCAL_DB_PATH
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const content = fs.readFileSync(LOCAL_DB_PATH, "utf8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn("⚠️ Error reading from LOCAL_DB_PATH, checking fallback:", err);
  }

  // Check if /tmp/local_database.json exists and load it
  const tempPath = path.join("/tmp", "local_database.json");
  try {
    if (fs.existsSync(tempPath)) {
      LOCAL_DB_PATH = tempPath;
      const content = fs.readFileSync(tempPath, "utf8");
      return JSON.parse(content);
    }
  } catch (err) {
    // ignore
  }

  const initialData = {
    customers: SEED_CUSTOMERS,
    templates: DEFAULT_TEMPLATES,
    settings: DEFAULT_SETTINGS
  };

  // Try writing to primary LOCAL_DB_PATH
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initialData, null, 2), "utf8");
    return initialData;
  } catch (err: any) {
    console.warn("⚠️ Primary LOCAL_DB_PATH is not writable (expected on read-only systems like Vercel). Trying /tmp/local_database.json fallback...");
    LOCAL_DB_PATH = tempPath;
    try {
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initialData, null, 2), "utf8");
      return initialData;
    } catch (tmpErr: any) {
      console.error("❌ Both file-based fallbacks failed. Activating in-memory storage fallback:", tmpErr.message);
      inMemoryDb = initialData;
      return inMemoryDb;
    }
  }
}

function writeLocalDB(data: any) {
  if (inMemoryDb) {
    inMemoryDb = data;
    return;
  }

  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err: any) {
    console.warn(`⚠️ Failed writing to LOCAL_DB_PATH (${LOCAL_DB_PATH}). Trying /tmp/local_database.json fallback...`);
    const tempPath = path.join("/tmp", "local_database.json");
    LOCAL_DB_PATH = tempPath;
    try {
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), "utf8");
    } catch (tmpErr: any) {
      console.error("❌ Both file-based write fallbacks failed. Activating in-memory storage fallback:", tmpErr.message);
      inMemoryDb = data;
    }
  }
}

class DatabaseService {
  private useSupabase = false;
  private connectionError: string | null = null;
  private supabase: any = null;
  private initPromise: Promise<void> | null = null;

  private isProduction() {
    return process.env.NODE_ENV === "production" || process.env.FORCE_SUPABASE === "true";
  }

  private ensureProductionDb() {
    if (this.isProduction() && !this.useSupabase) {
      console.log(
        `ℹ️ NOTICE (Database Production Mode): Koneksi Supabase tidak aktif. ` +
        `Data akan disimpan ke local database fallback. ` +
        `Pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY telah diatur di .env dan tabel-tabel di Supabase telah dibuat.`
      );
    }
  }

  async ensureInitialized() {
    if (!this.initPromise) {
      this.initPromise = this.init();
    }
    await this.initPromise;
    this.ensureProductionDb();
  }

  async init() {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) {
      this.useSupabase = false;
      this.connectionError = "Kredensial Supabase tidak ditemukan (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY kosong).";
      if (this.isProduction()) {
        console.error("❌ CRITICAL ERROR: Supabase credentials are missing in production! VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be configured.");
      } else {
        console.log("⚠️ Supabase credentials are not set. Falling back to Local JSON Database.");
      }
      return;
    }

    try {
      console.log("🔌 Checking connection to Supabase database...");
      this.supabase = createClient(url, key);

      // Perform a quick test query to check connection and schema availability with a 4-second timeout
      const queryPromise = this.supabase.from("customers").select("id").limit(1);
      const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
        setTimeout(() => reject(new Error("Koneksi Supabase timeout setelah 4 detik")), 4000)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error) {
        console.log("ℹ️ Supabase not fully initialized. Using Local File Database. Error details:", error.message);
        this.connectionError = `Tabel Supabase belum lengkap atau belum dibuat. Silakan jalankan script SQL di Supabase SQL Editor. Info: ${error.message}`;
        this.useSupabase = false;
      } else {
        console.log("✅ Successfully connected to Supabase database!");
        this.useSupabase = true;
        this.connectionError = null;

        // Seed tables if empty
        await this.seedIfNeeded();
      }
    } catch (err: any) {
      console.log("ℹ️ Supabase database is offline or unreachable. Utilizing Local File Database as the safe active storage fallback. Detail:", err.message || err);
      this.useSupabase = false;
      this.connectionError = `Supabase tidak dapat dihubungi: ${err.message || err}`;
    }
  }

  private async seedIfNeeded() {
    if (!this.useSupabase || !this.supabase) return;

    try {
      // 1. Seed customers if empty
      const { data: customers, error: cErr } = await this.supabase.from("customers").select("id").limit(1);
      if (!cErr && (!customers || customers.length === 0)) {
        console.log("🌱 Seeding Supabase with initial customers...");
        const formatted = SEED_CUSTOMERS.map(c => ({
          id: c.id.toUpperCase(),
          name: c.name.toUpperCase(),
          phone: c.phone,
          package: c.package,
          dueDate: c.dueDate,
          lastH1SentDate: c.lastH1SentDate || null
        }));
        await this.supabase.from("customers").insert(formatted);
      }

      // 2. Seed templates if empty
      const { data: templates, error: tErr } = await this.supabase.from("templates").select("key").eq("key", "default");
      if (!tErr && (!templates || templates.length === 0)) {
        console.log("🌱 Seeding Supabase with default templates...");
        await this.supabase.from("templates").insert([{
          key: "default",
          tagihanActive: DEFAULT_TEMPLATES.tagihanActive,
          tagihanTemplate: DEFAULT_TEMPLATES.tagihanTemplate,
          psbActive: DEFAULT_TEMPLATES.psbActive,
          psbTemplate: DEFAULT_TEMPLATES.psbTemplate
        }]);
      }

      // 3. Seed settings if empty
      const { data: settings, error: sErr } = await this.supabase.from("settings").select("key").eq("key", "default");
      if (!sErr && (!settings || settings.length === 0)) {
        console.log("🌱 Seeding Supabase with default settings...");
        await this.supabase.from("settings").insert([{
          key: "default",
          paymentLink: DEFAULT_SETTINGS.paymentLink,
          basicLink: DEFAULT_SETTINGS.basicLink,
          silverLink: DEFAULT_SETTINGS.silverLink,
          goldLink: DEFAULT_SETTINGS.goldLink,
          cronIntervalMinutes: DEFAULT_SETTINGS.cronIntervalMinutes,
          reminderTimingDays: DEFAULT_SETTINGS.reminderTimingDays
        }]);
      }

      // 4. Seed packages if empty
      const { data: pkgs, error: pErr } = await this.supabase.from("packages").select("id").limit(1);
      if (!pErr && (!pkgs || pkgs.length === 0)) {
        console.log("🌱 Seeding Supabase with default 3 packages...");
        await this.supabase.from("packages").insert(DEFAULT_PACKAGES);
      }

      // 5. Seed admin auth if empty
      const { data: adminAuth, error: aErr } = await this.supabase.from("admin_auth").select("username").limit(1);
      if (!aErr && (!adminAuth || adminAuth.length === 0)) {
        console.log("🌱 Seeding Supabase with default admin credentials...");
        await this.supabase.from("admin_auth").insert([DEFAULT_ADMIN_CREDENTIALS]);
      }
    } catch (err: any) {
      console.log("ℹ️ Auto-seed message: Supabase setup optional check finished.", err.message);
    }
  }

  isUsingSupabase() {
    return this.useSupabase;
  }

  getConnectionStatus() {
    return {
      connected: this.useSupabase,
      mode: this.useSupabase ? "Supabase Database" : "Local File Database",
      details: this.useSupabase 
        ? "Connected to Supabase Project: krmcerakwutsunuyuhku" 
        : "Menggunakan file /src/local_database.json (Local Database Aktif & Realtime).",
      error: this.connectionError,
      sqlHelp: `
-- Jalankan script SQL ini di Dashboard Supabase (SQL Editor) Anda:

CREATE TABLE IF NOT EXISTS packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  speed TEXT,
  price TEXT NOT NULL,
  period TEXT DEFAULT '/bulan',
  tagline TEXT,
  badge TEXT,
  "isPopular" BOOLEAN DEFAULT false,
  features JSONB DEFAULT '[]'::jsonb,
  "orderLink" TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_auth (
  username TEXT PRIMARY KEY DEFAULT 'admin',
  password TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  package TEXT NOT NULL,
  "dueDate" TEXT NOT NULL,
  "lastH1SentDate" TEXT,
  "wa_reminder_sent" BOOLEAN DEFAULT false,
  "wa_reminder_sent_at" TEXT,
  "last_wa_message_id" TEXT,
  "receipt_url" TEXT,
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
  "cronIntervalMinutes" INTEGER DEFAULT 10,
  "reminderTimingDays" INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS bot_settings (
  key TEXT PRIMARY KEY DEFAULT 'default',
  status BOOLEAN DEFAULT true,
  spreadsheet_id TEXT,
  sheet_name TEXT DEFAULT 'Sheet1',
  service_account_json TEXT,
  default_reply TEXT
);

CREATE TABLE IF NOT EXISTS bot_keywords (
  id TEXT PRIMARY KEY,
  keyword TEXT NOT NULL,
  reply TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bot_chats (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  name TEXT,
  message TEXT NOT NULL,
  reply TEXT NOT NULL,
  status TEXT,
  tanggal TEXT NOT NULL,
  jam TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS backups (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  type TEXT NOT NULL,
  size_bytes INTEGER DEFAULT 0,
  records_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS wa_sessions (
  id TEXT PRIMARY KEY,
  creds_data TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
      `
    };
  }

  // Customers Logic
  async getCustomers(): Promise<Customer[]> {
    await this.ensureInitialized();
    if (this.useSupabase && this.supabase) {
      const { data, error } = await this.supabase.from("customers").select("*").order("name", { ascending: true });
      if (error) {
        console.log("ℹ️ Fetching customers from Supabase offline. Using fallback: ", error.message);
        const db = readLocalDB();
        return db.customers || [];
      }
      return (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        package: c.package,
        dueDate: c.dueDate,
        lastH1SentDate: c.lastH1SentDate || undefined,
        wa_reminder_sent: c.wa_reminder_sent ?? false,
        wa_reminder_sent_at: c.wa_reminder_sent_at || undefined,
        last_wa_message_id: c.last_wa_message_id || undefined,
        receipt_url: c.receipt_url || undefined,
        receipt_uploaded_at: c.receipt_uploaded_at || undefined
      }));
    } else {
      const db = readLocalDB();
      return db.customers || [];
    }
  }

  async getCustomerByIdOrName(queryStr: string): Promise<Customer | null> {
    const q = queryStr.trim().toLowerCase();
    if (!q) return null;

    await this.ensureInitialized();
    if (this.useSupabase && this.supabase) {
      const { data, error } = await this.supabase
        .from("customers")
        .select("*")
        .or(`id.ilike.%${q}%,name.ilike.%${q}%`);

      if (error) {
        console.log("ℹ️ Searching customer: using active JSON database.");
        const db = readLocalDB();
        const found = (db.customers as Customer[]).find(
          cust => cust.id.toLowerCase() === q || cust.name.toLowerCase() === q
        );
        return found || null;
      }

      if (!data || data.length === 0) return null;
      const exactMatch = data.find((c: any) => c.id.toLowerCase() === q || c.name.toLowerCase() === q);
      const match = exactMatch || data[0];
      return {
        id: match.id,
        name: match.name,
        phone: match.phone,
        package: match.package,
        dueDate: match.dueDate,
        lastH1SentDate: match.lastH1SentDate || undefined,
        wa_reminder_sent: match.wa_reminder_sent ?? false,
        wa_reminder_sent_at: match.wa_reminder_sent_at || undefined,
        last_wa_message_id: match.last_wa_message_id || undefined,
        receipt_url: match.receipt_url || undefined,
        receipt_uploaded_at: match.receipt_uploaded_at || undefined
      };
    } else {
      const db = readLocalDB();
      const found = (db.customers as Customer[]).find(
        cust => cust.id.toLowerCase() === q || cust.name.toLowerCase() === q
      );
      return found || null;
    }
  }

  async saveCustomer(customer: Customer): Promise<Customer> {
    const finalCust = {
      id: customer.id.toUpperCase(),
      name: customer.name.toUpperCase(),
      phone: customer.phone,
      package: customer.package,
      dueDate: customer.dueDate,
      lastH1SentDate: customer.lastH1SentDate || null,
      wa_reminder_sent: customer.wa_reminder_sent ?? false,
      wa_reminder_sent_at: customer.wa_reminder_sent_at || null,
      last_wa_message_id: customer.last_wa_message_id || null,
      receipt_url: customer.receipt_url || null,
      receipt_uploaded_at: customer.receipt_uploaded_at || null
    };

    await this.ensureInitialized();
    if (this.useSupabase && this.supabase) {
      const { error } = await this.supabase.from("customers").upsert(finalCust);
      if (error) {
        console.log("ℹ️ Saving customer: using active JSON database.");
        const db = readLocalDB();
        const customers = db.customers as Customer[];
        const index = customers.findIndex(c => c.id.toUpperCase() === customer.id.toUpperCase());
        const mappedCust = {
          ...finalCust,
          lastH1SentDate: finalCust.lastH1SentDate || undefined,
          wa_reminder_sent: finalCust.wa_reminder_sent,
          wa_reminder_sent_at: finalCust.wa_reminder_sent_at || undefined,
          last_wa_message_id: finalCust.last_wa_message_id || undefined,
          receipt_url: finalCust.receipt_url || undefined,
          receipt_uploaded_at: finalCust.receipt_uploaded_at || undefined
        };
        if (index !== -1) {
          customers[index] = mappedCust;
        } else {
          customers.unshift(mappedCust);
        }
        db.customers = customers;
        writeLocalDB(db);
      }
      return {
        ...finalCust,
        lastH1SentDate: finalCust.lastH1SentDate || undefined,
        wa_reminder_sent: finalCust.wa_reminder_sent,
        wa_reminder_sent_at: finalCust.wa_reminder_sent_at || undefined,
        last_wa_message_id: finalCust.last_wa_message_id || undefined,
        receipt_url: finalCust.receipt_url || undefined,
        receipt_uploaded_at: finalCust.receipt_uploaded_at || undefined
      };
    } else {
      const db = readLocalDB();
      const customers = db.customers as Customer[];
      const index = customers.findIndex(c => c.id.toUpperCase() === customer.id.toUpperCase());

      const localCust = {
        ...finalCust,
        lastH1SentDate: finalCust.lastH1SentDate || undefined,
        wa_reminder_sent: finalCust.wa_reminder_sent,
        wa_reminder_sent_at: finalCust.wa_reminder_sent_at || undefined,
        last_wa_message_id: finalCust.last_wa_message_id || undefined,
        receipt_url: finalCust.receipt_url || undefined,
        receipt_uploaded_at: finalCust.receipt_uploaded_at || undefined
      };
      if (index !== -1) {
        customers[index] = localCust;
      } else {
        customers.unshift(localCust);
      }
      db.customers = customers;
      writeLocalDB(db);
      return localCust;
    }
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const upperId = id.toUpperCase();
    await this.ensureInitialized();
    if (this.useSupabase && this.supabase) {
      const { error } = await this.supabase.from("customers").delete().eq("id", upperId);
      if (error) {
        console.log("ℹ️ Deleting customer: using active JSON database.");
        const db = readLocalDB();
        const customers = db.customers as Customer[];
        const filtered = customers.filter(c => c.id.toUpperCase() !== upperId);
        const isDeleted = filtered.length < customers.length;
        db.customers = filtered;
        writeLocalDB(db);
        return isDeleted;
      }
      return true;
    } else {
      const db = readLocalDB();
      const customers = db.customers as Customer[];
      const filtered = customers.filter(c => c.id.toUpperCase() !== upperId);
      const isDeleted = filtered.length < customers.length;
      db.customers = filtered;
      writeLocalDB(db);
      return isDeleted;
    }
  }

  async clearAllCustomers(): Promise<boolean> {
    await this.ensureInitialized();
    // 1. Clear local DB file (if allowed or as fallback)
    try {
      const db = readLocalDB();
      db.customers = [];
      writeLocalDB(db);
    } catch (err: any) {
      console.log("ℹ️ Local database reset notice:", err.message);
    }

    // 2. Clear Supabase table
    if (this.useSupabase && this.supabase) {
      try {
        const { error } = await this.supabase.from("customers").delete().neq("id", "");
        if (error) {
          console.log("ℹ️ Supabase reset notice:", error.message);
          throw error;
        }
      } catch (err: any) {
        console.log("ℹ️ Reset notice:", err.message);
        throw err;
      }
    }
    return true;
  }

  // Templates Logic
  async getTemplates(): Promise<MessageTemplates> {
    await this.ensureInitialized();
    if (this.useSupabase && this.supabase) {
      const { data, error } = await this.supabase.from("templates").select("*").eq("key", "default").maybeSingle();
      if (error) {
        console.log("ℹ️ Fetching templates: using active JSON database.");
        const db = readLocalDB();
        return db.templates || DEFAULT_TEMPLATES;
      }
      if (!data) {
        return DEFAULT_TEMPLATES;
      }
      return {
        tagihanActive: data.tagihanActive ?? DEFAULT_TEMPLATES.tagihanActive,
        tagihanTemplate: data.tagihanTemplate || DEFAULT_TEMPLATES.tagihanTemplate,
        psbActive: data.psbActive ?? DEFAULT_TEMPLATES.psbActive,
        psbTemplate: data.psbTemplate || DEFAULT_TEMPLATES.psbTemplate
      };
    } else {
      const db = readLocalDB();
      const loaded = db.templates || {};
      return {
        tagihanActive: loaded.tagihanActive ?? DEFAULT_TEMPLATES.tagihanActive,
        tagihanTemplate: loaded.tagihanTemplate || DEFAULT_TEMPLATES.tagihanTemplate,
        psbActive: loaded.psbActive ?? DEFAULT_TEMPLATES.psbActive,
        psbTemplate: loaded.psbTemplate || DEFAULT_TEMPLATES.psbTemplate
      };
    }
  }

  async saveTemplates(templates: MessageTemplates): Promise<MessageTemplates> {
    const payload = {
      key: "default",
      tagihanActive: templates.tagihanActive,
      tagihanTemplate: templates.tagihanTemplate,
      psbActive: templates.psbActive,
      psbTemplate: templates.psbTemplate
    };

    await this.ensureInitialized();
    if (this.useSupabase && this.supabase) {
      const { error } = await this.supabase.from("templates").upsert(payload);
      if (error) {
        console.log("ℹ️ Saving templates: using active JSON database.");
        const db = readLocalDB();
        db.templates = templates;
        writeLocalDB(db);
      }
      return templates;
    } else {
      const db = readLocalDB();
      db.templates = templates;
      writeLocalDB(db);
      return templates;
    }
  }

  // Settings Logic
  async getSettings(): Promise<AppSettings> {
    await this.ensureInitialized();
    if (this.useSupabase && this.supabase) {
      const { data, error } = await this.supabase.from("settings").select("*").eq("key", "default").maybeSingle();
      if (error) {
        console.log("ℹ️ Fetching settings: using active JSON database.");
        const db = readLocalDB();
        return db.settings || DEFAULT_SETTINGS;
      }
      if (!data) {
        return DEFAULT_SETTINGS;
      }
      return {
        paymentLink: data.paymentLink || DEFAULT_SETTINGS.paymentLink,
        youtubeLink: data.youtubeLink || DEFAULT_SETTINGS.youtubeLink,
        basicLink: data.basicLink || DEFAULT_SETTINGS.basicLink,
        silverLink: data.silverLink || DEFAULT_SETTINGS.silverLink,
        goldLink: data.goldLink || DEFAULT_SETTINGS.goldLink,
        cronIntervalMinutes: data.cronIntervalMinutes || DEFAULT_SETTINGS.cronIntervalMinutes,
        reminderTimingDays: data.reminderTimingDays || DEFAULT_SETTINGS.reminderTimingDays,
        packagesList: data.packagesList && Array.isArray(data.packagesList) && data.packagesList.length > 0 ? data.packagesList : DEFAULT_PACKAGES_LIST
      };
    } else {
      const db = readLocalDB();
      const loaded = db.settings || {};
      return {
        paymentLink: loaded.paymentLink || DEFAULT_SETTINGS.paymentLink,
        youtubeLink: loaded.youtubeLink || DEFAULT_SETTINGS.youtubeLink,
        basicLink: loaded.basicLink || DEFAULT_SETTINGS.basicLink,
        silverLink: loaded.silverLink || DEFAULT_SETTINGS.silverLink,
        goldLink: loaded.goldLink || DEFAULT_SETTINGS.goldLink,
        cronIntervalMinutes: loaded.cronIntervalMinutes || DEFAULT_SETTINGS.cronIntervalMinutes,
        reminderTimingDays: loaded.reminderTimingDays || DEFAULT_SETTINGS.reminderTimingDays,
        packagesList: loaded.packagesList && Array.isArray(loaded.packagesList) && loaded.packagesList.length > 0 ? loaded.packagesList : DEFAULT_PACKAGES_LIST
      };
    }
  }

  async saveSettings(settings: AppSettings): Promise<AppSettings> {
    const payload = {
      key: "default",
      paymentLink: settings.paymentLink,
      youtubeLink: settings.youtubeLink || DEFAULT_SETTINGS.youtubeLink,
      basicLink: settings.basicLink,
      silverLink: settings.silverLink,
      goldLink: settings.goldLink,
      cronIntervalMinutes: settings.cronIntervalMinutes || 10,
      reminderTimingDays: settings.reminderTimingDays || 1,
      packagesList: settings.packagesList || DEFAULT_PACKAGES_LIST
    };

    await this.ensureInitialized();
    if (this.useSupabase && this.supabase) {
      const { error } = await this.supabase.from("settings").upsert(payload);
      if (error) {
        console.log("ℹ️ Saving settings: using active JSON database.");
        const db = readLocalDB();
        db.settings = settings;
        writeLocalDB(db);
      }
      return settings;
    } else {
      const db = readLocalDB();
      db.settings = settings;
      writeLocalDB(db);
      return settings;
    }
  }

  // Bot Settings
  async getBotSettings(): Promise<BotSettings> {
    await this.ensureInitialized();
    const fallbackSettings: BotSettings = {
      status: true,
      default_reply: "Maaf, pesan Anda belum dapat diproses secara otomatis. Silakan ketik *MENU* untuk melihat daftar layanan atau hubungi admin Komindo Network."
    };

    if (this.useSupabase && this.supabase) {
      try {
        const { data, error } = await this.supabase.from("bot_settings").select("*").eq("key", "default").maybeSingle();
        if (error) {
          console.log("ℹ️ Bot settings notice: using local active database.");
          const db = readLocalDB();
          return db.bot_settings || fallbackSettings;
        }
        if (!data) {
          return fallbackSettings;
        }
        return {
          status: data.status ?? true,
          default_reply: data.default_reply || fallbackSettings.default_reply
        };
      } catch (err: any) {
        console.log("ℹ️ Bot settings notice: using local active database.");
        const db = readLocalDB();
        return db.bot_settings || fallbackSettings;
      }
    } else {
      const db = readLocalDB();
      return db.bot_settings || fallbackSettings;
    }
  }

  async saveBotSettings(settings: BotSettings): Promise<BotSettings> {
    await this.ensureInitialized();
    const payload = {
      key: "default",
      status: settings.status,
      default_reply: settings.default_reply
    };

    if (this.useSupabase && this.supabase) {
      try {
        const { error } = await this.supabase.from("bot_settings").upsert(payload);
        if (error) {
          console.log("ℹ️ Save bot settings notice: using local active database.");
          const db = readLocalDB();
          db.bot_settings = settings;
          writeLocalDB(db);
        }
        return settings;
      } catch (err: any) {
        console.log("ℹ️ Save bot settings notice: using local active database.");
        const db = readLocalDB();
        db.bot_settings = settings;
        writeLocalDB(db);
        return settings;
      }
    } else {
      const db = readLocalDB();
      db.bot_settings = settings;
      writeLocalDB(db);
      return settings;
    }
  }

  // Bot Keywords
  async getBotKeywords(): Promise<BotKeyword[]> {
    await this.ensureInitialized();
    const defaultKeywords: BotKeyword[] = [
      { id: "kw1", keyword: "1", reply: "CEK_TAGIHAN_DYNAMIC" },
      { id: "kw2", keyword: "CEK TAGIHAN", reply: "CEK_TAGIHAN_DYNAMIC" },
      { id: "kw3", keyword: "TAGIHAN", reply: "CEK_TAGIHAN_DYNAMIC" },
      { id: "kw4", keyword: "BAYAR TAGIHAN", reply: "CARA_PEMBAYARAN_DYNAMIC" },
      { id: "kw5", keyword: "CARA PEMBAYARAN", reply: "CARA_PEMBAYARAN_DYNAMIC" },
      { id: "kw6", keyword: "2", reply: "Silakan hubungi admin kami melalui WhatsApp di https://wa.me/6282181144800 untuk pendaftaran pasang baru wifi Komindo Network." },
      { id: "kw7", keyword: "DAFTAR INTERNET", reply: "Silakan hubungi admin kami melalui WhatsApp di https://wa.me/6282181144800 untuk pendaftaran pasang baru wifi Komindo Network." },
      { id: "kw8", keyword: "3", reply: "Berikut adalah daftar paket internet KOMINDO NETWORK yang tersedia:\n\n1. PAKET BASIC 200K - Rp 200.000\n2. PAKET SILVER 250K - Rp 250.000\n3. PAKET GOLD 300K - Rp 300.000\n4. PAKET DIAMOND 350K - Rp 350.000\n5. PSB (Biaya Registrasi) - Rp 300.000\n6. PAKET PRO BISNIS 500K - Rp 500.000\n7. CSR FREE - Rp 0" },
      { id: "kw9", keyword: "PAKET INTERNET", reply: "Berikut adalah daftar paket internet KOMINDO NETWORK yang tersedia:\n\n1. PAKET BASIC 200K - Rp 200.000\n2. PAKET SILVER 250K - Rp 250.000\n3. PAKET GOLD 300K - Rp 300.000\n4. PAKET DIAMOND 350K - Rp 350.000\n5. PSB (Biaya Registrasi) - Rp 300.000\n6. PAKET PRO BISNIS 500K - Rp 500.000\n7. CSR FREE - Rp 0" },
      { id: "kw10", keyword: "4", reply: "Laporan gangguan Anda telah kami terima. Tim teknisi Komindo Network akan segera mengecek koneksi Anda. Mohon pastikan modem wifi tetap menyala." },
      { id: "kw11", keyword: "LAPOR GANGGUAN", reply: "Laporan gangguan Anda telah kami terima. Tim teknisi Komindo Network akan segera mengecek koneksi Anda. Mohon pastikan modem wifi tetap menyala." },
      { id: "kw12", keyword: "5", reply: "Hubungi admin kami di nomor berikut: 6282181144800 untuk info billing, kerja sama, dan penawaran lainnya." },
      { id: "kw13", keyword: "HUBUNGI ADMIN", reply: "Hubungi admin kami di nomor berikut: 6282181144800 untuk info billing, kerja sama, dan penawaran lainnya." },
      { id: "kw14", keyword: "MENU", reply: "WELCOME_MENU_DYNAMIC" },
      { id: "kw15", keyword: "HALO", reply: "WELCOME_MENU_DYNAMIC" }
    ];

    if (this.useSupabase && this.supabase) {
      try {
        const { data, error } = await this.supabase.from("bot_keywords").select("*");
        if (error) {
          console.log("ℹ️ Bot keywords notice: using local active database.");
          const db = readLocalDB();
          return db.bot_keywords || defaultKeywords;
        }
        if (!data || data.length === 0) {
          await this.supabase.from("bot_keywords").insert(defaultKeywords);
          return defaultKeywords;
        }
        return data;
      } catch (err: any) {
        console.log("ℹ️ Bot keywords notice: using local active database.");
        const db = readLocalDB();
        return db.bot_keywords || defaultKeywords;
      }
    } else {
      const db = readLocalDB();
      if (!db.bot_keywords || db.bot_keywords.length === 0) {
        db.bot_keywords = defaultKeywords;
        writeLocalDB(db);
      }
      return db.bot_keywords;
    }
  }

  async saveBotKeyword(keyword: BotKeyword): Promise<BotKeyword> {
    await this.ensureInitialized();
    if (this.useSupabase && this.supabase) {
      try {
        const { error } = await this.supabase.from("bot_keywords").upsert(keyword);
        if (error) {
          console.log("ℹ️ Save bot keyword notice: using local active database.");
          const db = readLocalDB();
          const list = db.bot_keywords || [];
          const idx = list.findIndex((k: any) => k.id === keyword.id);
          if (idx >= 0) list[idx] = keyword;
          else list.push(keyword);
          db.bot_keywords = list;
          writeLocalDB(db);
        }
        return keyword;
      } catch (err: any) {
        console.log("ℹ️ Save bot keyword notice: using local active database.");
        const db = readLocalDB();
        const list = db.bot_keywords || [];
        const idx = list.findIndex((k: any) => k.id === keyword.id);
        if (idx >= 0) list[idx] = keyword;
        else list.push(keyword);
        db.bot_keywords = list;
        writeLocalDB(db);
        return keyword;
      }
    } else {
      const db = readLocalDB();
      const list = db.bot_keywords || [];
      const idx = list.findIndex((k: any) => k.id === keyword.id);
      if (idx >= 0) list[idx] = keyword;
      else list.push(keyword);
      db.bot_keywords = list;
      writeLocalDB(db);
      return keyword;
    }
  }

  async deleteBotKeyword(id: string): Promise<boolean> {
    await this.ensureInitialized();
    let deleted = false;
    if (this.useSupabase && this.supabase) {
      try {
        const { error } = await this.supabase.from("bot_keywords").delete().eq("id", id);
        if (error) {
          console.log("ℹ️ Delete bot keyword notice: using local active database.");
          const db = readLocalDB();
          const list = db.bot_keywords || [];
          const filtered = list.filter((k: any) => k.id !== id);
          deleted = filtered.length < list.length;
          db.bot_keywords = filtered;
          writeLocalDB(db);
        } else {
          deleted = true;
        }
      } catch (err: any) {
        console.log("ℹ️ Delete bot keyword notice: using local active database.");
        const db = readLocalDB();
        const list = db.bot_keywords || [];
        const filtered = list.filter((k: any) => k.id !== id);
        deleted = filtered.length < list.length;
        db.bot_keywords = filtered;
        writeLocalDB(db);
      }
    } else {
      const db = readLocalDB();
      const list = db.bot_keywords || [];
      const filtered = list.filter((k: any) => k.id !== id);
      deleted = filtered.length < list.length;
      db.bot_keywords = filtered;
      writeLocalDB(db);
    }
    return deleted;
  }

  // Bot Chats Logs
  async getBotChats(): Promise<BotChatLog[]> {
    await this.ensureInitialized();
    if (this.useSupabase && this.supabase) {
      try {
        const { data, error } = await this.supabase.from("bot_chats").select("*");
        if (error) {
          console.log("ℹ️ Bot chats notice: using local active database.");
          const db = readLocalDB();
          return db.bot_chats || [];
        }
        return data || [];
      } catch (err: any) {
        console.log("ℹ️ Bot chats notice: using local active database.");
        const db = readLocalDB();
        return db.bot_chats || [];
      }
    } else {
      const db = readLocalDB();
      return db.bot_chats || [];
    }
  }

  async clearBotChats(): Promise<void> {
    await this.ensureInitialized();
    if (this.useSupabase && this.supabase) {
      try {
        const { error } = await this.supabase.from("bot_chats").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (error) {
          const db = readLocalDB();
          db.bot_chats = [];
          writeLocalDB(db);
        }
      } catch (e) {
        const db = readLocalDB();
        db.bot_chats = [];
        writeLocalDB(db);
      }
    } else {
      const db = readLocalDB();
      db.bot_chats = [];
      writeLocalDB(db);
    }
  }

  // --- PACKAGES MANAGEMENT (REAL-TIME OBJECTS & PERSISTENCE) ---
  async getPackages(): Promise<InternetPackage[]> {
    await this.ensureInitialized();

    // 1. Try Supabase packages table
    if (this.useSupabase && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from("packages")
          .select("*")
          .order("created_at", { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((p: any, idx: number) => ({
            id: p.id || `pkg_${Date.now()}_${idx}`,
            name: p.name || "Paket Komindo",
            speed: p.speed || "",
            price: p.price || "200K",
            period: p.period || "/bulan",
            tagline: p.tagline || "",
            badge: p.badge || "",
            isPopular: p.isPopular ?? false,
            features: Array.isArray(p.features) ? p.features : (typeof p.features === "string" ? JSON.parse(p.features || "[]") : []),
            orderLink: p.orderLink || "",
            created_at: p.created_at || new Date(Date.now() + idx * 1000).toISOString()
          }));
        }
      } catch (err: any) {
        console.log("ℹ️ Supabase packages fetch notice: using local fallback.", err.message);
      }
    }

    // 2. Local Database Fallback
    const db = readLocalDB();
    if (db.packages && Array.isArray(db.packages) && db.packages.length > 0) {
      return db.packages;
    }

    // Check if settings has packages
    if (db.settings?.packages && Array.isArray(db.settings.packages) && db.settings.packages.length > 0) {
      return db.settings.packages;
    }

    // Initialize with default 3 packages
    db.packages = DEFAULT_PACKAGES;
    if (!db.settings) db.settings = DEFAULT_SETTINGS;
    db.settings.packages = DEFAULT_PACKAGES;
    db.settings.packagesList = DEFAULT_PACKAGES.map(p => `${p.name} (${p.speed}) - ${p.price}`);
    writeLocalDB(db);

    return DEFAULT_PACKAGES;
  }

  async savePackages(packages: InternetPackage[]): Promise<InternetPackage[]> {
    await this.ensureInitialized();
    const baseTime = Date.now();
    const cleanPackages: InternetPackage[] = packages.map((p, idx) => ({
      id: p.id || `pkg_${baseTime}_${idx}`,
      name: p.name || `Paket ${idx + 1}`,
      speed: p.speed || "",
      price: p.price || "200K",
      period: p.period || "/bulan",
      tagline: p.tagline || "",
      badge: p.badge || "",
      isPopular: !!p.isPopular,
      features: Array.isArray(p.features) ? p.features : [],
      orderLink: p.orderLink || "",
      created_at: (p as any).created_at || new Date(baseTime + idx * 1000).toISOString()
    }));

    // 1. Save to Local DB
    const db = readLocalDB();
    db.packages = cleanPackages;
    if (!db.settings) db.settings = DEFAULT_SETTINGS;
    db.settings.packages = cleanPackages;
    db.settings.packagesList = cleanPackages.map(p => `${p.name} (${p.speed || 'Wifi'}) - ${p.price}`);
    writeLocalDB(db);

    // 2. Save to Supabase
    if (this.useSupabase && this.supabase) {
      try {
        await this.supabase.from("packages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (cleanPackages.length > 0) {
          const { error } = await this.supabase.from("packages").upsert(cleanPackages);
          if (error) {
            console.warn("⚠️ Warning writing packages to Supabase:", error.message);
          }
        }
      } catch (err: any) {
        console.warn("⚠️ Supabase packages save error:", err.message);
      }
    }

    return cleanPackages;
  }

  // --- ADMIN AUTHENTICATION & PASSWORD MANAGEMENT ---
  async getAdminCredentials(): Promise<AdminCredentials> {
    await this.ensureInitialized();
    if (this.useSupabase && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from("admin_auth")
          .select("*")
          .limit(1)
          .maybeSingle();

        if (!error && data && data.username && data.password) {
          return {
            username: data.username,
            password: data.password,
            updated_at: data.updated_at
          };
        }
      } catch (err: any) {
        console.log("ℹ️ Supabase admin_auth notice: using local fallback.", err.message);
      }
    }

    const db = readLocalDB();
    if (db.admin_credentials && db.admin_credentials.username && db.admin_credentials.password) {
      return db.admin_credentials;
    }

    return DEFAULT_ADMIN_CREDENTIALS;
  }

  async saveAdminCredentials(creds: AdminCredentials): Promise<AdminCredentials> {
    await this.ensureInitialized();
    const cleanCreds: AdminCredentials = {
      username: (creds.username || "admin").trim(),
      password: creds.password.trim(),
      updated_at: new Date().toISOString()
    };

    // 1. Save to Local DB
    const db = readLocalDB();
    db.admin_credentials = cleanCreds;
    writeLocalDB(db);

    // 2. Save to Supabase
    if (this.useSupabase && this.supabase) {
      try {
        await this.supabase.from("admin_auth").upsert(cleanCreds);
      } catch (err: any) {
        console.warn("⚠️ Supabase save admin credentials error:", err.message);
      }
    }

    return cleanCreds;
  }

  async addBotChat(chat: BotChatLog): Promise<BotChatLog> {
    await this.ensureInitialized();
    if (this.useSupabase && this.supabase) {
      try {
        const { error } = await this.supabase.from("bot_chats").insert(chat);
        if (error) {
          console.log("ℹ️ Add bot chat notice: using local active database.");
          const db = readLocalDB();
          const list = db.bot_chats || [];
          list.unshift(chat);
          if (list.length > 500) list.pop();
          db.bot_chats = list;
          writeLocalDB(db);
        }
      } catch (err: any) {
        console.log("ℹ️ Add bot chat notice: using local active database.");
        const db = readLocalDB();
        const list = db.bot_chats || [];
        list.unshift(chat);
        if (list.length > 500) list.pop();
        db.bot_chats = list;
        writeLocalDB(db);
      }
    } else {
      const db = readLocalDB();
      const list = db.bot_chats || [];
      list.unshift(chat);
      if (list.length > 500) list.pop();
      db.bot_chats = list;
      writeLocalDB(db);
    }
    return chat;
  }

  // --- DISASTER RECOVERY & BACKUP SYSTEM ---
  async exportFullSnapshot() {
    await this.ensureInitialized();
    const customers = await this.getCustomers();
    const templates = await this.getTemplates();
    const settings = await this.getSettings();
    const botSettings = await this.getBotSettings();
    const botKeywords = await this.getBotKeywords();
    const botChats = await this.getBotChats();

    const snapshot = {
      version: "2.0.0",
      appName: "Komindo Network Billing System",
      exportDate: new Date().toISOString(),
      counts: {
        customers: customers.length,
        keywords: botKeywords.length,
        chats: botChats.length
      },
      data: {
        customers,
        templates,
        settings,
        botSettings,
        botKeywords,
        botChats
      }
    };
    return snapshot;
  }

  async createBackup(type: 'automatic' | 'manual' = 'manual') {
    await this.ensureInitialized();
    const snapshot = await this.exportFullSnapshot();
    const jsonStr = JSON.stringify(snapshot, null, 2);
    const sizeBytes = Buffer.byteLength(jsonStr, "utf8");
    const id = "bkp_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const dateStr = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `komindo_backup_${type}_${dateStr}.json`;
    const recordsCount = snapshot.counts.customers + snapshot.counts.keywords + snapshot.counts.chats;

    const backupRecord = {
      id,
      filename,
      type,
      size_bytes: sizeBytes,
      records_count: recordsCount,
      created_at: new Date().toISOString(),
      data: snapshot
    };

    if (this.useSupabase && this.supabase) {
      try {
        const { error } = await this.supabase.from("backups").insert({
          id: backupRecord.id,
          filename: backupRecord.filename,
          type: backupRecord.type,
          size_bytes: backupRecord.size_bytes,
          records_count: backupRecord.records_count,
          created_at: backupRecord.created_at,
          data: backupRecord.data
        });
        if (error) {
          console.warn("⚠️ Could not write backup to Supabase backups table, storing locally:", error.message);
          const db = readLocalDB();
          if (!db.backups) db.backups = [];
          db.backups.unshift(backupRecord);
          if (db.backups.length > 30) db.backups.pop();
          writeLocalDB(db);
        }
      } catch (err: any) {
        console.warn("⚠️ Backup write notice: using local DB fallback", err.message);
        const db = readLocalDB();
        if (!db.backups) db.backups = [];
        db.backups.unshift(backupRecord);
        if (db.backups.length > 30) db.backups.pop();
        writeLocalDB(db);
      }
    } else {
      const db = readLocalDB();
      if (!db.backups) db.backups = [];
      db.backups.unshift(backupRecord);
      if (db.backups.length > 30) db.backups.pop();
      writeLocalDB(db);
    }

    return backupRecord;
  }

  async getBackups() {
    await this.ensureInitialized();
    if (this.useSupabase && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from("backups")
          .select("id, filename, type, size_bytes, records_count, created_at")
          .order("created_at", { ascending: false });
        if (!error && data) {
          return data;
        }
      } catch (err) {
        // fallback
      }
    }
    const db = readLocalDB();
    return (db.backups || []).map((b: any) => ({
      id: b.id,
      filename: b.filename,
      type: b.type,
      size_bytes: b.size_bytes,
      records_count: b.records_count,
      created_at: b.created_at
    }));
  }

  async getBackupById(id: string) {
    await this.ensureInitialized();
    if (this.useSupabase && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from("backups")
          .select("*")
          .eq("id", id)
          .single();
        if (!error && data) return data;
      } catch (err) {
        // fallback
      }
    }
    const db = readLocalDB();
    return (db.backups || []).find((b: any) => b.id === id);
  }

  async deleteBackup(id: string) {
    await this.ensureInitialized();
    let deleted = false;
    if (this.useSupabase && this.supabase) {
      try {
        const { error } = await this.supabase.from("backups").delete().eq("id", id);
        if (!error) deleted = true;
      } catch (err) {}
    }
    const db = readLocalDB();
    if (db.backups) {
      const origLen = db.backups.length;
      db.backups = db.backups.filter((b: any) => b.id !== id);
      if (db.backups.length < origLen) deleted = true;
      writeLocalDB(db);
    }
    return deleted;
  }

  async restoreBackup(backupData: any, mode: 'overwrite' | 'merge' = 'overwrite') {
    await this.ensureInitialized();
    const payload = backupData.data || backupData;
    if (!payload || !payload.customers || !Array.isArray(payload.customers)) {
      throw new Error("Format berkas backup tidak valid (data pelanggan tidak ditemukan).");
    }

    const {
      customers = [],
      templates = DEFAULT_TEMPLATES,
      settings = DEFAULT_SETTINGS,
      botSettings = { status: true, default_reply: "Maaf, pesan tidak dikenali." },
      botKeywords = [],
      botChats = []
    } = payload;

    if (mode === "overwrite") {
      const db = readLocalDB();
      db.customers = customers;
      db.templates = templates;
      db.settings = settings;
      db.bot_settings = botSettings;
      db.bot_keywords = botKeywords;
      db.bot_chats = botChats;
      writeLocalDB(db);

      if (this.useSupabase && this.supabase) {
        try {
          await this.supabase.from("customers").delete().neq("id", "DUMMY_NEVER_MATCH");
          if (customers.length > 0) {
            await this.supabase.from("customers").upsert(customers);
          }
          await this.supabase.from("templates").upsert({ key: "default", ...templates });
          await this.supabase.from("settings").upsert({ key: "default", ...settings });
          await this.supabase.from("bot_settings").upsert({ key: "default", ...botSettings });

          await this.supabase.from("bot_keywords").delete().neq("id", "DUMMY_NEVER_MATCH");
          if (botKeywords.length > 0) {
            await this.supabase.from("bot_keywords").upsert(botKeywords);
          }

          if (botChats.length > 0) {
            await this.supabase.from("bot_chats").upsert(botChats);
          }
        } catch (err: any) {
          console.warn("⚠️ Supabase restore warning:", err.message);
        }
      }
    } else {
      for (const cust of customers) {
        await this.saveCustomer(cust);
      }
      for (const kw of botKeywords) {
        await this.saveBotKeyword(kw);
      }
      await this.saveTemplates(templates);
      await this.saveSettings(settings);
      await this.saveBotSettings(botSettings);
    }

    return {
      success: true,
      message: `Berhasil memulihkan ${customers.length} pelanggan dan ${botKeywords.length} aturan kata kunci.`,
      restoredCounts: {
        customers: customers.length,
        keywords: botKeywords.length,
        chats: botChats.length
      }
    };
  }

  // --- WHATSAPP SESSION PERSISTENCE IN SUPABASE ---
  async saveWaSessionToSupabase(id: string, credsDataStr: string) {
    await this.ensureInitialized();
    if (this.useSupabase && this.supabase) {
      try {
        const { error } = await this.supabase.from("wa_sessions").upsert({
          id,
          creds_data: credsDataStr,
          updated_at: new Date().toISOString()
        });
        if (!error) return true;
      } catch (err: any) {
        console.warn("⚠️ Failed saving WA session to Supabase:", err.message);
      }
    }
    return false;
  }

  async loadWaSessionFromSupabase(id: string) {
    await this.ensureInitialized();
    if (this.useSupabase && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from("wa_sessions")
          .select("creds_data")
          .eq("id", id)
          .single();
        if (!error && data && data.creds_data) {
          return data.creds_data;
        }
      } catch (err: any) {
        // ignore
      }
    }
    return null;
  }
}

export const dbService = new DatabaseService();
