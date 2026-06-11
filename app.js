// ============================================================
// Mock Data — ข้อมูลจำลอง (ไม่มีการเชื่อมต่อ database จริง)
// historicalData = การใช้ไฟราย ชม. ย้อนหลัง 24 จุด (kWh)
// ============================================================

const timestamps = [
  "00:00", "01:00", "02:00", "03:00", "04:00", "05:00",
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00", "22:00", "23:00",
];

const baseZones = [
  {
    zoneName: "Zone A - Production Line 1",
    currentUsage: 385,
    maxThreshold: 500,
    historicalData: [320, 310, 305, 300, 310, 330, 380, 420, 440, 450, 445, 440,
                     430, 435, 430, 440, 445, 450, 420, 400, 380, 360, 340, 385],
  },
  {
    zoneName: "Zone B - Production Line 2",
    currentUsage: 612,   // เกิน threshold -> Critical (ตัวที่ทำให้กราฟ spike)
    maxThreshold: 550,
    historicalData: [340, 335, 330, 325, 330, 350, 400, 450, 470, 480, 760, 790,
                     480, 470, 465, 470, 690, 480, 460, 440, 420, 400, 380, 612],
  },
  {
    zoneName: "Zone C - Warehouse",
    currentUsage: 175,
    maxThreshold: 250,
    historicalData: [120, 115, 110, 110, 115, 130, 160, 180, 190, 195, 190, 185,
                     180, 185, 180, 185, 190, 195, 180, 170, 160, 150, 140, 175],
  },
  {
    zoneName: "Zone D - Boiler / Utility",
    currentUsage: 335,   // 95.7% ของ threshold -> Warning
    maxThreshold: 350,
    historicalData: [280, 275, 270, 270, 275, 285, 300, 315, 320, 325, 330, 330,
                     325, 330, 328, 330, 335, 338, 330, 320, 310, 300, 290, 335],
  },
  {
    zoneName: "Zone E - Office Building",
    currentUsage: 82,
    maxThreshold: 200,
    historicalData: [40, 38, 36, 35, 36, 40, 60, 110, 140, 150, 148, 145,
                     130, 145, 142, 140, 138, 120, 90, 70, 60, 55, 50, 82],
  },
];

// ============================================================
// Simulated data per date — สุ่มแบบ deterministic (วันเดิม = ข้อมูลเดิม)
// วันที่ 2026-06-11 ใช้ข้อมูล baseZones ตรง ๆ (วัน demo)
// ============================================================

const BASE_DATE = "2026-06-11";

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function generateZonesForDate(dateStr) {
  if (dateStr === BASE_DATE) return baseZones;

  const day = new Date(dateStr + "T00:00:00").getDay();
  const isWeekend = day === 0 || day === 6;

  return baseZones.map(base => {
    const rand = mulberry32(hashString(dateStr + "|" + base.zoneName));

    // ระดับการใช้ไฟของวันนั้น: วันธรรมดา ±10%, วันหยุดลดเหลือ 60–75%
    const levelFactor = isWeekend
      ? 0.6 + rand() * 0.15
      : 0.9 + rand() * 0.2;

    // บางวันมี spike 1–2 ชั่วโมง (โอกาส ~25%) เพื่อให้เกิด Warning/Critical บ้าง
    const spikeHours = new Set();
    if (rand() < 0.25) {
      const count = 1 + Math.floor(rand() * 2);
      for (let i = 0; i < count; i++) {
        spikeHours.add(6 + Math.floor(rand() * 16)); // ช่วง 06:00–21:00
      }
    }

    const historicalData = base.historicalData.map((v, i) => {
      const noise = 0.94 + rand() * 0.12;            // ±6% ต่อชั่วโมง
      const spike = spikeHours.has(i) ? 1.5 + rand() * 0.3 : 1;
      return Math.round(v * levelFactor * noise * spike);
    });

    return {
      zoneName: base.zoneName,
      maxThreshold: base.maxThreshold,
      historicalData,
      currentUsage: historicalData[23],
    };
  });
}

let zones = generateZonesForDate(BASE_DATE);

