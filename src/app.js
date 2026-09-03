/**
 * Memony Main Application Controller
 * -------------------------------------------------------------
 * Mengorkestrasi antarmuka, AI Vision & Voice, Firestore real-time,
 * dan animasi Anime.js.
 */

document.addEventListener("DOMContentLoaded", () => {
  // =========================================================================
  // STATE MANAGEMENT
  // =========================================================================
  let transactions = [];
  let currentFilter = "semua";
  let searchQuery = "";
  let mediaRecorder = null;
  let audioChunks = [];
  let currentScannedData = null;

  // =========================================================================
  // DOM ELEMENTS
  // =========================================================================
  const elTotalSpent = document.getElementById("stat-total-spent");
  const elBudgetRemaining = document.getElementById("stat-budget-remaining");
  const elBudgetPercent = document.getElementById("stat-budget-percent");
  const elBudgetBarFill = document.getElementById("budget-bar-fill");
  const elTxCount = document.getElementById("stat-tx-count");
  const elTxList = document.getElementById("tx-list-container");
  const elSearchInput = document.getElementById("ledger-search-input");
  const elFilterPills = document.querySelectorAll(".filter-pill");
  const elMuteBtn = document.getElementById("btn-toggle-mute");
  const elSettingsBtn = document.getElementById("btn-open-settings");
  const elExportCsvBtn = document.getElementById("btn-export-csv");
  const elExportJsonBtn = document.getElementById("btn-export-json");

  // Dropzone / File Inputs
  const elDropzone = document.getElementById("scanner-dropzone");
  const elFileInput = document.getElementById("receipt-file-input");
  const elCameraInput = document.getElementById("receipt-camera-input");
  const elLaserBeam = document.getElementById("scan-laser-beam");

  // Quick Hubs
  const elHubVoice = document.getElementById("hub-voice-btn");
  const elHubManual = document.getElementById("hub-manual-btn");

  // Modals
  const modalVerify = document.getElementById("modal-verify-scan");
  const modalManual = document.getElementById("modal-manual-add");
  const modalVoice = document.getElementById("modal-voice-record");
  const modalSettings = document.getElementById("modal-settings");
  const toastContainer = document.getElementById("toast-container");

  // =========================================================================
  // INITIALIZATION
  // =========================================================================
  function initApp() {
    // 1. Inisialisasi Firebase
    const fbConnected = window.firebaseService.init();

    // 2. Pasang Listener Transaksi Realtime (atau fallback ke local)
    window.firebaseService.subscribeToTransactions((data) => {
      transactions = data || [];
      renderDashboard();
    });

    // 3. Update Status Tombol Mute
    updateMuteButtonUI();

    // 4. Inisialisasi Service Worker untuk PWA
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    }

    // 5. Animasi Pembuka Halaman
    if (window.anime) {
      window.anime({
        targets: ".app-header, .hero-action-grid, .bento-stats-grid, .ledger-section",
        opacity: [0, 1],
        translateY: [15, 0],
        duration: 800,
        delay: window.anime.stagger(100),
        easing: "easeOutCubic"
      });
    }
  }

  // =========================================================================
  // DASHBOARD RENDERING & CALCULATIONS
  // =========================================================================
  function renderDashboard() {
    const monthlyBudget = window.storageService.getBudget();
    const todayStr = new Date().toISOString().split("T")[0];

    // Filter transaksi bulan ini untuk hitungan budget
    const currentYearMonth = todayStr.substring(0, 7);
    const thisMonthTxs = transactions.filter((t) => (t.date || "").startsWith(currentYearMonth));

    const totalSpentThisMonth = thisMonthTxs.reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0);
    const remainingBudget = Math.max(0, monthlyBudget - totalSpentThisMonth);
    const percentUsed = Math.min(100, Math.round((totalSpentThisMonth / (monthlyBudget || 1)) * 100));

    // Update Header Numbers
    elTotalSpent.textContent = "Rp " + totalSpentThisMonth.toLocaleString("id-ID");
    elBudgetRemaining.textContent = "Sisa: Rp " + remainingBudget.toLocaleString("id-ID");
    elBudgetPercent.textContent = percentUsed + "%";
    elBudgetBarFill.style.width = percentUsed + "%";
    elTxCount.textContent = transactions.length + " Transaksi";

    // Ubah warna bar jika mendekati batas
    if (percentUsed >= 90) {
      elBudgetBarFill.style.background = "linear-gradient(90deg, #e74c3c, #c0392b)";
    } else if (percentUsed >= 70) {
      elBudgetBarFill.style.background = "linear-gradient(90deg, #f39c12, #d35400)";
    } else {
      elBudgetBarFill.style.background = "linear-gradient(90deg, #1e6b42, #c99738)";
    }

    // Render Donut Chart
    window.chartService.renderCategoryDonut("category-chart-container", thisMonthTxs);

    // Render List
    renderTransactionList();
  }

  function renderTransactionList() {
    const filtered = filterTransactions(transactions, currentFilter, searchQuery);

    if (filtered.length === 0) {
      elTxList.innerHTML = `
        <div class="empty-chart-state" style="padding: 40px 10px;">
          <div style="font-size: 36px; margin-bottom: 8px;">📜</div>
          <p style="font-weight: 700; color: var(--text-main);">Tidak ada catatan transaksi yang cocok.</p>
          <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Jepret struk belanjaanmu atau tambah transaksi manual di atas.</p>
        </div>
      `;
      return;
    }

    const categoryIcons = {
      "Makanan & Minuman": "🍔",
      "Belanja & Kebutuhan": "🛍️",
      "Transportasi": "🛵",
      "Pendidikan & RPL": "💻",
      "Hiburan & Hobi": "🎮",
      "Lainnya": "🪙"
    };

    elTxList.innerHTML = filtered
      .map((tx) => {
        const icon = categoryIcons[tx.category] || "🪙";
        const formattedAmount = "Rp " + (Number(tx.totalAmount) || 0).toLocaleString("id-ID");
        const itemsDetail = (tx.items || []).map((it) => `${it.qty}x ${it.name}`).join(", ") || tx.notes || "Catatan transaksi";

        return `
        <div class="tx-item-card" data-id="${tx.id}">
          <div class="tx-left">
            <div class="tx-cat-icon" style="background: var(--bg-parchment);">${icon}</div>
            <div class="tx-details">
              <span class="tx-store">${escapeHtml(tx.storeName || "Transaksi")}</span>
              <div class="tx-meta">
                <span>${tx.date || ""}</span>
                <span class="tx-badge-cat">${escapeHtml(tx.category || "Lainnya")}</span>
                <span style="color: var(--text-light); max-width: 280px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(itemsDetail)}</span>
              </div>
            </div>
          </div>
          <div class="tx-right">
            <span class="tx-amount">- ${formattedAmount}</span>
            <button class="tx-del-btn" title="Hapus catatan" data-del-id="${tx.id}">🗑️</button>
          </div>
        </div>
      `;
      })
      .join("");

    // Pasang event hapus
    document.querySelectorAll(".tx-del-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-del-id");
        if (confirm("Apakah kamu yakin ingin menghapus catatan transaksi ini?")) {
          window.firebaseService.deleteTransaction(id);
          window.audioService.playClickSound();
          showToast("Catatan transaksi telah dihapus.");
        }
      });
    });
  }

  function filterTransactions(list, filter, query) {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    return list.filter((tx) => {
      const txDate = tx.date || "";

      // Filter Waktu
      if (filter === "hari-ini" && txDate !== todayStr) return false;
      if (filter === "minggu-ini") {
        const d = new Date(txDate);
        const diffDays = (today - d) / (1000 * 60 * 60 * 24);
        if (diffDays > 7 || diffDays < 0) return false;
      }
      if (filter === "bulan-ini") {
        if (!txDate.startsWith(todayStr.substring(0, 7))) return false;
      }

      // Filter Pencarian
      if (query && query.trim()) {
        const q = query.toLowerCase();
        const matchStore = (tx.storeName || "").toLowerCase().includes(q);
        const matchCat = (tx.category || "").toLowerCase().includes(q);
        const matchNotes = (tx.notes || "").toLowerCase().includes(q);
        const matchItems = (tx.items || []).some((it) => (it.name || "").toLowerCase().includes(q));
        if (!matchStore && !matchCat && !matchNotes && !matchItems) return false;
      }

      return true;
    });
  }

  // =========================================================================
  // AI RECEIPT SCANNER & DROPZONE
  // =========================================================================
  elDropzone.addEventListener("click", (e) => {
    if (e.target.closest("button") || e.target.closest("label")) return;
    elFileInput.click();
  });

  elDropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    elDropzone.classList.add("dragover");
  });

  elDropzone.addEventListener("dragleave", () => {
    elDropzone.classList.remove("dragover");
  });

  elDropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    elDropzone.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  elFileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });

  elCameraInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });

  async function handleFileSelected(file) {
    if (!file.type.startsWith("image/")) {
      alert("Silakan pilih file foto atau gambar struk.");
      return;
    }

    // Aktifkan Laser Scan Beam & Audio
    elLaserBeam.style.display = "block";
    window.audioService.playScanSound();
    showToast("🔍 Gemini AI sedang membedah foto struk...");

    try {
      const base64 = await fileToBase64(file);
      const parsedData = await window.geminiService.scanReceipt(base64, file.type);

      elLaserBeam.style.display = "none";
      window.audioService.playCoinSound();

      // Buka Modal Verifikasi
      openVerificationModal(parsedData, base64);
    } catch (err) {
      elLaserBeam.style.display = "none";
      console.error("Scan Error:", err);
      alert("Gagal memindai struk: " + err.message);
    }
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  // =========================================================================
  // VERIFICATION MODAL
  // =========================================================================
  function openVerificationModal(data, receiptImg = null) {
    currentScannedData = data;

    document.getElementById("verify-store").value = data.storeName || "";
    document.getElementById("verify-date").value = data.date || new Date().toISOString().split("T")[0];
    document.getElementById("verify-category").value = data.category || "Makanan & Minuman";
    document.getElementById("verify-total").value = data.totalAmount || 0;
    document.getElementById("verify-payment").value = data.paymentMethod || "Tunai";
    document.getElementById("verify-notes").value = data.notes || "";

    // Render tabel item
    const tbody = document.getElementById("verify-items-tbody");
    if (data.items && data.items.length > 0) {
      tbody.innerHTML = data.items
        .map(
          (it, idx) => `
        <tr>
          <td><input type="text" class="receipt-item-input" value="${escapeHtml(it.name)}" data-item-idx="${idx}" data-field="name" /></td>
          <td><input type="number" class="receipt-item-input" style="width: 50px;" value="${it.qty}" data-item-idx="${idx}" data-field="qty" /></td>
          <td><input type="number" class="receipt-item-input" style="width: 80px;" value="${it.price}" data-item-idx="${idx}" data-field="price" /></td>
        </tr>
      `
        )
        .join("");
    } else {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">Tidak ada rincian per item</td></tr>`;
    }

    openModal(modalVerify);
  }

  document.getElementById("btn-save-verified-tx").addEventListener("click", async () => {
    if (!currentScannedData) return;

    // Ambil nilai terverifikasi dari input
    const storeName = document.getElementById("verify-store").value.trim() || "Toko";
    const date = document.getElementById("verify-date").value || new Date().toISOString().split("T")[0];
    const category = document.getElementById("verify-category").value;
    const totalAmount = Number(document.getElementById("verify-total").value) || 0;
    const paymentMethod = document.getElementById("verify-payment").value;
    const notes = document.getElementById("verify-notes").value.trim();

    const newTx = {
      storeName,
      date,
      category,
      totalAmount,
      paymentMethod,
      notes,
      items: currentScannedData.items || []
    };

    await window.firebaseService.saveTransaction(newTx);

    // Audio SFX Taktil
    window.audioService.playWaxStampSound();
    setTimeout(() => window.audioService.playRegisterDing(), 150);

    closeModal(modalVerify);
    showToast("✨ Transaksi berhasil dicap & disimpan ke buku kas!");
  });

  // =========================================================================
  // VOICE RECORDING HUB
  // =========================================================================
  elHubVoice.addEventListener("click", () => {
    openModal(modalVoice);
    startVoiceRecording();
  });

  async function startVoiceRecording() {
    audioChunks = [];
    const statusText = document.getElementById("voice-status-text");
    const waveBars = document.querySelectorAll(".wave-bar");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        waveBars.forEach((b) => b.classList.remove("active"));
        statusText.textContent = "🧠 Gemini sedang mendengarkan ucapanmu...";

        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const base64Audio = await blobToBase64(audioBlob);

        try {
          const parsed = await window.geminiService.parseVoiceExpense(base64Audio, "audio/webm");
          closeModal(modalVoice);
          openVerificationModal(parsed);
        } catch (err) {
          alert("Gagal memproses suara: " + err.message);
          closeModal(modalVoice);
        }
      };

      mediaRecorder.start();
      waveBars.forEach((b) => b.classList.add("active"));
      statusText.textContent = "🎙️ Sedang merekam... Ucapkan pengeluaranmu!";
    } catch (err) {
      alert("Tidak dapat mengakses mikrofon: " + err.message);
      closeModal(modalVoice);
    }
  }

  document.getElementById("btn-stop-voice").addEventListener("click", () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
  });

  function blobToBase64(blob) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  // =========================================================================
  // MANUAL FAST ADD HUB
  // =========================================================================
  elHubManual.addEventListener("click", () => {
    document.getElementById("manual-date").value = new Date().toISOString().split("T")[0];
    document.getElementById("manual-store").value = "";
    document.getElementById("manual-amount").value = "";
    document.getElementById("manual-notes").value = "";
    openModal(modalManual);
  });

  document.getElementById("form-manual-add").addEventListener("submit", async (e) => {
    e.preventDefault();

    const storeName = document.getElementById("manual-store").value.trim() || "Pengeluaran";
    const totalAmount = Number(document.getElementById("manual-amount").value) || 0;
    const category = document.getElementById("manual-category").value;
    const date = document.getElementById("manual-date").value || new Date().toISOString().split("T")[0];
    const notes = document.getElementById("manual-notes").value.trim();

    if (totalAmount <= 0) {
      alert("Masukkan nominal yang valid.");
      return;
    }

    const tx = {
      storeName,
      totalAmount,
      category,
      date,
      notes,
      paymentMethod: "Tunai",
      items: [{ name: storeName, qty: 1, price: totalAmount, subtotal: totalAmount }]
    };

    await window.firebaseService.saveTransaction(tx);
    window.audioService.playWaxStampSound();
    closeModal(modalManual);
    showToast("📝 Transaksi manual tersimpan.");
  });

  // =========================================================================
  // SETTINGS & EXPORT
  // =========================================================================
  elSettingsBtn.addEventListener("click", () => {
    document.getElementById("setting-budget").value = window.storageService.getBudget();
    document.getElementById("setting-api-key").value = window.geminiService.getApiKey();
    openModal(modalSettings);
  });

  document.getElementById("form-settings").addEventListener("submit", (e) => {
    e.preventDefault();
    const newBudget = Number(document.getElementById("setting-budget").value) || 1500000;
    const newKey = document.getElementById("setting-api-key").value.trim();

    window.storageService.setBudget(newBudget);
    if (newKey) window.geminiService.setApiKey(newKey);

    closeModal(modalSettings);
    window.audioService.playClickSound();
    renderDashboard();
    showToast("⚙️ Pengaturan berhasil diperbarui.");
  });

  elExportCsvBtn.addEventListener("click", () => {
    const csv = window.storageService.exportCSV();
    if (!csv) {
      alert("Belum ada data transaksi untuk diekspor.");
      return;
    }
    downloadFile(csv, "memony_ledger.csv", "text/csv");
  });

  elExportJsonBtn.addEventListener("click", () => {
    const json = window.storageService.exportJSON();
    downloadFile(json, "memony_backup.json", "application/json");
  });

  function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    window.audioService.playClickSound();
    showToast(`📁 Berkas ${fileName} berhasil diunduh.`);
  }

  // =========================================================================
  // FILTER & SEARCH EVENT LISTENERS
  // =========================================================================
  elFilterPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      elFilterPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      currentFilter = pill.getAttribute("data-filter");
      window.audioService.playClickSound();
      renderTransactionList();
    });
  });

  elSearchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    renderTransactionList();
  });

  // Mute Button Toggle
  elMuteBtn.addEventListener("click", () => {
    window.audioService.toggleMute();
    updateMuteButtonUI();
  });

  function updateMuteButtonUI() {
    const isMuted = window.audioService.getMuteState();
    elMuteBtn.innerHTML = isMuted ? "🔇" : "🔔";
    elMuteBtn.title = isMuted ? "Suara Taktil Nonaktif" : "Suara Taktil Aktif";
  }

  // =========================================================================
  // MODAL UTILITIES
  // =========================================================================
  function openModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.add("active");
    window.audioService.playClickSound();

    if (window.anime) {
      window.anime({
        targets: modalEl.querySelector(".modal-box"),
        scale: [0.9, 1],
        opacity: [0, 1],
        easing: "easeOutElastic(1, .8)",
        duration: 500
      });
    }
  }

  function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove("active");
  }

  document.querySelectorAll(".modal-close-btn, .modal-overlay").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target === el || e.target.classList.contains("modal-close-btn")) {
        document.querySelectorAll(".modal-overlay").forEach((m) => m.classList.remove("active"));
      }
    });
  });

  function showToast(msg) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = msg;
    toastContainer.appendChild(toast);

    if (window.anime) {
      window.anime({
        targets: toast,
        translateX: [40, 0],
        opacity: [0, 1],
        duration: 400,
        easing: "easeOutCubic"
      });
    }

    setTimeout(() => {
      if (window.anime) {
        window.anime({
          targets: toast,
          opacity: [1, 0],
          translateX: [0, 40],
          duration: 300,
          easing: "easeInCubic",
          complete: () => toast.remove()
        });
      } else {
        toast.remove();
      }
    }, 3200);
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Jalankan Aplikasi
  initApp();
});
