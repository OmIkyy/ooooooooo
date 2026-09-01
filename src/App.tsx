import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import paymentConfig from "./payment-config.json";

interface BillingDetails {
  id: string;
  name: string;
  packageType: string;
  amount: number;
  adminFee: number;
  total: number;
  invoiceNo: string;
  dueDate?: string;
  receipt_url?: string;
  receipt_uploaded_at?: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  package: string;
  dueDate: string;
  wa_reminder_sent?: boolean;
  wa_reminder_sent_at?: string;
  last_wa_message_id?: string;
  receipt_url?: string;
  receipt_uploaded_at?: string;
}

interface MessageTemplates {
  tagihanActive: boolean;
  tagihanTemplate: string;
  psbActive: boolean;
  psbTemplate: string;
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

const SEED_CUSTOMERS: Customer[] = [
  { id: "PL3.01.ALI.KASIM.001", name: "ALI KASIM", phone: "6281273157733", package: "BASIC 200K", dueDate: "01/06/2026" },
  { id: "PL4.015.ADI.SAFUTRA.009", name: "ADI SAFUTRA", phone: "6283803966453", package: "BASIC 200K", dueDate: "01/06/2026" },
  { id: "PL4.015.SAUDI.003", name: "SAUDI", phone: "6283198534152", package: "BASIC 200K", dueDate: "01/06/2026" },
  { id: "PL4.017.SURYADI.SUDIRJA.004", name: "SURYADI", phone: "6282249427177", package: "BASIC 200K", dueDate: "01/06/2026" },
  { id: "PL4.02.SUPANDI.KADES.002", name: "SUPANDI", phone: "6285821111484", package: "BASIC 200K", dueDate: "01/06/2026" },
  { id: "PL4.020.MANTAP.001", name: "MANTAP", phone: "6285764910082", package: "BASIC 200K", dueDate: "01/06/2026" },
  { id: "PL4.023.NUR.KHOLIS.001", name: "NURKHOLIS", phone: "6285367961110", package: "BASIC 200K", dueDate: "01/06/2026" },
  { id: "PL4.023.SINDI.PRATIWI.002", name: "SINDI PRATIWI", phone: "6288286030335", package: "BASIC 200K", dueDate: "01/06/2026" },
  { id: "PL4.005.AANG.MIDHARTA.001", name: "AANG MIDHARTA", phone: "6282324553042", package: "BASIC 200K", dueDate: "02/06/2026" },
  { id: "PL4.010.MAULANA.004", name: "MAULANA", phone: "6281388703378", package: "BASIC 200K", dueDate: "02/06/2026" },
  { id: "PL4.011.HERI.SUSANTO.001", name: "HERI SUSANTO", phone: "6281234567891", package: "SILVER 250K", dueDate: "03/06/2026" },
  { id: "PL4.012.DIAN.SAFITRI.002", name: "DIAN SAFITRI", phone: "6281234567892", package: "GOLD 300K", dueDate: "03/06/2026" },
  { id: "PL4.013.BUDI.UTOMO.001", name: "BUDI UTOMO", phone: "6281234567893", package: "BASIC 200K", dueDate: "04/06/2026" },
  { id: "PL4.014.NENI.TRIANA.002", name: "NENI TRIANA", phone: "6281234567894", package: "SILVER 250K", dueDate: "05/06/2026" },
  { id: "PL4.015.ANDI.WIJAYA.001", name: "ANDI WIJAYA", phone: "6281234567895", package: "GOLD 300K", dueDate: "05/06/2026" },
  { id: "PL4.016.WATI.LESTARI.002", name: "WATI LESTARI", phone: "6281234567896", package: "BASIC 200K", dueDate: "06/06/2026" },
  { id: "PL4.017.DEDI.KURNIAWAN.001", name: "DEDI KURNIAWAN", phone: "6281234567897", package: "SILVER 250K", dueDate: "06/06/2026" },
  { id: "PL4.018.YUNI.SARI.002", name: "YUNI SARI", phone: "6281234567898", package: "GOLD 300K", dueDate: "07/06/2026" },
  { id: "PL4.019.AGUS.SETIAWAN.001", name: "AGUS SETIAWAN", phone: "6281234567899", package: "BASIC 200K", dueDate: "08/06/2026" },
  { id: "PL4.020.SITI.AMINAH.002", name: "SITI AMINAH", phone: "6281234567890", package: "SILVER 250K", dueDate: "09/06/2026" },
  { id: "PL4.021.JOKO.SUSILO.001", name: "JOKO SUSILO", phone: "6281234567891", package: "GOLD 300K", dueDate: "10/06/2026" },
  { id: "PL4.022.RISMAWATI", name: "RISMAWATI", phone: "6281234567892", package: "BASIC 200K", dueDate: "11/06/2026" }
];

const DEFAULT_TEMPLATES: MessageTemplates = {
  tagihanActive: true,
  tagihanTemplate: `Ini adalah pesan otomatis dari sistem e-billing layanan *KOMINDO NETWORK*

Halo {nama},
Paket : {paket}
Jatuh Tempo : {jatuhTempo}
Panduan cara melakukan pembayaran lihat video ini 

🖼 Video 
https://youtube.com/@komindo_network?si=uM1XCOSYa72IKZ6y

🔗 \`Pembayaran\`
https://e.ebilling.id/tagihan/?account=5379
ID Pelanggan : {id}

Segera lakukan pembayaran Terima Kasih.`,
  psbActive: false,
  psbTemplate: `Ini adalah pesan otomatis dari sistem e-billing layanan *KOMINDO NETWORK*

*Pembayaran Biaya Aktivasi Pemasangan Baru Wifi*

Halo *{nama}*,
Biaya : {paket}
Jatuh Tempo : {jatuhTempo}
Link Pembayaran : {linkPembayaran}

Mohon melakukan pembayaran biaya aktivasi pendaftaran baru sebesar 300K. Terima kasih!`
};

export default function App() {
  const [customerId, setCustomerId] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [billingDetails, setBillingDetails] = useState<BillingDetails | null>(null);

  // Administrative State - Strictly requires authentication (never auto-logged in via hash)
  const [adminLoggedIn, setAdminLoggedIn] = useState<boolean>(() => {
    try {
      if (typeof window !== "undefined") {
        return localStorage.getItem("komindo_admin_logged_in") === "true";
      }
      return false;
    } catch {
      return false;
    }
  });
  const [adminLoginModalOpen, setAdminLoginModalOpen] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");

  // Admin Change Password State
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newUsernameInput, setNewUsernameInput] = useState("admin");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordMsg, setChangePasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Customer Manager and Message Template States
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [templates, setTemplates] = useState<MessageTemplates>(DEFAULT_TEMPLATES);

