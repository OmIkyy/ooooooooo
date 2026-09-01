import { Customer } from "../db";

export interface MessageTemplateCategory {
  openings: string[];
  bridges: string[];
  notifications: string[];
  consequences: string[];
  ctas: string[];
  compliments: string[];
}

export interface MessageTemplatesConfig {
  h7: MessageTemplateCategory;
  h3: MessageTemplateCategory;
  h1: MessageTemplateCategory;
  h0: MessageTemplateCategory;
  overdue: MessageTemplateCategory;
  new_invoice: MessageTemplateCategory;
  payment_success: MessageTemplateCategory;
}

// Preset Indonesian message variations for high customization and natural variation
export const messageTemplates: MessageTemplatesConfig = {
  h7: {
    openings: [
      "Halo Kak [NAMA],",
      "Selamat pagi/siang Kak [NAMA],",
      "Hai pelanggan setia Komindo, Kak [NAMA],",
      "Permisi Kak [NAMA], semoga sehat selalu."
    ],
    bridges: [
      "Kami ingin menginformasikan mengenai status layanan internet Anda.",
      "Sekadar informasi berkala dari layanan pelanggan KOMINDO NETWORK.",
      "Berikut adalah pemberitahuan berkala terkait tagihan bulanan Anda."
    ],
    notifications: [
      "Layanan internet Anda dengan ID [ID] (Paket: [PAKET]) akan memasuki batas jatuh tempo dalam 7 hari lagi ([JATUH_TEMPO]).",
      "Masa aktif paket [PAKET] Anda dengan ID pelanggan [ID] akan berakhir dalam 7 hari kedepan pada tanggal [JATUH_TEMPO].",
      "Tagihan internet bulanan Anda untuk ID [ID] ([PAKET]) sebesar [BIAYA] akan jatuh tempo pada [JATUH_TEMPO]."
    ],
    consequences: [
      "Silakan lakukan pembayaran tepat waktu agar terhindar dari pemutusan koneksi otomatis oleh sistem.",
      "Pembayaran tepat waktu memastikan kenyamanan Anda dalam berselancar tanpa hambatan isolir.",
      "Kami menyarankan pembayaran sebelum tanggal jatuh tempo agar internet tetap lancar tanpa kendala."
    ],
    ctas: [
      "Anda dapat melakukan pembayaran langsung melalui tautan aman berikut: [LINK]",
      "Selesaikan pembayaran dengan mudah sekarang juga di: [LINK]",
      "Gunakan tautan resmi e-billing kami untuk pembayaran cepat: [LINK]"
    ],
    compliments: [
      "Terima kasih atas kepercayaan Anda menggunakan layanan internet KOMINDO NETWORK.",
      "Kami sangat bangga menjadi bagian dari aktivitas digital harian Anda.",
      "Hormat kami, Tim Customer Service KOMINDO NETWORK."
    ]
  },
  h3: {
    openings: [
      "Halo pelanggan setia, Kak [NAMA],",
      "Salam hangat Kak [NAMA],",
      "Hai Kak [NAMA], apa kabar hari ini?",
      "Permisi Kak [NAMA], mohon waktunya sebentar."
    ],
    bridges: [
      "Hanya ingin mengingatkan kembali terkait tagihan internet bulanan Anda.",
      "Kami mendeteksi tagihan Anda akan segera memasuki masa akhir aktif.",
      "Pemberitahuan ramah mengenai masa jatuh tempo layanan Wi-Fi Komindo."
    ],
    notifications: [
      "Tagihan internet bulanan ID [ID] ([PAKET]) senilai [BIAYA] akan segera jatuh tempo dalam 3 hari pada [JATUH_TEMPO].",
      "Sisa masa aktif layanan internet ID [ID] ([PAKET]) Anda adalah 3 hari lagi menuju jatuh tempo pada [JATUH_TEMPO].",
      "Masa tenggang untuk paket [PAKET] Anda dengan ID pelanggan [ID] tersisa 3 hari lagi ([JATUH_TEMPO])."
    ],
    consequences: [
      "Segera lakukan pembayaran sebelum jaringan terisolir otomatis oleh sistem pusat.",
      "Harap melunasi tagihan agar koneksi Wi-Fi di rumah/kantor Anda tidak terputus secara otomatis.",
      "Jangan tunda pembayaran untuk menghindari denda atau penonaktifan layanan internet."
    ],
    ctas: [
      "Silakan klik link pembayaran instan Anda di sini: [LINK]",
      "Selesaikan pembayaran tagihan Anda dengan aman melalui: [LINK]",
      "Pembayaran dapat diakses langsung melalui link e-billing: [LINK]"
    ],
    compliments: [
      "Terima kasih banyak atas perhatian dan kerja samanya.",
      "Kami berkomitmen memberikan koneksi internet terbaik untuk Anda.",
      "Salam sukses, KOMINDO NETWORK."
    ]
  },
  h1: {
    openings: [
      "⚠️ *PENGINGAT PENTING* - Halo Kak [NAMA],",
      "⚠️ *H-1 SEBELUM ISOLIR* - Salam hangat Kak [NAMA],",
      "Halo Kak [NAMA], mohon perhatian mendesak terkait internet Anda,",
      "Selamat hari ini Kak [NAMA], peringatan penting untuk layanan Wi-Fi Anda,"
    ],
    bridges: [
      "Sistem kami mendeteksi bahwa masa aktif paket internet Anda akan berakhir besok.",
      "Ini adalah pengingat terakhir sebelum sistem melakukan penonaktifan otomatis.",
      "Kami ingin memastikan Anda tidak mengalami gangguan konektivitas besok."
    ],
    notifications: [
      "Tagihan internet bulanan ID [ID] (Paket: [PAKET]) sebesar [BIAYA] akan jatuh tempo BESOK tanggal [JATUH_TEMPO].",
      "Layanan internet bulanan Anda dengan ID pelanggan [ID] akan dinonaktifkan besok ([JATUH_TEMPO]) karena belum ada pembayaran masuk.",
      "Masa tenggang pembayaran paket [PAKET] Anda akan ditutup besok pagi pada [JATUH_TEMPO]."
    ],
    consequences: [
      "Mohon lakukan pembayaran hari ini agar sistem tidak melakukan isolir otomatis besok pagi.",
      "Apabila belum dibayar hingga besok pagi, koneksi internet Anda akan terputus secara otomatis oleh sistem pusat.",
      "Hindari isolir otomatis jaringan internet Anda dengan melunasi tagihan sebelum malam ini."
    ],
    ctas: [
      "Link pembayaran aman Anda: [LINK]",
      "Selesaikan pembayaran instan sekarang melalui: [LINK]",
      "Silakan bayar melalui sistem e-billing resmi kami: [LINK]"
    ],
    compliments: [
      "Terima kasih atas kerja sama dan pengertiannya.",
      "Hormat kami, Tim Billing KOMINDO NETWORK.",
      "Jika Anda sudah membayar, mohon abaikan pesan ini atau unggah bukti bayar."
    ]
  },
  h0: {
    openings: [
      "🚨 *Batas Akhir Hari Ini!* - Halo Kak [NAMA],",
      "🚨 *HARI H JATUH TEMPO* - Salam penting Kak [NAMA],",
      "Halo Kak [NAMA], mohon segera merespon pesan darurat ini,"
    ],
    bridges: [
      "Hari ini adalah batas waktu terakhir pembayaran internet bulanan Anda.",
      "Hari ini layanan internet Anda telah mencapai batas akhir masa aktif.",
      "Mohon segera lakukan tindakan pembayaran agar koneksi tidak langsung terputus."
    ],
    notifications: [
      "Hari ini ([JATUH_TEMPO]) adalah batas akhir pembayaran tagihan internet ID [ID] ([PAKET]) sebesar [BIAYA].",
      "Masa aktif internet ID pelanggan [ID] (Paket [PAKET]) resmi berakhir hari ini ([JATUH_TEMPO]).",
      "Tagihan bulanan Anda senilai [BIAYA] telah mencapai hari H jatuh tempo hari ini ([JATUH_TEMPO])."
    ],
    consequences: [
      "Mohon segera selesaikan pembayaran untuk menghindari pemutusan jaringan otomatis oleh sistem hari ini.",
      "Jika pembayaran tidak diterima hari ini, sistem e-billing akan mematikan port internet Anda secara otomatis.",
      "Koneksi Wi-Fi akan langsung terisolir jika tagihan belum terbayar hari ini."
    ],
    ctas: [
      "Akses link pembayaran instan Anda sekarang: [LINK]",
      "Bayar segera melalui tautan resmi ini: [LINK]",
      "Gunakan link ini untuk melunasi tagihan secara real-time: [LINK]"
    ],
    compliments: [
      "Terima kasih banyak atas perhatian cepat Anda.",
      "Salam hangat, Layanan Pelanggan KOMINDO NETWORK.",
      "Jika ada kendala dalam pembayaran, segera hubungi admin kami."
    ]
  },
  overdue: {
    openings: [
      "❌ *LAYANAN INTERNET DIISOLIR* - Halo Kak [NAMA],",
      "❌ *PERINGATAN OVERDUE* - Salam Kak [NAMA],",
      "Halo Kak [NAMA], mohon maaf koneksi internet Anda saat ini terhambat,"
    ],
    bridges: [
      "Kami menginformasikan bahwa tagihan internet bulanan Anda telah melewati batas waktu pembayaran.",
      "Sistem mendeteksi adanya keterlambatan pembayaran yang menyebabkan isolir aktif.",
      "Layanan internet Anda saat ini telah ditangguhkan sementara oleh sistem pusat."
    ],
    notifications: [
      "Layanan internet bulanan ID [ID] (Paket: [PAKET]) saat ini berstatus OVERDUE (Menunggak) sejak jatuh tempo ([JATUH_TEMPO]).",
      "Tagihan internet Anda senilai [BIAYA] untuk ID pelanggan [ID] ([PAKET]) telah melewati jatuh tempo pada [JATUH_TEMPO].",
      "Akun internet ID [ID] terdeteksi belum melunasi tagihan bulanan [BIAYA] yang jatuh tempo pada [JATUH_TEMPO]."
    ],
    consequences: [
      "Koneksi internet Anda dinonaktifkan sementara (diisolir) dan akan aktif kembali secara otomatis setelah pembayaran sukses.",
      "Untuk dapat kembali menggunakan layanan internet, harap segera melunasi tunggakan Anda.",
      "Isolir internet akan terbuka secara otomatis 1 menit setelah transaksi pembayaran diverifikasi sukses."
    ],
    ctas: [
      "Silakan lakukan pelunasan instan melalui link berikut: [LINK]",
      "Bayar tunggakan Anda sekarang untuk mengaktifkan kembali internet: [LINK]",
      "Link e-billing pelunasan cepat: [LINK]"
    ],
    compliments: [
      "Terima kasih atas pengertian dan kerja sama yang baik.",
      "Hormat kami, Tim Support & Billing KOMINDO NETWORK.",
      "Abaikan pesan ini jika Anda baru saja menyelesaikan pembayaran."
    ]
  },
  new_invoice: {
    openings: [
      "🆕 *TAGIHAN BARU TELAH TERBIT* - Halo Kak [NAMA],",
      "🆕 *NOTIFIKASI E-BILLING* - Salam hangat Kak [NAMA],",
      "Halo Kak [NAMA], semoga hari Anda menyenangkan,"
    ],
    bridges: [
      "Tagihan internet bulanan KOMINDO NETWORK Anda untuk periode baru telah diterbitkan.",
      "Berikut adalah rincian tagihan berlangganan internet Anda yang baru saja dibuat.",
      "Kami telah memperbarui rincian akun pembayaran layanan internet Anda."
    ],
    notifications: [
      "Tagihan internet dengan ID [ID] (Paket: [PAKET]) sebesar [BIAYA] telah diterbitkan dengan tanggal jatuh tempo [JATUH_TEMPO].",
      "Akun e-billing ID pelanggan [ID] untuk paket [PAKET] telah menerbitkan tagihan senilai [BIAYA] jatuh tempo [JATUH_TEMPO].",
      "Rincian tagihan internet Anda: ID pelanggan [ID], Paket [PAKET], nominal [BIAYA] jatuh tempo pada [JATUH_TEMPO]."
    ],
    consequences: [
      "Anda dapat melakukan pembayaran lebih awal untuk memastikan kelancaran koneksi internet bulanan tanpa terputus.",
      "Harap lakukan pembayaran sebelum tanggal jatuh tempo tersebut agar layanan tetap lancar.",
      "Pembayaran awal sangat membantu menjaga keandalan jaringan Wi-Fi Anda."
    ],
    ctas: [
      "Detail tagihan dan link pembayaran aman Anda: [LINK]",
      "Lakukan pembayaran mudah dan cepat langsung di: [LINK]",
      "Gunakan tautan resmi e-billing KOMINDO: [LINK]"
    ],
    compliments: [
      "Terima kasih telah setia menggunakan layanan internet cepat KOMINDO NETWORK.",
      "Kami berkomitmen menghadirkan koneksi tanpa batas untuk kenyamanan Anda.",
      "Salam hangat, Manajemen KOMINDO NETWORK."
    ]
  },
  payment_success: {
    openings: [
      "💚 *PEMBAYARAN BERHASIL (LUNAS)* - Halo Kak [NAMA],",
      "💚 *TERIMA KASIH (SUKSES BAYAR)* - Salam hangat Kak [NAMA],",
      "Halo Kak [NAMA], konfirmasi pembayaran masuk,"
    ],
    bridges: [
      "Sistem kami telah berhasil menerima dan memverifikasi dana pembayaran Anda.",
      "Terima kasih atas pembayaran tagihan internet bulanan Anda yang telah sukses diproses.",
      "Dana pembayaran tagihan Anda telah terverifikasi secara real-time oleh sistem."
    ],
    notifications: [
      "Pembayaran internet ID [ID] (Paket: [PAKET]) sebesar [BIAYA] dinyatakan LUNAS/SUKSES.",
      "Transaksi e-billing untuk ID pelanggan [ID] ([PAKET]) senilai [BIAYA] telah resmi terbayarkan.",
      "Pembayaran tagihan Anda untuk ID [ID] ([PAKET]) jatuh tempo [JATUH_TEMPO] telah diterima dengan sukses."
    ],
    consequences: [
      "Status layanan internet Anda kini aktif kembali (jika sempat terisolir) / jaringan tetap aktif dengan status LUNAS.",
      "Koneksi internet Anda kini berstatus AKTIF dan lancar untuk 1 bulan kedepan. Selamat menikmati internet cepat!",
      "Sistem e-billing telah memperpanjang masa aktif Wi-Fi Anda secara otomatis untuk periode berikutnya."
    ],
    ctas: [
      "Anda dapat melihat riwayat transaksi Anda melalui tautan e-billing: [LINK]",
      "Simpan notifikasi pembayaran ini sebagai bukti pelunasan sah Anda.",
      "Tautan dashboard pelanggan Anda: [LINK]"
    ],
    compliments: [
      "Terima kasih atas kerja sama berharga Anda dengan melakukan pembayaran tepat waktu.",
      "Selamat menikmati internet stabil dari KOMINDO NETWORK!",
      "Salam hangat dan sukses selalu, KOMINDO NETWORK."
    ]
  }
};

