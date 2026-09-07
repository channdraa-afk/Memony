/**
 * Memony Google Gemini AI Service
 * -------------------------------------------------------------
 * Menghubungkan aplikasi langsung ke Google Gemini REST API untuk:
 * 1. Multimodal Vision OCR (Membaca struk foto/kamera)
 * 2. Multimodal Audio Parsing (Mendengarkan rekaman suara curhat pengeluaran)
 */

class GeminiService {
  constructor() {
    this.model = (window.MEMONY_CONFIG && window.MEMONY_CONFIG.GEMINI_MODEL) || "gemini-flash-lite-latest";
    this.baseUrl = "https://generativelanguage.googleapis.com/v1beta/models";
  }

  getModel() {
    const userSaved = localStorage.getItem("memony_gemini_model");
    const localConfig = window.MEMONY_CONFIG && window.MEMONY_CONFIG.GEMINI_MODEL;
    return userSaved || localConfig || "gemini-flash-lite-latest";
  }

  setModel(modelName) {
    if (modelName && modelName.trim()) {
      localStorage.setItem("memony_gemini_model", modelName.trim());
      this.model = modelName.trim();
    }
  }

  getApiKey() {
    const localConfig = window.MEMONY_CONFIG && window.MEMONY_CONFIG.GEMINI_API_KEY;
    const userSaved = localStorage.getItem("memony_gemini_api_key");
    return userSaved || localConfig || "";
  }

  hasApiKey() {
    const key = this.getApiKey();
    return !!(key && key.trim() && key !== "YOUR_GEMINI_API_KEY_HERE");
  }

  setApiKey(key) {
    if (key && key.trim()) {
      localStorage.setItem("memony_gemini_api_key", key.trim());
    }
  }

  removeApiKey() {
    localStorage.removeItem("memony_gemini_api_key");
    if (window.MEMONY_CONFIG) {
      window.MEMONY_CONFIG.GEMINI_API_KEY = "";
    }
  }

  /**
   * Ekstraksi Base64 murni dari data URI browser (menghilangkan prefix apapun)
   */
  _extractBase64(dataUrlOrBase64) {
    if (!dataUrlOrBase64 || typeof dataUrlOrBase64 !== "string") return "";
    return dataUrlOrBase64.includes(",") ? dataUrlOrBase64.split(",")[1].trim() : dataUrlOrBase64.trim();
  }

