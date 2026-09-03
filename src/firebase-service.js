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
  }

  init() {
    const config = window.MEMONY_CONFIG?.FIREBASE_CONFIG;
    if (!config || !config.apiKey || config.apiKey === "YOUR_FIREBASE_API_KEY") {
      console.warn("Firebase config belum diisi atau masih default. Menggunakan mode Local Storage.");
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
    if (!this.isInitialized || !this.db) {
      // Fallback ke local storage
      if (onUpdate) onUpdate(window.storageService.getTransactions());
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
            // Update local storage sebagai offline cache
            window.storageService.saveTransactions(list);
            if (onUpdate) onUpdate(list);
          },
          (err) => {
            console.warn("Firestore snapshot error, falling back to LocalStorage:", err);
            if (onUpdate) onUpdate(window.storageService.getTransactions());
          }
        );

      return this.unsubscribeListener;
    } catch (e) {
      console.warn("Gagal subscribe ke Firestore:", e);
      if (onUpdate) onUpdate(window.storageService.getTransactions());
      return () => {};
    }
  }

  async saveTransaction(tx) {
    // 1. Simpan ke local storage terlebih dahulu (optimistic UI)
    const localTx = window.storageService.addTransaction(tx);

    // 2. Jika Firebase aktif, kirim ke Cloud
    if (this.isInitialized && this.db) {
      try {
        const docRef = this.db.collection("transactions").doc(localTx.id);
        const { id, ...dataToSave } = localTx;
        await docRef.set(dataToSave);
        console.log("Transaksi tersimpan di Firestore Cloud:", localTx.id);
      } catch (err) {
        console.warn("Gagal menyimpan ke Firestore Cloud (tersimpan lokal):", err);
      }
    }

    return localTx;
  }

  async deleteTransaction(id) {
    window.storageService.deleteTransaction(id);

    if (this.isInitialized && this.db) {
      try {
        await this.db.collection("transactions").doc(id).delete();
        console.log("Transaksi dihapus dari Firestore Cloud:", id);
      } catch (err) {
        console.warn("Gagal menghapus dari Firestore Cloud:", err);
      }
    }
  }
}

window.firebaseService = new FirebaseService();
