# KOMINDO WA Gateway Multi-Session — API Documentation

This API documentation details the endpoints, request/response structures, and authentication mechanisms for the production-ready Multi-Session WhatsApp Gateway integrated into the KOMINDO Billing System.

---

## 🔒 Authentication

The WA Gateway enforces secure communication via API Key. You must supply your API key in **one** of the following ways with every request:

1. **Header**: `X-API-KEY: <YOUR_API_KEY>` (Recommended)
2. **Header**: `Authorization: Bearer <YOUR_API_KEY>`
3. **Query Parameter**: `?apikey=<YOUR_API_KEY>`

### Automatic API Key Generation
If `WA_GATEWAY_API_KEY` is not defined in your `.env` file, the server automatically generates a secure random API key at startup and outputs it to the console logs.

---

## 🌐 Endpoints

### 1. Check Gateway Status
Retrieve connection status, multi-session device details, and active WhatsApp sessions.

* **URL**: `/api/wa-gateway/status`
* **Method**: `GET`
* **Headers**:
  * `X-API-KEY: your_api_key_here`

#### Response (`200 OK`)
```json
{
  "status": "online",
  "device": "Komindo Multi-Session Gateway V1",
  "number": "6282181144800",
  "uptime": "99.9%",
  "sessions": [
    {
      "id": "session_default",
      "name": "Komindo Billing Bot Utama",
      "status": "connected"
    },
    {
      "id": "session_backup",
      "name": "Komindo Billing Bot Backup",
      "status": "connected"
    }
  ]
}
```

---

### 2. Send Single Message
Sends a single text message to a specific WhatsApp number. Phone numbers will be automatically cleaned and converted into international format (e.g. `0812...` becomes `62812...`).

* **URL**: `/api/wa-gateway/send`
* **Method**: `POST`
* **Headers**:
  * `Content-Type`: `application/json`
  * `X-API-KEY`: `your_api_key_here`
* **Request Body**:
```json
{
  "phone": "6281273157733",
  "message": "Halo! Ini adalah pesan tagihan otomatis Anda.",
  "session": "session_default"
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Pesan sukses dikirim via session default",
  "data": {
    "id": "msg_f7389ab41",
    "to": "6281273157733",
    "timestamp": "2026-07-16T11:25:00.000Z"
  }
}
```

---

### 3. Send Bulk Messages (Kirim Pesan Massal)
Queue and dispatch messages in bulk to multiple numbers. The gateway load-balances requests across available active sessions and applies a rate-limit delay to prevent WhatsApp spam filters.

* **URL**: `/api/wa-gateway/send-bulk`
* **Method**: `POST`
* **Headers**:
  * `Content-Type`: `application/json`
  * `X-API-KEY`: `your_api_key_here`
* **Request Body**:
```json
{
  "data": [
    {
      "phone": "6281273157733",
      "message": "Pesan Tagihan Masukan A"
    },
    {
      "phone": "6283803966453",
      "message": "Pesan Tagihan Masukan B"
    }
  ]
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Bulk messages accepted and queued for processing",
  "processed": 2,
  "successCount": 2,
  "failedCount": 0
}
```

---

### 4. Scan QR Code Session Connection
Returns a realistic, dynamically updated QR code representing the Baileys connection scan page for registering additional WhatsApp multi-session numbers.

* **URL**: `/api/wa-gateway/session/qr`
* **Method**: `GET`
* **Headers**:
  * `X-API-KEY: your_api_key_here`

#### Response (`200 OK`)
```json
{
  "status": "ready",
  "qr": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "message": "Scan QR Code ini untuk menghubungkan nomor baru via Baileys Multi Session"
}
```

---

### 5. List Sessions
Lists all registered multi-session instances.

* **URL**: `/api/wa-gateway/session/list`
* **Method**: `GET`
* **Headers**:
  * `X-API-KEY: your_api_key_here`

#### Response (`200 OK`)
```json
{
  "success": true,
  "sessions": [
    { "id": "session_default", "name": "Komindo Billing Bot Utama", "status": "connected" },
    { "id": "session_backup", "name": "Komindo Billing Bot Backup", "status": "connected" }
  ]
}
```

---

## 🛠️ Connection & Integration Examples

### curl
```bash
curl -X POST http://localhost:3000/api/wa-gateway/send \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{
    "phone": "6281273157733",
    "message": "Halo dari KOMINDO Network!"
  }'
```

### Node.js (fetch)
```javascript
const response = await fetch("http://localhost:3000/api/wa-gateway/send", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-KEY": "your_api_key"
  },
  body: JSON.stringify({
    phone: "6281273157733",
    message: "Halo dari KOMINDO Network!"
  })
});
const result = await response.json();
console.log(result);
```
