// ══════════════════════════════════════════════════════════════
//  ML Model Service — Crop Prediction Engine
//  Statistical model with 13 Indonesian crops
//  Based on ideal ranges, seasonal patterns, and growth stages
// ══════════════════════════════════════════════════════════════

const ML_STORAGE_KEY = 'agrisense_ml_data';
const MAX_HISTORY = 5000;

// Indonesian Climate Model (lowland tropical seasonal patterns)
const CLIMATE_MODEL = [
  { temp: 27.0, hum: 85 }, // January
  { temp: 27.0, hum: 85 }, // February
  { temp: 27.5, hum: 80 }, // March
  { temp: 28.0, hum: 75 }, // April
  { temp: 28.0, hum: 68 }, // May
  { temp: 27.5, hum: 63 }, // June
  { temp: 27.0, hum: 60 }, // July
  { temp: 27.0, hum: 58 }, // August
  { temp: 27.5, hum: 63 }, // September
  { temp: 28.0, hum: 72 }, // October
  { temp: 28.0, hum: 80 }, // November
  { temp: 27.5, hum: 85 }, // December
];

export interface CropConfig {
  id: string;
  name: string;
  icon: string;
  category: string;
  growthMonths: number;
  ideal: {
    tempMin: number;
    tempMax: number;
    humMin: number;
    humMax: number;
    ecMin: number;
    ecMax: number;
    tdsMin: number;
    tdsMax: number;
    wtMin: number;
    wtMax: number;
  };
  seasonFit: number[]; // 0-1, 12 months
  stageWeights: {
    seedling: number;
    vegetative: number;
    harvest: number;
  };
  baseYield: number;
  tips: string;
  difficulty: 'Mudah' | 'Sedang' | 'Sulit';
}

export interface MLDataEntry {
  t: number; // timestamp
  T: number | null; // temperature
  H: number | null; // humidity
  E: number | null; // EC
  D: number | null; // TDS
  W: number | null; // water temperature
}

export interface Features {
  temp: { mean: number | null; std: number; trend: number };
  humidity: { mean: number | null; std: number; trend: number };
  ec: { mean: number | null; std: number; trend: number };
  tds: { mean: number | null; std: number; trend: number };
  waterTemp: { mean: number | null; std: number; trend: number };
  n: number;
}

export interface ProjectedMonth {
  month: number;
  monthLabel: string;
  temp: number | null;
  humidity: number | null;
  ec: number | null;
  tds: number | null;
  waterTemp: number | null;
}

export interface CropPrediction {
  cropId: string;
  cropName: string;
  harvestIn: number; // months
  successRate: number; // 0-100%
  recommendation: string;
  riskFactors: string[];
  details: {
    temp: number;
    humidity: number;
    ec: number;
    tds: number;
  };
}

export interface MLPredictionResult {
  predictions: CropPrediction[];
  features: Features | null;
  projections: ProjectedMonth[];
  dataPointCount: number;
  currentMonth: number;
}