/**
 * Derives price/biaya from customer package name string.
 */
export function getCustomerBiaya(packageName: string): string {
  const pkgLower = (packageName || "").toLowerCase();
  if (pkgLower.includes("basic") || pkgLower.includes("200") || pkgLower.includes("20 mbps")) {
    return "Rp 200.000";
  }
  if (pkgLower.includes("silver") || pkgLower.includes("250") || pkgLower.includes("30 mbps")) {
    return "Rp 250.000";
  }
  if (pkgLower.includes("gold") || pkgLower.includes("300") || pkgLower.includes("50 mbps")) {
    return "Rp 300.000";
  }
  // Extract digits
  const numbers = pkgLower.replace(/[^0-9]/g, "");
  if (numbers.length >= 5) {
    const numVal = parseInt(numbers, 10);
    return "Rp " + numVal.toLocaleString("id-ID");
  } else if (numbers.length >= 3) {
    const numVal = parseInt(numbers, 10) * 1000;
    return "Rp " + numVal.toLocaleString("id-ID");
  }
  return "Rp 200.000";
}

/**
 * Decodes/evaluates Spintax formatting: {option1|option2|option3}
 */
export function processSpintax(text: string): string {
  let processed = text || "";
  const spintaxPattern = /\{([^{}]+)\}/g;
  for (let i = 0; i < 5; i++) {
    if (!processed.includes("{") || !processed.includes("}")) break;
    processed = processed.replace(spintaxPattern, (match, options) => {
      const choices = options.split("|");
      const randomIndex = Math.floor(Math.random() * choices.length);
      return choices[randomIndex];
    });
  }
  return processed;
}

