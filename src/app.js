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

  // Modals
  const modalVerify = document.getElementById("modal-verify-scan");
  const modalSettings = document.getElementById("modal-settings");
  const toastContainer = document.getElementById("toast-container");

  // =========================================================================
  // INITIALIZATION
  // =========================================================================
  function initApp() {
    // 0. Pastikan Scroll Selalu Bersih di Paling Atas (Laptop Viewport Safe)
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);

    // 1. Inisialisasi Firebase
    const fbConnected = window.firebaseService.init();

    // 2. Pasang Listener Transaksi Realtime (atau fallback ke local)
    window.firebaseService.subscribeToTransactions((data) => {
      transactions = data || [];
      renderDashboard();
    });

    // 3. Update Status Tombol Mute
    updateMuteButtonUI();

    // 4. Inisialisasi Tab Navigation System
    initTabs();

    // 5. Inisialisasi Three.js 3D Royal Coin (Centerpiece WebGL)
    if (window.coin3dService) {
      window.coin3dService.init("hero-3d-canvas-container");
    }

    // 6. Inisialisasi 3D Bento Card Tilt & Sheen (Puma/Adidas style)
    init3DCardTilt();

    // 7. Inisialisasi Tactile Buttons
    initMagneticButtons();

    // 8. Inisialisasi Service Worker untuk PWA
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js?v=9").catch(() => {});
    }

    // 9. Animasi Pembuka Halaman Kinetik
    if (window.anime) {
      window.anime({
        targets: ".app-header, .tabs-nav-bar, .tab-pane.active",
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 900,
        delay: window.anime.stagger(120),
        easing: "easeOutCubic"
      });
    }
  }

  // =========================================================================
  // TABS NAVIGATION CONTROLLER
  // =========================================================================
  function initTabs() {
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabPanes = document.querySelectorAll(".tab-pane");

    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetTabId = btn.getAttribute("data-tab");
        if (!targetTabId) return;

        // Reset scroll ke atas seketika agar header tidak terpotong
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });

        tabButtons.forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        tabPanes.forEach((p) => p.classList.remove("active"));

        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");
        window.audioService.playClickSound();

        const targetPane = document.getElementById(targetTabId);
        if (targetPane) {
          targetPane.classList.add("active");
          if (window.anime) {
            window.anime({
              targets: targetPane,
              opacity: [0, 1],
              translateY: [12, 0],
              duration: 350,
              easing: "easeOutCubic"
            });
          }

          // If switching to Vault & Ledger tab, trigger Three.js resize and Donut Chart redraw
          if (targetTabId === "tab-ledger") {
            if (window.coin3dService && window.coin3dService.resize) {
              setTimeout(() => window.coin3dService.resize(), 60);
            }
            if (window.chartService && window.chartService.renderCategoryChart) {
              const todayStr = new Date().toISOString().split("T")[0];
              const currentYearMonth = todayStr.substring(0, 7);
              const thisMonthTxs = transactions.filter((t) => (t.date || "").startsWith(currentYearMonth));
              window.chartService.renderCategoryChart("category-chart-container", thisMonthTxs);
            }
          }
        }
      });
    });
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

    // Update Header Numbers with Kinetic Rolling Counter (Anime.js)
    if (window.anime) {
      const currentSpent = parseInt(elTotalSpent.getAttribute("data-val") || "0", 10);
      const currentRemain = parseInt(elBudgetRemaining.getAttribute("data-val") || String(monthlyBudget), 10);
      const currentPct = parseInt(elBudgetPercent.getAttribute("data-val") || "0", 10);

      const counterState = {
        spent: currentSpent,
        remain: currentRemain,
        percent: currentPct
      };

      window.anime({
        targets: counterState,
        spent: totalSpentThisMonth,
        remain: remainingBudget,
        percent: percentUsed,
        round: 1,
        duration: 900,
        easing: "easeOutExpo",
        update: () => {
          elTotalSpent.textContent = "Rp " + Math.round(counterState.spent).toLocaleString("id-ID");
          elBudgetRemaining.textContent = "Sisa: Rp " + Math.round(counterState.remain).toLocaleString("id-ID");
          elBudgetPercent.textContent = Math.round(counterState.percent) + "%";
        }
      });

      elTotalSpent.setAttribute("data-val", totalSpentThisMonth);
      elBudgetRemaining.setAttribute("data-val", remainingBudget);
      elBudgetPercent.setAttribute("data-val", percentUsed);
    } else {
      elTotalSpent.textContent = "Rp " + totalSpentThisMonth.toLocaleString("id-ID");
      elBudgetRemaining.textContent = "Sisa: Rp " + remainingBudget.toLocaleString("id-ID");
      elBudgetPercent.textContent = percentUsed + "%";
    }

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
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-del-id");
        if (confirm("Apakah kamu yakin ingin menghapus catatan transaksi ini dari buku kas & cloud?")) {
          await window.firebaseService.deleteTransaction(id);
          transactions = window.storageService.getTransactions();
          renderDashboard();
          window.audioService.playClickSound();
          showToast("🗑️ Catatan transaksi telah dihapus dari lokal & cloud.");
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
  // Window-level drop protection to prevent accidental browser navigation
  window.addEventListener("dragover", (e) => e.preventDefault(), false);
  window.addEventListener("drop", (e) => e.preventDefault(), false);

  if (elDropzone) {
    elDropzone.addEventListener("click", (e) => {
      if (e.target.closest("button") || e.target.closest("label") || e.target.closest("input")) return;
      elFileInput.click();
    });

    elDropzone.addEventListener("dragenter", (e) => {
      e.preventDefault();
      elDropzone.classList.add("drag-active");
    });

    elDropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      elDropzone.classList.add("drag-active");
    });

    elDropzone.addEventListener("dragleave", (e) => {
      if (!elDropzone.contains(e.relatedTarget)) {
        elDropzone.classList.remove("drag-active");
      }
    });

    elDropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      elDropzone.classList.remove("drag-active");
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileSelected(e.dataTransfer.files[0]);
      }
    });
  }

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
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // =========================================================================
  // VERIFICATION MODAL & OPTIMISTIC INSTANT SAVE
  // =========================================================================
  function openVerificationModal(data, imageBase64 = null) {
    currentScannedData = {
      ...data,
      receiptImage: imageBase64
    };

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

    if (btnSaveVerified) {
      btnSaveVerified.disabled = false;
      btnSaveVerified.textContent = "🌸 Cap & Simpan ke Buku Kas";
    }

    openModal(modalVerify);
  }

  const btnSaveVerified = document.getElementById("btn-save-verified-tx");
  if (btnSaveVerified) {
    btnSaveVerified.addEventListener("click", async (e) => {
      e.preventDefault();
      if (btnSaveVerified.disabled) return;
      btnSaveVerified.disabled = true;

      // Ambil nilai terverifikasi dari elemen input langsung
      const storeName = document.getElementById("verify-store")?.value.trim() || "Toko";
      const date = document.getElementById("verify-date")?.value || new Date().toISOString().split("T")[0];
      const category = document.getElementById("verify-category")?.value || "Makanan & Minuman";
      const totalAmount = Number(document.getElementById("verify-total")?.value) || 0;
      const paymentMethod = document.getElementById("verify-payment")?.value.trim() || "Tunai";
      const notes = document.getElementById("verify-notes")?.value.trim() || "";

      // Ekstrak rincian item dari tabel DOM (mengakomodasi editan manual pengguna)
      const items = [];
      const itemRows = document.querySelectorAll("#verify-items-tbody tr");
      itemRows.forEach((row) => {
        const nameInput = row.querySelector('[data-field="name"]');
        const qtyInput = row.querySelector('[data-field="qty"]');
        const priceInput = row.querySelector('[data-field="price"]');
        if (nameInput) {
          const name = nameInput.value.trim();
          const qty = Math.max(1, Number(qtyInput?.value) || 1);
          const price = Math.max(0, Number(priceInput?.value) || 0);
          if (name) {
            items.push({ name, qty, price, subtotal: price * qty });
          }
        }
      });

      // Fallback item jika tabel kosong
      if (items.length === 0 && currentScannedData && Array.isArray(currentScannedData.items) && currentScannedData.items.length > 0) {
        items.push(...currentScannedData.items);
      }
      if (items.length === 0 && totalAmount > 0) {
        items.push({ name: storeName, qty: 1, price: totalAmount, subtotal: totalAmount });
      }

      const newTx = {
        storeName,
        date,
        category,
        totalAmount,
        paymentMethod,
        notes,
        items,
        receiptImage: currentScannedData?.receiptImage || null
      };

      // Optimistic Instant-Close: tutup modal seketika (0ms) & bersihkan data scan
      currentScannedData = null;
      closeModal(modalVerify);

      // Audio SFX Taktil
      window.audioService.playWaxStampSound();
      setTimeout(() => window.audioService.playRegisterDing(), 150);
      showToast("✨ Transaksi berhasil dicap & masuk ke Buku Kas!");

      try {
        await window.firebaseService.saveTransaction(newTx);
      } catch (err) {
        console.error("Gagal simpan transaksi:", err);
      } finally {
        // Selalu sinkronkan state transaksi & perbarui tampilan Vault
        transactions = window.storageService.getTransactions();
        renderDashboard();
        btnSaveVerified.disabled = false;
        btnSaveVerified.textContent = "🌸 Cap & Simpan ke Buku Kas";
      }
    });
  }

  // =========================================================================
  // VOICE RECORDING STATION (Dedicated In-Tab Curhat Suara)
  // =========================================================================
  let voiceTimerInterval = null;
  let voiceSeconds = 0;
  let currentAudioBlob = null;
  let currentBase64Audio = null;
  let voiceAudioCtx = null;
  let voiceAnalyser = null;
  let voiceAnimFrame = null;

  const phaseStandby = document.getElementById("voice-standby-phase");
  const phaseRecording = document.getElementById("voice-recording-phase");
  const phasePreview = document.getElementById("voice-preview-phase");
  const phaseProcessing = document.getElementById("voice-processing-phase");
  const elVoiceTimer = document.getElementById("voice-timer-display");
  const elAudioPreview = document.getElementById("voice-audio-preview");
  const btnStartVoiceTab = document.getElementById("btn-start-voice-tab");
  const btnStopVoice = document.getElementById("btn-stop-voice");
  const btnReRecordVoice = document.getElementById("btn-re-record-voice");
  const btnSubmitVoice = document.getElementById("btn-submit-voice");

  if (btnStartVoiceTab) {
    btnStartVoiceTab.addEventListener("click", () => {
      startVoiceRecording();
    });
  }

  function resetVoiceUI() {
    if (voiceTimerInterval) {
      clearInterval(voiceTimerInterval);
      voiceTimerInterval = null;
    }
    if (voiceAnimFrame) {
      cancelAnimationFrame(voiceAnimFrame);
      voiceAnimFrame = null;
    }
    if (voiceAudioCtx && voiceAudioCtx.state !== "closed") {
      voiceAudioCtx.close().catch(() => {});
      voiceAudioCtx = null;
    }
    voiceAnalyser = null;

    const waveBars = document.querySelectorAll(".wave-bar");
    waveBars.forEach((b) => {
      b.classList.remove("active");
      b.style.transform = "";
    });

    voiceSeconds = 0;
    currentAudioBlob = null;
    currentBase64Audio = null;
    if (elAudioPreview) {
      elAudioPreview.pause();
      elAudioPreview.src = "";
    }
    if (phaseStandby) phaseStandby.style.display = "block";
    if (phaseRecording) phaseRecording.style.display = "none";
    if (phasePreview) phasePreview.style.display = "none";
    if (phaseProcessing) phaseProcessing.style.display = "none";
    if (btnSubmitVoice) {
      btnSubmitVoice.disabled = false;
      btnSubmitVoice.textContent = "✨ Analisis dengan AI";
    }
    if (elVoiceTimer) elVoiceTimer.textContent = "00:00";
  }

  async function startVoiceRecording() {
    resetVoiceUI();
    if (phaseStandby) phaseStandby.style.display = "none";
    if (phaseRecording) phaseRecording.style.display = "block";
    audioChunks = [];
    const waveBars = document.querySelectorAll(".wave-bar");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Pasang Web Audio API Analyser untuk visualisasi volume suara nyata
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        try {
          voiceAudioCtx = new AudioContextClass();
          const source = voiceAudioCtx.createMediaStreamSource(stream);
          voiceAnalyser = voiceAudioCtx.createAnalyser();
          voiceAnalyser.fftSize = 64;
          source.connect(voiceAnalyser);

          const freqData = new Uint8Array(voiceAnalyser.frequencyBinCount);
          const updateVolumeMeter = () => {
            if (!voiceAnalyser) return;
            voiceAnalyser.getByteFrequencyData(freqData);
            let sum = 0;
            for (let i = 0; i < freqData.length; i++) {
              sum += freqData[i];
            }
            const avg = sum / freqData.length;
            // Skala dinamis 0.4 sampai 2.4 sesuai keras-lemahnya suara
            const baseScale = Math.max(0.4, Math.min(2.4, avg / 22));
            waveBars.forEach((bar, idx) => {
              const barScale = Math.max(0.35, baseScale * (0.75 + (idx % 3) * 0.25));
              bar.style.transform = `scaleY(${barScale.toFixed(2)})`;
            });
            voiceAnimFrame = requestAnimationFrame(updateVolumeMeter);
          };
          updateVolumeMeter();
        } catch (ctxErr) {
          console.warn("Analyser mic tidak aktif:", ctxErr);
        }
      }

      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (voiceAnimFrame) {
          cancelAnimationFrame(voiceAnimFrame);
          voiceAnimFrame = null;
        }
        if (voiceAudioCtx && voiceAudioCtx.state !== "closed") {
          voiceAudioCtx.close().catch(() => {});
          voiceAudioCtx = null;
        }
        voiceAnalyser = null;

        // Hentikan stream mikrofon agar icon mic browser mati
        stream.getTracks().forEach((track) => track.stop());
        waveBars.forEach((b) => {
          b.classList.remove("active");
          b.style.transform = "";
        });
        if (voiceTimerInterval) clearInterval(voiceTimerInterval);

        currentAudioBlob = new Blob(audioChunks, { type: "audio/webm" });
        currentBase64Audio = await blobToBase64(currentAudioBlob);

        // Tampilkan Fase 2: Preview Audio
        if (elAudioPreview && currentAudioBlob) {
          const audioUrl = URL.createObjectURL(currentAudioBlob);
          elAudioPreview.src = audioUrl;
        }

        if (phaseRecording) phaseRecording.style.display = "none";
        if (phasePreview) phasePreview.style.display = "block";
        if (phaseProcessing) phaseProcessing.style.display = "none";
        window.audioService.playClickSound();
      };

      // Mulai dengan timeslice 200ms agar data di-buffer secara terus-menerus
      mediaRecorder.start(200);
      waveBars.forEach((b) => b.classList.add("active"));
      window.audioService.playClickSound();

      // Timer durasi rekaman langsung
      voiceSeconds = 0;
      voiceTimerInterval = setInterval(() => {
        voiceSeconds++;
        const mins = String(Math.floor(voiceSeconds / 60)).padStart(2, "0");
        const secs = String(voiceSeconds % 60).padStart(2, "0");
        if (elVoiceTimer) elVoiceTimer.textContent = `${mins}:${secs}`;
      }, 1000);

    } catch (err) {
      alert("Tidak dapat mengakses mikrofon: " + err.message);
      resetVoiceUI();
    }
  }

  // Tombol Selesai Merekam
  if (btnStopVoice) {
    btnStopVoice.addEventListener("click", () => {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        window.audioService.playClickSound();
      }
    });
  }

  // Tombol Rekam Ulang
  if (btnReRecordVoice) {
    btnReRecordVoice.addEventListener("click", () => {
      window.audioService.playClickSound();
      startVoiceRecording();
    });
  }

  // Tombol Kirim ke AI (Full Power AI Analysis)
  if (btnSubmitVoice) {
    btnSubmitVoice.addEventListener("click", async () => {
      if (!currentBase64Audio || btnSubmitVoice.disabled) return;

      // Validasi rekaman audio kosong atau terlalu pendek (di bawah 2KB atau 1 detik)
      if (!currentAudioBlob || currentAudioBlob.size < 2000 || voiceSeconds < 1) {
        showToast("⚠️ Rekaman kosong atau terlalu singkat. Pastikan mic aktif dan coba rekam ulang!", "danger");
        return;
      }

      // Kunci tombol agar anti-spam
      btnSubmitVoice.disabled = true;
      window.audioService.playClickSound();

      // Tampilkan Fase 3: AI Processing State
      if (phaseRecording) phaseRecording.style.display = "none";
      if (phasePreview) phasePreview.style.display = "none";
      if (phaseProcessing) phaseProcessing.style.display = "block";

      try {
        const audioMime = (currentAudioBlob && currentAudioBlob.type) || "audio/webm";
        const parsed = await window.geminiService.parseVoiceExpense(currentBase64Audio, audioMime);
        resetVoiceUI();
        if (parsed.transcription) {
          showToast(`🎧 Didengar: "${parsed.transcription}"`);
        }
        openVerificationModal(parsed);
      } catch (err) {
        alert("Gagal memproses suara: " + err.message);
        if (phaseProcessing) phaseProcessing.style.display = "none";
        if (phasePreview) phasePreview.style.display = "block";
        btnSubmitVoice.disabled = false;
      }
    });
  }

  function blobToBase64(blob) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  // =========================================================================
  // MANUAL FAST ADD STATION (Dedicated In-Tab Form)
  // =========================================================================
  const formManual = document.getElementById("form-manual-add");
  if (formManual) {
    const elManualDate = document.getElementById("manual-date");
    if (elManualDate) {
      elManualDate.value = new Date().toISOString().split("T")[0];
    }

    formManual.addEventListener("submit", async (e) => {
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

      // Optimistic instant reset
      document.getElementById("manual-store").value = "";
      document.getElementById("manual-amount").value = "";
      document.getElementById("manual-notes").value = "";

      // Audio & feedback
      window.audioService.playWaxStampSound();
      setTimeout(() => window.audioService.playRegisterDing(), 150);
      showToast("📝 Transaksi manual tersimpan ke buku kas!");

      try {
        await window.firebaseService.saveTransaction(tx);
      } catch (err) {
        console.error("Gagal simpan transaksi manual:", err);
      } finally {
        transactions = window.storageService.getTransactions();
        renderDashboard();
      }
    });
  }

  // =========================================================================
  // SETTINGS & EXPORT
  // =========================================================================
  const elApiKeyStatus = document.getElementById("api-key-status");
  const elApiKeyInput = document.getElementById("setting-api-key");
  const elBtnClearKey = document.getElementById("btn-clear-api-key");

  function updateApiKeyStatusUI() {
    if (!elApiKeyStatus || !elApiKeyInput) return;
    const hasKey = window.geminiService.hasApiKey();
    if (hasKey) {
      elApiKeyStatus.className = "api-key-status-badge status-active";
      elApiKeyStatus.innerHTML = `<span>🟢 Kunci Gemini AI Terhubung</span><span style="font-size:11px; opacity:0.85;">Tersimpan Lokal</span>`;
      elApiKeyInput.placeholder = "Ketik kunci baru jika ingin mengganti...";
      elApiKeyInput.value = "";
      if (elBtnClearKey) elBtnClearKey.style.display = "inline-flex";
    } else {
      elApiKeyStatus.className = "api-key-status-badge status-empty";
      elApiKeyStatus.innerHTML = `<span>⚪ Belum Ada Kunci API</span><span style="font-size:11px; opacity:0.85;">Fitur AI Nonaktif</span>`;
      elApiKeyInput.placeholder = "Tempel Google Gemini API Key di sini...";
      elApiKeyInput.value = "";
      if (elBtnClearKey) elBtnClearKey.style.display = "none";
    }
  }

  elSettingsBtn.addEventListener("click", () => {
    document.getElementById("setting-budget").value = window.storageService.getBudget();
    const elModelSelect = document.getElementById("setting-gemini-model");
    if (elModelSelect) {
      elModelSelect.value = window.geminiService.getModel();
    }
    updateApiKeyStatusUI();
    openModal(modalSettings);
  });

  if (elBtnClearKey) {
    elBtnClearKey.addEventListener("click", () => {
      if (confirm("Hapus kunci API dari penyimpanan browser lokal?")) {
        window.geminiService.removeApiKey();
        updateApiKeyStatusUI();
        window.audioService.playClickSound();
        showToast("🗑️ Kunci API berhasil dihapus.");
      }
    });
  }

  document.getElementById("form-settings").addEventListener("submit", (e) => {
    e.preventDefault();
    const newBudget = Number(document.getElementById("setting-budget").value) || 1500000;
    const newKey = elApiKeyInput.value.trim();
    const elModelSelect = document.getElementById("setting-gemini-model");
    const newModel = elModelSelect ? elModelSelect.value : null;

    window.storageService.setBudget(newBudget);
    if (newKey) {
      window.geminiService.setApiKey(newKey);
      elApiKeyInput.value = "";
    }
    if (newModel) {
      window.geminiService.setModel(newModel);
      const badge = document.querySelector(".brand-badge");
      if (badge) {
        badge.textContent = newModel.includes("lite") ? "Gemini Flash Lite" : "Gemini Flash";
      }
    }

    updateApiKeyStatusUI();
    closeModal(modalSettings);
    window.audioService.playClickSound();
    renderDashboard();
    showToast("⚙️ Pengaturan & Model AI berhasil diperbarui.");
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

  // =========================================================================
  // 3D KINETIC PHYSICS (Puma & Adidas Athletic Style)
  // =========================================================================
  function init3DCardTilt() {
    // Sheen & tilt hanya untuk centerpiece 3D coin stage agar form & station tetap stabil
    const tiltCards = document.querySelectorAll("#coin-stage-card.bento-card-tilt");
    tiltCards.forEach((card) => {
      if (!card.querySelector(".card-sheen-overlay")) {
        const sheen = document.createElement("div");
        sheen.className = "card-sheen-overlay";
        card.appendChild(sheen);
      }

      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -6.5;
        const rotateY = ((x - centerX) / centerX) * 6.5;

        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.015, 1.015, 1.015)`;
        card.style.setProperty("--sheen-x", `${(x / rect.width) * 100}%`);
        card.style.setProperty("--sheen-y", `${(y / rect.height) * 100}%`);
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
      });
    });
  }

  function initMagneticButtons() {
    // Duolingo Tactile buttons mengandalkan CSS :active push-down murni untuk sensasi renyah tanpa jitter
  }

  // Jalankan Aplikasi
  initApp();
});
