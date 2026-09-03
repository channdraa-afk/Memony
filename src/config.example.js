/**
 * Memony - Configuration Template (Public Example)
 * -------------------------------------------------------------
 * Salin file ini menjadi `config.local.js` dan isi dengan kredensial pribadimu.
 * File `config.local.js` sudah didaftarkan ke .gitignore sehingga AMAN dari kebocoran.
 */

window.MEMONY_CONFIG = {
  // Google Gemini API Key (dari Google AI Studio)
  GEMINI_API_KEY: "YOUR_GEMINI_API_KEY_HERE",

  // Model Gemini yang digunakan untuk OCR Struk & Audio
  GEMINI_MODEL: "gemini-2.0-flash",

  // Konfigurasi Firebase Web SDK (dari Firebase Console)
  FIREBASE_CONFIG: {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
  },

  // Pengaturan Standar Aplikasi
  SETTINGS: {
    currency: "IDR",
    monthlyBudget: 1500000, // Rp 1.500.000 default
    soundEffects: true,
    hapticFeedback: true
  }
};