// ── 13 Indonesian Crops Knowledge Base ───────────────────────
export const CROPS: Record<string, CropConfig> = {
  selada: {
    id: 'selada',
    name: 'Selada',
    icon: '🥬',
    category: 'Sayuran Daun',
    growthMonths: 1.5,
    ideal: {
      tempMin: 18,
      tempMax: 24,
      humMin: 50,
      humMax: 70,
      ecMin: 0.8,
      ecMax: 1.8,
      tdsMin: 500,
      tdsMax: 840,
      wtMin: 18,
      wtMax: 24,
    },
    seasonFit: [0.6, 0.6, 0.7, 0.8, 0.9, 1.0, 1.0, 1.0, 0.9, 0.8, 0.7, 0.6],
    stageWeights: { seedling: 0.3, vegetative: 0.5, harvest: 0.2 },
    baseYield: 0.92,
    tips: 'Panen cepat 35-45 hari. Hindari suhu >26°C agar tidak cepat berbunga.',
    difficulty: 'Mudah',
  },
  bayam: {
    id: 'bayam',
    name: 'Bayam',
    icon: '🥗',
    category: 'Sayuran Daun',
    growthMonths: 1,
    ideal: {
      tempMin: 16,
      tempMax: 28,
      humMin: 50,
      humMax: 70,
      ecMin: 1.5,
      ecMax: 2.5,
      tdsMin: 560,
      tdsMax: 840,
      wtMin: 18,
      wtMax: 26,
    },
    seasonFit: [0.8, 0.8, 0.8, 0.9, 0.9, 1.0, 1.0, 1.0, 0.9, 0.9, 0.8, 0.8],
    stageWeights: { seedling: 0.3, vegetative: 0.5, harvest: 0.2 },
    baseYield: 0.95,
    tips: 'Tahan panas, panen cepat 21-30 hari. Cocok sepanjang tahun di Indonesia.',
    difficulty: 'Mudah',
  },
  kangkung: {
    id: 'kangkung',
    name: 'Kangkung',
    icon: '🌿',
    category: 'Sayuran Daun',
    growthMonths: 1,
    ideal: {
      tempMin: 25,
      tempMax: 32,
      humMin: 60,
      humMax: 90,
      ecMin: 2.1,
      ecMax: 2.8,
      tdsMin: 1050,
      tdsMax: 1400,
      wtMin: 20,
      wtMax: 28,
    },
    seasonFit: [0.9, 0.9, 0.9, 0.8, 0.7, 0.7, 0.7, 0.7, 0.8, 0.9, 0.9, 0.9],
    stageWeights: { seedling: 0.2, vegetative: 0.6, harvest: 0.2 },
    baseYield: 0.96,
    tips: 'Sangat cocok iklim Indonesia. Panen 25-30 hari, bisa berulang.',
    difficulty: 'Mudah',
  },
  pakcoy: {
    id: 'pakcoy',
    name: 'Pakcoy',
    icon: '🥬',
    category: 'Sayuran Daun',
    growthMonths: 1.5,
    ideal: {
      tempMin: 18,
      tempMax: 27,
      humMin: 50,
      humMax: 70,
      ecMin: 1.0,
      ecMax: 2.0,
      tdsMin: 700,
      tdsMax: 1050,
      wtMin: 18,
      wtMax: 25,
    },
    seasonFit: [0.7, 0.7, 0.8, 0.9, 0.9, 1.0, 1.0, 1.0, 0.9, 0.8, 0.7, 0.7],
    stageWeights: { seedling: 0.3, vegetative: 0.5, harvest: 0.2 },
    baseYield: 0.93,
    tips: 'Mudah ditanam, panen 30-40 hari. Cocok pemula.',
    difficulty: 'Mudah',
  },
  sawi: {
    id: 'sawi',
    name: 'Sawi Hijau',
    icon: '🥬',
    category: 'Sayuran Daun',
    growthMonths: 1.5,
    ideal: {
      tempMin: 18,
      tempMax: 27,
      humMin: 50,
      humMax: 70,
      ecMin: 1.2,
      ecMax: 2.0,
      tdsMin: 700,
      tdsMax: 1050,
      wtMin: 18,
      wtMax: 25,
    },
    seasonFit: [0.7, 0.7, 0.8, 0.9, 0.9, 1.0, 1.0, 1.0, 0.9, 0.8, 0.7, 0.7],
    stageWeights: { seedling: 0.3, vegetative: 0.5, harvest: 0.2 },
    baseYield: 0.93,
    tips: 'Panen cepat 25-35 hari. Bisa sepanjang tahun.',
    difficulty: 'Mudah',
  },
  basil: {
    id: 'basil',
    name: 'Kemangi / Basil',
    icon: '🌱',
    category: 'Herba',
    growthMonths: 2,
    ideal: {
      tempMin: 20,
      tempMax: 30,
      humMin: 40,
      humMax: 60,
      ecMin: 1.0,
      ecMax: 1.6,
      tdsMin: 700,
      tdsMax: 1120,
      wtMin: 18,
      wtMax: 26,
    },
    seasonFit: [0.8, 0.8, 0.8, 0.9, 0.9, 1.0, 1.0, 1.0, 0.9, 0.9, 0.8, 0.8],
    stageWeights: { seedling: 0.2, vegetative: 0.6, harvest: 0.2 },
    baseYield: 0.9,
    tips: 'Panen berulang, cocok bumbu dapur. Suka sinar matahari penuh.',
    difficulty: 'Mudah',
  },
  mentimun: {
    id: 'mentimun',
    name: 'Mentimun',
    icon: '🥒',
    category: 'Sayuran Buah',
    growthMonths: 2,
    ideal: {
      tempMin: 21,
      tempMax: 30,
      humMin: 60,
      humMax: 75,
      ecMin: 1.5,
      ecMax: 2.5,
      tdsMin: 1050,
      tdsMax: 1750,
      wtMin: 18,
      wtMax: 25,
    },
    seasonFit: [0.7, 0.7, 0.8, 0.9, 0.9, 0.8, 0.8, 0.8, 0.9, 0.9, 0.8, 0.7],
    stageWeights: { seedling: 0.2, vegetative: 0.3, harvest: 0.5 },
    baseYield: 0.88,
    tips: 'Panen cepat 35-45 hari. Butuh rambatan. Cocok iklim hangat.',
    difficulty: 'Mudah',
  },
  tomat: {
    id: 'tomat',
    name: 'Tomat',
    icon: '🍅',
    category: 'Sayuran Buah',
    growthMonths: 3,
    ideal: {
      tempMin: 20,
      tempMax: 27,
      humMin: 60,
      humMax: 70,
      ecMin: 2.0,
      ecMax: 3.5,
      tdsMin: 1400,
      tdsMax: 2500,
      wtMin: 18,
      wtMax: 24,
    },
    seasonFit: [0.5, 0.5, 0.6, 0.8, 0.9, 1.0, 1.0, 1.0, 0.9, 0.7, 0.6, 0.5],
    stageWeights: { seedling: 0.2, vegetative: 0.3, harvest: 0.5 },
    baseYield: 0.82,
    tips: 'Butuh cahaya 8+ jam. Panen 60-80 hari. Perlu penyangga.',
    difficulty: 'Sedang',
  },
  cabai: {
    id: 'cabai',
    name: 'Cabai',
    icon: '🌶️',
    category: 'Sayuran Buah',
    growthMonths: 4,
    ideal: {
      tempMin: 21,
      tempMax: 29,
      humMin: 55,
      humMax: 70,
      ecMin: 1.8,
      ecMax: 2.8,
      tdsMin: 1200,
      tdsMax: 2000,
      wtMin: 18,
      wtMax: 26,
    },
    seasonFit: [0.5, 0.5, 0.6, 0.8, 0.9, 1.0, 1.0, 0.9, 0.9, 0.7, 0.6, 0.5],
    stageWeights: { seedling: 0.15, vegetative: 0.25, harvest: 0.6 },
    baseYield: 0.78,
    tips: 'Butuh sinar penuh. Panen 70-90 hari. Cocok dataran rendah.',
    difficulty: 'Sedang',
  },
  seledri: {
    id: 'seledri',
    name: 'Seledri',
    icon: '🌿',
    category: 'Herba',
    growthMonths: 3,
    ideal: {
      tempMin: 16,
      tempMax: 24,
      humMin: 50,
      humMax: 70,
      ecMin: 1.8,
      ecMax: 2.4,
      tdsMin: 1260,
      tdsMax: 1680,
      wtMin: 16,
      wtMax: 22,
    },
    seasonFit: [0.6, 0.6, 0.7, 0.8, 0.9, 1.0, 1.0, 1.0, 0.9, 0.7, 0.6, 0.6],
    stageWeights: { seedling: 0.3, vegetative: 0.5, harvest: 0.2 },
    baseYield: 0.8,
    tips: 'Cocok di tempat sejuk. Panen bertahap.',
    difficulty: 'Sedang',
  },
  strawberry: {
    id: 'strawberry',
    name: 'Stroberi',
    icon: '🍓',
    category: 'Buah',
    growthMonths: 4,
    ideal: {
      tempMin: 17,
      tempMax: 25,
      humMin: 60,
      humMax: 75,
      ecMin: 1.0,
      ecMax: 1.8,
      tdsMin: 700,
      tdsMax: 1050,
      wtMin: 16,
      wtMax: 22,
    },
    seasonFit: [0.6, 0.6, 0.7, 0.8, 0.9, 1.0, 1.0, 1.0, 0.9, 0.7, 0.6, 0.6],
    stageWeights: { seedling: 0.2, vegetative: 0.3, harvest: 0.5 },
    baseYield: 0.72,
    tips: 'Cocok dataran tinggi/sejuk. Panen 60-90 hari.',
    difficulty: 'Sulit',
  },
  paprika: {
    id: 'paprika',
    name: 'Paprika',
    icon: '🫑',
    category: 'Sayuran Buah',
    growthMonths: 4,
    ideal: {
      tempMin: 18,
      tempMax: 25,
      humMin: 55,
      humMax: 70,
      ecMin: 2.0,
      ecMax: 3.0,
      tdsMin: 1400,
      tdsMax: 2100,
      wtMin: 18,
      wtMax: 24,
    },
    seasonFit: [0.5, 0.5, 0.6, 0.7, 0.9, 1.0, 1.0, 1.0, 0.9, 0.7, 0.5, 0.5],
    stageWeights: { seedling: 0.2, vegetative: 0.3, harvest: 0.5 },
    baseYield: 0.7,
    tips: 'Lebih cocok dataran tinggi. Butuh greenhouse.',
    difficulty: 'Sulit',
  },
  melon: {
    id: 'melon',
    name: 'Melon',
    icon: '🍈',
    category: 'Buah',
    growthMonths: 3,
    ideal: {
      tempMin: 25,
      tempMax: 32,
      humMin: 50,
      humMax: 65,
      ecMin: 2.0,
      ecMax: 3.5,
      tdsMin: 1400,
      tdsMax: 2450,
      wtMin: 20,
      wtMax: 26,
    },
    seasonFit: [0.5, 0.5, 0.6, 0.8, 0.9, 1.0, 1.0, 1.0, 0.9, 0.7, 0.5, 0.5],
    stageWeights: { seedling: 0.2, vegetative: 0.3, harvest: 0.5 },
    baseYield: 0.75,
    tips: 'Butuh suhu hangat & sinar penuh. Kelembapan rendah lebih baik.',
    difficulty: 'Sedang',
  },
};

