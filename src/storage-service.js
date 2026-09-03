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
    if (!existing || existing === "[]") {
      const today = new Date();
      const formatDt = (daysAgo) => {
        const d = new Date(today);
        d.setDate(d.getDate() - daysAgo);
        return d.toISOString().split("T")[0];
      };

      const seedData = [
        {
          id: "tx_seed_1",
          storeName: "Indomaret Point",
          date: formatDt(0),
          time: "08:30",
          category: "Makanan & Minuman",
          items: [
            { name: "Kopi Kenangan Mantan", qty: 1, price: 18000, subtotal: 18000 },
            { name: "Roti Sisir Mentega", qty: 1, price: 9500, subtotal: 9500 }
          ],
          subtotal: 27500,
          tax: 0,
          discount: 0,
          totalAmount: 27500,
          paymentMethod: "QRIS",
          notes: "Sarapan pagi sebelum ngoding",
          receiptImage: null,
          createdAt: Date.now() - 3600000
        },
        {
          id: "tx_seed_2",
          storeName: "Toko Buku & ATK Bintang",
          date: formatDt(1),
          time: "14:15",
          category: "Pendidikan & RPL",
          items: [
            { name: "Buku Catatan Grid A5", qty: 2, price: 15000, subtotal: 30000 },
            { name: "Pulpen Gel Pilot 0.5", qty: 2, price: 7500, subtotal: 15000 }
          ],
          subtotal: 45000,
          tax: 0,
          discount: 5000,
          totalAmount: 40000,
          paymentMethod: "Tunai",
          notes: "Kebutuhan catatan algoritma RPL",
          receiptImage: null,
          createdAt: Date.now() - 86400000
        },
        {
          id: "tx_seed_3",
          storeName: "Warung Bakso Pak Kumis",
          date: formatDt(2),
          time: "12:45",
          category: "Makanan & Minuman",
          items: [
            { name: "Bakso Urat Spesial", qty: 1, price: 18000, subtotal: 18000 },
            { name: "Es Teh Manis", qty: 1, price: 4000, subtotal: 4000 }
          ],
          subtotal: 22000,
          tax: 0,
          discount: 0,
          totalAmount: 22000,
          paymentMethod: "Tunai",
          notes: "Makan siang santai bareng teman",
          receiptImage: null,
          createdAt: Date.now() - 172800000
        }
      ];

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(seedData));
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
