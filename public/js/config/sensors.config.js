// ══════════════════════════════════════════════════════════════
//  AgriSense — Sensors Configuration
//  Config-driven approach for scalability
//  Add new sensors by simply adding to this object!
// ══════════════════════════════════════════════════════════════

const SENSORS = {
  // ── Group 1: Lingkungan (XY-MD02 Sensor) ────────────────────
  suhu: {
    id: 'suhu',
    group: 'lingkungan',
    label: 'Suhu Udara',
    unit: '°C',
    icon: '🌡️',
    max: 100,
    min: 0,
    chartMaxValue: 100,
    // MQTT topic patterns that might contain this sensor
    topics: ['sensor/xy-md02', 'sensor/xy', 'xy-md02', 'xy'],
    // Data field names this sensor might use in payload
    fieldNames: ['suhu', 'temperature', 'temp', 'T'],
    // For chart visualization
    chart: {
      color: '#ef6c00',
      backgroundColor: 'rgba(239,108,0,0.06)',
      borderWidth: 2,
      tension: 0.4,
    },
    // Default thresholds
    threshold: {
      min: 10,
      max: 40,
    },
    // For gauge styling
    gauge: {
      cssClass: 'temp',
      colorClass: 'temp',
    },
    // Display preferences
    precision: 1,
    displayFormat: (v) => v.toFixed(1),
  },

  kelembapan: {
    id: 'kelembapan',
    group: 'lingkungan',
    label: 'Kelembapan',
    unit: '%RH',
    icon: '💧',
    max: 100,
    min: 0,
    chartMaxValue: 100,
    topics: ['sensor/xy-md02', 'sensor/xy', 'xy-md02', 'xy'],
    fieldNames: ['kelembapan', 'humidity', 'hum', 'H'],
    chart: {
      color: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.06)',
      borderWidth: 2,
      tension: 0.4,
    },
    threshold: {
      max: 80,
    },
    gauge: {
      cssClass: 'humidity',
      colorClass: 'humidity',
    },
    precision: 1,
    displayFormat: (v) => v.toFixed(1),
  },

  // ── Group 2: Nutrisi Air (BSK-EC-100 Sensor) ────────────────
  ec: {
    id: 'ec',
    group: 'nutrisi',
    label: 'EC',
    unit: 'µS/cm',
    icon: '⚡',
    max: 2000,
    min: 0,
    chartMaxValue: 2000,
    topics: ['sensor/bsk-ec100', 'sensor/bsk', 'bsk-ec100', 'bsk'],
    fieldNames: ['ec', 'EC', 'electrical_conductivity'],
    chart: {
      color: '#2d8a4e',
      backgroundColor: 'rgba(45,138,78,0.06)',
      borderWidth: 2,
      tension: 0.4,
    },
    threshold: {
      max: 1000,
    },
    gauge: {
      cssClass: 'ec',
      colorClass: 'ec',
    },
    precision: 0,
    displayFormat: (v) => v.toFixed(0),
  },

  tds: {
    id: 'tds',
    group: 'nutrisi',
    label: 'TDS',
    unit: 'ppm',
    icon: '🧂',
    max: 1000,
    min: 0,
    chartMaxValue: 1000,
    topics: ['sensor/bsk-ec100', 'sensor/bsk', 'bsk-ec100', 'bsk'],
    fieldNames: ['tds', 'TDS', 'total_dissolved_solid'],
    chart: {
      color: '#a67c52',
      backgroundColor: 'rgba(166,124,82,0.06)',
      borderWidth: 2,
      tension: 0.4,
    },
    threshold: {
      max: 500,
    },
    gauge: {
      cssClass: 'tds',
      colorClass: 'tds',
    },
    precision: 0,
    displayFormat: (v) => v.toFixed(0),
  },

  suhuAir: {
    id: 'suhuAir',
    group: 'nutrisi',
    label: 'Suhu Air',
    unit: '°C',
    icon: '🌊',
    max: 60,
    min: 0,
    chartMaxValue: 60,
    topics: ['sensor/bsk-ec100', 'sensor/bsk', 'bsk-ec100', 'bsk'],
    fieldNames: ['suhuAir', 'temperature', 'temp', 'water_temp', 'tempAir'],
    chart: {
      color: '#0891b2',
      backgroundColor: 'rgba(8,145,178,0.06)',
      borderWidth: 2,
      tension: 0.4,
    },
    threshold: {
      max: 50,
    },
    gauge: {
      cssClass: 'water-temp',
      colorClass: 'water-temp',
    },
    precision: 1,
    displayFormat: (v) => v.toFixed(1),
  },

  // ── Group 3: Kualitas Tanah (RS485 NPK Sensor 7-in-1) ────────
  phTanah: {
    id: 'phTanah',
    group: 'tanah',
    label: 'pH Tanah',
    unit: 'pH',
    icon: '🧪',
    max: 14,
    min: 0,
    chartMaxValue: 14,
    topics: ['sensor/rs485-npk', 'sensor/tanah', 'rs485-npk', 'tanah'],
    fieldNames: ['phTanah', 'soil_ph', 'pH'],
    chart: {
      color: '#9c27b0',
      backgroundColor: 'rgba(156,39,176,0.06)',
      borderWidth: 2,
      tension: 0.4,
    },
    threshold: { min: 5.5, max: 7.5 },
    gauge: { cssClass: 'ph', colorClass: 'ph' },
    precision: 1,
    displayFormat: (v) => v.toFixed(1),
  },
  ecTanah: {
    id: 'ecTanah',
    group: 'tanah',
    label: 'EC Tanah',
    unit: 'µS/cm',
    icon: '⚡',
    max: 20000,
    min: 0,
    chartMaxValue: 20000,
    topics: ['sensor/rs485-npk', 'sensor/tanah', 'rs485-npk', 'tanah'],
    fieldNames: ['ecTanah', 'soil_ec', 'EC'],
    chart: {
      color: '#2d8a4e',
      backgroundColor: 'rgba(45,138,78,0.06)',
      borderWidth: 2,
      tension: 0.4,
    },
    threshold: { min: 100, max: 2000 },
    gauge: { cssClass: 'ec', colorClass: 'ec' },
    precision: 0,
    displayFormat: (v) => v.toFixed(0),
  },
  nTanah: {
    id: 'nTanah',
    group: 'tanah',
    label: 'Nitrogen (N)',
    unit: 'mg/kg',
    icon: '🌱',
    max: 2000,
    min: 0,
    chartMaxValue: 2000,
    topics: ['sensor/rs485-npk', 'sensor/tanah', 'rs485-npk', 'tanah'],
    fieldNames: ['nTanah', 'nitrogen', 'N'],
    chart: {
      color: '#10b981',
      backgroundColor: 'rgba(16,185,129,0.06)',
      borderWidth: 2,
      tension: 0.4,
    },
    threshold: { min: 50, max: 500 },
    gauge: { cssClass: 'n', colorClass: 'n' },
    precision: 0,
    displayFormat: (v) => v.toFixed(0),
  },
  pTanah: {
    id: 'pTanah',
    group: 'tanah',
    label: 'Fosfor (P)',
    unit: 'mg/kg',
    icon: '🌾',
    max: 2000,
    min: 0,
    chartMaxValue: 2000,
    topics: ['sensor/rs485-npk', 'sensor/tanah', 'rs485-npk', 'tanah'],
    fieldNames: ['pTanah', 'phosphorus', 'P'],
    chart: {
      color: '#f59e0b',
      backgroundColor: 'rgba(245,158,11,0.06)',
      borderWidth: 2,
      tension: 0.4,
    },
    threshold: { min: 20, max: 300 },
    gauge: { cssClass: 'p', colorClass: 'p' },
    precision: 0,
    displayFormat: (v) => v.toFixed(0),
  },
  kTanah: {
    id: 'kTanah',
    group: 'tanah',
    label: 'Kalium (K)',
    unit: 'mg/kg',
    icon: '🌿',
    max: 2000,
    min: 0,
    chartMaxValue: 2000,
    topics: ['sensor/rs485-npk', 'sensor/tanah', 'rs485-npk', 'tanah'],
    fieldNames: ['kTanah', 'potassium', 'K'],
    chart: {
      color: '#8b5cf6',
      backgroundColor: 'rgba(139,92,246,0.06)',
      borderWidth: 2,
      tension: 0.4,
    },
    threshold: { min: 50, max: 500 },
    gauge: { cssClass: 'k', colorClass: 'k' },
    precision: 0,
    displayFormat: (v) => v.toFixed(0),
  },
  suhuTanah: {
    id: 'suhuTanah',
    group: 'tanah',
    label: 'Suhu Tanah',
    unit: '°C',
    icon: '🌡️',
    max: 80,
    min: -20,
    chartMaxValue: 80,
    topics: ['sensor/rs485-npk', 'sensor/tanah', 'rs485-npk', 'tanah'],
    fieldNames: ['suhuTanah', 'soil_temp', 'T_soil'],
    chart: {
      color: '#ef4444',
      backgroundColor: 'rgba(239,68,68,0.06)',
      borderWidth: 2,
      tension: 0.4,
    },
    threshold: { min: 15, max: 35 },
    gauge: { cssClass: 'temp', colorClass: 'temp' },
    precision: 1,
    displayFormat: (v) => v.toFixed(1),
  },
  kelembapanTanah: {
    id: 'kelembapanTanah',
    group: 'tanah',
    label: 'Kelembapan Tanah',
    unit: '%',
    icon: '💧',
    max: 100,
    min: 0,
    chartMaxValue: 100,
    topics: ['sensor/rs485-npk', 'sensor/tanah', 'rs485-npk', 'tanah'],
    fieldNames: ['kelembapanTanah', 'soil_hum', 'H_soil'],
    chart: {
      color: '#0ea5e9',
      backgroundColor: 'rgba(14,165,233,0.06)',
      borderWidth: 2,
      tension: 0.4,
    },
    threshold: { min: 40, max: 80 },
    gauge: { cssClass: 'humidity', colorClass: 'humidity' },
    precision: 1,
    displayFormat: (v) => v.toFixed(1),
  },
};