// ══════════════════════════════════════════════════════════════
//  DATA COLLECTOR
// ══════════════════════════════════════════════════════════════
class DataCollector {
  private history: MLDataEntry[] = [];

  constructor() {
    this.history = this._load();
  }

  private _load(): MLDataEntry[] {
    try {
      const raw = localStorage.getItem(ML_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private _save(): void {
    while (this.history.length > MAX_HISTORY) {
      this.history.shift();
    }
    try {
      localStorage.setItem(ML_STORAGE_KEY, JSON.stringify(this.history));
    } catch {}
  }

  private _normalizeValue(value: any): number | null {
    if (value === null || value === undefined || isNaN(value)) return null;
    return Number(value);
  }

  record(readings: {
    temp?: number | null;
    humidity?: number | null;
    ec?: number | null;
    tds?: number | null;
    waterTemp?: number | null;
  }): void {
    if (readings.temp === null && readings.ec === null) return;

    const entry: MLDataEntry = {
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

  getAll(): MLDataEntry[] {
    return this.history;
  }

  count(): number {
    return this.history.length;
  }

  recent(n: number = 50): MLDataEntry[] {
    return this.history.slice(-n);
  }
}

// ══════════════════════════════════════════════════════════════
//  FEATURE EXTRACTOR — Statistical features from raw data
// ══════════════════════════════════════════════════════════════
function extractFeatures(records: MLDataEntry[]): Features {
  const valid = (arr: (number | null)[]): number[] =>
    arr.filter((v) => v !== null && v !== undefined && !isNaN(v)) as number[];

  const mean = (arr: (number | null)[]): number | null => {
    const v = valid(arr);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  };

  const std = (arr: (number | null)[]): number => {
    const v = valid(arr);
    if (v.length < 2) return 0;
    const m = v.reduce((a, b) => a + b, 0) / v.length;
    return Math.sqrt(v.reduce((s, x) => s + Math.pow(x - m, 2), 0) / v.length);
  };

  const trend = (arr: (number | null)[]): number => {
    const v = valid(arr);
    if (v.length < 3) return 0;
    const n = v.length;
    let sx = 0,
      sy = 0,
      sxy = 0,
      sx2 = 0;
    for (let i = 0; i < n; i++) {
      sx += i;
      sy += v[i];
      sxy += i * v[i];
      sx2 += i * i;
    }
    return (n * sxy - sx * sy) / (n * sx2 - sx * sx);
  };

  const T = records.map((r) => r.T);
  const H = records.map((r) => r.H);
  const E = records.map((r) => r.E);
  const D = records.map((r) => r.D);
  const W = records.map((r) => r.W);

  return {
    temp: { mean: mean(T), std: std(T), trend: trend(T) },
    humidity: { mean: mean(H), std: std(H), trend: trend(H) },
    ec: { mean: mean(E), std: std(E), trend: trend(E) },
    tds: { mean: mean(D), std: std(D), trend: trend(D) },
    waterTemp: { mean: mean(W), std: std(W), trend: trend(W) },
    n: records.length,
  };
}

// ══════════════════════════════════════════════════════════════
//  SEASONAL PROJECTION — Predict conditions month-by-month
// ══════════════════════════════════════════════════════════════
function projectMonthlyConditions(
  features: Features,
  startMonth: number,
  months: number
): ProjectedMonth[] {
  const projections: ProjectedMonth[] = [];
  const monthLabels = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Ags',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ];

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

    projEc =
      features.ec.mean !== null
        ? Math.max(0, features.ec.mean + features.ec.trend * m * 0.1)
        : null;
    projTds =
      features.tds.mean !== null
        ? Math.max(0, features.tds.mean + features.tds.trend * m * 0.1)
        : null;
    projWt =
      features.waterTemp.mean !== null
        ? Math.max(10, features.waterTemp.mean + features.waterTemp.trend * m * 0.05)
        : null;

    projections.push({
      month: futureMonth,
      monthLabel: monthLabels[futureMonth],
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
//  CROP PREDICTION MODEL — Sigmoid-based scoring
// ══════════════════════════════════════════════════════════════
const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));

// Score how well a value fits in [min, max] range
function rangeScore(value: number | null, min: number, max: number): number {
  if (value === null || value === undefined || isNaN(value)) return 0.5;

  const center = (min + max) / 2;
  const halfRange = (max - min) / 2;

  if (halfRange <= 0) return value === min ? 1 : 0;

  const dist = Math.abs(value - center);

  if (dist <= halfRange) {
    return 0.85 + 0.15 * (1 - dist / halfRange);
  } else {
    const overshoot = (dist - halfRange) / halfRange;
    return 0.85 * sigmoid(-3 * overshoot);
  }
}

function predictCropAtMonth(crop: CropConfig, conditions: ProjectedMonth): number {
  const ideal = crop.ideal;

  const s_temp = rangeScore(conditions.temp, ideal.tempMin, ideal.tempMax);
  const s_hum = rangeScore(conditions.humidity, ideal.humMin, ideal.humMax);
  const s_ec = rangeScore(conditions.ec, ideal.ecMin, ideal.ecMax);
  const s_tds = rangeScore(conditions.tds, ideal.tdsMin, ideal.tdsMax);
  const s_wt = rangeScore(conditions.waterTemp, ideal.wtMin, ideal.wtMax);

  const hasHydro = conditions.ec !== null;
  let w_t = 0.3,
    w_h = 0.25,
    w_e = 0.2,
    w_d = 0.15,
    w_w = 0.1;

  if (!hasHydro) {
    w_e = 0;
    w_d = 0;
    w_w = 0.1;
    w_t = 0.4;
    w_h = 0.5;
    const sum = w_t + w_h + w_w;
    w_t /= sum;
    w_h /= sum;
    w_w /= sum;
  }

  const conditionScore = w_t * s_temp + w_h * s_hum + w_e * s_ec + w_d * s_tds + w_w * s_wt;
  const seasonalBoost = crop.seasonFit[conditions.month] || 0.5;

  return conditionScore * 0.75 + seasonalBoost * 0.25;
}

function predictCropHarvest(
  crop: CropConfig,
  projections: ProjectedMonth[],
  currentMonth: number
): { successRate: number; avgScore: number } {
  const growthMonths = Math.ceil(crop.growthMonths);
  const cropMonths = projections.slice(0, growthMonths);

  if (cropMonths.length === 0) {
    return { successRate: 0, avgScore: 0 };
  }

  let totalScore = 0;
  cropMonths.forEach((mon, idx) => {
    const stageKey =
      idx === 0 ? 'seedling' : idx < growthMonths - 1 ? 'vegetative' : 'harvest';
    const stageWeight = crop.stageWeights[stageKey as keyof typeof crop.stageWeights];
    const monthScore = predictCropAtMonth(crop, mon);
    totalScore += monthScore * stageWeight;
  });

  const avgScore = totalScore / growthMonths;
  const successRate = Math.round(avgScore * 100) * crop.baseYield;

  return { successRate: Math.min(100, successRate), avgScore };
}

// ══════════════════════════════════════════════════════════════
//  MAIN ML MODEL SINGLETON
// ══════════════════════════════════════════════════════════════
class MLModel {
  private collector: DataCollector;

  constructor() {
    this.collector = new DataCollector();
  }

  recordReading(readings: {
    temp?: number | null;
    humidity?: number | null;
    ec?: number | null;
    tds?: number | null;
    waterTemp?: number | null;
  }): void {
    this.collector.record(readings);
  }

  predict(): MLPredictionResult {
    const records = this.collector.getAll();

    if (records.length === 0) {
      return {
        predictions: [],
        features: null,
        projections: [],
        dataPointCount: 0,
        currentMonth: new Date().getMonth(),
      };
    }

    const features = extractFeatures(records);
    const currentMonth = new Date().getMonth();
    const projections = projectMonthlyConditions(features, currentMonth, 6);

    const predictions: CropPrediction[] = Object.values(CROPS)
      .map((crop) => {
        const { successRate } = predictCropHarvest(crop, projections, currentMonth);
        const harvestMonth = (currentMonth + Math.ceil(crop.growthMonths)) % 12;

        let recommendation = '✓ Sangat cocok ditanam';
        let riskFactors: string[] = [];

        if (successRate < 50) {
          recommendation = '✗ Tidak direkomendasikan';
          riskFactors.push('Kondisi tidak sesuai ideal');
        } else if (successRate < 70) {
          recommendation = '⚠ Cocok dengan perhatian khusus';
          if (features.temp.mean && (features.temp.mean < crop.ideal.tempMin || features.temp.mean > crop.ideal.tempMax)) {
            riskFactors.push('Suhu di luar rentang optimal');
          }
          if (features.humidity.mean && (features.humidity.mean < crop.ideal.humMin || features.humidity.mean > crop.ideal.humMax)) {
            riskFactors.push('Kelembapan kurang ideal');
          }
        }

        return {
          cropId: crop.id,
          cropName: crop.name,
          harvestIn: Math.ceil(crop.growthMonths),
          successRate: Math.min(100, successRate),
          recommendation,
          riskFactors,
          details: {
            temp: features.temp.mean || 0,
            humidity: features.humidity.mean || 0,
            ec: features.ec.mean || 0,
            tds: features.tds.mean || 0,
          },
        };
      })
      .sort((a, b) => b.successRate - a.successRate);

    return {
      predictions,
      features,
      projections,
      dataPointCount: records.length,
      currentMonth,
    };
  }

  exportData(): string {
    const records = this.collector.getAll();
    const headers = ['timestamp', 'datetime', 'temp', 'humidity', 'ec', 'tds', 'waterTemp'];
    const rows = records.map((r) => [
      r.t,
      new Date(r.t).toISOString(),
      r.T ?? '',
      r.H ?? '',
      r.E ?? '',
      r.D ?? '',
      r.W ?? '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => (typeof v === 'string' ? `"${v}"` : v)).join(',')),
    ].join('\n');

    return csv;
  }

  getDataCount(): number {
    return this.collector.count();
  }

  clearData(): void {
    this.collector = new DataCollector();
    localStorage.removeItem(ML_STORAGE_KEY);
  }
}

// ── Singleton Instance ───────────────────────────────────────
export const mlModel = new MLModel();