// ============================================================
// Status logic — สถานะคำนวณจากตัวเลข ไม่ hardcode
//   Critical : ใช้ไฟเกิน threshold
//   Warning  : ใช้ไฟ >= 80% ของ threshold
//   Normal   : ต่ำกว่านั้น
// ============================================================

function getStatus(zone) {
  if (zone.currentUsage > zone.maxThreshold) return "Critical";
  if (zone.currentUsage >= zone.maxThreshold * 0.8) return "Warning";
  return "Normal";
}

const statusIcon = { Normal: "●", Warning: "▲", Critical: "✖" };
const statusBadgeClass = {
  Normal: "badge-success",
  Warning: "badge-warning",
  Critical: "badge-error",
};

// ============================================================
// Render: Summary Cards
// ============================================================

function renderSummary() {
  const totalUsage = zones.reduce(
    (sum, z) => sum + z.historicalData.reduce((s, v) => s + v, 0), 0);
  const criticalCount = zones.filter(z => getStatus(z) === "Critical").length;

  document.getElementById("totalUsage").textContent = totalUsage.toLocaleString();
  document.getElementById("criticalCount").textContent = criticalCount;
  document.getElementById("zoneCount").textContent = zones.length;

  const criticalCard = document.getElementById("criticalCard");
  criticalCard.classList.toggle("border-error", criticalCount > 0);
  criticalCard.classList.toggle("bg-error/10", criticalCount > 0);
  document.getElementById("criticalCount")
    .classList.toggle("text-error", criticalCount > 0);
}

// ============================================================
// Render: Trend Chart (ผลรวมทุกโซนต่อชั่วโมง + เส้น threshold รวม)
// ============================================================

let trendChart = null;

function renderChart() {
  const hourlyTotals = timestamps.map((_, i) =>
    zones.reduce((sum, z) => sum + z.historicalData[i], 0));
  const totalThreshold = zones.reduce((sum, z) => sum + z.maxThreshold, 0);

  if (trendChart) {
    trendChart.data.datasets[0].data = hourlyTotals;
    trendChart.data.datasets[1].data = timestamps.map(() => totalThreshold);
    trendChart.update();
    return;
  }

  trendChart = new Chart(document.getElementById("trendChart"), {
    type: "line",
    data: {
      labels: timestamps,
      datasets: [
        {
          label: "Total Usage (kWh)",
          data: hourlyTotals,
          borderColor: "#38bdf8",
          backgroundColor: "rgba(56, 189, 248, 0.15)",
          fill: true,
          tension: 0.3,
        },
        {
          label: "Total Threshold",
          data: timestamps.map(() => totalThreshold),
          borderColor: "#ef4444",
          borderDash: [6, 6],
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: "#cbd5e1" } } },
      scales: {
        x: { ticks: { color: "#94a3b8" }, grid: { color: "#334155" } },
        y: { ticks: { color: "#94a3b8" }, grid: { color: "#334155" } },
      },
    },
  });
}

// ============================================================
// Render: Zone Status Table
// ============================================================

function renderZoneTable() {
  const tbody = document.getElementById("zoneTableBody");
  tbody.innerHTML = "";

  const statusOrder = { Critical: 0, Warning: 1, Normal: 2 };
  const sortedZones = [...zones].sort(
    (a, b) => statusOrder[getStatus(a)] - statusOrder[getStatus(b)]
  );

  sortedZones.forEach(zone => {
    const status = getStatus(zone);
    const percent = (zone.currentUsage / zone.maxThreshold) * 100;

    const tr = document.createElement("tr");
    tr.className = "hover:bg-base-200";
    tr.innerHTML = `
      <td>${zone.zoneName}</td>
      <td class="text-right">${zone.currentUsage.toLocaleString()}</td>
      <td class="text-right">${zone.maxThreshold.toLocaleString()}</td>
      <td class="text-right">${percent.toFixed(1)}%</td>
      <td><span class="badge badge-soft ${statusBadgeClass[status]}">${statusIcon[status]} ${status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// ============================================================
// Init
// ============================================================

function renderAll() {
  renderSummary();
  renderChart();
  renderZoneTable();
}

document.getElementById("datePicker").addEventListener("change", e => {
  if (!e.target.value) return;
  zones = generateZonesForDate(e.target.value);
  renderAll();
});

renderAll();