  // Dynamic Packages State (3 Default Packages, Real-time Synchronized)
  const [packages, setPackages] = useState<InternetPackage[]>(() => {
    try {
      const stored = localStorage.getItem("komindo_packages_v2");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_PACKAGES;
  });

  // Backwards-compatible packagesList for customer dropdowns
  const packagesList = packages.map(p => `${p.name} (${p.speed || 'Wifi'}) - ${p.price}`);

  // Add / Edit Package Modal & Form State
  const [isPackageFormModalOpen, setIsPackageFormModalOpen] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [pkgFormName, setPkgFormName] = useState("");
  const [pkgFormSpeed, setPkgFormSpeed] = useState("");
  const [pkgFormPrice, setPkgFormPrice] = useState("");
  const [pkgFormPeriod, setPkgFormPeriod] = useState("/bulan");
  const [pkgFormTagline, setPkgFormTagline] = useState("");
  const [pkgFormBadge, setPkgFormBadge] = useState("");
  const [pkgFormIsPopular, setPkgFormIsPopular] = useState(false);
  const [pkgFormFeatures, setPkgFormFeatures] = useState<string[]>([
    "Paket Silver (30 Mbps)",
    "Unlimited Tanpa FUP",
    "Instalasi Gratis",
    "Support Team Teknis dan Admin"
  ]);
  const [pkgFormNewFeatureText, setPkgFormNewFeatureText] = useState("");
  const [pkgFormOrderLink, setPkgFormOrderLink] = useState("https://wa.me/6282181144800");

  const [packageSearchQuery, setPackageSearchQuery] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("komindo_packages_v2", JSON.stringify(packages));
    } catch (e) {}
  }, [packages]);

  // Admin Dashboard Form fields
  const [formName, setFormName] = useState("");
  const [formId, setFormId] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPackage, setFormPackage] = useState("");
  const [formDueDate, setFormDueDate] = useState("01/06/2026");
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState("");

  // Template active and template text states
  const [tagihanActive, setTagihanActive] = useState(true);
  const [tagihanTemplate, setTagihanTemplate] = useState("");
  const [psbActive, setPsbActive] = useState(false);
  const [psbTemplate, setPsbTemplate] = useState("");

  // Table Filters
  const [tableSearch, setTableSearch] = useState("");
  const [tablePackageFilter, setTablePackageFilter] = useState("Semua Paket");
  const [tableLimit, setTableLimit] = useState(10);
  const [tablePage, setTablePage] = useState(1);

  // WhatsApp Dropdown menu active customer
  const [waMenuCustId, setWaMenuCustId] = useState<string | null>(null);

  // Dynamic Payment links (configurable via /src/payment-config.json or public/payment-link.txt)
  const [paymentLink, setPaymentLink] = useState("https://e.ebilling.id/tagihan/?account=5379");
  const [youtubeLink, setYoutubeLink] = useState("https://youtube.com/@komindo_network?si=uM1XCOSYa72IKZ6y");
  const [basicLink, setBasicLink] = useState("https://wa.me/6282181144800");
  const [silverLink, setSilverLink] = useState("https://wa.me/6282181144800");
  const [goldLink, setGoldLink] = useState("https://wa.me/6282181144800");
  const [cronIntervalMinutes, setCronIntervalMinutes] = useState(10);
  const [reminderTimingDays, setReminderTimingDays] = useState(1);

  // Real-time WhatsApp Gateway Connection and QR states
  const [realWaStatus, setRealWaStatus] = useState<string>("disconnected");
  const [realWaQr, setRealWaQr] = useState<string>("");
  const [realWaNumber, setRealWaNumber] = useState<string | null>(null);
  const [realWaMessage, setRealWaMessage] = useState<string>("Sedang mendeteksi status WhatsApp Gateway...");
  const [isRefreshingWaQr, setIsRefreshingWaQr] = useState<boolean>(false);

  // Database and Gateway logs states
  const [dbStatus, setDbStatus] = useState<any>({ connected: false, mode: "Loading...", details: "", error: null, sqlHelp: "" });
  const [botLogs, setBotLogs] = useState<any[]>([]);
  const [isCheckingAutoBot, setIsCheckingAutoBot] = useState(false);

  // WhatsApp Gateway Sandbox Test States
  const [simSender, setSimSender] = useState("6281234567890");
  const [simMessage, setSimMessage] = useState("Cek PL3.01.ALI.KASIM.001");
  const [simReply, setSimReply] = useState("");
  const [simSending, setSimSending] = useState(false);

  // Tab Admin state & Garis 3 Sidebar Navigation
  type AdminSection = "dashboard" | "customers" | "whatsapp" | "bot" | "templates" | "packages" | "system";
  const [activeAdminSection, setActiveAdminSection] = useState<AdminSection>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [adminTab, setAdminTab] = useState<"billing" | "bot_whatsapp">("billing");

  // Bot WhatsApp State Variables
  const [botStatus, setBotStatus] = useState<boolean>(true);
  const [botDefaultReply, setBotDefaultReply] = useState<string>("");

  const [botKeywords, setBotKeywords] = useState<any[]>([]);
  const [botChats, setBotChats] = useState<any[]>([]);

  // Disaster Recovery & Health System States
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [backupsList, setBackupsList] = useState<any[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isFetchingHealth, setIsFetchingHealth] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restoreFileData, setRestoreFileData] = useState<any>(null);
  const [restoreFileName, setRestoreFileName] = useState("");
  const [restoreMode, setRestoreMode] = useState<'overwrite' | 'merge'>("overwrite");
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<string | null>(null);
  
  // Keyword Modal
  const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<any | null>(null);
  const [formKeyword, setFormKeyword] = useState("");
  const [formReply, setFormReply] = useState("");

  // Keyword Test Simulator State
  const [testKeywordMsg, setTestKeywordMsg] = useState("");
  const [testKeywordResult, setTestKeywordResult] = useState<any | null>(null);
  const [isTestingKeyword, setIsTestingKeyword] = useState(false);

  const handleTestKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testKeywordMsg.trim()) return;
    setIsTestingKeyword(true);
    setTestKeywordResult(null);
    try {
      const res = await fetch("/api/bot/test-keyword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: testKeywordMsg })
      });
      const data = await res.json();
      if (res.ok) {
        setTestKeywordResult(data);
      } else {
        alert("Gagal menguji kata kunci: " + (data.error || ""));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsTestingKeyword(false);
    }
  };

  // Payment simulation state
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  const [videoSource, setVideoSource] = useState<"local" | "youtube">("local");

  // Payment receipt states
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [receiptUploadError, setReceiptUploadError] = useState("");
  const [uploadedReceiptUrl, setUploadedReceiptUrl] = useState("");

  useEffect(() => {
    if (!billingModalOpen) {
      setIsUploadingReceipt(false);
      setReceiptUploadError("");
      setUploadedReceiptUrl("");
    }
  }, [billingModalOpen]);

  const handleReceiptUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !billingDetails) return;

    if (file.size > 10 * 1024 * 1024) {
      setReceiptUploadError("Ukuran file bukti pembayaran terlalu besar (maksimal 10MB)");
      return;
    }

    setReceiptUploadError("");
    setIsUploadingReceipt(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        const response = await fetch("/api/payments/upload-receipt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerId: billingDetails.id,
            receiptBase64: base64String,
          }),
        });

        const data = await response.json();
        if (response.ok && data.success) {
          setUploadedReceiptUrl(data.receipt_url);
          setBillingDetails({
            ...billingDetails,
            receipt_url: data.receipt_url,
          });
          setCustomers(prev => prev.map(c => c.id === billingDetails.id ? { ...c, receipt_url: data.receipt_url, receipt_uploaded_at: data.receipt_uploaded_at } : c));
          alert("Bukti pembayaran berhasil diunggah! Notifikasi WhatsApp otomatis dikirim.");
        } else {
          setReceiptUploadError(data.error || "Gagal mengunggah bukti pembayaran");
        }
      } catch (err: any) {
        setReceiptUploadError("Error mengunggah: " + err.message);
      } finally {
        setIsUploadingReceipt(false);
      }
    };

    reader.onerror = () => {
      setReceiptUploadError("Gagal membaca file gambar");
      setIsUploadingReceipt(false);
    };

    reader.readAsDataURL(file);
  };

  const handleSimulatePayment = async (status: "success" | "failed") => {
    if (!billingDetails) return;
    setIsSimulatingPayment(true);
    try {
      const res = await fetch("/api/payments/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: billingDetails.id, status })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Sukses! Simulasi pembayaran ${status === "success" ? "SUKSES" : "GAGAL"} diproses.\nNotifikasi WhatsApp otomatis dikirim via Gateway!`);
      } else {
        alert("Gagal melakukan simulasi: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error simulasi: " + err.message);
    } finally {
      setIsSimulatingPayment(false);
    }
  };

  // Bulk customer upload states
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [parsedBulkCustomers, setParsedBulkCustomers] = useState<Customer[]>([]);
  const [bulkFileError, setBulkFileError] = useState("");
  const [isUploadingBulk, setIsUploadingBulk] = useState(false);

  // Selected day, month, year states for the admin due date selector
  const [selectDay, setSelectDay] = useState("01");
  const [selectMonth, setSelectMonth] = useState("06");
  const [selectYear, setSelectYear] = useState("2026");

  // Bulk paste text states
  const [bulkPasteText, setBulkPasteText] = useState("");
  const [importTab, setImportTab] = useState<"file" | "paste">("file");

  // Sync effect from formDueDate string "DD/MM/YYYY" to the individual dropdown states
  useEffect(() => {
    if (formDueDate && formDueDate.includes("/")) {
      const parts = formDueDate.split("/");
      if (parts.length === 3) {
        setSelectDay(parts[0].padStart(2, "0"));
        setSelectMonth(parts[1].padStart(2, "0"));
        setSelectYear(parts[2]);
      }
    }
  }, [formDueDate]);

  // Handle dropdown selections and update formDueDate state
  const handleSelectDateChange = (d: string, m: string, y: string) => {
    setSelectDay(d);
    setSelectMonth(m);
    setSelectYear(y);
    setFormDueDate(`${d}/${m}/${y}`);
  };

  // Convert Indonesian DD/MM/YYYY to HTML5 YYYY-MM-DD for visual calendar input
  const getHtml5DateValue = (ddMMyyyy: string) => {
    if (!ddMMyyyy || !ddMMyyyy.includes("/")) return "";
    const parts = ddMMyyyy.split("/");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
    return "";
  };

  // Convert HTML5 YYYY-MM-DD back to Indonesian DD/MM/YYYY
  const handleHtml5DateChange = (isoDate: string) => {
    if (!isoDate) return;
    const parts = isoDate.split("-");
    if (parts.length === 3) {
      const y = parts[0];
      const m = parts[1];
      const d = parts[2];
      handleSelectDateChange(d, m, y);
    }
  };

  // Helper to parse pasted customer data and preview it instantly
  const handleParsePasteText = () => {
    setBulkFileError("");
    setParsedBulkCustomers([]);
    if (!bulkPasteText.trim()) {
      setBulkFileError("Teks tempelan kosong. Silakan masukkan data pelanggan terlebih dahulu.");
      return;
    }

    try {
      const lines = bulkPasteText.split(/\r?\n/);
      let parsedList: any[] = [];
      
      // Look for a potential separator in the first non-empty line
      const firstValidLine = lines.find(l => l.trim().length > 0) || "";
      let separator = ",";
      if (firstValidLine.includes(";")) separator = ";";
      else if (firstValidLine.includes("\t")) separator = "\t";
      else if (firstValidLine.includes("|")) separator = "|";

      // Detect if first non-empty line is a header
      const firstLineLower = firstValidLine.toLowerCase();
      let hasHeader = false;
      if (firstLineLower.includes("nama") || firstLineLower.includes("name") || firstLineLower.includes("phone") || firstLineLower.includes("wa") || firstLineLower.includes("paket") || firstLineLower.includes("package")) {
        hasHeader = true;
      }

      const headerIndices: Record<string, number> = {};
      if (hasHeader) {
        const rawHeaders = firstValidLine.split(separator).map(h => h.trim().toLowerCase().replace(/['"]/g, ""));
        rawHeaders.forEach((h, idx) => {
          if (h.includes("id") || h.includes("customer_id") || h.includes("pelanggan")) {
            headerIndices.id = idx;
          } else if (h.includes("name") || h.includes("nama")) {
            headerIndices.name = idx;
          } else if (h.includes("phone") || h.includes("wa") || h.includes("telepon") || h.includes("hp")) {
            headerIndices.phone = idx;
          } else if (h.includes("package") || h.includes("paket")) {
            headerIndices.package = idx;
          } else if (h.includes("due") || h.includes("tempo") || h.includes("tanggal")) {
            headerIndices.dueDate = idx;
          }
        });
      } else {
        // Default fallbacks
        headerIndices.name = 0;
        headerIndices.phone = 1;
        headerIndices.package = 2;
        headerIndices.dueDate = 3;
      }

      const startIndex = hasHeader ? lines.indexOf(firstValidLine) + 1 : 0;
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        let cols = line.split(separator).map(col => col.trim().replace(/['"]/g, ""));
        // if separator wasn't correct, attempt fallback
        if (cols.length === 1) {
          if (line.includes(";")) cols = line.split(";").map(col => col.trim().replace(/['"]/g, ""));
          else if (line.includes("\t")) cols = line.split("\t").map(col => col.trim().replace(/['"]/g, ""));
          else if (line.includes("|")) cols = line.split("|").map(col => col.trim().replace(/['"]/g, ""));
        }

        const item: any = {};
        if (headerIndices.id !== undefined && cols[headerIndices.id]) item.id = cols[headerIndices.id];
        if (headerIndices.name !== undefined && cols[headerIndices.name]) item.name = cols[headerIndices.name];
        if (headerIndices.phone !== undefined && cols[headerIndices.phone]) item.phone = cols[headerIndices.phone];
        if (headerIndices.package !== undefined && cols[headerIndices.package]) item.package = cols[headerIndices.package];
        if (headerIndices.dueDate !== undefined && cols[headerIndices.dueDate]) item.dueDate = cols[headerIndices.dueDate];

        parsedList.push(item);
      }

      const finalized: Customer[] = parsedList.map((item, index) => {
        let pkg = (item.package || item.paket || "").trim().toUpperCase();
        if (pkg.includes("250") || pkg.includes("SILVER")) pkg = "SILVER 250K";
        else if (pkg.includes("300") || pkg.includes("GOLD")) pkg = "GOLD 300K";
        else pkg = "BASIC 200K";

        const name = (item.name || item.nama || `PELANGGAN_${index + 1}`).trim().toUpperCase();
        
        let phone = String(item.phone || item.wa || item.telepon || "").trim().replace(/[^0-9]/g, "");
        if (phone.startsWith("0")) {
          phone = "62" + phone.slice(1);
        } else if (phone && !phone.startsWith("62")) {
          phone = "62" + phone;
        }

        let dueDate = (item.dueDate || item.due_date || item.tempo || item.tanggal || "01/06/2026").trim();

        let id = (item.id || item.customer_id || "").trim().toUpperCase();
        if (!id) {
          const cleanName = name
            .replace(/[^A-Z0-9]/g, ".")
            .replace(/\.+/g, ".")
            .replace(/^\.|\.$/g, "");
          id = `PL4.GEN.${cleanName}`;
        }

        return {
          id,
          name,
          phone,
          package: pkg,
          dueDate
        };
      });

      const validList = finalized.filter(c => c.name && c.phone);
      if (validList.length === 0) {
        setBulkFileError("Tidak ditemukan data pelanggan yang valid. Pastikan baris data memiliki Nama dan No WhatsApp.");
      } else {
        autoImportBulkCustomers(validList);
      }
    } catch (err: any) {
      setBulkFileError("Gagal memproses data tempelan: " + err.message);
    }
  };

  // Helper to fetch and parse JSON safely, avoiding HTML fallback errors and stale caches
  const fetchJsonSafe = async (url: string, options?: RequestInit) => {
    try {
      const separator = url.includes("?") ? "&" : "?";
      const noCacheUrl = url.startsWith("/api") ? `${url}${separator}_t=${Date.now()}` : url;
      const res = await fetch(noCacheUrl, {
        signal: AbortSignal.timeout(10000), // 10 seconds timeout limit
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          ...(options?.headers || {})
        },
        ...options,
      });
      if (!res.ok) return null;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await res.json();
      }
      return null;
    } catch (err) {
      console.warn(`Safe fetch warning for ${url}:`, err);
      return null;
    }
  };

  // Function to load all data from backend
  const loadBackendData = async () => {
    try {
      // 1. Fetch Connection Status
      const statusData = await fetchJsonSafe("/api/status");
      if (statusData) {
        setDbStatus(statusData);
      } else {
        setDbStatus({
          connected: false,
          mode: "Database offline",
          details: "Gagal terhubung ke Express server atau database offline. Silakan periksa koneksi Anda.",
          error: "Koneksi backend/Supabase offline",
          sqlHelp: ""
        });
      }

      // 2. Fetch Customers
      const custList = await fetchJsonSafe("/api/customers");
      if (custList) {
        setCustomers(custList);
      }

      // 3. Fetch Templates
      const tempParsed = await fetchJsonSafe("/api/templates");
      if (tempParsed) {
        setTemplates(tempParsed);
        setTagihanActive(tempParsed.tagihanActive ?? true);
        setTagihanTemplate(tempParsed.tagihanTemplate ?? DEFAULT_TEMPLATES.tagihanTemplate);
        setPsbActive(tempParsed.psbActive ?? false);
        setPsbTemplate(tempParsed.psbTemplate ?? DEFAULT_TEMPLATES.psbTemplate);
      }

      // 4. Fetch Settings & Assets Links
      const setParsed = await fetchJsonSafe("/api/settings");
      if (setParsed) {
        if (setParsed.paymentLink) setPaymentLink(setParsed.paymentLink);
        if (setParsed.youtubeLink) setYoutubeLink(setParsed.youtubeLink);
        if (setParsed.basicLink) setBasicLink(setParsed.basicLink);
        if (setParsed.silverLink) setSilverLink(setParsed.silverLink);
        if (setParsed.goldLink) setGoldLink(setParsed.goldLink);
        if (setParsed.cronIntervalMinutes !== undefined) setCronIntervalMinutes(setParsed.cronIntervalMinutes);
        if (setParsed.reminderTimingDays !== undefined) setReminderTimingDays(setParsed.reminderTimingDays);
      }
      const assetLinks = await fetchJsonSafe("/assets/links.json");
      if (assetLinks) {
        if (assetLinks.youtubeLink) setYoutubeLink(assetLinks.youtubeLink);
        if (assetLinks.paymentLink && !setParsed?.paymentLink) setPaymentLink(assetLinks.paymentLink);
        if ((assetLinks.adminWhatsAppLink || assetLinks.basicPackageLink) && !setParsed?.basicLink) {
          setBasicLink(assetLinks.adminWhatsAppLink || assetLinks.basicPackageLink);
        }
      }

      // 5. Fetch WhatsApp Gateway Logs
      fetchBotLogs();

      // 6. Fetch Bot WhatsApp configurations
      loadBotData();

      // 7. Fetch Disaster Recovery & System Health status
      fetchSystemHealthAndBackups();

      // 8. Fetch Packages List from Database
      const pkgRes = await fetchJsonSafe("/api/packages");
      if (pkgRes && pkgRes.packages && Array.isArray(pkgRes.packages) && pkgRes.packages.length > 0) {
        setPackages(pkgRes.packages);
      }
    } catch (e) {
      console.error("Failed to load data from backend:", e);
    }
  };

  // Disaster Recovery System Handlers
  const fetchSystemHealthAndBackups = async () => {
    setIsFetchingHealth(true);
    try {
      const healthData = await fetchJsonSafe("/api/system/health");
      if (healthData) setSystemHealth(healthData);

      const bkpData = await fetchJsonSafe("/api/backups");
      if (bkpData && bkpData.backups) setBackupsList(bkpData.backups);
    } catch (e) {
      console.error("Failed to fetch system health & backups:", e);
    } finally {
      setIsFetchingHealth(false);
    }
  };

  const handleCreateManualBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const res = await fetch("/api/backups/create", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ Backup manual berhasil dibuat dan tersimpan aman di Supabase/Database!");
        fetchSystemHealthAndBackups();
      } else {
        alert("❌ Gagal membuat backup: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("❌ Terjadi kesalahan: " + err.message);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleDeleteBackup = async (id: string, filename: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus berkas backup "${filename}"?`)) return;
    try {
      const res = await fetch(`/api/backups/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchSystemHealthAndBackups();
      } else {
        alert("Gagal menghapus backup: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    }
  };

  const handleBackupFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        if (!json || (!json.data && !json.customers)) {
          alert("❌ Berkas JSON tidak memiliki struktur data Komindo Billing yang valid.");
          setRestoreFileData(null);
          return;
        }
        setRestoreFileData(json);
        setSelectedBackupForRestore(null);
      } catch (err: any) {
        alert("❌ Gagal membaca file JSON: " + err.message);
        setRestoreFileData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!restoreFileData && !selectedBackupForRestore) {
      alert("Silakan pilih berkas backup atau riwayat snapshot terlebih dahulu.");
      return;
    }

    const confirmMsg = restoreMode === "overwrite"
      ? "⚠️ PERINGATAN RECOVERY: Mode 'OVERWRITE' akan menggantikan seluruh data saat ini dengan data dari backup ini. Lanjutkan?"
      : "Apakah Anda yakin ingin MENGGABUNGKAN (merge) data dari backup ini?";

    if (!window.confirm(confirmMsg)) return;

    setIsRestoring(true);
    try {
      const res = await fetch("/api/backups/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backupData: restoreFileData,
          backupId: selectedBackupForRestore,
          mode: restoreMode
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`🎉 RECOVERY/RESTORE BERHASIL!\n${data.message}`);
        setRestoreModalOpen(false);
        setRestoreFileData(null);
        setRestoreFileName("");
        setSelectedBackupForRestore(null);
        loadBackendData();
      } else {
        alert("❌ Gagal memulihkan backup: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("❌ Terjadi kesalahan: " + err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  // Bot WhatsApp CRUD Handlers
  const loadBotData = async () => {
    try {
      const settings = await fetchJsonSafe("/api/bot/settings");
      if (settings) {
        setBotStatus(settings.status ?? true);
        setBotDefaultReply(settings.default_reply || "");
      }

      const keywords = await fetchJsonSafe("/api/bot/keywords");
      if (keywords && Array.isArray(keywords)) {
        setBotKeywords(keywords);
      }

      const chats = await fetchJsonSafe("/api/bot/chats");
      if (chats && Array.isArray(chats)) {
        setBotChats(chats);
      }
    } catch (e) {
      console.error("Failed to load bot data:", e);
    }
  };

  const handleSaveBotSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/bot/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: botStatus,
          default_reply: botDefaultReply
        })
      });
      if (res.ok) {
        alert("Konfigurasi Bot WhatsApp berhasil disimpan!");
        loadBotData();
      } else {
        alert("Gagal menyimpan konfigurasi Bot.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleSaveKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKeyword.trim() || !formReply.trim()) {
      alert("Kata Kunci dan Balasan wajib diisi!");
      return;
    }
    try {
      const res = await fetch("/api/bot/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingKeyword ? editingKeyword.id : undefined,
          keyword: formKeyword,
          reply: formReply
        })
      });
      if (res.ok) {
        alert(editingKeyword ? "Kata kunci berhasil diupdate!" : "Kata kunci baru berhasil ditambahkan!");
        setIsKeywordModalOpen(false);
        setEditingKeyword(null);
        setFormKeyword("");
        setFormReply("");
        loadBotData();
      } else {
        const d = await res.json();
        alert("Gagal menyimpan kata kunci: " + (d.error || ""));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleDeleteKeyword = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus kata kunci ini?")) return;
    try {
      const res = await fetch(`/api/bot/keywords/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Kata kunci berhasil dihapus!");
        loadBotData();
      } else {
        alert("Gagal menghapus kata kunci.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const fetchBotLogs = async () => {
    const logsData = await fetchJsonSafe("/api/whatsapp/logs");
    if (logsData && Array.isArray(logsData)) {
      setBotLogs(logsData);
    }
  };

  const clearBotLogs = async () => {
    if (!window.confirm("Apakah Anda yakin ingin membersihkan seluruh log aktivitas WhatsApp Gateway?")) return;
    try {
      const res = await fetch("/api/whatsapp/logs/clear", { method: "POST" });
      if (res.ok) {
        setBotLogs([]);
        alert("Log aktivitas WhatsApp Gateway berhasil dibersihkan.");
      } else {
        alert("Gagal membersihkan log.");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const handleClearBotChats = async () => {
    if (!window.confirm("Apakah Anda yakin ingin membersihkan seluruh riwayat chat bot?")) return;
    try {
      const res = await fetch("/api/bot/chats", { method: "DELETE" });
      if (res.ok) {
        setBotChats([]);
        alert("Riwayat chat bot berhasil dibersihkan.");
      } else {
        alert("Gagal membersihkan riwayat chat.");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const savePackagesToBackend = async (newPackages: InternetPackage[]) => {
    setPackages(newPackages);
    try {
      localStorage.setItem("komindo_packages_v2", JSON.stringify(newPackages));
      window.dispatchEvent(new CustomEvent("komindo_packages_updated", { detail: newPackages }));
      const res = await fetch(`/api/packages?_t=${Date.now()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packages: newPackages })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.packages && Array.isArray(data.packages)) {
          setPackages(data.packages);
          localStorage.setItem("komindo_packages_v2", JSON.stringify(data.packages));
        }
      }
    } catch (e) {
      console.error("Gagal menyimpan data paket ke database:", e);
    }
  };

  const handleOpenAddPackage = () => {
    setEditingPackageId(null);
    setPkgFormName("");
    setPkgFormSpeed("");
    setPkgFormPrice("");
    setPkgFormPeriod("/bulan");
    setPkgFormTagline("Ideal untuk kebutuhan internet Anda");
    setPkgFormBadge("");
    setPkgFormIsPopular(false);
    setPkgFormFeatures([
      "Kecepatan Tinggi & Stabil",
      "Unlimited Tanpa FUP",
      "Instalasi Cepat & Gratis",
      "Support Team Teknis 24/7"
    ]);
    setPkgFormNewFeatureText("");
    setPkgFormOrderLink("https://wa.me/6282181144800");
    setIsPackageFormModalOpen(true);
  };

  const handleOpenEditPackage = (pkg: InternetPackage) => {
    setEditingPackageId(pkg.id);
    setPkgFormName(pkg.name);
    setPkgFormSpeed(pkg.speed || "");
    setPkgFormPrice(pkg.price || "");
    setPkgFormPeriod(pkg.period || "/bulan");
    setPkgFormTagline(pkg.tagline || "");
    setPkgFormBadge(pkg.badge || "");
    setPkgFormIsPopular(!!pkg.isPopular);
    setPkgFormFeatures(pkg.features && pkg.features.length > 0 ? [...pkg.features] : [
      `${pkg.name} (${pkg.speed || "Wifi"})`,
      "Unlimited Tanpa FUP",
      "Instalasi Cepat & Gratis",
      "Support Team Teknis 24/7"
    ]);
    setPkgFormNewFeatureText("");
    setPkgFormOrderLink(pkg.orderLink || "https://wa.me/6282181144800");
    setIsPackageFormModalOpen(true);
  };

  const handleSavePackageForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = pkgFormName.trim();
    const price = pkgFormPrice.trim();
    if (!name || !price) {
      alert("Nama paket dan harga wajib diisi!");
      return;
    }

    let updatedList: InternetPackage[];
    if (editingPackageId) {
      updatedList = packages.map(p => {
        if (p.id === editingPackageId) {
          return {
            ...p,
            name,
            speed: pkgFormSpeed.trim(),
            price,
            period: pkgFormPeriod.trim() || "/bulan",
            tagline: pkgFormTagline.trim(),
            badge: pkgFormBadge.trim(),
            isPopular: pkgFormIsPopular,
            features: pkgFormFeatures.filter(f => f.trim().length > 0),
            orderLink: pkgFormOrderLink.trim()
          };
        }
        return p;
      });
    } else {
      const newPkg: InternetPackage = {
        id: `pkg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name,
        speed: pkgFormSpeed.trim(),
        price,
        period: pkgFormPeriod.trim() || "/bulan",
        tagline: pkgFormTagline.trim() || "Ideal untuk kebutuhan internet Anda",
        badge: pkgFormBadge.trim(),
        isPopular: pkgFormIsPopular,
        features: pkgFormFeatures.filter(f => f.trim().length > 0),
        orderLink: pkgFormOrderLink.trim()
      };
      // Appended to the end so it appears sequentially at the bottom
      updatedList = [...packages, newPkg];
    }

    await savePackagesToBackend(updatedList);
    setIsPackageFormModalOpen(false);
    alert(editingPackageId ? "Paket internet berhasil diperbarui!" : "Paket internet baru berhasil ditambahkan dan tampil di halaman depan!");
  };

  const handleDeletePackage = async (id: string, name: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus paket "${name}"?`)) return;
    const filtered = packages.filter(p => p.id !== id);
    await savePackagesToBackend(filtered);
    alert(`Paket "${name}" berhasil dihapus.`);
  };

  const handleTriggerAutoBot = async () => {
    setIsCheckingAutoBot(true);
    try {
      const res = await fetch("/api/whatsapp/auto-check", {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        fetchBotLogs();
        
        const reminded = data.results?.filter((r: any) => r.status?.startsWith("Success Reminded")) || [];
        const already = data.results?.filter((r: any) => r.status?.startsWith("Already Sent")) || [];
        
        if (reminded.length > 0) {
          alert(`⚙️ Sistem Pengingat Otomatis Selesai!\n\nBerhasil mengirim tagihan otomatis ke ${reminded.length} pelanggan:\n${reminded.map((r: any) => `- ${r.name} (${r.id})`).join("\n")}\n\n${already.length} pelanggan lainnya sudah diproses hari ini.`);
        } else {
          alert(`⚙️ Sistem Pengingat Otomatis Selesai!\n\nTidak ada pelanggan jatuh tempo yang perlu dikirim hari ini (Semua sudah diproses atau memang tidak ada).`);
        }
      } else {
        alert("Gagal memicu Pengingat Otomatis.");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsCheckingAutoBot(false);
    }
  };

  useEffect(() => {
    loadBackendData();

    // Real-time synchronization polling (every 3 seconds) for instant cross-device updates (HP & Laptop)
    const interval = setInterval(() => {
      fetchJsonSafe("/api/packages").then((pkgRes) => {
        if (pkgRes && pkgRes.packages && Array.isArray(pkgRes.packages) && pkgRes.packages.length > 0) {
          setPackages(pkgRes.packages);
        }
      });
      fetchBotLogs();
    }, 3000);

    // Sync immediately when user switches tabs or focuses the window
    const onFocus = () => {
      loadBackendData();
    };
    window.addEventListener("focus", onFocus);

    // Cross-tab and multi-window instant synchronization
    const onStorage = (e: StorageEvent) => {
      if (e.key === "komindo_packages_v2" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPackages(parsed);
          }
        } catch (err) {}
      }
    };
    window.addEventListener("storage", onStorage);

    const onCustomUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setPackages(e.detail);
      }
    };
    window.addEventListener("komindo_packages_updated", onCustomUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("komindo_packages_updated", onCustomUpdate);
    };
  }, []);

  // Monitor URL Hash changes to navigate to admin panel or prompt login modal
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      const cleanHash = decodeURIComponent(hash);
      if (cleanHash === "#admin-dashboard" || cleanHash === "#admin" || cleanHash === "##admin") {
        let isAuth = false;
        try {
          isAuth = localStorage.getItem("komindo_admin_logged_in") === "true";
        } catch (e) {
          isAuth = false;
        }

        if (!isAuth) {
          // User is not logged in: Force login modal & clear the hash so it cannot be abused
          setAdminLoggedIn(false);
          setAdminLoginModalOpen(true);
          if (typeof window !== "undefined" && window.history && window.history.replaceState) {
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
          }
        } else {
          setAdminLoggedIn(true);
        }
      }
    };
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => {
      window.removeEventListener("hashchange", checkHash);
    };
  }, []);

  // Unified WhatsApp Gateway Real-time Connection Polling and QR fetchers
  const fetchRealWaStatus = async () => {
    const data = await fetchJsonSafe("/api/admin/whatsapp/status");
    if (data) {
      setRealWaStatus(data.status || "disconnected");
      setRealWaNumber(data.number || null);
      setRealWaMessage(data.message || "");
      if (data.status === "connected") {
        setRealWaQr("");
      } else if (data.qr) {
        setRealWaQr(data.qr);
      } else {
        setRealWaQr("");
      }
    }
  };

  const handleWaDisconnect = async () => {
    if (!window.confirm("Apakah Anda yakin ingin memutuskan koneksi WhatsApp ini? Sesi session_default akan dibersihkan.")) return;
    try {
      const response = await fetch("/api/admin/whatsapp/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session: "default" })
      });
      const data = await response.json();
      alert(data.message || "Koneksi berhasil diputus.");
      fetchRealWaStatus();
    } catch (err: any) {
      alert("Gagal memutuskan koneksi: " + err.message);
    }
  };

  const handleWaReconnect = async () => {
    try {
      const response = await fetch("/api/admin/whatsapp/reconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session: "default" })
      });
      const data = await response.json();
      alert(data.message || "Sesi berhasil di-reconnect.");
      fetchRealWaStatus();
    } catch (err: any) {
      alert("Gagal me-reconnect: " + err.message);
    }
  };

  useEffect(() => {
    if (!adminLoggedIn) return;

    fetchRealWaStatus();

    // Poll WhatsApp status. If disconnected/connecting, poll faster (3s) to catch QR scan instantly. Otherwise, poll every 10s.
    const delay = (realWaStatus === "connecting" || realWaStatus === "disconnected") ? 3000 : 10000;
    const statusInterval = setInterval(() => {
      fetchRealWaStatus();
    }, delay);

    return () => {
      clearInterval(statusInterval);
    };
  }, [adminLoggedIn, realWaStatus]);

  // Helper to append pre-filled message text to WhatsApp links
  const getWhatsAppWithText = (baseLink: string, packageName: string, price: string) => {
    try {
      if (baseLink.includes("wa.me") || baseLink.includes("whatsapp.com")) {
        if (baseLink.includes("text=")) {
          return baseLink;
        }
        
        // Dapatkan tanggal otomatis berformat Indonesia (contoh: 13 Juli 2026)
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const months = [
          "Januari", "Februari", "Maret", "April", "Mei", "Juni",
          "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];
        const month = months[today.getMonth()];
        const year = today.getFullYear();
        const dateString = `${day} ${month} ${year}`;

        const textMessage = `*BIAYA AKTIVASI/REGISTRASI 300K*
=======================
*DATA PELANGGAN*

Tanggal Pendaftaran: ${dateString}
BOX ODP : *(KOSONGKAN)*
ID PELANGGAN : *(KOSONGKAN)*
NIK KTP : 
NAMA :  
NO HP : 
ALAMAT : 

PAKET INTERNET : ${packageName} (${price})
=======================
*NAMA WIFI YANG INGIN DI BUAT*
WIFI :
PASSWORD :
=======================
*KIRIM POTO KTP*
*KIRIM LOKASI RUMAH PELANGGAN*

*Terima Kasih*
*Salam Komindo Network*`;

        const separator = baseLink.includes("?") ? "&" : "?";
        return `${baseLink}${separator}text=${encodeURIComponent(textMessage)}`;
      }
    } catch (e) {
      // safe fallback
    }
    return baseLink;
  };

  // Helper to dynamically calculate realistic billing details based on Customer ID
  const calculateBillingDetails = (uuid: string) => {
    const cleanId = uuid.trim();
    const parts = cleanId.split(".");

    let name = "Pelanggan Komindo";
    let packageType = "Paket Silver (30 Mbps)";
    let amount = 250000;

    // Standard Komindo structure: PLX.XXX.NAMA_PELANGGAN.XXX
    if (parts.length >= 3) {
      name = parts[2].replace(/_/g, " ").toUpperCase();
    } else if (cleanId.length > 2) {
      // Deterministic name generation for generic IDs so they look realistic
      const names = [
        "Rian Hidayat",
        "Sari Sartika",
        "Budi Pratama",
        "Ahmad Fauzi",
        "Dewi Lestari",
        "Rizky Ramadhan",
        "Hendra Wijaya",
        "Indah Permata",
      ];
      let charSum = 0;
      for (let i = 0; i < cleanId.length; i++) {
        charSum += cleanId.charCodeAt(i);
      }
      name = names[charSum % names.length];
    }

    // Determine package based on keywords in ID or pattern matching
    const lowerId = cleanId.toLowerCase();
    if (lowerId.includes("basic") || lowerId.includes("200")) {
      packageType = "Paket Basic (20 Mbps)";
      amount = 200000;
    } else if (lowerId.includes("gold") || lowerId.includes("300")) {
      packageType = "Paket Gold (50 Mbps)";
      amount = 300000;
    } else if (lowerId.includes("silver") || lowerId.includes("250")) {
      packageType = "Paket Silver (30 Mbps)";
      amount = 250000;
    } else {
      // Consistent fallback based on string length
      const packages = [
        { name: "Paket Basic (20 Mbps)", amt: 200000 },
        { name: "Paket Silver (30 Mbps)", amt: 250000 },
        { name: "Paket Gold (50 Mbps)", amt: 300000 },
      ];
      const index = cleanId.length % 3;
      packageType = packages[index].name;
      amount = packages[index].amt;
    }

    const adminFee = 2500;
    const total = amount + adminFee;

    // Generate deterministic invoice number
    let invoiceSum = 7712;
    for (let i = 0; i < cleanId.length; i++) {
      invoiceSum += cleanId.charCodeAt(i) * (i + 1);
    }
    const invoiceNo = `INV/202607/${100000 + (invoiceSum % 899999)}`;

    setBillingDetails({
      id: cleanId,
      name,
      packageType,
      amount,
      adminFee,
      total,
      invoiceNo,
    });
  };

  // Admin Dashboard Actions and Handlers
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = adminUsername.trim();
    const pass = adminPassword.trim();
    if (!user || !pass) {
      setAdminError("Harap isi username dan password.");
      return;
    }

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pass })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminLoggedIn(true);
        try {
          localStorage.setItem("komindo_admin_logged_in", "true");
          localStorage.setItem("komindo_admin_user", data.username || "admin");
        } catch (err) {}
        setAdminLoginModalOpen(false);
        setAdminError("");
        setAdminUsername("");
        setAdminPassword("");
        window.location.hash = "#admin-dashboard";
      } else {
        setAdminError(data.error || "Username atau Password salah.");
      }
    } catch (err: any) {
      // Fallback check if backend call failed
      if ((user.toLowerCase() === "admin" && pass === "adminkomindo") || (user.toLowerCase() === "admin" && pass === "admin")) {
        setAdminLoggedIn(true);
        try {
          localStorage.setItem("komindo_admin_logged_in", "true");
        } catch (e) {}
        setAdminLoginModalOpen(false);
        setAdminError("");
        setAdminUsername("");
        setAdminPassword("");
        window.location.hash = "#admin-dashboard";
      } else {
        setAdminError("Username atau Password salah.");
      }
    }
  };

  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput || newPasswordInput.trim().length < 4) {
      setChangePasswordMsg({ type: "error", text: "Password baru minimal 4 karakter." });
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setChangePasswordMsg({ type: "error", text: "Konfirmasi password baru tidak cocok!" });
      return;
    }
    setChangePasswordLoading(true);
    setChangePasswordMsg(null);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currentPasswordInput,
          newUsername: newUsernameInput.trim() || "admin",
          newPassword: newPasswordInput.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setChangePasswordMsg({ type: "success", text: data.message || "Password admin berhasil diubah!" });
        setTimeout(() => {
          setChangePasswordModalOpen(false);
          setCurrentPasswordInput("");
          setNewPasswordInput("");
          setConfirmPasswordInput("");
          setChangePasswordMsg(null);
        }, 1200);
      } else {
        setChangePasswordMsg({ type: "error", text: data.error || "Gagal mengubah password admin." });
      }
    } catch (err: any) {
      setChangePasswordMsg({ type: "error", text: "Error: " + err.message });
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleAdminLogout = () => {
    setAdminLoggedIn(false);
    try {
      localStorage.removeItem("komindo_admin_logged_in");
      localStorage.removeItem("komindo_admin_user");
      sessionStorage.removeItem("komindo_admin_logged_in");
      sessionStorage.removeItem("komindo_admin_user");
    } catch (err) {}
    setAdminUsername("");
    setAdminPassword("");
    setAdminError("");
    setAdminLoginModalOpen(false);
    window.location.hash = "";
    if (typeof window !== "undefined" && window.history && window.history.replaceState) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  };

  const handleSaveTemplates = async () => {
    const newTemplates: MessageTemplates = {
      tagihanActive,
      tagihanTemplate,
      psbActive,
      psbTemplate,
    };
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTemplates)
      });
      if (res.ok) {
        const saved = await res.json();
        setTemplates(saved);
        alert("Template pesan WhatsApp berhasil disimpan di database!");
      } else {
        alert("Gagal menyimpan template.");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  // Automated background bulk customer importer that saves data and refreshes UI instantly
  const autoImportBulkCustomers = async (list: Customer[]) => {
    if (list.length === 0) return;
    setIsUploadingBulk(true);
    setParsedBulkCustomers(list);
    
    try {
      const res = await fetch("/api/customers/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customers: list })
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Sukses Otomatis! Berhasil mengimpor ${data.count} data pelanggan langsung ke database!`);
        
        // Refresh customer list
        const custRes = await fetch("/api/customers");
        if (custRes.ok) {
          setCustomers(await custRes.json());
        }
        setBulkUploadOpen(false);
      } else {
        const data = await res.json();
        alert("Gagal mengimpor data pelanggan secara otomatis: " + (data.error || "Gagal menghubungi server"));
      }
    } catch (err: any) {
      alert("Error Impor Otomatis: " + err.message);
    } finally {
      setIsUploadingBulk(false);
    }
  };

  // Bulk customer upload handlers
  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkFileError("");
    setParsedBulkCustomers([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          setBulkFileError("File kosong.");
          return;
        }

        let parsedList: any[] = [];
        const fileName = file.name.toLowerCase();

        if (fileName.endsWith(".json")) {
          const rawObj = JSON.parse(text);
          const list = Array.isArray(rawObj) ? rawObj : (rawObj.customers || rawObj.data || []);
          if (!Array.isArray(list)) {
            throw new Error("Format JSON tidak valid. Harus berupa array objek.");
          }
          parsedList = list;
        } else if (fileName.endsWith(".csv") || fileName.endsWith(".txt")) {
          const lines = text.split(/\r?\n/);
          if (lines.length < 2) {
            throw new Error("CSV terlalu sedikit baris. Pastikan ada baris judul (header) dan baris data.");
          }

          const headerLine = lines[0];
          let separator = ",";
          if (headerLine.includes(";")) separator = ";";
          else if (headerLine.includes("\t")) separator = "\t";

          const rawHeaders = headerLine.split(separator).map(h => h.trim().toLowerCase().replace(/['"]/g, ""));
          const headerIndices: Record<string, number> = {};
          
          rawHeaders.forEach((h, idx) => {
            if (h.includes("id") || h.includes("customer_id") || h.includes("pelanggan")) {
              headerIndices.id = idx;
            } else if (h.includes("name") || h.includes("nama")) {
              headerIndices.name = idx;
            } else if (h.includes("phone") || h.includes("wa") || h.includes("telepon") || h.includes("hp")) {
              headerIndices.phone = idx;
            } else if (h.includes("package") || h.includes("paket")) {
              headerIndices.package = idx;
            } else if (h.includes("due") || h.includes("tempo") || h.includes("tanggal")) {
              headerIndices.dueDate = idx;
            }
          });

          // Fallback if no headers found
          if (Object.keys(headerIndices).length === 0) {
            headerIndices.name = 0;
            headerIndices.id = 1;
            headerIndices.phone = 2;
            headerIndices.package = 3;
            headerIndices.dueDate = 4;
          }

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const cols = line.split(separator).map(col => col.trim().replace(/['"]/g, ""));
            const item: any = {};
            if (headerIndices.id !== undefined && cols[headerIndices.id]) item.id = cols[headerIndices.id];
            if (headerIndices.name !== undefined && cols[headerIndices.name]) item.name = cols[headerIndices.name];
            if (headerIndices.phone !== undefined && cols[headerIndices.phone]) item.phone = cols[headerIndices.phone];
            if (headerIndices.package !== undefined && cols[headerIndices.package]) item.package = cols[headerIndices.package];
            if (headerIndices.dueDate !== undefined && cols[headerIndices.dueDate]) item.dueDate = cols[headerIndices.dueDate];

            parsedList.push(item);
          }
        } else {
          setBulkFileError("Format file tidak didukung. Harap unggah file dengan format .csv atau .json");
          return;
        }

        const finalized: Customer[] = parsedList.map((item, index) => {
          let pkg = (item.package || item.paket || "").trim().toUpperCase();
          if (pkg.includes("250") || pkg.includes("SILVER")) pkg = "SILVER 250K";
          else if (pkg.includes("300") || pkg.includes("GOLD")) pkg = "GOLD 300K";
          else pkg = "BASIC 200K";

          const name = (item.name || item.nama || `PELANGGAN_${index + 1}`).trim().toUpperCase();
          
          let phone = String(item.phone || item.wa || item.telepon || "").trim().replace(/[^0-9]/g, "");
          if (phone.startsWith("0")) {
            phone = "62" + phone.slice(1);
          } else if (phone && !phone.startsWith("62")) {
            phone = "62" + phone;
          }

          let dueDate = (item.dueDate || item.due_date || item.tempo || item.tanggal || "01/06/2026").trim();

          let id = (item.id || item.customer_id || "").trim().toUpperCase();
          if (!id) {
            const cleanName = name
              .replace(/[^A-Z0-9]/g, ".")
              .replace(/\.+/g, ".")
              .replace(/^\.|\.$/g, "");
            id = `PL4.GEN.${cleanName}`;
          }

          return {
            id,
            name,
            phone,
            package: pkg,
            dueDate
          };
        });

        const validList = finalized.filter(c => c.name && c.phone);
        if (validList.length === 0) {
          setBulkFileError("Tidak ditemukan data pelanggan yang valid. Pastikan kolom Nama dan No WhatsApp terisi.");
        } else {
          autoImportBulkCustomers(validList);
        }
      } catch (err: any) {
        setBulkFileError("Gagal memproses file: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmBulkUpload = async () => {
    if (parsedBulkCustomers.length === 0) return;
    setIsUploadingBulk(true);

    try {
      const res = await fetch("/api/customers/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customers: parsedBulkCustomers })
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Sukses! Berhasil mengimpor ${data.count} data pelanggan ke database!`);
        
        // Refresh customer list
        const custRes = await fetch("/api/customers");
        if (custRes.ok) {
          setCustomers(await custRes.json());
        }

        setParsedBulkCustomers([]);
        setBulkUploadOpen(false);
      } else {
        const data = await res.json();
        alert("Gagal mengimpor data pelanggan: " + (data.error || "Gagal menghubungi server"));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsUploadingBulk(false);
    }
  };

  const handleDownloadCSVTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Nama Pelanggan,No WhatsApp,Paket,Jatuh Tempo\nBUDI UTOMO,6281234567890,BASIC 200K,01/06/2026\nSITI AMINAH,6289876543210,SILVER 250K,05/06/2026\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template_komindo_pelanggan.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJSONTemplate = () => {
    const jsonContent = JSON.stringify([
      {
        id: "PL4.GEN.BUDI.UTOMO",
        name: "BUDI UTOMO",
        phone: "6281234567890",
        package: "BASIC 200K",
        dueDate: "01/06/2026"
      },
      {
        id: "PL4.GEN.SITI.AMINAH",
        name: "SITI AMINAH",
        phone: "6289876543210",
        package: "SILVER 250K",
        dueDate: "05/06/2026"
      }
    ], null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(jsonContent);
    const link = document.createElement("a");
    link.setAttribute("href", dataUri);
    link.setAttribute("download", "template_komindo_pelanggan.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formId.trim() || !formPhone.trim() || !formPackage) {
      alert("Mohon lengkapi semua bidang.");
      return;
    }

    const updatedCust: Customer = {
      id: formId.trim().toUpperCase(),
      name: formName.trim().toUpperCase(),
      phone: formPhone.trim(),
      package: formPackage,
      dueDate: formDueDate.trim() || "01/06/2026",
    };

    try {
      if (!editMode && customers.some((c) => c.id.toUpperCase() === updatedCust.id.toUpperCase())) {
        alert("ID Customer sudah terdaftar!");
        return;
      }

      const bodyPayload = {
        ...updatedCust,
        oldId: editMode ? editId : undefined
      };

      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload)
      });

      if (res.ok) {
        const savedData = await res.json();
        // Reload all customers from DB
        const custRes = await fetch("/api/customers");
        if (custRes.ok) {
          setCustomers(await custRes.json());
        }

        setEditMode(false);
        setEditId("");
        setFormName("");
        setFormId("");
        setFormPhone("");
        setFormPackage("");
        setFormDueDate("01/06/2026");

        let msg = editMode ? "Data Pelanggan berhasil diperbarui di database!" : "Pelanggan baru berhasil ditambahkan ke database!";
        if (savedData.waWarning) {
          msg += `\n\n⚠️ Peringatan WhatsApp: ${savedData.waWarning}`;
        }
        alert(msg);
      } else {
        alert("Gagal menyimpan data pelanggan.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus pelanggan ini?")) {
      try {
        const res = await fetch(`/api/customers/${encodeURIComponent(id)}`, {
          method: "DELETE"
        });
        if (res.ok) {
          const custRes = await fetch("/api/customers");
          if (custRes.ok) {
            setCustomers(await custRes.json());
          }
          alert("Pelanggan berhasil dihapus dari database!");
        } else {
          alert("Gagal menghapus pelanggan.");
        }
      } catch (err: any) {
        alert("Error: " + err.message);
      }
    }
  };

  const handleIncrementDueDate = async (customer: Customer) => {
    let currentDueDate = customer.dueDate || "01/06/2026";
    let parts = currentDueDate.trim().split("/");
    if (parts.length !== 3) {
      alert("Format tanggal Jatuh Tempo tidak didukung (harus DD/MM/YYYY, contoh: 01/06/2026)");
      return;
    }
    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      alert("Gagal membaca tanggal Jatuh Tempo yang valid");
      return;
    }

    let newMonth = month + 1;
    let newYear = year;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }

    const dayStr = String(day).padStart(2, "0");
    const monthStr = String(newMonth).padStart(2, "0");
    const yearStr = String(newYear);
    const newDueDate = `${dayStr}/${monthStr}/${yearStr}`;

    const confirmation = window.confirm(
      `Konfirmasi pembayaran & perpanjangan tagihan?\n\n` +
      `• Nama: ${customer.name}\n` +
      `• Jatuh Tempo Lama: ${currentDueDate}\n` +
      `• Jatuh Tempo Baru: ${newDueDate}\n\n` +
      `Klik OK jika pelanggan sudah membayar dan Anda ingin memperpanjang masa aktif internet.`
    );

    if (!confirmation) return;

    try {
      const bodyPayload = {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        package: customer.package,
        dueDate: newDueDate,
        oldId: customer.id
      };

      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload)
      });

      if (res.ok) {
        // Reload all customers from DB
        const custRes = await fetch("/api/customers");
        if (custRes.ok) {
          setCustomers(await custRes.json());
        }
        alert(`Pembayaran terkonfirmasi! Jatuh tempo ${customer.name} berhasil diperpanjang menjadi ${newDueDate}.`);
      } else {
        alert("Gagal memperbarui jatuh tempo pelanggan.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleClearAllCustomers = async () => {
    const confirmation = window.confirm(
      "PERINGATAN KRITIKAL:\n\nApakah Anda yakin ingin menghapus SELURUH data pelanggan dari database? Tindakan ini tidak dapat dibatalkan."
    );
    if (!confirmation) return;

    try {
      const res = await fetch("/api/customers/clear-all", { method: "POST" });
      if (res.ok) {
        setCustomers([]);
        alert("Semua data pelanggan telah berhasil dihapus secara permanen. Database kini kosong (fresh 0).");
      } else {
        alert("Gagal menghapus seluruh data pelanggan.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          paymentLink, 
          youtubeLink,
          basicLink, 
          silverLink, 
          goldLink,
          cronIntervalMinutes: Number(cronIntervalMinutes),
          reminderTimingDays: Number(reminderTimingDays)
        })
      });
      if (res.ok) {
        alert("Konfigurasi tautan pembayaran, YouTube tutorial, scheduler & timing berhasil disimpan ke database!");
        loadBackendData();
      } else {
        alert("Gagal menyimpan konfigurasi.");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const handleManualRetry = async (customer: Customer) => {
    try {
      const res = await fetch("/api/whatsapp/send-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: customer.id })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || `Sukses mengirim pengingat manual ke ${customer.name}!`);
        // Refresh customer list
        loadBackendData();
        fetchBotLogs();
      } else {
        alert("Gagal mengirim pengingat manual: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
    setWaMenuCustId(null);
  };

  const handleResetReminderStatus = async (customer: Customer) => {
    try {
      const res = await fetch("/api/whatsapp/reset-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: customer.id })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Status pengingat WhatsApp untuk ${customer.name} berhasil di-reset menjadi BELUM DIKIRIM.`);
        loadBackendData();
      } else {
        alert("Gagal me-reset status: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
    setWaMenuCustId(null);
  };

  const handleBotSimulateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simMessage.trim()) return;
    setSimSending(true);
    setSimReply("");
    try {
      const res = await fetch("/api/whatsapp/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: simSender.trim(),
          message: simMessage.trim()
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSimReply(data.reply || "No reply generated");
        fetchBotLogs();
      } else {
        setSimReply("Gagal terhubung dengan webhook server.");
      }
    } catch (err: any) {
      setSimReply("Network Error: " + err.message);
    } finally {
      setSimSending(false);
    }
  };

  const handleStartEdit = (customer: Customer) => {
    setFormName(customer.name);
    setFormId(customer.id);
    setFormPhone(customer.phone);
    setFormPackage(customer.package);
    setFormDueDate(customer.dueDate);
    setEditMode(true);
    setEditId(customer.id);
    const formElement = document.getElementById("customer-form-title");
    if (formElement) formElement.scrollIntoView({ behavior: "smooth" });
  };

  const formatWhatsAppNumber = (phone: string) => {
    let cleaned = phone.trim().replace(/[^0-9]/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.substring(1);
    } else if (!cleaned.startsWith("62") && cleaned.length > 0) {
      cleaned = "62" + cleaned;
    }
    return cleaned;
  };

  const generateWhatsAppMessage = (customer: Customer, templateType: "tagihan" | "psb") => {
    const templateText = templateType === "tagihan" ? tagihanTemplate : psbTemplate;
    return templateText
      .replace(/{nama}/g, customer.name)
      .replace(/{paket}/g, customer.package)
      .replace(/{jatuhTempo}/g, customer.dueDate)
      .replace(/{id}/g, customer.id)
      .replace(/{linkPembayaran}/g, paymentLink)
      .replace(/{youtubeLink}/g, youtubeLink);
  };

  const handleSendWhatsApp = (customer: Customer, templateType: "tagihan" | "psb") => {
    const message = generateWhatsAppMessage(customer, templateType);
    const cleanedPhone = formatWhatsAppNumber(customer.phone);
    const url = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    setWaMenuCustId(null);
  };

  const handleCopyWhatsAppText = (customer: Customer, templateType: "tagihan" | "psb") => {
    const message = generateWhatsAppMessage(customer, templateType);
    navigator.clipboard.writeText(message);
    alert("Teks pesan berhasil disalin ke clipboard!");
    setWaMenuCustId(null);
  };

  const handleCheckBillingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = customerId.trim();
    if (!trimmedId) return;

    const lowerId = trimmedId.toLowerCase();
    if (lowerId === "##admin" || lowerId === "#admin" || lowerId === "admin") {
      setAdminLoginModalOpen(true);
      return;
    }

    // Check in local customer database first
    const found = customers.find(
      (c) =>
        c.id.toLowerCase() === trimmedId.toLowerCase() ||
        c.name.toLowerCase() === trimmedId.toLowerCase()
    );

    if (found) {
      let amt = 200000;
      const pkgLower = found.package.toLowerCase();
      if (pkgLower.includes("silver") || pkgLower.includes("250")) amt = 250000;
      else if (pkgLower.includes("gold") || pkgLower.includes("300")) amt = 300000;
      else if (pkgLower.includes("free") || pkgLower.includes("csr")) amt = 0;

      const adminFee = amt > 0 ? 2500 : 0;
      const total = amt + adminFee;

      // Deterministic invoice number
      let invoiceSum = 7712;
      for (let i = 0; i < found.id.length; i++) {
        invoiceSum += found.id.charCodeAt(i) * (i + 1);
      }
      const invoiceNo = `INV/202607/${100000 + (invoiceSum % 899999)}`;

      setBillingDetails({
        id: found.id,
        name: found.name,
        packageType: found.package.toUpperCase().includes("CSR") ? found.package : `Paket ${found.package}`,
        amount: amt,
        adminFee: adminFee,
        total: total,
        invoiceNo: invoiceNo,
        dueDate: found.dueDate,
      });
      setBillingModalOpen(true);
    } else {
      // Fallback to simulator
      calculateBillingDetails(trimmedId);
      setBillingModalOpen(true);
    }
  };

  // Filter and Paginate Customers
  const filteredCustomers = customers.filter((c) => {
    const searchLower = tableSearch.toLowerCase();
    const matchSearch =
      c.name.toLowerCase().includes(searchLower) ||
      c.id.toLowerCase().includes(searchLower) ||
      c.phone.includes(searchLower);

    const matchPackage =
      tablePackageFilter === "Semua Paket" ||
      c.package.toUpperCase() === tablePackageFilter.toUpperCase();

    return matchSearch && matchPackage;
  });

  const totalPages = Math.ceil(filteredCustomers.length / tableLimit) || 1;
  const currentPage = Math.min(tablePage, totalPages);
  const startIndex = (currentPage - 1) * tableLimit;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + tableLimit);

  const adminMenuItems = [
    {
      id: "dashboard" as const,
      title: "Kelola & Tambah Paket",
      subtitle: "Atur pilihan paket internet & tarif",
      icon: "fas fa-box-open",
      badge: `${packagesList.length} Paket`,
      badgeColor: "bg-blue-100 text-blue-700 border border-blue-200"
    }
  ];

  if (adminLoggedIn) {
    const filteredAdminPackages = packages.filter((p) => {
      const q = packageSearchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.speed && p.speed.toLowerCase().includes(q)) ||
        (p.price && p.price.toLowerCase().includes(q)) ||
        (p.tagline && p.tagline.toLowerCase().includes(q))
      );
    });

    return (
      <div className="min-h-screen bg-slate-100 font-sans antialiased text-slate-800 flex flex-col pb-12">
        {/* 🔝 Top Navigation Header (Clean, Simple, Professional) */}
        <nav className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-40 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Sisi Kiri: Garis 3 (Hamburger Menu) & Identitas */}
              <div className="flex items-center space-x-3">
                {/* ☰ Tombol Menu Garis 3 */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors flex items-center justify-center cursor-pointer min-w-[40px] min-h-[40px]"
                    title="Menu Navigasi Garis Tiga"
                  >
                    <i className={`fas ${isSidebarOpen ? "fa-times" : "fa-bars"} text-base`}></i>
                  </button>

                  {/* Dropdown Menu Garis 3 */}
                  <AnimatePresence>
                    {isSidebarOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsSidebarOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-slate-700"
                        >
                          <div className="px-4 py-2 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Menu Navigasi Admin
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              setIsSidebarOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 flex items-center gap-3 text-blue-600 transition-colors cursor-pointer"
                          >
                            <i className="fas fa-box-open text-base w-5 text-center"></i>
                            <span>Kelola Pilihan Paket</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsSidebarOpen(false);
                              setChangePasswordMsg(null);
                              setChangePasswordModalOpen(true);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 flex items-center gap-3 text-slate-700 transition-colors cursor-pointer"
                          >
                            <i className="fas fa-key text-base w-5 text-center text-amber-500"></i>
                            <span>Ganti Password Admin</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsSidebarOpen(false);
                              setAdminLoggedIn(false);
                              try {
                                localStorage.removeItem("komindo_admin_logged_in");
                              } catch (e) {}
                              window.location.hash = "";
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 flex items-center gap-3 text-slate-700 transition-colors cursor-pointer"
                          >
                            <i className="fas fa-home text-base w-5 text-center text-slate-500"></i>
                            <span>Halaman Utama (Depan)</span>
                          </button>

                          <div className="border-t border-slate-100 my-1"></div>

                          <button
                            type="button"
                            onClick={() => {
                              setIsSidebarOpen(false);
                              handleAdminLogout();
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-rose-50 flex items-center gap-3 text-rose-600 transition-colors cursor-pointer"
                          >
                            <i className="fas fa-sign-out-alt text-base w-5 text-center text-rose-500"></i>
                            <span>Logout / Keluar</span>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center space-x-2.5">
                  <img
                    src="https://komindo.net/uploads/company/logo.png?1783994168"
                    alt="Logo"
                    className="h-8 w-auto border border-slate-200 rounded p-1"
                  />
                  <div>
                    <span className="font-bold text-sm sm:text-base text-slate-900 block leading-tight">
                      Admin Billing Komindo
                    </span>
                    <span className="text-xs text-slate-500 hidden sm:block">
                      Pengelolaan Pilihan Paket &amp; Kredensial
                    </span>
                  </div>
                </div>
              </div>

              {/* Sisi Kanan: Ganti Password, Status & Logout */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setChangePasswordMsg(null);
                    setChangePasswordModalOpen(true);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[40px] border border-slate-200"
                  title="Ganti Password Administrator"
                >
                  <i className="fas fa-key text-amber-500 text-xs"></i>
                  <span className="hidden sm:inline">Ganti Password</span>
                </button>

                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 hidden md:inline-block">
                  Total: <strong className="text-slate-900">{packages.length} Paket</strong>
                </span>

                <button
                  type="button"
                  onClick={handleAdminLogout}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[40px]"
                  title="Keluar dari Admin"
                >
                  <i className="fas fa-sign-out-alt text-xs"></i>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* 🖥️ Main Workspace */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 flex-1 w-full space-y-6">
          <div className="space-y-6">
            
            {/* Header Workspace */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    Pengelolaan Paket Layanan Internet
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                    Real-time Sync
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Atur tarif, kecepatan (Mbps), tagline seperti <em>"Ideal untuk work from home"</em>, dan daftar fitur yang tampil langsung di website depan.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
                <button
                  type="button"
                  onClick={handleOpenAddPackage}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer flex items-center gap-2"
                >
                  <i className="fas fa-plus-circle text-sm"></i>
                  <span>+ Tambah Paket Baru</span>
                </button>
              </div>
            </div>

            {/* Pencarian dan Ringkasan */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <i className="fas fa-search text-xs"></i>
                </span>
                <input
                  type="text"
                  value={packageSearchQuery}
                  onChange={(e) => setPackageSearchQuery(e.target.value)}
                  placeholder="Cari paket internet (nama, kecepatan, harga)..."
                  className="pl-8 pr-3 py-2 w-full rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none text-xs text-slate-800 bg-white"
                />
                {packageSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setPackageSearchQuery("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  >
                    <i className="fas fa-times text-xs"></i>
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-600 font-medium flex items-center gap-2">
                <span>Menampilkan: <strong>{filteredAdminPackages.length}</strong> dari <strong>{packages.length}</strong> paket</span>
              </div>
            </div>

            {/* Grid Kartu Paket Internet */}
            {filteredAdminPackages.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 text-xl">
                  <i className="fas fa-box-open"></i>
                </div>
                <h4 className="text-sm font-bold text-slate-700">Tidak ada paket yang ditemukan</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {packageSearchQuery ? "Coba ubah kata kunci pencarian Anda." : "Belum ada paket internet yang ditambahkan."}
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddPackage}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5"
                >
                  <i className="fas fa-plus text-xs"></i> Tambah Paket Pertama
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredAdminPackages.map((pkg) => {
                  const isPop = !!pkg.isPopular;
                  return (
                    <div
                      key={pkg.id}
                      className={`bg-white rounded-2xl border-2 transition-all p-5 flex flex-col justify-between shadow-xs hover:shadow-md relative ${
                        isPop ? "border-sky-400 bg-sky-50/20" : "border-slate-200"
                      }`}
                    >
                      {/* Badge */}
                      {(pkg.badge || isPop) && (
                        <div className="mb-2 flex items-center justify-between">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isPop ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-sky-100 text-sky-800 border border-sky-200"
                          }`}>
                            <i className="fas fa-star text-[10px] mr-1"></i>
                            {pkg.badge || "Paling Populer"}
                          </span>
                          {isPop && (
                            <span className="text-[10px] text-sky-600 font-bold">Highlighted di Website</span>
                          )}
                        </div>
                      )}

                      {/* Info Utama */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-lg font-bold text-slate-900 leading-tight">
                              {pkg.name}
                            </h4>
                            {pkg.speed && (
                              <span className="inline-block text-xs font-semibold text-blue-600 mt-0.5">
                                Kecepatan: {pkg.speed}
                              </span>
                            )}
                          </div>

                          <div className="text-right">
                            <span className="text-xl font-extrabold text-slate-900 block leading-tight">
                              {pkg.price}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {pkg.period || "/bulan"}
                            </span>
                          </div>
                        </div>

                        {pkg.tagline && (
                          <p className="text-xs text-slate-600 font-medium italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                            "{pkg.tagline}"
                          </p>
                        )}

                        {/* List Fitur */}
                        <div className="pt-2 border-t border-slate-100 space-y-1.5">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Fitur Layanan ({pkg.features?.length || 0}):
                          </span>
                          <ul className="space-y-1.5 text-xs text-slate-700">
                            {pkg.features && pkg.features.map((feat, fIdx) => (
                              <li key={fIdx} className="flex items-start gap-2">
                                <i className="fas fa-check text-emerald-500 text-xs mt-0.5 shrink-0"></i>
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400 font-mono truncate max-w-[120px]">
                          ID: {pkg.id}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPackage(pkg)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                            title="Edit paket ini"
                          >
                            <i className="fas fa-edit text-xs text-blue-600"></i>
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                            className="px-2.5 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                            title="Hapus paket"
                          >
                            <i className="fas fa-trash-alt text-xs"></i>
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Status Koneksi Database Sederhana */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${dbStatus.connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}></span>
                <span>Penyimpanan Data: <strong>{dbStatus.connected ? "Supabase PostgreSQL (Real-time Dual-Write)" : "Local Database (Fallback JSON)"}</strong></span>
              </div>
              <span className="text-slate-400">Sinkronisasi otomatis aktif antar HP dan Komputer</span>
            </div>

          </div>
        </div>

        {/* 🔐 MODAL GANTI PASSWORD ADMIN */}
        <AnimatePresence>
          {changePasswordModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setChangePasswordModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.93, y: 15, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.93, y: 15, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 relative"
              >
                <button
                  type="button"
                  onClick={() => setChangePasswordModalOpen(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-50 z-10 cursor-pointer"
                >
                  <i className="fas fa-times text-base"></i>
                </button>

                <div className="bg-gradient-to-br from-slate-800 to-sky-950 px-6 py-6 text-center text-white relative">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/10 shadow-inner">
                    <i className="fas fa-key text-amber-400 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-bold tracking-tight">Ganti Password Administrator</h3>
                  <p className="text-slate-300 text-xs mt-1 font-medium">
                    Perbarui username dan password login admin Komindo
                  </p>
                </div>

                <form onSubmit={handleChangeAdminPassword} className="p-6 space-y-4">
                  {changePasswordMsg && (
                    <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                      changePasswordMsg.type === "success"
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                        : "bg-rose-50 border border-rose-200 text-rose-600"
                    }`}>
                      <i className={`fas ${changePasswordMsg.type === "success" ? "fa-check-circle" : "fa-exclamation-triangle"}`}></i>
                      <span>{changePasswordMsg.text}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Username Baru
                    </label>
                    <input
                      type="text"
                      value={newUsernameInput}
                      onChange={(e) => setNewUsernameInput(e.target.value)}
                      placeholder="admin"
                      className="px-3.5 py-2.5 w-full rounded-xl border border-slate-300 focus:border-slate-800 focus:outline-none text-xs font-semibold text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Password Lama (Opsional bila pertama kali)
                    </label>
                    <input
                      type="password"
                      value={currentPasswordInput}
                      onChange={(e) => setCurrentPasswordInput(e.target.value)}
                      placeholder="Masukkan password saat ini..."
                      className="px-3.5 py-2.5 w-full rounded-xl border border-slate-300 focus:border-slate-800 focus:outline-none text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Password Baru
                    </label>
                    <input
                      type="password"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="Minimal 4 karakter..."
                      className="px-3.5 py-2.5 w-full rounded-xl border border-slate-300 focus:border-slate-800 focus:outline-none text-xs font-semibold text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Konfirmasi Password Baru
                    </label>
                    <input
                      type="password"
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      placeholder="Ulangi password baru..."
                      className="px-3.5 py-2.5 w-full rounded-xl border border-slate-300 focus:border-slate-800 focus:outline-none text-xs font-semibold text-slate-800"
                      required
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setChangePasswordModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={changePasswordLoading}
                      className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {changePasswordLoading && <i className="fas fa-spinner fa-spin"></i>}
                      <span>Simpan Password Baru</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 📦 MODAL TAMBAH & EDIT PAKET INTERNET */}
        <AnimatePresence>
          {isPackageFormModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPackageFormModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.93, y: 15, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.93, y: 15, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 relative my-8"
              >
                <button
                  type="button"
                  onClick={() => setIsPackageFormModalOpen(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-50 z-10 cursor-pointer"
                >
                  <i className="fas fa-times text-base"></i>
                </button>

                <div className="bg-gradient-to-br from-blue-700 to-indigo-900 px-6 py-5 text-center text-white relative">
                  <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-white/10 shadow-inner">
                    <i className="fas fa-box text-white text-lg"></i>
                  </div>
                  <h3 className="text-lg font-bold tracking-tight">
                    {editingPackageId ? "Edit Paket Internet" : "Tambah Paket Internet Baru"}
                  </h3>
                  <p className="text-blue-100 text-xs mt-0.5">
                    Data paket akan langsung sinkron secara real-time ke halaman utama
                  </p>
                </div>

                <form onSubmit={handleSavePackageForm} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Nama Paket *
                      </label>
                      <input
                        type="text"
                        value={pkgFormName}
                        onChange={(e) => setPkgFormName(e.target.value)}
                        placeholder="Contoh: Paket Silver"
                        className="px-3 py-2 w-full rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none text-xs font-semibold text-slate-800"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Kecepatan Internet
                      </label>
                      <input
                        type="text"
                        value={pkgFormSpeed}
                        onChange={(e) => setPkgFormSpeed(e.target.value)}
                        placeholder="Contoh: 30 Mbps"
                        className="px-3 py-2 w-full rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none text-xs font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Harga (Tarif) *
                      </label>
                      <input
                        type="text"
                        value={pkgFormPrice}
                        onChange={(e) => setPkgFormPrice(e.target.value)}
                        placeholder="Contoh: 250K atau 250.000"
                        className="px-3 py-2 w-full rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none text-xs font-semibold text-slate-800"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Periode Tagihan
                      </label>
                      <input
                        type="text"
                        value={pkgFormPeriod}
                        onChange={(e) => setPkgFormPeriod(e.target.value)}
                        placeholder="/bulan"
                        className="px-3 py-2 w-full rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none text-xs font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Keterangan / Tagline Singkat
                    </label>
                    <input
                      type="text"
                      value={pkgFormTagline}
                      onChange={(e) => setPkgFormTagline(e.target.value)}
                      placeholder="Contoh: Ideal untuk work from home"
                      className="px-3 py-2 w-full rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Label Badge (Opsional)
                      </label>
                      <input
                        type="text"
                        value={pkgFormBadge}
                        onChange={(e) => setPkgFormBadge(e.target.value)}
                        placeholder="Contoh: Paling Populer, Promo, dll"
                        className="px-3 py-2 w-full rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none text-xs font-semibold text-slate-800"
                      />
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pkgFormIsPopular}
                          onChange={(e) => setPkgFormIsPopular(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
                        />
                        <span className="text-xs font-bold text-slate-700">Tandai Paket Paling Populer</span>
                      </label>
                    </div>
                  </div>

                  {/* Pengaturan Daftar Fitur */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Daftar Fitur Paket ({pkgFormFeatures.length})
                      </label>
                    </div>

                    {/* Fitur List Items */}
                    <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-h-40 overflow-y-auto">
                      {pkgFormFeatures.map((feat, index) => (
                        <div key={index} className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800">
                          <div className="flex items-center gap-2 flex-1">
                            <i className="fas fa-check text-emerald-500 text-xs"></i>
                            <span className="font-medium">{feat}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPkgFormFeatures(pkgFormFeatures.filter((_, i) => i !== index));
                            }}
                            className="text-rose-500 hover:text-rose-700 p-1"
                            title="Hapus fitur ini"
                          >
                            <i className="fas fa-times text-xs"></i>
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Input Tambah Fitur Kustom */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={pkgFormNewFeatureText}
                        onChange={(e) => setPkgFormNewFeatureText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const val = pkgFormNewFeatureText.trim();
                            if (val && !pkgFormFeatures.includes(val)) {
                              setPkgFormFeatures([...pkgFormFeatures, val]);
                              setPkgFormNewFeatureText("");
                            }
                          }
                        }}
                        placeholder="Ketik fitur baru..."
                        className="px-3 py-1.5 w-full rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none text-xs font-semibold text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = pkgFormNewFeatureText.trim();
                          if (val && !pkgFormFeatures.includes(val)) {
                            setPkgFormFeatures([...pkgFormFeatures, val]);
                            setPkgFormNewFeatureText("");
                          }
                        }}
                        className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                      >
                        + Tambah
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Link WhatsApp Pemesanan
                    </label>
                    <input
                      type="text"
                      value={pkgFormOrderLink}
                      onChange={(e) => setPkgFormOrderLink(e.target.value)}
                      placeholder="https://wa.me/6282181144800"
                      className="px-3 py-2 w-full rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPackageFormModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1.5"
                    >
                      <i className="fas fa-save"></i>
                      <span>Simpan Paket</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-gray-800">
      {/* Navigation */}
      <nav id="navbar" className="fixed w-full bg-white/95 backdrop-blur-sm shadow-lg z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-2">
              <img
                src="https://komindo.net/uploads/company/logo.png?1783994168"
                alt="Logo"
                id="navbar-logo"
                className="h-8 w-auto"
                style={{
                  width: "auto",
                  height: "auto",
                  maxWidth: "none",
                  maxHeight: "2rem",
                  minWidth: "80px",
                  minHeight: "1.5rem",
                  objectFit: "contain",
                }}
              />
              <span className="text-base min-[390px]:text-lg sm:text-2xl font-bold text-gray-800">KOMINDO NETWORK</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-800 hover:text-sky-600 transition-colors font-medium">Beranda</a>
              <a href="#features" className="text-gray-800 hover:text-sky-600 transition-colors font-medium">Fitur</a>
              <a href="#pricing" className="text-gray-800 hover:text-sky-600 transition-colors font-medium">Paket</a>
              <a href="#testimonials" className="text-gray-800 hover:text-sky-600 transition-colors font-medium">Testimoni</a>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                id="mobile-menu-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-800 hover:text-sky-600 p-2 focus:outline-none"
              >
                <i className={`fas ${mobileMenuOpen ? "fa-times" : "fa-bars"} text-lg sm:text-xl`}></i>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div id="mobile-menu" className="md:hidden pb-4 transition-all duration-300">
              <div className="flex flex-col space-y-3">
                <a
                  href="#home"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-800 hover:text-sky-600 transition-colors font-medium py-2 px-2"
                >
                  Beranda
                </a>
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-800 hover:text-sky-600 transition-colors font-medium py-2 px-2"
                >
                  Fitur
                </a>
                <a
                  href="#pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-800 hover:text-sky-600 transition-colors font-medium py-2 px-2"
                >
                  Paket
                </a>
                <a
                  href="#testimonials"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-800 hover:text-sky-600 transition-colors font-medium py-2 px-2"
                >
                  Testimoni
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="gradient-bg hero-pattern min-h-screen flex items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-sky-600"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-white text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 leading-tight text-white text-shadow-lg">
                Internet <span className="text-yellow-400 text-shadow-lg font-black">Super Cepat</span> untuk Hidup Digital Anda
              </h1>
              <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 text-white leading-relaxed font-semibold text-shadow bg-black/30 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/30 shadow-xl">
                Nikmati koneksi internet fiber optik berkecepatan tinggi dengan harga terjangkau. Cocok untuk streaming, gaming, dan work from home.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8 justify-center lg:justify-start">
                <a
                  href={getWhatsAppWithText("https://wa.me/6282181144800", "....................", "....................")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-sky-800 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold hover:bg-yellow-400 hover:text-sky-900 transition-all duration-300 shadow-2xl border-3 border-white transform hover:scale-105 text-center flex items-center justify-center gap-2"
                >
                  <i className="fas fa-rocket"></i>
                  Daftar Sekarang
                </a>
              </div>
            </div>

            <div className="relative order-last lg:order-last mb-8 lg:mb-0">
              <div className="relative z-10">
                <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 mx-auto relative">
                  <div className="absolute inset-0 bg-white/30 rounded-full pulse-ring"></div>
                  <div className="w-full h-full bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30 shadow-2xl">
                    <i className="fas fa-wifi text-white text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl text-shadow-lg"></i>
                  </div>
                </div>
              </div>
              <div className="absolute top-2 sm:top-4 md:top-8 lg:top-10 right-2 sm:right-4 md:right-8 lg:right-10 bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border-2 sm:border-3 border-yellow-400 shadow-2xl">
                <div className="text-center">
                  <div className="text-base sm:text-lg md:text-xl font-extrabold text-sky-800">Paket Basic</div>
                  <div className="text-[10px] sm:text-xs font-bold text-sky-700">Untuk Keluarga</div>
                </div>
              </div>
              <div className="absolute bottom-8 sm:bottom-12 md:bottom-16 lg:bottom-20 left-2 sm:left-4 md:left-8 lg:left-10 bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border-2 sm:border-3 border-yellow-400 shadow-2xl">
                <div className="text-center">
                  <div className="text-base sm:text-lg md:text-xl font-extrabold text-sky-800">Rp 200K</div>
                  <div className="text-[10px] sm:text-xs font-bold text-sky-700">Mulai dari</div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Cek Tagihan */}
          <div className="bg-black/30 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/30 mt-12 sm:mt-16 mb-6 sm:mb-8 shadow-xl text-center">
            <h3 className="text-white font-bold text-lg sm:text-xl mb-4 flex items-center justify-center text-shadow">
              <i className="fas fa-search mr-2 text-yellow-400 animate-bounce"></i>
              Cek Tagihan Internet Anda
            </h3>
            <div className="flex justify-center">
              <a
                href="https://e.ebilling.id/tagihan/?account=5379"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-yellow-400 text-sky-900 px-8 py-3.5 rounded-full font-extrabold hover:bg-yellow-500 transition-all duration-300 shadow-xl flex items-center justify-center gap-2 border-2 border-yellow-300 transform hover:scale-105 text-sm sm:text-base cursor-pointer text-center max-w-sm"
              >
                <i className="fas fa-search"></i>
                Cek Tagihan
              </a>
            </div>
            <p className="text-white text-xs sm:text-sm mt-4 font-medium text-shadow">
              <i className="fas fa-info-circle mr-1 text-yellow-400"></i>
              ID Customer dapat ditemukan pada tagihan atau konfirmasi pendaftaran Anda (Data disinkronkan langsung ke server pusat KOMINDO NETWORK)
            </p>
          </div>

          {/* Panduan Cara Melakukan Pembayaran */}
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-5 sm:p-8 border border-white/30 mt-8 mb-8 shadow-xl text-white animate-fade-in">
            <h3 className="font-bold text-lg sm:text-2xl mb-4 sm:mb-6 flex items-center text-yellow-400 text-shadow">
              <i className="fas fa-play-circle mr-2 sm:mr-3 animate-pulse text-yellow-400"></i>
              Panduan Cara Melakukan Pembayaran
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* Kolom Kiri: Video Tutorial / YouTube Channel */}
              <div className="lg:col-span-5 w-full flex flex-col gap-4">
                <div className="w-full max-w-[340px] mx-auto bg-slate-950/85 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 p-2.5 backdrop-blur-md animate-fade-in flex flex-col">
                  {/* Video Player Box */}
                  <div className="relative aspect-[9/16] w-full rounded-xl overflow-hidden bg-black shadow-inner">
                    <video
                      src="/assets/mp4/tutorial.mp4"
                      controls
                      playsInline
                      className="absolute inset-0 w-full h-full object-contain"
                    >
                      Browser Anda tidak mendukung pemutaran video HTML5 secara langsung. Silakan unggah video Anda ke `/public/assets/mp4/tutorial.mp4`.
                    </video>
                  </div>
                  
                  {/* Video Details */}
                  <div className="p-3 text-center flex flex-col gap-1.5">
                    <span className="text-white font-extrabold text-xs tracking-wider uppercase text-yellow-400 flex items-center justify-center gap-1.5">
                      <i className="fas fa-file-video"></i> Pemutar Video Tutorial
                    </span>
                    <p className="text-[11px] text-slate-300 font-medium">
                      Silakan putar video tutorial di atas untuk panduan langkah demi langkah melakukan pembayaran.
                    </p>
                  </div>
                </div>

                {/* Fitur YouTube di bawah yang Buka YouTube */}
                <div className="w-full max-w-[340px] mx-auto bg-gradient-to-br from-red-950/45 to-rose-950/50 border border-red-500/30 rounded-2xl p-4 text-center backdrop-blur-sm shadow-xl">
                  <span className="block text-[10px] font-extrabold text-red-400 tracking-wider uppercase mb-1 flex items-center justify-center gap-1.5">
                    <i className="fab fa-youtube text-red-500"></i> Video Panduan YouTube
                  </span>
                  <p className="text-[11px] text-slate-200 mb-3 font-medium leading-relaxed">
                    Atau tonton video tutorial singkat di channel YouTube kami untuk panduan interaktif lainnya.
                  </p>
                  <a
                    href={youtubeLink || "https://youtube.com/@komindo_network?si=uM1XCOSYa72IKZ6y"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-xl text-xs font-bold shadow-md transition-all items-center justify-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <i className="fab fa-youtube"></i> Tonton di YouTube
                  </a>
                </div>
              </div>

              {/* Kolom Kanan: Langkah-langkah detail */}
              <div className="lg:col-span-7 flex flex-col gap-4 text-sm font-medium">
                <div className="bg-white/10 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
                  <h4 className="text-yellow-300 font-bold text-base mb-3 flex items-center gap-2">
                    <i className="fas fa-list-ol"></i> Langkah-Langkah Pembayaran:
                  </h4>
                  <ul className="space-y-3.5 text-xs sm:text-sm leading-relaxed">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-400 text-sky-950 font-extrabold flex items-center justify-center text-xs sm:text-sm">1</span>
                      <div>
                        <strong>Kunjungi Halaman Tagihan</strong>: Klik tombol <span className="text-yellow-300 font-semibold">Cek Tagihan</span> di atas atau akses langsung link pembayaran Anda.
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-400 text-sky-950 font-extrabold flex items-center justify-center text-xs sm:text-sm">2</span>
                      <div>
                        <strong>Masukkan ID Pelanggan</strong>: Isikan ID Pelanggan Anda (Contoh: <code className="bg-white/20 px-1.5 py-0.5 rounded text-yellow-300 font-mono text-[11px]">PL.010.KOMINDO.NET.001</code>) dan klik <strong className="text-yellow-300">Bayar</strong>.
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-400 text-sky-950 font-extrabold flex items-center justify-center text-xs sm:text-sm">3</span>
                      <div>
                        <strong>Pilih Bulan Pembayaran</strong>: Pada tabel rincian tagihan, pilih tombol pembayaran sesuai bulan yang ingin Anda lunasi. <span className="text-rose-300 font-bold">*Pastikan bulan yang Anda pilih sudah benar!*</span>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-400 text-sky-950 font-extrabold flex items-center justify-center text-xs sm:text-sm">4</span>
                      <div>
                        <strong>Pilih Metode QRIS</strong>: Untuk pembayaran paling instan dan praktis, direkomendasikan memilih metode pembayaran <strong className="text-yellow-300">QRIS</strong>.
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 h-fit min-h-6 w-6 rounded-full bg-yellow-400 text-sky-950 font-extrabold flex items-center justify-center text-xs sm:text-sm">5</span>
                      <div>
                        <strong>Ambil Tangkapan Layar (Screenshot)</strong>: Ambil screenshot dari layar HP Anda tepat pada bagian Barcode QRIS / Kode QR yang muncul.
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 h-fit min-h-6 w-6 rounded-full bg-yellow-400 text-sky-950 font-extrabold flex items-center justify-center text-xs sm:text-sm">6</span>
                      <div>
                        <strong>Buka Aplikasi Pembayaran</strong>: Buka e-wallet favorit Anda (seperti GoPay, OVO, ShopeePay, DANA, LinkAja) atau aplikasi Mobile Banking Anda yang mendukung pembayaran QRIS.
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 h-fit min-h-6 w-6 rounded-full bg-yellow-400 text-sky-950 font-extrabold flex items-center justify-center text-xs sm:text-sm">7</span>
                      <div>
                        <strong>Scan dari Galeri & Bayar</strong>: Pilih fitur Scan/Bayar QRIS, ketuk <strong className="text-yellow-300">ikon galeri/upload foto</strong>, pilih gambar screenshot barcode tadi, konfirmasi nominal tagihan, masukkan PIN Anda dan transaksi selesai!
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 lg:gap-8 justify-center mt-8">
            <div className="text-center bg-black/30 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/30 shadow-xl min-w-[120px]">
              <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white text-shadow-lg">50+</div>
              <div className="text-xs sm:text-sm text-white font-bold text-shadow">Area Coverage</div>
            </div>
            <div className="text-center bg-black/30 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/30 shadow-xl min-w-[120px]">
              <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white text-shadow-lg">99.9%</div>
              <div className="text-xs sm:text-sm text-white font-bold text-shadow">Uptime</div>
            </div>
            <div className="text-center bg-black/30 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/30 shadow-xl min-w-[120px]">
              <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white text-shadow-lg">Call Center</div>
              <div className="text-xs sm:text-sm text-white font-bold text-shadow">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Mengapa Memilih KOMINDO NETWORK?
            </h2>
            <p className="text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto font-medium">
              Kami berkomitmen memberikan layanan internet terbaik dengan teknologi terdepan dan dukungan pelanggan yang luar biasa.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg card-hover">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-sky-500 to-sky-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <i className="fas fa-bolt text-white text-lg sm:text-2xl"></i>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-gray-900">Kecepatan Tinggi</h3>
              <p className="text-gray-700 leading-relaxed font-medium text-sm sm:text-base">
                Nikmati kecepatan download hingga 1 Gbps dengan teknologi fiber optik terbaru. Perfect untuk streaming 4K dan gaming online.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg card-hover">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-sky-500 to-sky-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <i className="fas fa-shield-alt text-white text-lg sm:text-2xl"></i>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-gray-900">Jaringan Stabil</h3>
              <p className="text-gray-700 leading-relaxed font-medium text-sm sm:text-base">
                Uptime 99.9% dengan redundant network infrastructure. Tidak ada lag atau putus koneksi saat sedang penting.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg card-hover">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-sky-500 to-sky-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <i className="fas fa-headset text-white text-lg sm:text-2xl"></i>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-gray-900">Support Teknis dan Admin</h3>
              <p className="text-gray-700 leading-relaxed font-medium text-sm sm:text-base">
                Tim teknis berpengalaman siap membantu Anda kapan saja. Chat, call, atau WhatsApp - respons cepat.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg card-hover">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-sky-500 to-sky-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <i className="fas fa-dollar-sign text-white text-lg sm:text-2xl"></i>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-gray-900">Harga Terjangkau</h3>
              <p className="text-gray-700 leading-relaxed font-medium text-sm sm:text-base">
                Paket internet dengan harga kompetitif mulai dari Rp 200K/bulan tanpa biaya tersembunyi.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg card-hover">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-sky-500 to-sky-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <i className="fas fa-tools text-white text-lg sm:text-2xl"></i>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-gray-900">Instalasi Cepat</h3>
              <p className="text-gray-700 leading-relaxed font-medium text-sm sm:text-base">
                Pemasangan dan konfigurasi oleh teknisi berpengalaman. Siap digunakan dalam 24 jam setelah pendaftaran.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg card-hover">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-sky-500 to-sky-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <i className="fas fa-wifi text-white text-lg sm:text-2xl"></i>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-gray-900">WiFi Router Premium</h3>
              <p className="text-gray-700 leading-relaxed font-medium text-sm sm:text-base">
                Router WiFi dengan coverage luas hingga 200m². Support banyak perangkat sekaligus tanpa hambatan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Pilih Paket Sesuai Kebutuhan
            </h2>
            <p className="text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto font-medium">
              Paket internet fleksibel untuk rumah, bisnis, dan enterprise. Semua paket sudah termasuk instalasi gratis dan router WiFi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {packages.map((pkg) => {
              const isPop = !!pkg.isPopular;
              const link = pkg.orderLink || "https://wa.me/6282181144800";
              const targetWaLink = getWhatsAppWithText(link, `${pkg.name} (${pkg.speed || "Internet"})`, pkg.price);

              return (
                <div
                  key={pkg.id}
                  className={`rounded-2xl p-6 sm:p-8 card-hover relative flex flex-col justify-between transition-all ${
                    isPop
                      ? "bg-gradient-to-b from-sky-500 to-sky-600 text-white shadow-xl border-2 border-sky-400"
                      : "bg-white border-2 border-slate-200 text-gray-900 shadow-sm"
                  }`}
                >
                  {(pkg.badge || isPop) && (
                    <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
                      <span
                        className={`px-3.5 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-bold shadow-sm ${
                          isPop ? "bg-yellow-400 text-gray-900" : "bg-sky-600 text-white"
                        }`}
                      >
                        {pkg.badge || "Paling Populer"}
                      </span>
                    </div>
                  )}

                  <div className={`text-center mb-6 sm:mb-8 ${pkg.badge || isPop ? "mt-2" : ""}`}>
                    <h3 className={`text-xl sm:text-2xl font-bold mb-2 ${isPop ? "text-white" : "text-gray-900"}`}>
                      {pkg.name}
                    </h3>
                    <div className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 ${isPop ? "text-white" : "text-gray-900"}`}>
                      {pkg.price}
                      <span className={`text-sm sm:text-base lg:text-lg font-medium ${isPop ? "opacity-75" : "text-gray-600"}`}>
                        {pkg.period || "/bulan"}
                      </span>
                    </div>
                    {pkg.tagline && (
                      <p className={`font-medium text-sm sm:text-base ${isPop ? "opacity-90 text-white" : "text-gray-700"}`}>
                        {pkg.tagline}
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 flex-1">
                    {pkg.features && pkg.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start">
                        <i className={`fas fa-check mt-1 mr-3 flex-shrink-0 text-sm ${isPop ? "text-yellow-300" : "text-emerald-500"}`}></i>
                        <span className={`font-medium text-sm sm:text-base ${isPop ? "text-white" : "text-gray-800"}`}>
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={targetWaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-2.5 sm:py-3 rounded-full font-bold transition-all text-center block text-sm sm:text-base shadow-md cursor-pointer ${
                      isPop
                        ? "bg-white text-sky-600 hover:bg-gray-100"
                        : "bg-gray-900 text-white hover:bg-gray-800"
                    }`}
                  >
                    Pilih Paket
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Apa Kata Pelanggan Kami?
            </h2>
            <p className="text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto font-medium">
              Ribuan pelanggan telah merasakan pengalaman internet terbaik bersama KOMINDO NETWORK.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="flex text-yellow-400">
                  <i className="fas fa-star text-sm sm:text-base"></i>
                  <i className="fas fa-star text-sm sm:text-base"></i>
                  <i className="fas fa-star text-sm sm:text-base"></i>
                  <i className="fas fa-star text-sm sm:text-base"></i>
                  <i className="fas fa-star text-sm sm:text-base"></i>
                </div>
              </div>
              <p className="text-gray-700 mb-4 sm:mb-6 leading-relaxed font-medium text-sm sm:text-base">
                Internet super cepat dan stabil! Gaming online jadi lancar banget, nggak ada lag sama sekali. Customer service juga responsif banget.
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-sky-500 to-sky-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                  AR
                </div>
                <div className="ml-3 sm:ml-4">
                  <div className="font-semibold text-gray-900 text-sm sm:text-base">Ahmad Rizki</div>
                  <div className="text-gray-600 font-medium text-xs sm:text-sm">Gamer &amp; Content Creator</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="flex text-yellow-400">
                  <i className="fas fa-star text-sm sm:text-base"></i>
                  <i className="fas fa-star text-sm sm:text-base"></i>
                  <i className="fas fa-star text-sm sm:text-base"></i>
                  <i className="fas fa-star text-sm sm:text-base"></i>
                  <i className="fas fa-star text-sm sm:text-base"></i>
                </div>
              </div>
              <p className="text-gray-700 mb-4 sm:mb-6 leading-relaxed font-medium text-sm sm:text-base">
                WFH jadi nyaman banget pakai KOMINDO NETWORK. Video call Zoom HD tanpa buffering, upload file besar cuma butuh beberapa detik.
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-sky-500 to-sky-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                  SS
                </div>
                <div className="ml-3 sm:ml-4">
                  <div className="font-semibold text-gray-900 text-sm sm:text-base">Sari Sartika</div>
                  <div className="text-gray-600 font-medium text-xs sm:text-sm">Digital Marketing Manager</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="flex text-yellow-400">
                  <i className="fas fa-star text-sm sm:text-base"></i>
                  <i className="fas fa-star text-sm sm:text-base"></i>
                  <i className="fas fa-star text-sm sm:text-base"></i>
                  <i className="fas fa-star text-sm sm:text-base"></i>
                  <i className="fas fa-star text-sm sm:text-base"></i>
                </div>
              </div>
              <p className="text-gray-700 mb-4 sm:mb-6 leading-relaxed font-medium text-sm sm:text-base">
                Streaming Netflix 4K lancar jaya! Sekeluarga bisa internetan bareng tanpa lemot. Harga juga masuk akal untuk kualitas segini.
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-sky-500 to-sky-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                  BP
                </div>
                <div className="ml-3 sm:ml-4">
                  <div className="font-semibold text-gray-900 text-sm sm:text-base">Budi Prabowo</div>
                  <div className="text-gray-600 font-medium text-xs sm:text-sm">Kepala Keluarga</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-sky-500 to-sky-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-wifi text-white text-lg"></i>
                </div>
                <span className="text-2xl font-bold">KOMINDO NETWORK</span>
              </div>
              <p className="text-gray-200 mb-6 leading-relaxed font-medium">
                Penyedia layanan internet terpercaya dengan teknologi fiber optik terdepan. Memberikan koneksi stabil dan kecepatan tinggi untuk kebutuhan digital Anda.
              </p>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="w-10 h-10 bg-teal-600 hover:bg-teal-700 rounded-full flex items-center justify-center transition-colors"
                >
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-teal-500 hover:bg-teal-600 rounded-full flex items-center justify-center transition-colors"
                >
                  <i className="fab fa-twitter"></i>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-teal-600 hover:bg-teal-700 rounded-full flex items-center justify-center transition-colors"
                >
                  <i className="fab fa-instagram"></i>
                </a>
                <a
                  href="https://wa.me/6282181144800?text=Halo%20KOMINDO%20NETWORK%2C%20saya%20ingin%20menanyakan%20info%20layanan%20internet%20cepat%20dan%20stabil.%20Terima%20kasih!"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center transition-colors"
                >
                  <i className="fab fa-whatsapp"></i>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-6">Layanan</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-200 hover:text-white transition-colors font-medium">Internet Rumah</a>
                </li>
                <li>
                  <a href="#" className="text-gray-200 hover:text-white transition-colors font-medium">Internet Bisnis</a>
                </li>
                <li>
                  <a href="#" className="text-gray-200 hover:text-white transition-colors font-medium">Dedicated Line</a>
                </li>
                <li>
                  <a href="#" className="text-gray-200 hover:text-white transition-colors font-medium">Hosting &amp; Domain</a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-6">Kontak</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center">
                  <i className="fas fa-phone mr-3 text-teal-400"></i>
                  <span className="text-gray-200 font-medium">+6282181144800</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-envelope mr-3 text-teal-400"></i>
                  <span className="text-gray-200 font-medium">info@komindo.net</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-map-marker-alt mr-3 text-teal-400"></i>
                  <span className="text-gray-200 font-medium">Banyuasin, Indonesia</span>
                </li>
                <li className="flex items-center">
                  <i className="fab fa-whatsapp mr-3 text-green-400"></i>
                  <span className="text-gray-200 font-medium">+6282181144800</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-xs sm:text-sm text-center md:text-left">
                © 2026 KOMINDO NETWORK. All rights reserved.
              </p>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                <a href="#" className="text-gray-400 hover:text-white text-xs sm:text-sm transition-colors font-medium">Privacy Policy</a>
                <a href="#" className="text-gray-400 hover:text-white text-xs sm:text-sm transition-colors font-medium">Terms of Service</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Billing Modal */}
      <AnimatePresence>
        {billingModalOpen && billingDetails && (
          <motion.div
            id="billing-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setBillingModalOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.93, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.93, y: 15, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setBillingModalOpen(false)}
                className="absolute top-4 right-4 text-white/85 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 z-10 cursor-pointer"
                aria-label="Tutup modal"
              >
                <i className="fas fa-times text-lg"></i>
              </button>

              {/* Header */}
              <div className="bg-gradient-to-br from-teal-500 to-teal-700 px-6 py-6 text-center text-white relative">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-md border border-white/20">
                  <i className="fas fa-file-invoice-dollar text-white text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold tracking-tight">Rincian Tagihan Anda</h3>
                <p className="text-teal-100 text-xs mt-1 font-medium">
                  {billingDetails.dueDate ? `Jatuh Tempo: ${billingDetails.dueDate}` : "Periode Layanan: Juli 2026"}
                </p>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 bg-slate-50/50">
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold uppercase">No. Tagihan</span>
                    <span className="text-xs font-mono text-slate-800 font-bold">{billingDetails.invoiceNo}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold uppercase">ID Pelanggan</span>
                    <span className="text-xs font-mono text-slate-800 font-bold">{billingDetails.id}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold uppercase">Nama</span>
                    <span className="text-xs text-slate-800 font-bold">{billingDetails.name}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold uppercase">Paket</span>
                    <span className="text-xs text-slate-800 font-bold">{billingDetails.packageType}</span>
                  </div>
                  {billingDetails.dueDate && (
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-xs text-rose-500 font-bold uppercase">Jatuh Tempo</span>
                      <span className="text-xs text-rose-600 font-extrabold">{billingDetails.dueDate}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-semibold uppercase">Status</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full text-rose-600 bg-rose-50 border border-rose-100 font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span> Belum Dibayar
                    </span>
                  </div>
                </div>

                {/* Pricing details */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-2.5 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Biaya Berlangganan</span>
                    <span className="font-semibold text-slate-800">Rp {billingDetails.amount.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Biaya Administrasi</span>
                    <span className="font-semibold text-slate-800">Rp {billingDetails.adminFee.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between pt-2.5 border-t-2 border-dashed border-slate-100 text-slate-800 font-bold text-base">
                    <span>Total Bayar</span>
                    <span className="text-teal-600">Rp {billingDetails.total.toLocaleString("id-ID")}</span>
                  </div>
                </div>

                {/* Receipt Upload Container */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
                  <span className="block text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <i className="fas fa-file-invoice text-teal-600"></i> Unggah Bukti Pembayaran (.PNG / .JPG)
                  </span>
                  {uploadedReceiptUrl || billingDetails.receipt_url ? (
                    <div className="space-y-2 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                      <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
                        <i className="fas fa-check-circle"></i>
                        <span>Bukti Pembayaran Berhasil Terunggah!</span>
                      </div>
                      <a 
                        href={uploadedReceiptUrl || billingDetails.receipt_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-center py-1.5 px-3 rounded-lg text-xs font-bold block transition-colors"
                      >
                        <i className="fas fa-eye mr-1.5"></i> Lihat Bukti Pembayaran
                      </a>
                      <button
                        onClick={() => {
                          setUploadedReceiptUrl("");
                          setBillingDetails({
                            ...billingDetails,
                            receipt_url: undefined
                          });
                        }}
                        className="text-[10px] text-slate-400 hover:text-rose-500 font-bold block text-center mx-auto hover:underline cursor-pointer"
                      >
                        <i className="fas fa-redo mr-1"></i> Unggah Ulang File Lain
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative border-2 border-dashed border-slate-200 hover:border-teal-400 hover:bg-teal-50/5 rounded-xl p-4 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[100px] group">
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg"
                          onChange={handleReceiptUploadChange}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                        <i className="fas fa-camera text-slate-400 group-hover:scale-110 transition-transform text-lg mb-1"></i>
                        <p className="text-[11px] font-bold text-slate-600">Pilih / Foto Bukti Transfer</p>
                        <p className="text-[9px] text-slate-400">Format PNG, JPEG, JPG (Maks. 10MB)</p>
                      </div>
                      {receiptUploadError && (
                        <p className="text-[10px] text-rose-500 font-bold text-center bg-rose-50 border border-rose-100 p-2 rounded-xl">
                          <i className="fas fa-exclamation-triangle mr-1"></i> {receiptUploadError}
                        </p>
                      )}
                      {isUploadingReceipt && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 justify-center py-1 bg-slate-50 rounded-xl border border-slate-100 animate-pulse">
                          <i className="fas fa-spinner animate-spin text-teal-500"></i>
                          <span>Mengunggah bukti ke server...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer/Action */}
              <div className="p-6 bg-white border-t border-slate-100 flex flex-col gap-3">
                <a
                  href={paymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3 rounded-full font-bold hover:shadow-lg transition-all duration-300 text-center block text-sm sm:text-base transform hover:scale-[1.02] active:scale-[0.98] animate-pulse"
                >
                  <i className="fas fa-credit-card mr-2"></i>
                  Bayar Sekarang
                </a>
                
                {/* Payment Sandbox Testing Section (Production & VPS Ready) */}
                <div className="mt-1 pt-3 border-t border-slate-100">
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2 text-center">
                    ⚙️ Sandbox Pengujian Transaksi & Auto WA Gateway
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      disabled={isSimulatingPayment}
                      onClick={() => handleSimulatePayment("success")}
                      className="bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white py-2 rounded-xl text-xs font-bold transition-all shadow-sm border border-emerald-100 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <i className="fas fa-check-circle"></i> Bayar Sukses
                    </button>
                    <button
                      disabled={isSimulatingPayment}
                      onClick={() => handleSimulatePayment("failed")}
                      className="bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white py-2 rounded-xl text-xs font-bold transition-all shadow-sm border border-rose-100 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <i className="fas fa-times-circle"></i> Bayar Gagal
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-center text-slate-400 font-medium flex items-center justify-center gap-1.5 mt-1">
                  <i className="fas fa-lock text-emerald-500"></i> Sistem Pembayaran Aman &amp; Terenkripsi
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Login Modal */}
      <AnimatePresence>
        {adminLoginModalOpen && (
          <motion.div
            id="admin-login-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setAdminLoginModalOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.93, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.93, y: 15, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-100 relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setAdminLoginModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-50 z-10 cursor-pointer"
                aria-label="Tutup login"
              >
                <i className="fas fa-times text-lg"></i>
              </button>

              {/* Header */}
              <div className="bg-gradient-to-br from-slate-800 to-sky-950 px-6 py-6 text-center text-white relative">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/10 shadow-inner">
                  <i className="fas fa-user-shield text-white text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold tracking-tight">Login Administrator</h3>
                <p className="text-slate-300 text-xs mt-1 font-medium font-sans">
                  Masukkan kredensial admin KOMINDO
                </p>
              </div>

              {/* Body */}
              <form onSubmit={handleAdminLogin} className="p-6 space-y-4">
                {adminError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold flex items-center gap-2 animate-shake">
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>{adminError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Username</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                      <i className="fas fa-user text-xs"></i>
                    </span>
                    <input
                      type="text"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="admin"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      className="pl-9 pr-4 py-2.5 w-full rounded-xl border-2 border-slate-200 focus:border-slate-800 focus:outline-none text-sm font-semibold text-slate-800"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                      <i className="fas fa-lock text-xs"></i>
                    </span>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      className="pl-9 pr-4 py-2.5 w-full rounded-xl border-2 border-slate-200 focus:border-slate-800 focus:outline-none text-sm font-semibold text-slate-800"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl font-bold transition-all shadow hover:shadow-lg text-xs uppercase cursor-pointer"
                >
                  Login Sekarang
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* RESTORE & RECOVERY MODAL */}
      {restoreModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-xl border border-slate-100 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <i className="fas fa-file-import text-indigo-600"></i> Restore & Disaster Recovery
              </h4>
              <button
                onClick={() => {
                  setRestoreModalOpen(false);
                  setRestoreFileData(null);
                  setSelectedBackupForRestore(null);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            {/* Source Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                Pilih Berkas Backup (.json) Dari Komputer:
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleBackupFileUpload}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-slate-200 rounded-xl p-2 bg-slate-50"
              />

              {selectedBackupForRestore && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-900 font-medium">
                  <i className="fas fa-check-circle mr-1 text-indigo-600"></i> Menggunakan snapshot riwayat: <strong>{restoreFileName}</strong>
                </div>
              )}

              {restoreFileData && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 space-y-2 text-xs">
                  <span className="font-bold text-emerald-900 block uppercase tracking-wide">
                    Preview Data Berkas Backup Valid:
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-2 rounded-xl border border-emerald-100">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Pelanggan</span>
                      <span className="text-base font-extrabold text-slate-800">
                        {restoreFileData.data?.customers?.length || restoreFileData.customers?.length || 0}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-emerald-100">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Kata Kunci</span>
                      <span className="text-base font-extrabold text-slate-800">
                        {restoreFileData.data?.botKeywords?.length || restoreFileData.botKeywords?.length || 0}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-emerald-100">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Tanggal Export</span>
                      <span className="text-[11px] font-bold text-slate-800 block truncate">
                        {restoreFileData.exportDate ? new Date(restoreFileData.exportDate).toLocaleDateString("id-ID") : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mode Restore */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                Metode Pemulihan Data:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`border rounded-2xl p-3 cursor-pointer transition-all flex flex-col gap-1 ${
                  restoreMode === "overwrite" ? "border-rose-500 bg-rose-50/40 shadow-sm" : "border-slate-200 bg-white"
                }`}>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="restoreMode"
                      value="overwrite"
                      checked={restoreMode === "overwrite"}
                      onChange={() => setRestoreMode("overwrite")}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-xs font-bold text-slate-800">OVERWRITE (Disaster Recovery)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 pl-5">
                    Gantikan seluruh data database saat ini dengan data dari backup ini. (Rekomendasi pemulihan penuh).
                  </p>
                </label>

                <label className={`border rounded-2xl p-3 cursor-pointer transition-all flex flex-col gap-1 ${
                  restoreMode === "merge" ? "border-indigo-500 bg-indigo-50/40 shadow-sm" : "border-slate-200 bg-white"
                }`}>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="restoreMode"
                      value="merge"
                      checked={restoreMode === "merge"}
                      onChange={() => setRestoreMode("merge")}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-800">MERGE (Gabungkan Data)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 pl-5">
                    Gabungkan data backup dengan data yang sudah ada tanpa menghapus data baru.
                  </p>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRestoreModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={isRestoring || (!restoreFileData && !selectedBackupForRestore)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 shadow-sm"
              >
                {isRestoring && <i className="fas fa-spinner fa-spin"></i>}
                {isRestoring ? "Memulihkan..." : "Mulai Restore Data"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
