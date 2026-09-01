import { whatsappManager } from "./whatsappManager";

export interface QueueItem {
  id: string;
  phone: string;
  message: string;
  timestamp: string;
  retries: number;
}

export interface WaLog {
  timestamp: string;
  type: "INFO" | "ERROR" | "SUCCESS";
  message: string;
  details?: string;
}

class WaGatewayService {
  private logs: WaLog[] = [];
  private maxLogs = 200;

  // Validate and clean phone numbers using basic rules (Indonesian formats)
  public validatePhoneNumber(phone: string): { isValid: boolean; cleaned: string; error?: string } {
    let cleaned = String(phone).trim().replace(/[^0-9]/g, "");
    if (!cleaned) {
      return { isValid: false, cleaned: "", error: "Nomor WhatsApp kosong atau tidak mengandung angka" };
    }
    
    // Normalize leading 0 or +62
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.substring(1);
    } else if (cleaned.startsWith("8")) {
      cleaned = "62" + cleaned;
    }

    if (cleaned.length < 9 || cleaned.length > 15) {
      return { isValid: false, cleaned, error: "Panjang nomor tidak valid (harus 9-15 digit)" };
    }

    return { isValid: true, cleaned };
  }

  // Check connection status of our default session
  public async checkStatus(): Promise<{ status: "online" | "offline"; message: string; details?: any }> {
    const session = whatsappManager.getSession("default");
    if (!session) {
      return { status: "offline", message: "Session default belum diinisialisasi" };
    }

    const isConnected = session.status === "connected";
    const msg = isConnected 
      ? `WhatsApp Gateway aktif & terhubung (${session.phoneNumber || "No HP"})`
      : `WhatsApp Gateway berstatus: ${session.status}`;

    return {
      status: isConnected ? "online" : "offline",
      message: msg,
      details: {
        id: session.id,
        status: session.status,
        phoneNumber: session.phoneNumber,
        name: session.name,
      }
    };
  }

  // Send a single message using real Baileys Session
  public async sendMessage(
    phone: string,
    message: string,
    _bypassQueue = false
  ): Promise<{ success: boolean; message: string; reason?: string; response?: any }> {
    const validation = this.validatePhoneNumber(phone);
    if (!validation.isValid) {
      const errText = validation.error || "Nomor telepon tidak valid";
      this.log("ERROR", `Nomor telepon tidak valid: ${phone}`, errText);
      return { success: false, reason: "invalid_number", message: `Nomor tidak valid: ${errText}` };
    }

    const res = await whatsappManager.sendMessage(validation.cleaned, message, "default");
    
    if (res.success) {
      this.log("SUCCESS", `Berhasil mengirim pesan ke ${validation.cleaned}`);
      return { success: true, message: "Pesan berhasil terkirim via Baileys", response: res.response };
    } else {
      const errMsg = res.error || "Gagal mengirim pesan via Baileys.";
      if (res.reason === "not_connected") {
        this.log("INFO", `[WA Gateway Offline] ${errMsg}`);
      } else {
        this.log("ERROR", `Gagal mengirim ke ${validation.cleaned}: ${errMsg}`);
      }
      return { success: false, reason: res.reason || "failed", message: errMsg };
    }
  }

  // Send bulk messages
  public async sendBulk(
    items: { phone: string; message: string }[]
  ): Promise<{ successCount: number; failedCount: number; queuedCount: number }> {
    let successCount = 0;
    let failedCount = 0;

    for (const item of items) {
      const res = await this.sendMessage(item.phone, item.message);
      if (res.success) {
        successCount++;
      } else {
        failedCount++;
      }
    }

    return {
      successCount,
      failedCount,
      queuedCount: 0
    };
  }

  // Fetch recent logs
  public getLogs(): WaLog[] {
    return this.logs;
  }

  // Empty queue fallback
  public getQueue(): QueueItem[] {
    return [];
  }

  // Logs helper
  public log(type: "INFO" | "ERROR" | "SUCCESS", message: string, details?: string) {
    const timestamp = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
    const logItem: WaLog = { timestamp, type, message, details };
    this.logs.unshift(logItem);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    console.log(`[WaGatewayService] [${timestamp}] [${type}] ${message} ${details ? `(${details})` : ""}`);
  }

  // Destroy dummy
  public destroy() {}
}

export const waGateway = new WaGatewayService();
