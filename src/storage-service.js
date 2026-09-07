/**
 * Memony Local Storage & Data Management Service
 * -------------------------------------------------------------
 * Menyimpan data transaksi secara lokal (offline-first) dan
 * menyediakan fungsi ekspor data CSV & JSON.
 */

class StorageService {
  constructor() {
    this.STORAGE_KEY = "memony_transactions_v1";
    this.BUDGET_KEY = "memony_monthly_budget_v1";
    this._initSeedDataIfEmpty();
  }

  _initSeedDataIfEmpty() {
    const existing = localStorage.getItem(this.STORAGE_KEY);
    if (!existing) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
      return;
    }

    try {
      const list = JSON.parse(existing);
      if (Array.isArray(list)) {
        // Bersihkan data sampel bawaan lama (tx_seed_*) agar buku kas murni 100% milik pengguna
        const cleanList = list.filter((tx) => tx && !String(tx.id || "").startsWith("tx_seed_"));
        if (cleanList.length !== list.length) {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cleanList));
        }
      }
    } catch (e) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
    }
  }

  getTransactions() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Gagal membaca LocalStorage:", e);
      return [];
    }
  }

  saveTransactions(transactions) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(transactions));
      return true;
    } catch (e) {
      console.error("Gagal menyimpan ke LocalStorage:", e);
      return false;
    }
  }

  addTransaction(tx) {
    const list = this.getTransactions();
    const newTx = {
      id: tx.id || "tx_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
      createdAt: tx.createdAt || Date.now(),
      ...tx
    };
    list.unshift(newTx); // letakkan paling atas
    this.saveTransactions(list);
    return newTx;
  }

  deleteTransaction(id) {
    const list = this.getTransactions();
    const filtered = list.filter((tx) => tx.id !== id);
    this.saveTransactions(filtered);
    return filtered;
  }

  updateTransaction(id, updatedFields) {
    const list = this.getTransactions();
    const index = list.findIndex((tx) => tx.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updatedFields };
      this.saveTransactions(list);
      return list[index];
    }
    return null;
  }

  getBudget() {
    const saved = localStorage.getItem(this.BUDGET_KEY);
    const defaultBudget = window.MEMONY_CONFIG?.SETTINGS?.monthlyBudget || 1500000;
    return saved ? Number(saved) : defaultBudget;
  }

  setBudget(amount) {
    const num = Math.max(0, Number(amount) || 0);
    localStorage.setItem(this.BUDGET_KEY, String(num));
    return num;
  }

  exportCSV() {
    const list = this.getTransactions();
    if (list.length === 0) return null;

    const headers = ["ID", "Tanggal", "Waktu", "Toko", "Kategori", "Total", "Metode Pembayaran", "Catatan", "Rincian Barang"];
    const rows = list.map((tx) => {
      const itemsSummary = (tx.items || []).map((it) => `${it.qty}x ${it.name} (@${it.price})`).join(" | ");
      return [
        `"${tx.id}"`,
        `"${tx.date || ""}"`,
        `"${tx.time || ""}"`,
        `"${(tx.storeName || "").replace(/"/g, '""')}"`,
        `"${tx.category || ""}"`,
        tx.totalAmount || 0,
        `"${tx.paymentMethod || ""}"`,
        `"${(tx.notes || "").replace(/"/g, '""')}"`,
        `"${itemsSummary.replace(/"/g, '""')}"`
      ].join(",");
    });

    return [headers.join(","), ...rows].join("\n");
  }

  exportJSON() {
    const list = this.getTransactions();
    const budget = this.getBudget();
    const payload = {
      appName: "Memony",
      exportedAt: new Date().toISOString(),
      budget: budget,
      totalEntries: list.length,
      transactions: list
    };
    return JSON.stringify(payload, null, 2);
  }
}

window.storageService = new StorageService();
