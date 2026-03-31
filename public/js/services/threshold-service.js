// ══════════════════════════════════════════════════════════════
//  AgriSense — Threshold Service
//  Centralized threshold checking and alert generation
// ══════════════════════════════════════════════════════════════

class ThresholdService {
  constructor() {
    // Current thresholds: { [sensorId]: {min?, max?} }
    this.thresholds = this.loadThresholds();
    // Cooldowns to prevent spam: { [sensorId]: cooldownTimestamp }
    this.cooldowns = {};
    this.COOLDOWN_MS = 60 * 1000; // 1 minute per sensor
    // Listeners for threshold violations
    this.listeners = new Set();
  }

  // Load thresholds from localStorage or defaults
  loadThresholds() {
    try {
      const raw = localStorage.getItem('agrisense_thresholds');
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('[ThresholdService] Failed to load thresholds:', e);
    }

    // Create defaults from SENSORS config
    const defaults = {};
    Object.entries(SENSORS).forEach(([id, sensor]) => {
      defaults[id] = { ...sensor.threshold };
    });
    return defaults;
  }

  // Save thresholds to localStorage
  saveThresholds() {
    try {
      localStorage.setItem('agrisense_thresholds', JSON.stringify(this.thresholds));
    } catch (e) {
      console.warn('[ThresholdService] Failed to save thresholds:', e);
    }
  }

  // Set threshold for a sensor
  setThreshold(sensorId, min = null, max = null) {
    if (!(sensorId in SENSORS)) {
      console.warn(`[ThresholdService] Unknown sensor: ${sensorId}`);
      return false;
    }

    this.thresholds[sensorId] = {
      ...(this.thresholds[sensorId] || {}),
      ...(min !== null && { min }),
      ...(max !== null && { max }),
    };

    this.saveThresholds();
    return true;
  }

  // Get threshold for a sensor
  getThreshold(sensorId) {
    return this.thresholds[sensorId] || {};
  }

  // Get all thresholds
  getAllThresholds() {
    return { ...this.thresholds };
  }

  // Check if value violates threshold
  checkViolation(sensorId, value) {
    if (value === null || value === undefined) return null;

    const sensor = SENSORS[sensorId];
    if (!sensor) return null;

    const threshold = this.thresholds[sensorId] || {};

    // Check if in cooldown
    const now = Date.now();
    const lastAlert = this.cooldowns[sensorId] || 0;
    if (now - lastAlert < this.COOLDOWN_MS) {
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
  checkAllReadings() {
    const violations = [];
    const readings = dataStore.getAllReadings();

    Object.entries(readings).forEach(([sensorId, value]) => {
      const violation = this.checkViolation(sensorId, value);
      if (violation) {
        violations.push(violation);
      }
    });

    return violations;
  }

  // Subscribe to threshold violations
  onViolation(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify listeners of violation
  notifyViolation(violation) {
    this.listeners.forEach((cb) => cb(violation));
  }

  // Reset cooldowns
  resetCooldowns() {
    this.cooldowns = {};
  }

  // Reset to defaults
  resetToDefaults() {
    this.thresholds = {};
    Object.entries(SENSORS).forEach(([id, sensor]) => {
      this.thresholds[id] = { ...sensor.threshold };
    });
    this.saveThresholds();
  }
}

const thresholdService = new ThresholdService();
