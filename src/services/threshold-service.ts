// ══════════════════════════════════════════════════════════════
//  AgriSense — Threshold Service
//  Centralized threshold checking and alert generation
// ══════════════════════════════════════════════════════════════

import { SENSORS } from '../config/sensors';
import { dataStore } from './data-store';

interface Threshold {
  min?: number;
  max?: number;
}

interface Violation {
  type: 'warning' | 'danger';
  level: 'min' | 'max';
  sensorId: string;
  sensorLabel: string;
  value: number;
  unit: string;
  threshold: number;
  message: string;
}

const COOLDOWN_MS = 60 * 1000; // 1 minute per sensor
const THRESHOLDS_KEY = 'agrisense_thresholds';

class ThresholdService {
  private thresholds: Record<string, Threshold> = {};
  private cooldowns: Record<string, number> = {};
  private listeners = new Set<(violation: Violation) => void>();

  constructor() {
    this.thresholds = this.loadThresholds();
  }

  // Load thresholds from localStorage or defaults
  private loadThresholds(): Record<string, Threshold> {
    try {
      const raw = localStorage.getItem(THRESHOLDS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('[ThresholdService] Failed to load thresholds:', e);
    }

    // Create defaults from SENSORS config
    const defaults: Record<string, Threshold> = {};
    Object.entries(SENSORS).forEach(([id, sensor]) => {
      defaults[id] = { ...sensor.threshold };
    });
    return defaults;
  }

  // Save thresholds to localStorage
  private saveThresholds(): void {
    try {
      localStorage.setItem(THRESHOLDS_KEY, JSON.stringify(this.thresholds));
    } catch (e) {
      console.warn('[ThresholdService] Failed to save thresholds:', e);
    }
  }

  // Set threshold for a sensor
  setThreshold(sensorId: string, min?: number | null, max?: number | null): boolean {
    if (!(sensorId in SENSORS)) {
      console.warn(`[ThresholdService] Unknown sensor: ${sensorId}`);
      return false;
    }

    this.thresholds[sensorId] = {
      ...(this.thresholds[sensorId] || {}),
      ...(min !== null && min !== undefined && { min }),
      ...(max !== null && max !== undefined && { max }),
    };

    this.saveThresholds();
    return true;
  }

  // Get threshold for a sensor
  getThreshold(sensorId: string): Threshold {
    return this.thresholds[sensorId] || {};
  }

  // Get all thresholds
  getAllThresholds(): Record<string, Threshold> {
    return { ...this.thresholds };
  }

  // Check if value violates threshold
  checkViolation(sensorId: string, value: number): Violation | null {
    if (value === null || value === undefined) return null;

    const sensor = SENSORS[sensorId];
    if (!sensor) return null;

    const threshold = this.thresholds[sensorId] || {};

    // Check if in cooldown
    const now = Date.now();
    const lastAlert = this.cooldowns[sensorId] || 0;
    if (now - lastAlert < COOLDOWN_MS) {
      return null; // Still in cooldown
    }

    // Check violations
    if (threshold.min !== undefined && value < threshold.min) {
      this.cooldowns[sensorId] = now;
      return {
        type: 'warning',
        level: 'min',
        sensorId,
        sensorLabel: sensor.label,
        value,
        unit: sensor.unit,
        threshold: threshold.min,
        message: `${sensor.label} terlalu rendah: ${value}${sensor.unit} (min: ${threshold.min}${sensor.unit})`,
      };
    }

    if (threshold.max !== undefined && value > threshold.max) {
      this.cooldowns[sensorId] = now;
      return {
        type: 'danger',
        level: 'max',
        sensorId,
        sensorLabel: sensor.label,
        value,
        unit: sensor.unit,
        threshold: threshold.max,
        message: `${sensor.label} terlalu tinggi: ${value}${sensor.unit} (max: ${threshold.max}${sensor.unit})`,
      };
    }

    return null;
  }

  // Check all current readings for violations
  checkAllReadings(): Violation[] {
    const violations: Violation[] = [];
    const readings = dataStore.getAllReadings();

    Object.entries(readings).forEach(([sensorId, value]) => {
      if (value !== null) {
        const violation = this.checkViolation(sensorId, value);
        if (violation) {
          violations.push(violation);
        }
      }
    });

    return violations;
  }

  // Subscribe to threshold violations
  onViolation(callback: (violation: Violation) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify listeners of violation
  notifyViolation(violation: Violation): void {
    this.listeners.forEach((cb) => cb(violation));
  }

  // Reset cooldowns
  resetCooldowns(): void {
    this.cooldowns = {};
  }

  // Reset to defaults
  resetToDefaults(): void {
    const defaults: Record<string, Threshold> = {};
    Object.entries(SENSORS).forEach(([id, sensor]) => {
      defaults[id] = { ...sensor.threshold };
    });
    this.thresholds = defaults;
    this.saveThresholds();
  }

  // Get number of active violations
  getViolationCount(): number {
    return this.checkAllReadings().length;
  }
}

// Singleton instance
export const thresholdService = new ThresholdService();

// Exports for testing
export { COOLDOWN_MS, THRESHOLDS_KEY };
export type { Violation, Threshold };
