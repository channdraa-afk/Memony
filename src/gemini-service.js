/**
 * Memony Google Gemini 2.0 Flash AI Service
 * -------------------------------------------------------------
 * Menghubungkan aplikasi langsung ke Gemini REST API untuk:
 * 1. Multimodal Vision OCR (Membaca struk foto/kamera)
 * 2. Multimodal Audio Parsing (Mendengarkan rekaman suara pengeluaran)
 */

class GeminiService {
  constructor() {
    this.model = "gemini-2.0-flash";
    this.baseUrl = "https://generativelanguage.googleapis.com/v1beta/models";
  }

  getApiKey() {
    const localConfig = window.MEMONY_CONFIG && window.MEMONY_CONFIG.GEMINI_API_KEY;
    const userSaved = localStorage.getItem("memony_gemini_api_key");
    return userSaved || localConfig || "";
  }

  setApiKey(key) {
    if (key && key.trim()) {
      localStorage.setItem("memony_gemini_api_key", key.trim());
    }
  }

  /**
   * 1. Pindai Foto Struk (Multimodal Image OCR)
   * @param {string} base64Image - Data URL / Base64 image
   * @param {string} mimeType - e.g. 'image/jpeg', 'image/png'
   * @returns {Promise<Object>} Data transaksi terstruktur
   */
  async scanReceipt(base64Image, mimeType = "image/jpeg") {
    const apiKey = this.getApiKey();
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
      throw new Error("Kunci Gemini API Key belum diisi. Silakan atur di menu Pengaturan ⚙️.");
    }

    // Bersihkan header Data URL jika ada
    const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");

    const systemInstruction = `Kamu adalah 'The Royal Treasurer' & AI Receipt Inspector untuk aplikasi keuangan 'Memony'.
Tugasmu adalah menganalisis foto struk/bon belanjaan secara sangat teliti.
Ekstrak informasi ke format JSON murni TANPA markdown backticks, TANPA teks tambahan.

Struktur JSON yang WAJIB dihasilkan:
{
  "storeName": "Nama Toko/Merchant (misal: Indomaret, Alfamart, Warung Makan, SPBU Pertamina, Starbucks)",
  "date": "YYYY-MM-DD (jika tidak tertera tahun, gunakan tahun 2026 atau tanggal hari ini)",
  "time": "HH:mm (waktu jika ada, atau kosongkan)",
  "category": "Pilih salah satu: 'Makanan & Minuman' | 'Belanja & Kebutuhan' | 'Transportasi' | 'Pendidikan & RPL' | 'Hiburan & Hobi' | 'Lainnya'",
  "items": [
    {
      "name": "Nama barang/menu",
      "qty": 1,
      "price": 15000,
      "subtotal": 15000
    }
  ],
  "subtotal": 15000,
  "tax": 0,
  "discount": 0,
  "totalAmount": 15000,
  "paymentMethod": "Tunai / QRIS / Debit / Kredit / E-Wallet",
  "notes": "Catatan singkat atau keunikan dari struk ini",
  "confidenceScore": 95
}

Peraturan Ketat:
1. Semua nominal angka harus berupa integer/number murni (misal: 15000, BUKAN "Rp 15.000").
2. Jika ada struk buram/tidak terbaca, perkirakan dengan masuk akal dan beri confidenceScore lebih rendah.
3. Kategori harus dipilih dari 6 pilihan resmi di atas.`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: "Tolong bedah dan ekstrak seluruh data dari foto struk belanjaan ini ke format JSON terstruktur."
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: cleanBase64
              }
            }
          ]
        }
      ],
      generationConfig: {
        response_mime_type: "application/json",
        temperature: 0.1
      },
      system_instruction: {
        parts: [{ text: systemInstruction }]
      }
    };

    const url = `${this.baseUrl}/${this.model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.error && errData.error.message ? errData.error.message : response.statusText;
      throw new Error(`Gemini Vision Error (${response.status}): ${errMsg}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error("AI tidak mengembalikan teks jawaban.");
    }

    try {
      const parsed = JSON.parse(rawText);
      return this._sanitizeParsedData(parsed);
    } catch (parseErr) {
      // Coba bersihkan markdown jika ada
      const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return this._sanitizeParsedData(parsed);
    }
  }

  /**
   * 2. Proses Suara Pengeluaran (Voice Expense Parsing)
   * @param {string} base64Audio - Data base64 audio
   * @param {string} mimeType - e.g. 'audio/webm' or 'audio/wav'
   * @returns {Promise<Object>}
   */
  async parseVoiceExpense(base64Audio, mimeType = "audio/webm") {
    const apiKey = this.getApiKey();
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
      throw new Error("Kunci Gemini API Key belum diisi. Silakan atur di menu Pengaturan ⚙️.");
    }

    const cleanBase64 = base64Audio.replace(/^data:audio\/[a-z0-9]+;base64,/, "");

    const prompt = `Dengarkan rekaman suara percakapan ini (bahasa Indonesia/slang). 
Pengguna sedang menyebutkan pengeluaran atau jajanan yang dibelinya.
Ekstrak menjadi data transaksi JSON terstruktur dengan format:
{
  "storeName": "Nama Toko / Lokasi (atau 'Jajanan Harian')",
  "date": "${new Date().toISOString().split("T")[0]}",
  "category": "'Makanan & Minuman' | 'Belanja & Kebutuhan' | 'Transportasi' | 'Pendidikan & RPL' | 'Hiburan & Hobi' | 'Lainnya'",
  "items": [
    { "name": "nama item", "qty": 1, "price": 10000, "subtotal": 10000 }
  ],
  "totalAmount": 10000,
  "notes": "Catatan dari ucapan suara"
}`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: cleanBase64
              }
            }
          ]
        }
      ],
      generationConfig: {
        response_mime_type: "application/json",
        temperature: 0.1
      }
    };

    const url = `${this.baseUrl}/${this.model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.error?.message || response.statusText;
      throw new Error(`Gemini Audio Error (${response.status}): ${errMsg}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(rawText.replace(/```json/gi, "").replace(/```/g, "").trim());
    return this._sanitizeParsedData(parsed);
  }

  _sanitizeParsedData(data) {
    const today = new Date().toISOString().split("T")[0];
    return {
      storeName: String(data.storeName || "Toko / Merchant").trim(),
      date: data.date && data.date.match(/^\d{4}-\d{2}-\d{2}$/) ? data.date : today,
      time: String(data.time || ""),
      category: data.category || "Makanan & Minuman",
      items: Array.isArray(data.items)
        ? data.items.map((it) => ({
            name: String(it.name || "Item"),
            qty: Math.max(1, Number(it.qty) || 1),
            price: Math.max(0, Number(it.price) || 0),
            subtotal: Math.max(0, Number(it.subtotal) || Number(it.price) || 0)
          }))
        : [],
      subtotal: Math.max(0, Number(data.subtotal) || Number(data.totalAmount) || 0),
      tax: Math.max(0, Number(data.tax) || 0),
      discount: Math.max(0, Number(data.discount) || 0),
      totalAmount: Math.max(0, Number(data.totalAmount) || Number(data.subtotal) || 0),
      paymentMethod: String(data.paymentMethod || "Tunai"),
      notes: String(data.notes || ""),
      confidenceScore: Math.min(100, Math.max(0, Number(data.confidenceScore) || 90))
    };
  }
}

window.geminiService = new GeminiService();
