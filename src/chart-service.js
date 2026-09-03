/**
 * Memony Interactive Visual Charts (SVG & Anime.js)
 * -------------------------------------------------------------
 * Visualisasi alur keuangan berestetika Warm Studio Modern.
 * Menghitung proporsi kategori pengeluaran dan merender SVG Donut Chart interaktif.
 */

class ChartService {
  constructor() {
    this.colors = {
      "Makanan & Minuman": "#e67e22", // Warm Amber Orange
      "Belanja & Kebutuhan": "#3498db", // Slate Blue
      "Transportasi": "#9b59b6", // Amethyst Purple
      "Pendidikan & RPL": "#1abc9c", // Emerald Teal
      "Hiburan & Hobi": "#e74c3c", // Ruby Red
      "Lainnya": "#95a5a6" // Neutral Slate
    };
  }

  getColor(category) {
    return this.colors[category] || "#b8860b";
  }

  renderCategoryDonut(containerId, transactions) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!transactions || transactions.length === 0) {
      container.innerHTML = `
        <div class="empty-chart-state">
          <div class="empty-icon">🪙</div>
          <p>Belum ada catatan transaksi di periode ini.</p>
        </div>
      `;
      return;
    }

    // 1. Hitung total per kategori
    const categoryTotals = {};
    let grandTotal = 0;

    transactions.forEach((tx) => {
      const cat = tx.category || "Lainnya";
      const amt = Number(tx.totalAmount) || 0;
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
      grandTotal += amt;
    });

    if (grandTotal === 0) {
      container.innerHTML = `
        <div class="empty-chart-state">
          <p>Total pengeluaran saat ini Rp 0.</p>
        </div>
      `;
      return;
    }

    // 2. Buat Slice SVG Donut
    const size = 200;
    const center = size / 2;
    const radius = 75;
    const strokeWidth = 26;
    const circumference = 2 * Math.PI * radius;

    let accumulatedAngle = 0;
    const slices = [];
    const legendItems = [];

    const sortedCats = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

    sortedCats.forEach(([cat, amount], index) => {
      const percentage = (amount / grandTotal) * 100;
      const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
      const strokeDashoffset = -accumulatedAngle;
      accumulatedAngle += (percentage / 100) * circumference;

      const color = this.getColor(cat);

      slices.push(`
        <circle 
          class="donut-segment" 
          cx="${center}" 
          cy="${center}" 
          r="${radius}" 
          fill="transparent" 
          stroke="${color}" 
          stroke-width="${strokeWidth}" 
          stroke-dasharray="${strokeDasharray}" 
          stroke-dashoffset="${strokeDashoffset}"
          data-category="${cat}"
          data-amount="${amount}"
          data-percentage="${percentage.toFixed(1)}"
          transform="rotate(-90 ${center} ${center})"
        />
      `);

      legendItems.push(`
        <div class="chart-legend-item" data-cat="${cat}">
          <span class="legend-dot" style="background-color: ${color}"></span>
          <span class="legend-label">${cat}</span>
          <span class="legend-val">Rp ${amount.toLocaleString("id-ID")}</span>
          <span class="legend-pct">(${percentage.toFixed(1)}%)</span>
        </div>
      `);
    });

    const formattedTotal = "Rp " + grandTotal.toLocaleString("id-ID");

    container.innerHTML = `
      <div class="donut-chart-wrapper">
        <div class="donut-svg-container">
          <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="donut-svg">
            <circle cx="${center}" cy="${center}" r="${radius}" fill="transparent" stroke="#f0e6d6" stroke-width="${strokeWidth}" />
            ${slices.join("")}
          </svg>
          <div class="donut-center-info">
            <span class="donut-center-label">Total Keluar</span>
            <span class="donut-center-value">${formattedTotal}</span>
          </div>
        </div>
        <div class="chart-legend-list">
          ${legendItems.join("")}
        </div>
      </div>
    `;

    // 3. Tambahkan Animasi Spring dengan Anime.js jika tersedia
    if (window.anime) {
      window.anime({
        targets: `#${containerId} .donut-segment`,
        opacity: [0, 1],
        strokeDashoffset: [
          (el) => {
            return parseFloat(el.getAttribute("stroke-dashoffset")) + 50;
          },
          (el) => el.getAttribute("stroke-dashoffset")
        ],
        easing: "easeOutElastic(1, .8)",
        duration: 900,
        delay: window.anime.stagger(80)
      });
    }
  }
}

window.chartService = new ChartService();