/**
 * Returns a randomly picked element from an array. Fallback if empty.
 */
function randomPick(arr: string[], fallback: string = ""): string {
  if (!arr || arr.length === 0) return fallback;
  const index = Math.floor(Math.random() * arr.length);
  return arr[index];
}

/**
 * Generates a high-variety randomized billing/reminder message for a customer.
 * Supports custom categories: openings, bridges, notifications, consequences, ctas, compliments.
 * Supports replace for standard curly bracket placeholders and square bracket placeholders.
 * 
 * @param customer Customer data object
 * @param reminderType Type of notification (h7, h3, h1, h0, overdue, new_invoice, payment_success)
 * @param customLink Optional payment link override (defaults to standard setting)
 */
export function generateReminderMessage(
  customer: Customer, 
  reminderType: "h7" | "h3" | "h1" | "h0" | "overdue" | "new_invoice" | "payment_success" | string,
  customLink?: string,
  customYoutubeLink?: string
): string {
  // Normalize types
  let typeKey: keyof MessageTemplatesConfig = "h1";
  const typeLower = (reminderType || "").toLowerCase();
  
  if (typeLower === "h7" || typeLower.includes("h-7")) {
    typeKey = "h7";
  } else if (typeLower === "h3" || typeLower.includes("h-3")) {
    typeKey = "h3";
  } else if (typeLower === "h1" || typeLower.includes("h-1")) {
    typeKey = "h1";
  } else if (typeLower === "h0" || typeLower === "h" || typeLower.includes("hari h")) {
    typeKey = "h0";
  } else if (typeLower === "overdue" || typeLower.includes("lewat") || typeLower.includes("tunggal")) {
    typeKey = "overdue";
  } else if (typeLower === "new" || typeLower === "new_invoice" || typeLower.includes("baru")) {
    typeKey = "new_invoice";
  } else if (typeLower === "success" || typeLower === "payment_success" || typeLower.includes("berhasil") || typeLower.includes("lunas")) {
    typeKey = "payment_success";
  }

  const category = messageTemplates[typeKey] || messageTemplates.h1;

  // Pick random sentences from each category
  const opening = randomPick(category.openings, "Halo Kak [NAMA],");
  const bridge = randomPick(category.bridges, "Berikut informasi tagihan internet bulanan Anda.");
  const notification = randomPick(category.notifications, "Tagihan internet bulanan Anda dengan ID [ID] ([PAKET]) senilai [BIAYA] jatuh tempo pada [JATUH_TEMPO].");
  const consequence = randomPick(category.consequences, "Silakan bayar sebelum jatuh tempo agar koneksi tetap aktif.");
  const cta = randomPick(category.ctas, "Selesaikan pembayaran aman di: [LINK]");
  const compliment = randomPick(category.compliments, "Terima kasih atas kepercayaannya. KOMINDO NETWORK.");

  // Build the unified layout with readable spacing
  let fullTemplate = `${opening}\n\n${bridge} ${notification}\n\n${consequence}\n\n${cta}\n\n${compliment}`;

  // Evaluate any spintax in the generated structure
  fullTemplate = processSpintax(fullTemplate);

  // Resolve Customer Data
  const link = customLink || "https://e.ebilling.id/tagihan/?account=5379";
  const youtube = customYoutubeLink || "https://youtube.com/@komindo_network?si=uM1XCOSYa72IKZ6y";
  const biaya = getCustomerBiaya(customer.package);

  // Function to replace placeholders
  const replaceAllPlaceholders = (text: string): string => {
    return text
      // Curly placeholders
      .replace(/{nama}/gi, customer.name || "PELANGGAN")
      .replace(/{id}/gi, customer.id || "")
      .replace(/{paket}/gi, customer.package || "")
      .replace(/{biaya}/gi, biaya)
      .replace(/{jatuhTempo}/gi, customer.dueDate || "")
      .replace(/{linkPembayaran}/gi, link)
      .replace(/{link}/gi, link)
      .replace(/{youtubeLink}/gi, youtube)
      .replace(/{youtube}/gi, youtube)
      // Square placeholders
      .replace(/\[NAMA\]/g, customer.name || "PELANGGAN")
      .replace(/\[ID\]/g, customer.id || "")
      .replace(/\[PAKET\]/g, customer.package || "")
      .replace(/\[BIAYA\]/g, biaya)
      .replace(/\[JATUH_TEMPO\]/g, customer.dueDate || "")
      .replace(/\[LINK\]/g, link)
      .replace(/\[YOUTUBE\]/g, youtube)
      .replace(/\[YOUTUBE_LINK\]/g, youtube);
  };

  const finalMsg = replaceAllPlaceholders(fullTemplate);
  return finalMsg;
}
