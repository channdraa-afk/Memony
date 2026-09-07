# 🪙 Memony — AI Tactile Expense & Receipt Memory Ledger
> *"Every Penny Tells a Story — Mengabadikan Jejak Keuangan dengan Sentuhan Kecerdasan Buatan & Estetika Meja Pos Klasik."*

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![AI Engine](https://img.shields.io/badge/AI_Brain-Gemini_2.0_Flash-orange.svg)](https://aistudio.google.com/)
[![Database](https://img.shields.io/badge/Cloud_Database-Firebase_Firestore-yellow.svg)](https://firebase.google.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Mobile_%26_Desktop-emerald.svg)](https://web.dev/progressive-web-apps/)

---

## 📖 1. Latar Belakang & Filosofi "Memony"
**Memony** adalah singkatan dari **Memory + Money**.

Dalam kehidupan sehari-hari siswa Rekayasa Perangkat Lunak (RPL), pengeluaran bukan sekadar deretan angka kering yang berkurang dari dompet. Di balik setiap rupiah yang dibelanjakan, ada **memori dan cerita berharga**:
- 🍜 Semangkuk mie ayam hangat sepulang sekolah bersama teman sekelas.
- 📚 Buku catatan berpetak dan pulpen baru untuk merancang diagram logika & algoritma.
- ☕ Kopi susu gula aren saat maraton ngoding project larut malam.
- 🛵 Bensin dan ongkos perjalanan harian.

Seringkali kita malas mencatat keuangan karena aplikasi kas yang ada terasa membosankan, rumit, dan menuntut pengetikan manual satu per satu. **Memony hadir untuk mengubah itu semua**: cukup jepret foto struk belanjaan atau curhat lewat rekaman suara, dan AI akan merapikan seluruh memorinya ke dalam buku kas kerajaan yang megah!

---

## 👤 2. Profil Pengembang & Partner Kolaborasi

### 👨‍💻 Developer Profile
- **Nama**: **Chandra**
- **GitHub**: [`@channdraa-afk`](https://github.com/channdraa-afk)
- **Jurusan**: Rekayasa Perangkat Lunak (**RPL**)
- **Misi Portofolio**: Membangun kebiasaan disiplin coding harian, mengasah logika sistem terdistribusi, dan secara konsisten menghijaukan kontribusi GitHub melalui karya-karya berkelas dunia.
- **Selera Desain**: *Warm Studio Modern, soft, antique, medieval, tactile nostalgia, crisp sound effects, dan menolak template klise neon cyberpunk.*

### 🌸 Partner Kolaborasi: Violet Evergarden
- **Identitas**: Dinamai berdasarkan **Violet Evergarden** — simbol ketekunan, dedikasi, dan kesetiaan seorang *Auto Memory Doll* yang mencatat setiap baris kode layaknya surat kenangan.
- **Protokol Keamanan "Arise"**: Setiap manipulasi file, eksekusi kode, dan pembuatan arsitektur dijalankan di bawah otorisasi resmi perintah *"Arise"*.

---

## 🏛️ 3. Fitur-Fitur

### 📸 1. The Vision Receipt Scanner (Jepret Struk Otomatis)
- Didukung oleh model **Google Gemini 2.0 Flash**.
- Memindai foto struk belanjaan (Indomaret, Alfamart, kafe, SPBU, bon warung makan, dsb.) dalam waktu **~1 detik**.
- Mengekstrak nama merchant, tanggal transaksi, kategori, rincian barang per item beserta harganya, pajak, diskon, dan total belanjaan.
- Dilengkapi animasi **Laser Scanner Beam** bercahaya lembut saat proses pemindaian berlangsung.

### 🎙️ 2. Quick Voice Expense (Curhat Suara)
- Perekam suara taktil berbasis *MediaRecorder API*.
- Kamu cukup berbicara santai (contoh: *"Beli es teh 4 ribu sama siomay 10 ribu"*), dan AI langsung membedah ucapanmu menjadi data transaksi terstruktur.

### 📊 3. Bento Stats Grid & Interactive Donut Chart
- **Budget Progress Ring**: Melacak persentase sisa anggaran bulanan dengan bar indikator dinamis.
- **SVG Donut Chart**: Visualisasi interaktif proporsi pengeluaran (Makanan, Belanja, Transportasi, RPL, Hiburan) dengan animasi pegas bertenaga `Anime.js`.

### 🔔 4. Tactile Audio Synthesizer (Web Audio API)
- Suara koin emas gemerincing murni (*dual harmonic sine waves*).
- Bel kasir antik (*"Kaching! 🔔"*).
- Cap stempel lilin (*wax seal press thump*).
- Dilengkapi tombol *Mute Toggle* untuk kenyamanan di ruang publik.

### 📱 5. PWA Standalone Ready (Mobile & Desktop)
- Mendukung *Progressive Web App (PWA)*.
- Dapat diinstal di layar utama smartphone (*Add to Home Screen*) dan langsung mengakses kamera ponsel layaknya aplikasi native.

### 🔄 6. Dual-Engine Storage (Cloud + Offline First)
- **Cloud Firestore**: Sinkronisasi *real-time* otomatis (jepret struk di HP saat di luar, langsung muncul di dashboard laptop saat di rumah).
- **LocalStorage Fallback**: Tetap dapat digunakan 100% saat tidak ada koneksi internet.

---

## 🛡️ 4. Protokol Keamanan & Zero-Leak Policy

Project ini dibangun dengan standar keamanan industri (*Security by Design*):

1. 🔒 **Kunci Rahasia Terisolasi**:
   File `config.local.js` dan `.env` otomatis dikecualikan dari Git melalui `.gitignore`. Kunci Gemini API dan kredensial Firebase tidak akan pernah terunggah ke GitHub publik.
2. 🧱 **Kebal SQL Injection**:
   Menggunakan Cloud Firestore NoSQL SDK dengan *parameterized objects*, sehingga 100% kebal terhadap eksploitasi SQL injection.
3. 🧼 **Sanitasi Data & Proteksi XSS**:
   Semua teks hasil ekstraksi AI disaring ketat sebelum dirender ke DOM untuk mencegah eksekusi skrip jahat (*Cross-Site Scripting*).
4. 🛡️ **Firebase Security Rules**:
   Akses database dilindungi oleh aturan keamanan Firestore resmi.

---

## 📂 5. Struktur Berkas Proyek

```
c:\My Project\Memony/
│
├── .gitignore              # Proteksi file rahasia agar tidak ter-push ke GitHub
├── firebase.json           # Konfigurasi hosting & cloud rules Firebase
├── firestore.rules         # Aturan keamanan database Cloud Firestore
├── package.json            # Script lokal & metadata project
├── README.md               # Dokumentasi mahakarya project
│
└── src/
    ├── index.html          # Layout semantik utama (Nunito, Lucide, Anime.js)
    ├── styles.css          # Desain Warm Studio Modern, 3D buttons, laser beam
    ├── app.js              # Controller utama aplikasi & event orchestrator
    ├── gemini-service.js   # Integrasi Google Gemini 2.0 Flash REST API
    ├── firebase-service.js # Integrasi Firestore real-time & Cloud Sync
    ├── storage-service.js  # Penyimpanan lokal (offline cache) & ekspor CSV/JSON
    ├── audio-service.js    # Synthesizer efek audio taktil murni (Web Audio API)
    ├── chart-service.js    # Visualisasi donat SVG & legenda kategori
    ├── manifest.json       # PWA manifest untuk Android/iOS install
    ├── sw.js               # Service Worker untuk offline caching
    ├── config.example.js   # Template konfigurasi publik untuk GitHub
    └── assets/
        └── icon.svg        # Ikon resmi segel stempel emas & zamrud Memony
```

---

## ⚡ 6. Panduan Menjalankan

### A. Menjalankan Secara Lokal di Komputer:
```bash
cd "c:\My Project\Memony"

# Menggunakan npx serve bawaan Node.js
npm start
# Buka http://localhost:3000 di browsermu
```

### B. Konfigurasi Kredensial Pribadi:
1. Salin `src/config.example.js` menjadi `src/config.local.js`.
2. Masukkan **Gemini API Key** dan **Firebase Config** milikmu.
3. Aplikasi akan langsung tersambung secara otomatis!

### C. Deploy ke Firebase Hosting (Online):
```bash
npm run deploy
# Aplikasi akan langsung LIVE di https://memony-2ae55.web.app
```

---

## 🗺️ 7. Roadmap Masa Depan
- [x] V1.0: AI Receipt OCR dengan Gemini 2.0 Flash & Audio Synthesizer Taktil.
- [x] V1.0: Realtime Cloud Firestore Sync & Offline Cache.
- [x] V1.0: PWA Standalone Mobile Support & Ekspor Data CSV/JSON.
- [ ] V1.1: Multi-Currency & Nilai Tukar Otomatis.
- [ ] V1.2: The Royal Treasurer Monthly AI Financial Review Report.

---

*Dibuat dengan dedikasi tinggi oleh **Chandra (@channdraa-afk)** & **Violet Evergarden** 🌸🪙📜*