  /**
   * Ekstraksi JSON terstruktur dari kandidat Gemini (tahan terhadap multi-part dan thoughts)
   */
  _extractJsonText(data) {
    const candidate = data.candidates?.[0];
    if (!candidate || !candidate.content || !candidate.content.parts) {
      throw new Error("AI tidak mengembalikan respon yang dapat dibaca.");
    }
    const parts = candidate.content.parts;
    // Cari part teks yang bukan thought block
    const textPart = parts.find((p) => p.text && !p.thought) || parts[parts.length - 1];
    const rawText = textPart?.text;
    if (!rawText) {
      throw new Error("AI tidak mengembalikan teks jawaban.");
    }

    try {
      return JSON.parse(rawText);
    } catch (e) {
      const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
      return JSON.parse(cleaned);
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

    const cleanBase64 = this._extractBase64(base64Image);
    const cleanMimeType = (mimeType || "image/jpeg").split(";")[0].trim();

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
                mime_type: cleanMimeType,
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

    const url = `${this.baseUrl}/${this.getModel()}:generateContent?key=${apiKey}`;

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
    const parsed = this._extractJsonText(data);
    return this._sanitizeParsedData(parsed);
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

    // Bersihkan data URI agar tidak merusak WebM header
    const cleanBase64 = this._extractBase64(base64Audio);
    const cleanMimeType = (mimeType || "audio/webm").split(";")[0].trim();

    const systemInstruction = `Kamu adalah 'The Royal Treasurer' & AI Voice Expense Auditor untuk aplikasi keuangan 'Memony'.
Tugasmu adalah mendengarkan rekaman audio curhat pengeluaran dalam bahasa Indonesia (bahasa santai/sehari-hari/gaul/slang), memahami konteksnya dengan sangat teliti, dan mengekstrak seluruh rincian transaksi ke format JSON murni.

Aturan Penting Pemahaman Bahasa Indonesia & Angka:
1. Pahami istilah gaul/slang dan satuan harga Indonesia:
   - "k" / "rb" / "ribu" = dikali 1.000 (contoh: "15 ribu" / "15rb" / "15k" = 15000, "5 ribu" = 5000)
   - "goceng" = 5000, "ceban" = 10000, "seceng" = 1000, "gocap" = 50000, "noban" = 20000
   - "setengah juta" = 500000, "sejuta" = 1000000
   - "dua puluh lima ribu" = 25000, "tujuh puluh ribu" = 70000
2. Jika pengguna menyebutkan beberapa item/barang belanjaan, pecah setiap item ke dalam array 'items' lengkap dengan 'name', 'qty', 'price' (harga satuan), dan 'subtotal'.
3. 'totalAmount' WAJIB sama persis dengan jumlah total semua subtotal item (atau total pengeluaran yang diucapkan).
4. Kategori WAJIB dipilih secara tepat dari salah satu dari 6 kategori resmi ini:
   - 'Makanan & Minuman'
   - 'Belanja & Kebutuhan'
   - 'Transportasi'
   - 'Pendidikan & RPL'
   - 'Hiburan & Hobi'
   - 'Lainnya'
5. Tuliskan teks lengkap yang diucapkan pengguna pada field 'transcription', dan rangkuman singkat pada field 'notes'.

Format JSON yang WAJIB dihasilkan:
{
  "transcription": "Teks lengkap yang diucapkan pengguna dalam audio",
  "storeName": "Nama Toko/Merchant/Tempat (atau 'Jajanan Harian')",
  "date": "${new Date().toISOString().split("T")[0]}",
  "category": "Makanan & Minuman",
  "items": [
    { "name": "Nama item", "qty": 1, "price": 10000, "subtotal": 10000 }
  ],
  "totalAmount": 10000,
  "paymentMethod": "Tunai",
  "notes": "Catatan ringkasan dari audio",
  "confidenceScore": 95
}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: "Dengarkan rekaman suara curhat pengeluaran ini dengan sangat teliti. Transkripsikan apa yang diucapkan dan ekstrak ke format JSON terstruktur sesuai aturan."
            },
            {
              inline_data: {
                mime_type: cleanMimeType,
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

    const url = `${this.baseUrl}/${this.getModel()}:generateContent?key=${apiKey}`;
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
    const parsed = this._extractJsonText(data);
    return this._sanitizeParsedData(parsed);
  }

  _cleanString(str, fallback = "") {
    if (!str) return fallback;
    return String(str)
      .replace(/<[^>]*>/g, "")
      .replace(/[\r\n\t]/g, " ")
      .trim() || fallback;
  }

  _sanitizeParsedData(data) {
    const today = new Date().toISOString().split("T")[0];
    const ALLOWED_CATEGORIES = [
      "Makanan & Minuman",
      "Belanja & Kebutuhan",
      "Transportasi",
      "Pendidikan & RPL",
      "Hiburan & Hobi",
      "Lainnya"
    ];

    const rawCategory = this._cleanString(data.category, "Lainnya");
    const category = ALLOWED_CATEGORIES.includes(rawCategory) ? rawCategory : "Lainnya";

    let rawItems = Array.isArray(data.items)
      ? data.items.map((it) => {
          const qty = Math.max(1, Math.min(9999, Math.floor(Number(it.qty) || 1)));
          const price = Math.max(0, Math.min(1000000000, Math.floor(Number(it.price) || 0)));
          const subtotal = Math.max(0, Math.min(1000000000, Math.floor(Number(it.subtotal) || price * qty || 0)));
          return {
            name: this._cleanString(it.name, "Item"),
            qty,
            price: price || subtotal,
            subtotal: subtotal || price
          };
        })
      : [];

    let itemsSum = rawItems.reduce((acc, it) => acc + (it.subtotal || 0), 0);
    let declaredTotal = Math.max(0, Math.min(1000000000, Math.floor(Number(data.totalAmount) || Number(data.subtotal) || 0)));

    // Jika total tidak dideklarasikan tapi ada rincian item, gunakan jumlah item
    let finalTotal = declaredTotal > 0 ? declaredTotal : itemsSum;

    // Jika tidak ada rincian item sama sekali tapi ada total, buat item default
    if (rawItems.length === 0 && finalTotal > 0) {
      rawItems.push({
        name: this._cleanString(data.storeName, "Pengeluaran"),
        qty: 1,
        price: finalTotal,
        subtotal: finalTotal
      });
    }

    const transcription = this._cleanString(data.transcription, "");
    const notes = this._cleanString(data.notes, transcription);

    // Deteksi jika AI melaporkan rekaman hening atau kosong
    const isSilentNotice = (text) => /tidak ada suara|rekaman kosong|hening|audio kosong|suara tidak terdengar/i.test(text);
    if (finalTotal === 0 && (isSilentNotice(transcription) || isSilentNotice(notes))) {
      throw new Error("Tidak ada suara percakapan yang terdeteksi di rekaman. Pastikan mikrofon laptopmu aktif dan coba bicara lebih dekat ya!");
    }

    return {
      storeName: this._cleanString(data.storeName, "Toko / Merchant"),
      date: data.date && String(data.date).match(/^\d{4}-\d{2}-\d{2}$/) ? data.date : today,
      time: this._cleanString(data.time, ""),
      category: category,
      items: rawItems,
      subtotal: itemsSum || finalTotal,
      tax: Math.max(0, Math.min(100000000, Math.floor(Number(data.tax) || 0))),
      discount: Math.max(0, Math.min(100000000, Math.floor(Number(data.discount) || 0))),
      totalAmount: finalTotal,
      paymentMethod: this._cleanString(data.paymentMethod, "Tunai"),
      notes: notes,
      transcription: transcription,
      confidenceScore: Math.min(100, Math.max(0, Math.floor(Number(data.confidenceScore) || 92)))
    };
  }
}

window.geminiService = new GeminiService();