// ── Sensor Groups for UI Organization ────────────────────────
const SENSOR_GROUPS = {
  lingkungan: {
    id: 'lingkungan',
    label: 'Lingkungan',
    subLabel: 'XY-MD02 · Suhu & Kelembapan Udara',
    icon: '🌍',
    sensors: ['suhu', 'kelembapan'],
  },
  nutrisi: {
    id: 'nutrisi',
    label: 'Nutrisi Air',
    subLabel: 'BSK-EC-100 · EC, TDS & Suhu Air',
    icon: '💧',
    sensors: ['ec', 'tds', 'suhuAir'],
  },
  tanah: {
    id: 'tanah',
    label: 'Kualitas Tanah',
    subLabel: 'RS485 NPK 7-in-1 · pH, EC, N, P, K, Suhu, Hum',
    icon: '🌱',
    sensors: ['phTanah', 'ecTanah', 'nTanah', 'pTanah', 'kTanah', 'suhuTanah', 'kelembapanTanah'],
  },
};

// ── Helper Functions ─────────────────────────────────────────
function getSensorById(id) {
  return SENSORS[id] || null;
}

function getSensorsByGroup(groupId) {
  return SENSOR_GROUPS[groupId]?.sensors.map((sId) => SENSORS[sId]).filter(Boolean) || [];
}

function getGroupById(id) {
  return SENSOR_GROUPS[id] || null;
}

function getAllSensors() {
  return Object.values(SENSORS);
}

function getAllGroups() {
  return Object.values(SENSOR_GROUPS);
}

// Find sensor by MQTT topic
function findSensorByTopic(topic) {
  return (
    Object.values(SENSORS).find((sensor) => sensor.topics.some((t) => topic.includes(t))) || null
  );
}

// Find sensor by field name in payload
function findSensorByFieldName(fieldName) {
  return Object.values(SENSORS).find((sensor) => sensor.fieldNames.includes(fieldName)) || null;
}

function findSensorsByFieldName(fieldName) {
  return Object.values(SENSORS).filter((sensor) => sensor.fieldNames.includes(fieldName));
}

// Extract sensor value from data object
function extractSensorValue(sensor, data) {
  for (const fieldName of sensor.fieldNames) {
    if (fieldName in data) {
      const val = data[fieldName];
      return val !== undefined && val !== null ? parseFloat(val) : null;
    }
  }
  return null;
}
