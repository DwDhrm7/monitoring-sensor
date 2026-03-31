const ML_STORAGE_KEY = 'agrisense_ml_data';
const MAX_HISTORY = 5000;

// ── Seasonal Climate Model (Indonesia — lowland tropical) ────
// Approximate monthly averages for reference baseline
const CLIMATE_MODEL = [
  /* Jan */ { temp: 27.0, hum: 85 },
  /* Feb */ { temp: 27.0, hum: 85 },
  /* Mar */ { temp: 27.5, hum: 80 },
  /* Apr */ { temp: 28.0, hum: 75 },
  /* May */ { temp: 28.0, hum: 68 },
  /* Jun */ { temp: 27.5, hum: 63 },
  /* Jul */ { temp: 27.0, hum: 60 },
  /* Aug */ { temp: 27.0, hum: 58 },
  /* Sep */ { temp: 27.5, hum: 63 },
  /* Oct */ { temp: 28.0, hum: 72 },
  /* Nov */ { temp: 28.0, hum: 80 },
  /* Dec */ { temp: 27.5, hum: 85 },
];

// ── Crop Knowledge Base ──────────────────────────────────────
// Each crop contains ideal ranges, growth duration, seasonal
// suitability, growth-stage sensitivity weights
const CROPS = [
  {
    id: 'selada', name: 'Selada', icon: '🥬', category: 'Sayuran Daun',
    growthMonths: 1.5,
    ideal: { tempMin: 18, tempMax: 24, humMin: 50, humMax: 70, ecMin: 0.8, ecMax: 1.8, tdsMin: 500, tdsMax: 840, wtMin: 18, wtMax: 24 },
    // Monthly planting suitability 0-1 (index 0=Jan)
    seasonFit: [0.6,0.6,0.7,0.8,0.9,1.0,1.0,1.0,0.9,0.8,0.7,0.6],
    stageWeights: { seedling: 0.3, vegetative: 0.5, harvest: 0.2 },
    baseYield: 0.92,
    tips: 'Panen cepat 35-45 hari. Hindari suhu >26°C agar tidak cepat berbunga.',
    difficulty: 'Mudah',
  },
  {
    id: 'bayam', name: 'Bayam', icon: '🥗', category: 'Sayuran Daun',
    growthMonths: 1,
    ideal: { tempMin: 16, tempMax: 28, humMin: 50, humMax: 70, ecMin: 1.5, ecMax: 2.5, tdsMin: 560, tdsMax: 840, wtMin: 18, wtMax: 26 },
    seasonFit: [0.8,0.8,0.8,0.9,0.9,1.0,1.0,1.0,0.9,0.9,0.8,0.8],
    stageWeights: { seedling: 0.3, vegetative: 0.5, harvest: 0.2 },
    baseYield: 0.95,
    tips: 'Tahan panas, panen cepat 21-30 hari. Cocok sepanjang tahun di Indonesia.',
    difficulty: 'Mudah',
  },
  {
    id: 'kangkung', name: 'Kangkung', icon: '🌿', category: 'Sayuran Daun',
    growthMonths: 1,
    ideal: { tempMin: 25, tempMax: 32, humMin: 60, humMax: 90, ecMin: 2.1, ecMax: 2.8, tdsMin: 1050, tdsMax: 1400, wtMin: 20, wtMax: 28 },
    seasonFit: [0.9,0.9,0.9,0.8,0.7,0.7,0.7,0.7,0.8,0.9,0.9,0.9],
    stageWeights: { seedling: 0.2, vegetative: 0.6, harvest: 0.2 },
    baseYield: 0.96,
    tips: 'Sangat cocok iklim Indonesia. Panen 25-30 hari, bisa berulang.',
    difficulty: 'Mudah',
  },
  {
    id: 'pakcoy', name: 'Pakcoy', icon: '🥬', category: 'Sayuran Daun',
    growthMonths: 1.5,
    ideal: { tempMin: 18, tempMax: 27, humMin: 50, humMax: 70, ecMin: 1.0, ecMax: 2.0, tdsMin: 700, tdsMax: 1050, wtMin: 18, wtMax: 25 },
    seasonFit: [0.7,0.7,0.8,0.9,0.9,1.0,1.0,1.0,0.9,0.8,0.7,0.7],
    stageWeights: { seedling: 0.3, vegetative: 0.5, harvest: 0.2 },
    baseYield: 0.93,
    tips: 'Mudah ditanam, panen 30-40 hari. Cocok pemula.',
    difficulty: 'Mudah',
  },
  {
    id: 'sawi', name: 'Sawi Hijau', icon: '🥬', category: 'Sayuran Daun',
    growthMonths: 1.5,
    ideal: { tempMin: 18, tempMax: 27, humMin: 50, humMax: 70, ecMin: 1.2, ecMax: 2.0, tdsMin: 700, tdsMax: 1050, wtMin: 18, wtMax: 25 },
    seasonFit: [0.7,0.7,0.8,0.9,0.9,1.0,1.0,1.0,0.9,0.8,0.7,0.7],
    stageWeights: { seedling: 0.3, vegetative: 0.5, harvest: 0.2 },
    baseYield: 0.93,
    tips: 'Panen cepat 25-35 hari. Bisa sepanjang tahun.',
    difficulty: 'Mudah',
  },
  {
    id: 'basil', name: 'Kemangi / Basil', icon: '🌱', category: 'Herba',
    growthMonths: 2,
    ideal: { tempMin: 20, tempMax: 30, humMin: 40, humMax: 60, ecMin: 1.0, ecMax: 1.6, tdsMin: 700, tdsMax: 1120, wtMin: 18, wtMax: 26 },
    seasonFit: [0.8,0.8,0.8,0.9,0.9,1.0,1.0,1.0,0.9,0.9,0.8,0.8],
    stageWeights: { seedling: 0.2, vegetative: 0.6, harvest: 0.2 },
    baseYield: 0.90,
    tips: 'Panen berulang, cocok bumbu dapur. Suka sinar matahari penuh.',
    difficulty: 'Mudah',
  },
  {
    id: 'mentimun', name: 'Mentimun', icon: '🥒', category: 'Sayuran Buah',
    growthMonths: 2,
    ideal: { tempMin: 21, tempMax: 30, humMin: 60, humMax: 75, ecMin: 1.5, ecMax: 2.5, tdsMin: 1050, tdsMax: 1750, wtMin: 18, wtMax: 25 },
    seasonFit: [0.7,0.7,0.8,0.9,0.9,0.8,0.8,0.8,0.9,0.9,0.8,0.7],
    stageWeights: { seedling: 0.2, vegetative: 0.3, harvest: 0.5 },
    baseYield: 0.88,
    tips: 'Panen cepat 35-45 hari. Butuh rambatan. Cocok iklim hangat.',
    difficulty: 'Mudah',
  },
  {
    id: 'tomat', name: 'Tomat', icon: '🍅', category: 'Sayuran Buah',
    growthMonths: 3,
    ideal: { tempMin: 20, tempMax: 27, humMin: 60, humMax: 70, ecMin: 2.0, ecMax: 3.5, tdsMin: 1400, tdsMax: 2500, wtMin: 18, wtMax: 24 },
    seasonFit: [0.5,0.5,0.6,0.8,0.9,1.0,1.0,1.0,0.9,0.7,0.6,0.5],
    stageWeights: { seedling: 0.2, vegetative: 0.3, harvest: 0.5 },
    baseYield: 0.82,
    tips: 'Butuh cahaya 8+ jam. Panen 60-80 hari. Perlu penyangga.',
    difficulty: 'Sedang',
  },
  {
    id: 'cabai', name: 'Cabai', icon: '🌶️', category: 'Sayuran Buah',
    growthMonths: 4,
    ideal: { tempMin: 21, tempMax: 29, humMin: 55, humMax: 70, ecMin: 1.8, ecMax: 2.8, tdsMin: 1200, tdsMax: 2000, wtMin: 18, wtMax: 26 },
    seasonFit: [0.5,0.5,0.6,0.8,0.9,1.0,1.0,0.9,0.9,0.7,0.6,0.5],
    stageWeights: { seedling: 0.15, vegetative: 0.25, harvest: 0.6 },
    baseYield: 0.78,
    tips: 'Butuh sinar penuh. Panen 70-90 hari. Cocok dataran rendah.',
    difficulty: 'Sedang',
  },
  {
    id: 'seledri', name: 'Seledri', icon: '🌿', category: 'Herba',
    growthMonths: 3,
    ideal: { tempMin: 16, tempMax: 24, humMin: 50, humMax: 70, ecMin: 1.8, ecMax: 2.4, tdsMin: 1260, tdsMax: 1680, wtMin: 16, wtMax: 22 },
    seasonFit: [0.6,0.6,0.7,0.8,0.9,1.0,1.0,1.0,0.9,0.7,0.6,0.6],
    stageWeights: { seedling: 0.3, vegetative: 0.5, harvest: 0.2 },
    baseYield: 0.80,
    tips: 'Cocok di tempat sejuk. Panen bertahap.',
    difficulty: 'Sedang',
  },
  {
    id: 'strawberry', name: 'Stroberi', icon: '🍓', category: 'Buah',
    growthMonths: 4,
    ideal: { tempMin: 17, tempMax: 25, humMin: 60, humMax: 75, ecMin: 1.0, ecMax: 1.8, tdsMin: 700, tdsMax: 1050, wtMin: 16, wtMax: 22 },
    seasonFit: [0.6,0.6,0.7,0.8,0.9,1.0,1.0,1.0,0.9,0.7,0.6,0.6],
    stageWeights: { seedling: 0.2, vegetative: 0.3, harvest: 0.5 },
    baseYield: 0.72,
    tips: 'Cocok dataran tinggi/sejuk. Panen 60-90 hari.',
    difficulty: 'Sulit',
  },
  {
    id: 'paprika', name: 'Paprika', icon: '🫑', category: 'Sayuran Buah',
    growthMonths: 4,
    ideal: { tempMin: 18, tempMax: 25, humMin: 55, humMax: 70, ecMin: 2.0, ecMax: 3.0, tdsMin: 1400, tdsMax: 2100, wtMin: 18, wtMax: 24 },
    seasonFit: [0.5,0.5,0.6,0.7,0.9,1.0,1.0,1.0,0.9,0.7,0.5,0.5],
    stageWeights: { seedling: 0.2, vegetative: 0.3, harvest: 0.5 },
    baseYield: 0.70,
    tips: 'Lebih cocok dataran tinggi. Butuh greenhouse.',
    difficulty: 'Sulit',
  },
  {
    id: 'melon', name: 'Melon', icon: '🍈', category: 'Buah',
    growthMonths: 3,
    ideal: { tempMin: 25, tempMax: 32, humMin: 50, humMax: 65, ecMin: 2.0, ecMax: 3.5, tdsMin: 1400, tdsMax: 2450, wtMin: 20, wtMax: 26 },
    seasonFit: [0.5,0.5,0.6,0.8,0.9,1.0,1.0,1.0,0.9,0.7,0.5,0.5],
    stageWeights: { seedling: 0.2, vegetative: 0.3, harvest: 0.5 },
    baseYield: 0.75,
    tips: 'Butuh suhu hangat & sinar penuh. Kelembapan rendah lebih baik.',
    difficulty: 'Sedang',
  },
];

