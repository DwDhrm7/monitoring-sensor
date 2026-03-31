// ══════════════════════════════════════════════════════════════
//  AgriSense — Sensor Service
//  High-level sensor data handling and processing
// ══════════════════════════════════════════════════════════════

import { SENSORS } from '../config/sensors';
import { dataStore } from './data-store';
import { thresholdService, type Violation } from './threshold-service';

interface SensorReading {
  sensorId: string;
  value: number;
  rawData: Record<string, any>;
}

type ReadingListener = (reading: SensorReading) => void;
type ViolationListener = (violation: Violation) => void;

class SensorService {
  private listeners = new Set<ReadingListener>();
  private violationListeners = new Set<ViolationListener>();

  constructor() {
    // Subscribe to threshold violations
    thresholdService.onViolation((violation) => {
      this.notifyViolationListeners(violation);
    });
  }

  // Process a new sensor reading
  handleReading(
    sensorId: string,
    value: number,
    rawData: Record<string, any> = {},
    topic: string = '',
    timestamp: number = Date.now()
  ): boolean {
    const sensor = SENSORS[sensorId];
    if (!sensor) {
      console.warn(`[SensorService] Unknown sensor: ${sensorId}`);
      return false;
    }

    // Validate value
    if (value === null || isNaN(value)) {
      console.warn(`[SensorService] Invalid value for ${sensorId}:`, value);
      return false;
    }

    // Ensure value is within sensor range
    const clampedValue = Math.max(sensor.min, Math.min(sensor.max, value));
    if (clampedValue !== value) {
      console.warn(
        `[SensorService] Value for ${sensorId} out of range: ${value}, clamped to ${clampedValue}`
      );
    }

    // Store in data store
    const changed = dataStore.setReading(sensorId, clampedValue, timestamp);

    // Check thresholds if value changed
    if (changed) {
      const violation = thresholdService.checkViolation(sensorId, clampedValue);
      if (violation) {
        this.handleViolation(violation);
      }

      // Notify listeners
      this.notifyListeners({
        sensorId,
        value: clampedValue,
        rawData,
      });
    }

    return true;
  }

  // Handle threshold violation
  private handleViolation(violation: Violation): void {
    console.warn('[SensorService] Threshold violation:', violation);

    // Notify violation listeners
    this.notifyViolationListeners(violation);

    // Send notification if available
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(`[${violation.type}] ${violation.sensorLabel}`, {
        body: violation.message,
        tag: `violation-${violation.sensorId}`,
        icon: SENSORS[violation.sensorId]?.icon,
      });
    }
  }

  // Subscribe to sensor readings
  onReading(callback: ReadingListener) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Subscribe to violations
  onViolation(callback: ViolationListener) {
    this.violationListeners.add(callback);
    return () => this.violationListeners.delete(callback);
  }

  // Notify reading listeners
  private notifyListeners(reading: SensorReading): void {
    this.listeners.forEach((cb) => cb(reading));
  }

  // Notify violation listeners
  private notifyViolationListeners(violation: Violation): void {
    this.violationListeners.forEach((cb) => cb(violation));
  }

  // Get sensor statistics
  getStatistics(sensorId: string) {
    return dataStore.getSummaryStats(sensorId);
  }

  // Get all current readings
  getAllReadings() {
    return dataStore.getAllReadings();
  }

  // Get sensor history
  getHistory(sensorId: string) {
    return dataStore.getHistory(sensorId);
  }
}

// Singleton instance
export const sensorService = new SensorService();

// Exports for testing
export type { SensorReading };
