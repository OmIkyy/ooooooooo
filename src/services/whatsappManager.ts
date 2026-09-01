import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore
} from "@whiskeysockets/baileys";
import pino from "pino";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { dbService } from "../db";

const logger = pino({ level: "silent" });

export interface WhatsAppSession {
  id: string;
  status: "connecting" | "connected" | "disconnected";
  qr: string;
  phoneNumber: string | null;
  name: string | null;
  socket: any | null;
}

class WhatsAppManager {
  private sessions = new Map<string, WhatsAppSession>();
  private sessionsDir = path.join(process.cwd(), "sessions");

  constructor() {
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true });
    }
  }

  // Initialize and load all existing sessions from disk
  public async init() {
    console.log("📱 Initializing WhatsApp Session Manager...");
    try {
      const dirs = fs.readdirSync(this.sessionsDir, { withFileTypes: true });
      const sessionDirs = dirs
        .filter(d => d.isDirectory() && d.name.startsWith("session_"))
        .map(d => d.name.replace("session_", ""));

      // Always ensure the 'default' session folder exists or is initialized
      if (!sessionDirs.includes("default")) {
        sessionDirs.push("default");
      }

      console.log(`📂 Found ${sessionDirs.length} WhatsApp sessions to initialize:`, sessionDirs);

      for (const id of sessionDirs) {
        await this.createSession(id);
      }
    } catch (err: any) {
      console.error("❌ Failed to read sessions directory during init:", err.message);
    }
  }

  // Get status details of all active sessions
  public getAllSessions() {
    return Array.from(this.sessions.values()).map(s => ({
      id: s.id,
      status: s.status,
      qr: s.qr,
      phoneNumber: s.phoneNumber,
      name: s.name,
    }));
  }

  // Get status of a specific session
  public getSession(id: string): WhatsAppSession | undefined {
    return this.sessions.get(id);
  }

  // Create or reconnect a session
  public async createSession(id: string): Promise<WhatsAppSession> {
    // If session already connected, return it
    const existing = this.sessions.get(id);
    if (existing && existing.status === "connected" && existing.socket) {
      return existing;
    }

    console.log(`⚡ Creating/restarting WhatsApp session: "${id}"`);
    
    // Setup state
    const sessionPath = path.join(this.sessionsDir, `session_${id}`);
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }

    const credsFile = path.join(sessionPath, "creds.json");
    if (!fs.existsSync(credsFile)) {
      try {
        const savedCreds = await dbService.loadWaSessionFromSupabase(id);
        if (savedCreds) {
          console.log(`📥 Restoring WhatsApp session "${id}" credentials from Supabase DB...`);
          fs.writeFileSync(credsFile, savedCreds, "utf8");
        }
      } catch (err: any) {
        console.warn(`⚠️ Could not load WA session from Supabase for "${id}":`, err.message);
      }
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    
    const sock = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      printQRInTerminal: false,
      logger,
    });

    const session: WhatsAppSession = {
      id,
      status: "connecting",
      qr: "",
      phoneNumber: sock.user?.id ? sock.user.id.split(":")[0] : null,
      name: sock.user?.name || null,
      socket: sock,
    };

    this.sessions.set(id, session);

    // Save creds when updated & sync to Supabase for disaster recovery
    sock.ev.on("creds.update", async () => {
      await saveCreds();
      try {
        if (fs.existsSync(credsFile)) {
          const credsStr = fs.readFileSync(credsFile, "utf8");
          await dbService.saveWaSessionToSupabase(id, credsStr);
        }
      } catch (err: any) {
        // ignore sync error
      }
    });

    // Connection changes
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const qrBase64 = await QRCode.toDataURL(qr);
          session.qr = qrBase64;
          session.status = "connecting";
          console.log(`📸 New QR Code generated for session: "${id}"`);
        } catch (err: any) {
          console.error(`❌ Failed to generate QR Base64 for session "${id}":`, err.message);
        }
      }

      if (connection === "close") {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`🔌 Connection closed for session "${id}". Status Code: ${statusCode}. Will Reconnect: ${shouldReconnect}`);

        session.status = "disconnected";
        session.qr = "";
        session.socket = null;
        session.phoneNumber = null;
        session.name = null;

        if (shouldReconnect) {
          // Attempt automatic reconnection after a delay
          console.log(`🔄 Reconnecting session "${id}" in 5 seconds...`);
          setTimeout(() => {
            this.createSession(id);
          }, 5000);
        } else {
          // Explicitly logged out, remove session data
          console.log(`🗑️ Session "${id}" logged out. Clearing directory...`);
          this.deleteSessionFolder(id);
        }
      } else if (connection === "open") {
        console.log(`✅ WhatsApp session "${id}" is fully CONNECTED!`);
        session.status = "connected";
        session.qr = "";
        
        const userJid = sock.user?.id;
        session.phoneNumber = userJid ? userJid.split(":")[0].split("@")[0] : null;
        session.name = sock.user?.name || "WhatsApp Device";
      }
    });

    // Inbound Message Handler
    sock.ev.on("messages.upsert", async (m) => {
      if (m.type !== "notify") return;

      for (const msg of m.messages) {
        if (msg.key.fromMe) continue; // Skip messages sent by the bot itself

        const jid = msg.key.remoteJid;
        if (!jid || !jid.endsWith("@s.whatsapp.net")) continue;

        // Parse message content (supports text, captions, and extended text)
        let textContent = "";
        if (msg.message?.conversation) {
          textContent = msg.message.conversation;
        } else if (msg.message?.extendedTextMessage?.text) {
          textContent = msg.message.extendedTextMessage.text;
        } else if (msg.message?.imageMessage?.caption) {
          textContent = msg.message.imageMessage.caption;
        }

        if (!textContent) continue;

        const phone = jid.split("@")[0];
        console.log(`📥 [WhatsApp Session: "${id}"] Received from ${phone}: "${textContent}"`);

        // Forward to our local express auto-responder webhook
        try {
          const webhookSecret = process.env.WEBHOOK_SECRET || "default_secret";
          const webhookUrl = `http://127.0.0.1:3000/api/whatsapp/webhook`;
          
          await fetch(webhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-webhook-secret": webhookSecret,
            },
            body: JSON.stringify({
              sender: phone,
              message: textContent,
              secret: webhookSecret,
            }),
          });
        } catch (err: any) {
          console.error(`❌ Failed to forward message to local webhook:`, err.message);
        }
      }
    });

    return session;
  }

  // Logout/disconnect session
  public async logoutSession(id: string): Promise<boolean> {
    const session = this.sessions.get(id);
    if (!session) return false;

    console.log(`🔌 Logging out of session: "${id}"`);
    try {
      if (session.socket) {
        await session.socket.logout();
      }
    } catch (err: any) {
      console.warn(`⚠️ Warning: Failed to clean logout session "${id}":`, err.message);
    }

    session.status = "disconnected";
    session.qr = "";
    session.socket = null;
    session.phoneNumber = null;
    session.name = null;

    this.deleteSessionFolder(id);
    return true;
  }

  // Send message from specific session (or default to first connected one)
  public async sendMessage(
    phone: string, 
    text: string, 
    preferredSessionId = "default"
  ): Promise<{ success: boolean; message?: string; error?: string; reason?: "not_connected" | "not_registered" | "failed"; response?: any }> {
    let session = this.sessions.get(preferredSessionId);
    
    // If preferred session not connected, look for ANY connected session
    if (!session || session.status !== "connected" || !session.socket) {
      const activeSessions = Array.from(this.sessions.values()).filter(s => s.status === "connected" && s.socket);
      if (activeSessions.length > 0) {
        session = activeSessions[0];
        console.log(`ℹ️ Preferred session "${preferredSessionId}" not available. Using connected session "${session.id}" to send message.`);
      }
    }

    if (!session || session.status !== "connected" || !session.socket) {
      console.error(`❌ Cannot send message. No active connected WhatsApp sessions found!`);
      return {
        success: false,
        reason: "not_connected",
        error: "WhatsApp Gateway belum terhubung. Silakan scan QR Code di menu Admin terlebih dahulu."
      };
    }

    const cleanNumber = phone.replace(/[^0-9]/g, "");
    if (!cleanNumber || cleanNumber.length < 9 || cleanNumber.length > 15) {
      return {
        success: false,
        reason: "failed",
        error: `Nomor WhatsApp (${phone}) tidak valid. Panjang nomor harus 9 - 15 digit.`
      };
    }

    const jid = `${cleanNumber}@s.whatsapp.net`;
    
    // 🔍 Check if the phone number is registered & active on WhatsApp
    try {
      if (session.socket.onWhatsApp) {
        const onWaResult = await session.socket.onWhatsApp(cleanNumber);
        if (Array.isArray(onWaResult) && onWaResult.length > 0) {
          const matched = onWaResult[0];
          if (!matched || matched.exists === false) {
            console.warn(`⚠️ [Session: "${session.id}"] Number ${cleanNumber} is NOT registered on WhatsApp!`);
            return {
              success: false,
              reason: "not_registered",
              error: `Nomor WhatsApp ${phone} tidak terdaftar atau tidak aktif di WhatsApp.`
            };
          }
        }
      }
    } catch (checkErr: any) {
      console.warn(`⚠️ Could not check onWhatsApp for ${cleanNumber}, proceeding to send attempt:`, checkErr.message);
    }

    try {
      const sendRes = await session.socket.sendMessage(jid, { text });
      console.log(`📤 [Session: "${session.id}"] Successfully sent message to ${phone}`);
      return {
        success: true,
        message: "Pesan terkirim via WhatsApp",
        response: sendRes
      };
    } catch (err: any) {
      console.error(`❌ [Session: "${session.id}"] Failed to send message to ${phone}:`, err.message);
      return {
        success: false,
        reason: "failed",
        error: `Gagal mengirim pesan ke WhatsApp (${phone}): ${err.message || "Unknown error"}`
      };
    }
  }

  private deleteSessionFolder(id: string) {
    const sessionPath = path.join(this.sessionsDir, `session_${id}`);
    try {
      if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
        console.log(`🗑️ Deleted session directory: ${sessionPath}`);
      }
    } catch (err: any) {
      console.error(`❌ Failed to delete folder for session "${id}":`, err.message);
    }
  }
}

export const whatsappManager = new WhatsAppManager();
