// ══════════════════════════════════════════════════════════════
//  AgriSense — Data Store (Centralized State)
//  Single source of truth for all sensor readings, history, etc
// ══════════════════════════════════════════════════════════════

import { SENSORS } from '../config/sensors';

interface HistoryEntry {
  time: string;
  value: number;
  timestamp: number;
}

interface Statistics {
  min: number;
  max: number;
  avg: number;
  latest: number;
  count: number;
}

const HISTORY_MAX = 20;
const DATASTORE_KEY = 'agrisense_datastore';

class DataStore {
  private readings: Record<string, number | null> = {};
  private history: Record<string, HistoryEntry[]> = {};
  private listeners = new Set<(data: any) => void>();

  constructor() {
    // Initialize with null for all sensors
    Object.keys(SENSORS).forEach((id) => {
      this.readings[id] = null;
      this.history[id] = [];
    });

    // Clear persisted state on new session (dashboard shows live data only)
    this.clearPersistedState();
  }

  // ─── Persistence ────────────────────────────────────────
  private clearPersistedState(): void {
    try {
      localStorage.removeItem(DATASTORE_KEY);
    } catch (err) {
      console.warn('[DataStore] Failed to clear persisted storage:', err);
    }
  }

  // ─── Reading Management ──────────────────────────────────
  setReading(sensorId: string, value: number, timestamp: number = Date.now()): boolean {
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

  getReading(sensorId: string): number | null {
    return this.readings[sensorId] ?? null;
  }

  getAllReadings(): Record<string, number | null> {
    return { ...this.readings };
  }

  // ─── History Management ─────────────────────────────────
  getHistory(sensorId: string): HistoryEntry[] {
    return [...(this.history[sensorId] || [])];
  }

  getHistoryForGroup(groupId: string): Record<string, HistoryEntry[]> {
    const result: Record<string, HistoryEntry[]> = {};
    const sensor = SENSORS[groupId];

    if (sensor) {
      const groupSensors = Object.values(SENSORS).filter((s) => s.group === groupId);
      groupSensors.forEach((s) => {
        result[s.id] = this.getHistory(s.id);
      });
    }

    return result;
  }

  clearHistory(sensorId?: string): void {
    if (sensorId) {
      this.history[sensorId] = [];
    } else {
      Object.keys(this.history).forEach((id) => {
        this.history[id] = [];
      });
    }
  }

  // ─── Statistics ─────────────────────────────────────────
  getSummaryStats(sensorId: string): Statistics | null {
    const hist = this.history[sensorId];
    if (!hist || !hist.length) {
      return null;
    }

    const values = hist.map((h) => h.value);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      latest: values[values.length - 1],
      count: values.length,
    };
  }

  // ─── Listeners ───────────────────────────────────────────
  subscribe(callback: (data: any) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(data: any): void {
    this.listeners.forEach((cb) => cb(data));
  }

  // ─── Debugging ───────────────────────────────────────────
  dump(): void {
    console.group('[DataStore] Current State');
    console.log('Readings:', this.readings);
    console.log('History:', this.history);
    console.groupEnd();
  }

  // Clear all data
  reset(): void {
    Object.keys(this.readings).forEach((id) => {
      this.readings[id] = null;
    });
    Object.keys(this.history).forEach((id) => {
      this.history[id] = [];
    });
    this.clearPersistedState();
  }
}

// Singleton instance
export const dataStore = new DataStore();

// Exports for testing
export { HISTORY_MAX, DATASTORE_KEY };
