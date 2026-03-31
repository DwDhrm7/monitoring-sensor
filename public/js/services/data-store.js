// ══════════════════════════════════════════════════════════════
//  AgriSense — Data Store (Centralized State)
//  Single source of truth for all sensor readings, history, etc
// ══════════════════════════════════════════════════════════════

const HISTORY_MAX = 20;
const DATASTORE_KEY = 'agrisense_datastore';

class DataStore {
  constructor() {
    // Current readings: { [sensor_id]: value }
    this.readings = {};
    // Historical data: { [sensor_id]: [ {time, value}, ... ] }
    this.history = {};
    // All sensors initialized with null
    Object.keys(SENSORS).forEach((id) => {
      this.readings[id] = null;
      this.history[id] = [];
    });

    // Dashboard should reflect only the current live session from MQTT.
    this.clearPersistedState();
  }

  // ─── Persistence ────────────────────────────────────────
  clearPersistedState() {
    try {
      localStorage.removeItem(DATASTORE_KEY);
    } catch (err) {
      console.warn('[DataStore] Failed to clear persisted storage:', err);
    }
  }

  // ─── Reading Management ──────────────────────────────────
  setReading(sensorId, value, timestamp = Date.now()) {
    if (!(sensorId in SENSORS)) {
      console.warn(`[DataStore] Unknown sensor: ${sensorId}`);
      return false;
    }
    const oldValue = this.readings[sensorId];
    this.readings[sensorId] = value;

    // Push to history
    if (value !== null && value !== undefined) {
      const timeStr = new Date(timestamp).toLocaleTimeString('id-ID');
      this.history[sensorId].push({ time: timeStr, value, timestamp });

      // Keep max history
      if (this.history[sensorId].length > HISTORY_MAX) {
        this.history[sensorId].shift();
      }
    }

    // Return if value changed (for re-render efficiency)
    return oldValue !== value;
  }

  getReading(sensorId) {
    return this.readings[sensorId] ?? null;
  }

  getAllReadings() {
    return { ...this.readings };
  }

  // ─── History Management ─────────────────────────────────
  getHistory(sensorId) {
    return [...(this.history[sensorId] || [])];
  }

  getHistoryForGroup(groupId) {
    const groupSensors = SENSOR_GROUPS[groupId]?.sensors || [];
    const result = {};
    groupSensors.forEach((sId) => {
      result[sId] = this.getHistory(sId);
    });
    return result;
  }

  clearHistory(sensorId = null) {
    if (sensorId) {
      this.history[sensorId] = [];
    } else {
      Object.keys(this.history).forEach((id) => {
        this.history[id] = [];
      });
    }
  }

  // ─── Utility ─────────────────────────────────────────────
  reset() {
    Object.keys(SENSORS).forEach((id) => {
      this.readings[id] = null;
      this.history[id] = [];
    });
    this.clearPersistedState();
  }

  exportJSON() {
    return JSON.stringify(
      {
        readings: this.readings,
        history: this.history,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    );
  }

  getSummaryStats(sensorId) {
    const hist = this.history[sensorId] || [];
    if (hist.length === 0)
      return { count: 0, min: null, max: null, avg: null };

    const values = hist.map((h) => h.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    return {
      count: hist.length,
      min: parseFloat(min.toFixed(2)),
      max: parseFloat(max.toFixed(2)),
      avg: parseFloat(avg.toFixed(2)),
    };
  }
}

// Global instance
const dataStore = new DataStore();
