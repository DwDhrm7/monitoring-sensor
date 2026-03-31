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

  // ── Example: To add new sensor (e.g., pH) in future:
  // ph: {
  //   id: 'ph',
  //   group: 'nutrisi',
  //   label: 'pH',
  //   unit: '',
  //   icon: '🧪',
  //   max: 14,
  //   min: 0,
  //   chartMaxValue: 14,
  //   topics: ['sensor/ph', 'ph-sensor'],
  //   fieldNames: ['ph', 'pH', 'power_of_hydrogen'],
  //   chart: { color: '#9c27b0', ... },
  //   threshold: { min: 5.5, max: 7.5 },
  //   gauge: { cssClass: 'ph', colorClass: 'ph' },
  //   precision: 1,
  //   displayFormat: (v) => v.toFixed(1),
  // },
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
};

// ── Helper Functions ─────────────────────────────────────────
function getSensorById(id) {
  return SENSORS[id] || null;
}

function getSensorsByGroup(groupId) {
  return SENSOR_GROUPS[groupId]?.sensors
    .map((sId) => SENSORS[sId])
    .filter(Boolean) || [];
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
  return Object.values(SENSORS).find((sensor) =>
    sensor.topics.some((t) => topic.includes(t))
  ) || null;
}

// Find sensor by field name in payload
function findSensorByFieldName(fieldName) {
  return Object.values(SENSORS).find((sensor) =>
    sensor.fieldNames.includes(fieldName)
  ) || null;
}

function findSensorsByFieldName(fieldName) {
  return Object.values(SENSORS).filter((sensor) =>
    sensor.fieldNames.includes(fieldName)
  );
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
