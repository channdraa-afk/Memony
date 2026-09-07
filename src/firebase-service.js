/**
 * Memony Firebase Cloud Firestore & Sync Service
 * -------------------------------------------------------------
 * Menyediakan sinkronisasi cloud real-time ke database `memony-2ae55`.
 * Mendukung fallback offline otomatis ke LocalStorage.
 */

class FirebaseService {
  constructor() {
    this.app = null;
    this.db = null;
    this.isInitialized = false;
    this.unsubscribeListener = null;
    this.onUpdateCallback = null;
  }

  notifySubscribers(data) {
    if (typeof this.onUpdateCallback === "function") {
      this.onUpdateCallback(data);
    }
  }

  init() {
    const config = window.MEMONY_CONFIG?.FIREBASE_CONFIG;
    if (!config || !config.apiKey || config.apiKey === "YOUR_FIREBASE_API_KEY" || !config.projectId) {
      console.log("📦 Mode Offline-First Aktif: Transaksi tersimpan aman di LocalStorage browser.");
      return false;
    }

    try {
      if (typeof firebase !== "undefined") {
        if (!firebase.apps.length) {
          this.app = firebase.initializeApp(config);
        } else {
          this.app = firebase.app();
        }
        this.db = firebase.firestore();
        this.isInitialized = true;
        console.log("🔥 Firebase Firestore connected successfully to:", config.projectId);
        return true;
      } else {
        console.warn("Firebase SDK tidak ditemukan di window.");
        return false;
      }
    } catch (e) {
      console.warn("Inisialisasi Firebase gagal:", e);
      return false;
    }
  }

  /**
   * Pasang listener real-time ke koleksi transactions
   */
  subscribeToTransactions(onUpdate) {
    this.onUpdateCallback = onUpdate;

    // Selalu sajikan data lokal secara instan (0ms)
    const localList = window.storageService.getTransactions();
    if (onUpdate) onUpdate(localList);

    if (!this.isInitialized || !this.db) {
      return () => {};
    }

    try {
      this.unsubscribeListener = this.db
        .collection("transactions")
        .orderBy("date", "desc")
        .onSnapshot(
          (snapshot) => {
            const list = [];
            snapshot.forEach((doc) => {
              list.push({ id: doc.id, ...doc.data() });
            });
            if (list.length > 0) {
              window.storageService.saveTransactions(list);
              this.notifySubscribers(list);
            }
          },
          (err) => {
            console.warn("Firestore snapshot error (offline/permission):", err.message || err);
            this.notifySubscribers(window.storageService.getTransactions());
          }
        );

      return this.unsubscribeListener;
    } catch (e) {
      console.warn("Gagal subscribe ke Firestore:", e);
      return () => {};
    }
  }

  async saveTransaction(tx) {
    // 1. Simpan ke local storage terlebih dahulu (optimistic UI)
    const localTx = window.storageService.addTransaction(tx);

    // 2. Beritahu subscriber seketika agar UI langsung menampilkan item baru
    this.notifySubscribers(window.storageService.getTransactions());

    // 3. Jika Firebase aktif, kirim ke Cloud dengan timeout 2.5s agar tidak pernah menggantung
    if (this.isInitialized && this.db) {
      try {
        const docRef = this.db.collection("transactions").doc(localTx.id);
        const { id, ...dataToSave } = localTx;
        await Promise.race([
          docRef.set(dataToSave),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout sinkronisasi Firestore Cloud")), 2500))
        ]);
        console.log("Transaksi tersimpan di Firestore Cloud:", localTx.id);
      } catch (err) {
        console.warn("Gagal menyimpan ke Firestore Cloud (tersimpan aman di lokal):", err.message || err);
      }
    }

    return localTx;
  }

  async deleteTransaction(id) {
    window.storageService.deleteTransaction(id);
    this.notifySubscribers(window.storageService.getTransactions());

    if (this.isInitialized && this.db) {
      try {
        const docRef = this.db.collection("transactions").doc(id);
        await Promise.race([
          docRef.delete(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout delete Firestore Cloud")), 2500))
        ]);
        console.log("Transaksi dihapus dari Firestore Cloud:", id);
      } catch (err) {
        console.warn("Gagal menghapus dari Firestore Cloud (terhapus di lokal):", err.message || err);
      }
    }
  }
}

window.firebaseService = new FirebaseService();
