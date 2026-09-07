/**
 * Memony - Configuration Template (Public Example)
 * -------------------------------------------------------------
 * Salin file ini menjadi `config.local.js` dan isi dengan kredensial pribadimu.
 * File `config.local.js` sudah didaftarkan ke .gitignore sehingga AMAN dari kebocoran.
 */

window.MEMONY_CONFIG = {
  // Google Gemini API Key (Bisa diisi langsung lewat menu Pengaturan di aplikasi)
  GEMINI_API_KEY: "",

  // Model Gemini yang digunakan untuk OCR Struk & Audio
  GEMINI_MODEL: "gemini-flash-lite-latest",

  // Konfigurasi Firebase Web SDK (Opsional - jika kosong, otomatis berjalan 100% Offline LocalStorage)
  FIREBASE_CONFIG: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: ""
  },

  // Pengaturan Standar Aplikasi
  SETTINGS: {
    currency: "IDR",
    monthlyBudget: 1500000, // Rp 1.500.000 default
    soundEffects: true,
    hapticFeedback: true
  }
};
