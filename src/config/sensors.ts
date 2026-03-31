// ══════════════════════════════════════════════════════════════
//  AgriSense — Sensors Configuration
//  Config-driven approach for scalability
//  Add new sensors by simply adding to this object!
// ══════════════════════════════════════════════════════════════

export interface SensorField {
  fieldNames: string[];
  unit: string;
  min: number;
  max: number;
}

export interface ChartConfig {
  color: string;
  backgroundColor: string;
  borderWidth: number;
  tension: number;
}

export interface GaugeConfig {
  cssClass: string;
  colorClass: string;
}

export interface SensorConfig {
  id: string;
  group: string;
  label: string;
  unit: string;
  icon: string;
  max: number;
  min: number;
  chartMaxValue: number;
  topics: string[];
  fieldNames: string[];
  chart: ChartConfig;
  threshold: {
    min?: number;
    max?: number;
  };
  gauge: GaugeConfig;
  precision: number;
  displayFormat: (v: number) => string;
}

export interface SensorGroup {
  id: string;
  label: string;
  subLabel: string;
  icon: string;
  sensors: string[];
}

export const SENSORS: Record<string, SensorConfig> = {
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
    topics: ['sensor/xy-md02', 'sensor/xy', 'xy-md02', 'xy'],
    fieldNames: ['suhu', 'temperature', 'temp', 'T'],
    chart: {
      color: '#ef6c00',
      backgroundColor: 'rgba(239,108,0,0.06)',
      borderWidth: 2,
      tension: 0.4,
    },
    threshold: {
      min: 10,
      max: 40,
    },
    gauge: {
      cssClass: 'temp',
      colorClass: 'temp',
    },
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
      min: 40,
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
      min: 200,
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
      min: 100,
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
      min: 15,
      max: 50,
    },
    gauge: {
      cssClass: 'water-temp',
      colorClass: 'water-temp',
    },
    precision: 1,
    displayFormat: (v) => v.toFixed(1),
  },
};

// ── Sensor Groups for UI Organization ────────────────────────
export const SENSOR_GROUPS: Record<string, SensorGroup> = {
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
export function getSensorById(id: string): SensorConfig | null {
  return SENSORS[id] || null;
}

export function getSensorsByGroup(groupId: string): SensorConfig[] {
  const group = SENSOR_GROUPS[groupId];
  if (!group) return [];
  return group.sensors.map(id => SENSORS[id]).filter(Boolean);
}

export function extractSensorValue(sensor: SensorConfig, data: Record<string, any>): number | null {
  for (const fieldName of sensor.fieldNames) {
    const value = data[fieldName];
    if (value !== undefined && value !== null) {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
  }
  return null;
}

export function findSensorsByFieldName(fieldName: string): SensorConfig[] {
  return Object.values(SENSORS).filter(sensor =>
    sensor.fieldNames.some(fn => fn.toLowerCase() === fieldName.toLowerCase())
  );
}

export function getSensorGroups(): SensorGroup[] {
  return Object.values(SENSOR_GROUPS);
}

export function getAllSensors(): SensorConfig[] {
  return Object.values(SENSORS);
}
