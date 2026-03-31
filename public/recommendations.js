

const MONTH_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

function summarizeProjection(projections, key) {
  const values = projections
    .map((proj) => proj[key])
    .filter((value) => value !== null && value !== undefined && !isNaN(value));

  if (!values.length) return null;

  const sum = values.reduce((total, value) => total + value, 0);
  return {
    avg: sum / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function projectionAssessment(label, summary, config) {
  if (!summary) return null;

  const { avg, min, max } = summary;
  const status = config.getStatus(avg);
  const text = config.getText(avg);
  const formattedAvg = config.format(avg);
  const formattedMin = config.format(min);
  const formattedMax = config.format(max);

  return assessmentCard(
    label,
    `${formattedAvg} rata-rata proyeksi 6 bulan · rentang ${formattedMin} - ${formattedMax}.
     ${text}`,
    status
  );
}

function renderRecommendations() {
  const container = document.getElementById('recommendation-content');
  if (!container) return;

  const result = mlPredict();
  const currentReadings = window.latestReadings || {};

  if (!result.features) {
    container.innerHTML = '<p class="rec-waiting">Menunggu data sensor untuk memulai prediksi...</p>';
    return;
  }

  const { predictions, features, projections, dataPointCount, currentMonth } = result;
  const now = new Date();
  const harvestMonth = (currentMonth + 6) % 12;

  let html = '';

  // ── ML Status Bar ──────────────────────────────────────────
  let weatherHtml = '';
  if (window.weatherData) {
    const w = window.weatherData;
    weatherHtml = `<span class="ml-weather" title="Prediksi cuaca membantu antisipasi (Open-Meteo)">
      <span>${w.city}: ${w.desc} (${w.temp}°C)</span>
    </span>`;
  } else {
    weatherHtml = `<span class="ml-weather" title="Konfigurasi di config.js untuk prediksi cuaca" style="opacity:0.6">
      <span>Cuaca tidak terhubung</span>
    </span>`;
  }

  // Only Admin can see dataset controls and counts
  const isAdmin = currentUser && currentUser.role === 'admin';
  const downloadBtn = isAdmin 
    ? `<button class="btn btn-outline btn-sm" style="padding:2px 6px; font-size:10px; margin-left:6px" onclick="mlExportDataset()">Unduh CSV</button>` 
    : '';
  const dataCountHtml = isAdmin
    ? `<span class="ml-data-count">
          ${dataPointCount} set data terkumpul
          ${downloadBtn}
        </span>`
    : '';

  html += `
    <div class="ml-status-bar">
      <div class="ml-status-left">
        <span class="ml-badge">ML Model</span>
        ${dataCountHtml}
        ${weatherHtml}
      </div>
      <div class="ml-status-right">
        <span class="ml-period">Tanam: <strong>${MONTH_NAMES[currentMonth]} ${now.getFullYear()}</strong></span>
        <span class="ml-arrow">→</span>
        <span class="ml-period">Panen: <strong>${MONTH_NAMES[harvestMonth]} ${now.getFullYear() + (currentMonth + 6 >= 12 ? 1 : 0)}</strong></span>
      </div>
    </div>`;

  const currentSensorItems = [
    { label: 'Suhu', value: currentReadings.temp, unit: '°C', digits: 1 },
    { label: 'Kelembapan', value: currentReadings.humidity, unit: '%', digits: 1 },
    { label: 'EC', value: currentReadings.ec, unit: 'µS/cm', digits: 0 },
    { label: 'TDS', value: currentReadings.tds, unit: 'ppm', digits: 0 },
    { label: 'Suhu Air', value: currentReadings.waterTemp, unit: '°C', digits: 1 },
  ]
    .filter((item) => item.value !== null && item.value !== undefined && !isNaN(item.value))
    .map((item) => `${item.label}: <strong>${Number(item.value).toFixed(item.digits)} ${item.unit}</strong>`)
    .join(' · ');

  if (currentSensorItems) {
    html += `<div class="stability-badge optimal">Kondisi sensor saat ini: ${currentSensorItems}</div>`;
  }

  // ── Projected Conditions (mini chart) ──────────────────────
  const visibleProjections = projections.filter((p) => p.temp !== null || p.humidity !== null);
  if (visibleProjections.length > 0) {
    html += '<div class="projection-bar">';
    html += '<div class="projection-title">Proyeksi Berdasarkan Data Sensor Masuk</div>';
    html += '<div class="projection-grid">';
    visibleProjections.forEach((p, i) => {
      const tempBarH = p.temp !== null ? Math.min(100, (p.temp / 45) * 100) : 0;
      const humBarH = p.humidity !== null ? Math.min(100, p.humidity) : 0;
      const tempTitle = p.temp !== null ? `Suhu: ${p.temp.toFixed(1)}°C` : 'Suhu: belum ada data';
      const humTitle = p.humidity !== null ? `Kelembapan: ${p.humidity.toFixed(0)}%` : 'Kelembapan: belum ada data';
      const tempLabel = p.temp !== null ? `${p.temp.toFixed(0)}°` : '–';
      html += `
        <div class="proj-month ${i === 0 ? 'current' : ''}">
          <div class="proj-label">${p.monthLabel}</div>
          <div class="proj-bars">
            <div class="proj-bar temp" style="height:${tempBarH}%" title="${tempTitle}"></div>
            <div class="proj-bar hum" style="height:${humBarH}%" title="${humTitle}"></div>
          </div>
          <div class="proj-val">${tempLabel}</div>
        </div>`;
    });
    html += '</div>';
    html += `<div class="proj-legend">
      <span><span class="proj-dot temp"></span>Suhu</span>
      <span><span class="proj-dot hum"></span>Kelembapan</span>
    </div>`;
    html += '</div>';
  }

  // ── Environment Assessment ─────────────────────────────────
  const projectionTemp = summarizeProjection(projections, 'temp');
  const projectionHumidity = summarizeProjection(projections, 'humidity');
  const projectionEc = summarizeProjection(projections, 'ec');
  const projectionWaterTemp = summarizeProjection(projections, 'waterTemp');

  html += '<div class="assessment-grid">';
  const tempAssessment = projectionAssessment('Suhu Proyeksi', projectionTemp, {
    format: (value) => `${value.toFixed(1)}°C`,
    getStatus: (value) => value >= 20 && value <= 28 ? 'optimal' : value > 35 || value < 15 ? 'danger' : 'warning',
    getText: (value) => value >= 20 && value <= 28 ? 'Ideal untuk sebagian besar tanaman' : value > 28 ? 'Cenderung panas, pilih tanaman tahan panas' : 'Cenderung sejuk, cocok tanaman tertentu',
  });
  if (tempAssessment) html += tempAssessment;

  const humidityAssessment = projectionAssessment('Kelembapan Proyeksi', projectionHumidity, {
    format: (value) => `${value.toFixed(1)}%`,
    getStatus: (value) => value >= 50 && value <= 75 ? 'optimal' : 'warning',
    getText: (value) => value >= 50 && value <= 75 ? 'Kelembapan proyeksi masih ideal' : value > 75 ? 'Cenderung tinggi, ada risiko jamur' : 'Cenderung rendah, perlu antisipasi kelembapan',
  });
  if (humidityAssessment) html += humidityAssessment;

  const ecAssessment = projectionAssessment('EC Proyeksi', projectionEc, {
    format: (value) => `${value.toFixed(1)} µS/cm`,
    getStatus: (value) => value >= 1.0 && value <= 2.5 ? 'optimal' : value > 4 ? 'danger' : 'warning',
    getText: (value) => value >= 1.0 && value <= 2.5 ? 'Nutrisi proyeksi cukup seimbang' : value > 2.5 ? 'Cenderung pekat, lebih cocok tanaman kebutuhan tinggi' : 'Cenderung rendah, nutrisi mungkin perlu ditambah',
  });
  if (ecAssessment) html += ecAssessment;

  const waterTempAssessment = projectionAssessment('Suhu Air Proyeksi', projectionWaterTemp, {
    format: (value) => `${value.toFixed(1)}°C`,
    getStatus: (value) => value >= 18 && value <= 26 ? 'optimal' : 'warning',
    getText: (value) => value >= 18 && value <= 26 ? 'Masih optimal untuk penyerapan akar' : value > 26 ? 'Cenderung hangat, risiko bakteri meningkat' : 'Cenderung dingin, penyerapan nutrisi bisa melambat',
  });
  if (waterTempAssessment) html += waterTempAssessment;
  html += '</div>';

  // ── Stability Indicator ────────────────────────────────────
  if (features.temp.std !== null && dataPointCount >= 5) {
    const stability = features.temp.std < 2 ? 'Sangat Stabil' : features.temp.std < 5 ? 'Cukup Stabil' : 'Fluktuatif';
    const stabClass = features.temp.std < 2 ? 'optimal' : features.temp.std < 5 ? 'warning' : 'danger';
    html += `<div class="stability-badge ${stabClass}">Stabilitas data sumber: <strong>${stability}</strong> (σ = ${features.temp.std.toFixed(2)}°C) · ${dataPointCount} pembacaan. Nilai ini dipakai untuk membentuk proyeksi 6 bulan, bukan ditampilkan sebagai kondisi saat ini.</div>`;
  }

  // ── Crop Predictions ───────────────────────────────────────
  const topCrops = predictions.filter(p => p.successRate >= 30);
  if (topCrops.length > 0) {
    html += '<div class="crop-section-title">Prediksi Tanaman — Tanam Sekarang, Panen 6 Bulan</div>';
    html += '<div class="crop-grid">';
    topCrops.forEach(pred => {
      const c = pred.crop;
      const lvl = pred.successRate >= 75 ? 'excellent' : pred.successRate >= 55 ? 'good' : 'fair';
      const lvlLabel = pred.successRate >= 75 ? 'Sangat Direkomendasikan' : pred.successRate >= 55 ? 'Direkomendasikan' : 'Bisa Dicoba';
      const diffClass = c.difficulty === 'Mudah' ? 'easy' : c.difficulty === 'Sedang' ? 'medium' : 'hard';

      const harvestStr = pred.harvestDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

      let riskHtml = '';
      if (pred.risks.length > 0) {
        riskHtml = `<div class="crop-risks">${pred.risks.map(r => `<span class="risk-tag">${r}</span>`).join('')}</div>`;
      }

      html += `
        <div class="crop-card">
          <div class="crop-card-header">
            <div class="crop-score-badge ${lvl}">${pred.successRate}%</div>
          </div>
          <div class="crop-name">${c.name}</div>
          <div class="crop-category">${c.category}</div>
          <div class="crop-score-bar">
            <div class="crop-score-fill ${lvl}" style="width:${pred.successRate}%"></div>
          </div>
          <div class="crop-score-label">${lvlLabel}</div>
          <div class="crop-meta">
            <span class="crop-difficulty ${diffClass}">${c.difficulty}</span>
            <span class="crop-confidence" title="Kepercayaan model berdasarkan jumlah data">Confidence ${pred.confidence}%</span>
          </div>
          <div class="crop-harvest-info">
            <span>Panen: ${harvestStr}</span>
            <span>Durasi: ${c.growthMonths} bulan</span>
          </div>
          ${riskHtml}
          <div class="crop-tips">${c.tips}</div>
        </div>`;
    });
    html += '</div>';
  } else {
    html += '<div class="rec-waiting">Proyeksi 6 bulan saat ini belum menunjukkan kondisi yang cocok. Kumpulkan lebih banyak data atau atur nutrisi untuk memperbaiki prediksi.</div>';
  }

  container.innerHTML = html;
}

function assessmentCard(label, text, status) {
  return `
    <div class="assessment-item ${status}">
      <div>
        <div class="assessment-label">${label}</div>
        <div class="assessment-text">${text}</div>
      </div>
    </div>`;
}

// Expose globally
window.renderRecommendations = renderRecommendations;