// ══════════════════════════════════════════════════════════════
//  DATA COLLECTOR — writes every reading to localStorage
// ══════════════════════════════════════════════════════════════
class DataCollector {
  constructor() {
    this.history = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(ML_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  _save() {
    while (this.history.length > MAX_HISTORY) this.history.shift();
    try { localStorage.setItem(ML_STORAGE_KEY, JSON.stringify(this.history)); } catch {}
  }

  _normalizeValue(value) {
    return value === null || value === undefined || isNaN(value) ? null : Number(value);
  }

  record(readings) {
    // Only record if at least one field is non-null
    if (readings.temp === null && readings.ec === null) return;
    const entry = {
      t: Date.now(),
      T: this._normalizeValue(readings.temp),
      H: this._normalizeValue(readings.humidity),
      E: this._normalizeValue(readings.ec),
      D: this._normalizeValue(readings.tds),
      W: this._normalizeValue(readings.waterTemp),
    };

    const last = this.history[this.history.length - 1];
    if (
      last &&
      last.T === entry.T &&
      last.H === entry.H &&
      last.E === entry.E &&
      last.D === entry.D &&
      last.W === entry.W
    ) {
      return;
    }

    this.history.push(entry);
    this._save();
  }

  getAll() { return this.history; }
  count() { return this.history.length; }
  recent(n = 50) { return this.history.slice(-n); }
}

// ══════════════════════════════════════════════════════════════
//  FEATURE EXTRACTOR — statistical features from raw data
// ══════════════════════════════════════════════════════════════
function extractFeatures(records) {
  const valid = (arr) => arr.filter(v => v !== null && v !== undefined && !isNaN(v));

  function mean(arr) {
    const v = valid(arr);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  }

  function std(arr) {
    const v = valid(arr);
    if (v.length < 2) return 0;
    const m = v.reduce((a, b) => a + b, 0) / v.length;
    return Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / v.length);
  }

  // Linear regression slope (trend per reading)
  function trend(arr) {
    const v = valid(arr);
    if (v.length < 3) return 0;
    const n = v.length;
    let sx = 0, sy = 0, sxy = 0, sx2 = 0;
    for (let i = 0; i < n; i++) {
      sx += i; sy += v[i]; sxy += i * v[i]; sx2 += i * i;
    }
    return (n * sxy - sx * sy) / (n * sx2 - sx * sx);
  }

  const T = records.map(r => r.T);
  const H = records.map(r => r.H);
  const E = records.map(r => r.E);
  const D = records.map(r => r.D);
  const W = records.map(r => r.W);

  return {
    temp:     { mean: mean(T), std: std(T), trend: trend(T) },
    humidity: { mean: mean(H), std: std(H), trend: trend(H) },
    ec:       { mean: mean(E), std: std(E), trend: trend(E) },
    tds:      { mean: mean(D), std: std(D), trend: trend(D) },
    waterTemp:{ mean: mean(W), std: std(W), trend: trend(W) },
    n: records.length,
  };
}

// ══════════════════════════════════════════════════════════════
//  SEASONAL PROJECTION — predict conditions month-by-month
// ══════════════════════════════════════════════════════════════
function projectMonthlyConditions(features, startMonth, months) {
  const projections = [];

  for (let m = 0; m < months; m++) {
    const futureMonth = (startMonth + m) % 12;

    let projTemp, projHum, projEc, projTds, projWt;

    if (features.temp.mean !== null) {
      projTemp = features.temp.mean + features.temp.trend * m * 0.05;
      projTemp = Math.max(10, Math.min(45, projTemp));
    } else {
      projTemp = null;
    }

    if (features.humidity.mean !== null) {
      projHum = features.humidity.mean + features.humidity.trend * m * 0.05;
      projHum = Math.max(20, Math.min(100, projHum));
    } else {
      projHum = null;
    }

    // EC/TDS — assume controlled (hydroponics), keep current + slight trend
    projEc = features.ec.mean !== null
      ? Math.max(0, features.ec.mean + features.ec.trend * m * 0.1)
      : null;
    projTds = features.tds.mean !== null
      ? Math.max(0, features.tds.mean + features.tds.trend * m * 0.1)
      : null;
    projWt = features.waterTemp.mean !== null
      ? Math.max(10, features.waterTemp.mean + features.waterTemp.trend * m * 0.05)
      : null;

    projections.push({
      month: futureMonth,
      monthLabel: ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'][futureMonth],
      temp: projTemp,
      humidity: projHum,
      ec: projEc,
      tds: projTds,
      waterTemp: projWt,
    });
  }
  return projections;
}

// ══════════════════════════════════════════════════════════════
//  CROP PREDICTION MODEL — sigmoid-based neural scoring
// ══════════════════════════════════════════════════════════════
// For each (crop × projected-month), compute a fit score using
// a smooth sigmoid function centered on the ideal range.
// Then aggregate across the crop's growth duration to get an
// overall harvest-success probability.

function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

// Score how well a value fits in [min, max] — returns 0..1
function rangeScore(value, min, max) {
  if (value === null || value === undefined) return 0.5; // unknown → neutral
  const center = (min + max) / 2;
  const halfRange = (max - min) / 2;
  if (halfRange <= 0) return value === min ? 1 : 0;

  const dist = Math.abs(value - center);
  if (dist <= halfRange) {
    // Inside range: score 0.85 – 1.0 (score better near center)
    return 0.85 + 0.15 * (1 - dist / halfRange);
  } else {
    // Outside range: smooth falloff via sigmoid
    const overshoot = (dist - halfRange) / halfRange;
    return 0.85 * sigmoid(-3 * overshoot); // drops smoothly
  }
}

function predictCropAtMonth(crop, conditions) {
  const ideal = crop.ideal;
  // Weighted sub-scores
  const s_temp = rangeScore(conditions.temp, ideal.tempMin, ideal.tempMax);
  const s_hum  = rangeScore(conditions.humidity, ideal.humMin, ideal.humMax);
  const s_ec   = rangeScore(conditions.ec, ideal.ecMin, ideal.ecMax);
  const s_tds  = rangeScore(conditions.tds, ideal.tdsMin, ideal.tdsMax);
  const s_wt   = rangeScore(conditions.waterTemp, ideal.wtMin, ideal.wtMax);

  // Weights: temp & humidity dominate for outdoor; ec/tds for hydroponics
  const hasHydro = conditions.ec !== null;
  let w_t = 0.30, w_h = 0.25, w_e = 0.20, w_d = 0.15, w_w = 0.10;
  if (!hasHydro) {
    w_t = 0.45; w_h = 0.35; w_e = 0; w_d = 0; w_w = 0.20;
  }

  return s_temp * w_t + s_hum * w_h + s_ec * w_e + s_tds * w_d + s_wt * w_w;
}

// Growth stage mapping: how many months into growth → which stage
function getStage(progressRatio) {
  if (progressRatio < 0.25) return 'seedling';
  if (progressRatio < 0.7) return 'vegetative';
  return 'harvest';
}

// ── Main prediction function ──────────────────────────────────
function predictCrop(crop, projections, features, currentMonth) {
  const growthMonths = Math.ceil(crop.growthMonths);
  const relevantProjections = projections.slice(0, growthMonths);

  if (relevantProjections.length === 0) return null;

  // Score each month of growth
  let totalScore = 0;
  let totalWeight = 0;
  const monthlyScores = [];

  relevantProjections.forEach((proj, i) => {
    const progressRatio = i / Math.max(1, growthMonths - 1);
    const stage = getStage(progressRatio);
    const stageWeight = crop.stageWeights[stage] || 0.33;

    const fitScore = predictCropAtMonth(crop, proj);
    const seasonalBonus = crop.seasonFit[proj.month];

    const monthScore = fitScore * 0.7 + seasonalBonus * 0.3;
    const weight = stageWeight;

    totalScore += monthScore * weight;
    totalWeight += weight;

    monthlyScores.push({
      month: proj.monthLabel,
      stage,
      score: monthScore,
      fit: fitScore,
      season: seasonalBonus,
    });
  });

  const avgScore = totalWeight > 0 ? totalScore / totalWeight : 0;

  // Apply base yield and stability penalty
  const stabilityPenalty = features.temp.std !== null
    ? Math.max(0, 1 - features.temp.std * 0.03)  // High variance → lower success
    : 0.9;

  // Confidence factor (more data → more confident prediction)
  const dataConfidence = Math.min(1, features.n / 20); // 20+ readings = full confidence
  const confidenceFactor = 0.6 + 0.4 * dataConfidence; // min 60%, max 100%

  const rawSuccess = avgScore * crop.baseYield * stabilityPenalty;
  const successRate = Math.round(Math.min(99, Math.max(5, rawSuccess * 100)));

  // Confidence percentage
  const confidence = Math.round(confidenceFactor * 100);

  // Identify risk factors
  const risks = [];
  const avgProjection = (key) => {
    const values = relevantProjections
      .map((proj) => proj[key])
      .filter((value) => value !== null && value !== undefined && !isNaN(value));
    if (!values.length) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  };

  const projectedTemp = avgProjection('temp');
  const projectedHumidity = avgProjection('humidity');
  const projectedEc = avgProjection('ec');

  if (projectedTemp !== null) {
    if (projectedTemp > crop.ideal.tempMax + 3) risks.push('Proyeksi suhu terlalu tinggi');
    if (projectedTemp < crop.ideal.tempMin - 3) risks.push('Proyeksi suhu terlalu rendah');
  }
  if (projectedHumidity !== null && projectedHumidity > crop.ideal.humMax + 15) {
    risks.push('Proyeksi kelembapan terlalu tinggi');
  }
  if (projectedEc !== null) {
    if (projectedEc > crop.ideal.ecMax * 1.5) risks.push('Proyeksi EC terlalu pekat');
    if (projectedEc < crop.ideal.ecMin * 0.5) risks.push('Proyeksi EC terlalu rendah');
  }
  if (features.temp.std > 5) risks.push('Suhu tidak stabil');

  // Harvest date
  const harvestDate = new Date();
  harvestDate.setMonth(harvestDate.getMonth() + Math.ceil(crop.growthMonths));

  return {
    crop,
    successRate,
    confidence,
    risks,
    monthlyScores,
    harvestDate,
    dataPoints: features.n,
  };
}

// ══════════════════════════════════════════════════════════════
//  PUBLIC API
// ══════════════════════════════════════════════════════════════
const mlCollector = new DataCollector();

function mlRecordReading(readings) {
  mlCollector.record(readings);
}

function mlPredict() {
  const records = mlCollector.getAll();
  const currentMonth = new Date().getMonth(); // 0-11

  let useRecords = records;
  if (useRecords.length === 0 && typeof latestReadings !== 'undefined') {
    useRecords = [{
      t: Date.now(),
      T: latestReadings.temp,
      H: latestReadings.humidity,
      E: latestReadings.ec,
      D: latestReadings.tds,
      W: latestReadings.waterTemp,
    }];
  }

  if (useRecords.length === 0) return { predictions: [], features: null, projections: [] };

  const recentRecords = useRecords.slice(-50);
  const features = extractFeatures(recentRecords);
  const projections = projectMonthlyConditions(features, currentMonth, 6);

  const predictions = CROPS.map(crop => predictCrop(crop, projections, features, currentMonth))
    .filter(p => p !== null)
    .sort((a, b) => b.successRate - a.successRate);

  return { predictions, features, projections, dataPointCount: records.length, currentMonth };
}

// Export ML data to CSV for external training
function mlExportDataset() {
  const records = mlCollector.getAll();
  if (records.length === 0) {
    alert("Dataset masih kosong. Kumpulkan data setidaknya beberapa menit.");
    return;
  }
  
  let csv = "Timestamp,Suhu_C,Kelembapan_RH,EC_uS,TDS_ppm,SuhuAir_C\n";
  records.forEach(r => {
    const d = new Date(r.t).toISOString();
    csv += `${d},${r.T ?? ''},${r.H ?? ''},${r.E ?? ''},${r.D ?? ''},${r.W ?? ''}\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `agrisense_dataset_${new Date().toISOString().slice(0,10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

window.mlRecordReading = mlRecordReading;
window.mlPredict = mlPredict;
window.mlExportDataset = mlExportDataset;
window.mlCollector = mlCollector;
window.CROPS = CROPS;
