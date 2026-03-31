// ══════════════════════════════════════════════════════════════
//  AgriSense — Sensor Service
//  High-level sensor data handling and processing
// ══════════════════════════════════════════════════════════════

class SensorService {
  constructor() {
    this.listeners = new Set();
  }

  // Process a new sensor reading
  handleReading(sensorId, value, rawData = {}, topic = '', timestamp = Date.now()) {
    const sensor = SENSORS[sensorId];
    if (!sensor) {
      console.warn(`[SensorService] Unknown sensor: ${sensorId}`);
      return;
    }

    // Validate value
    if (value === null || isNaN(value)) {
      console.warn(`[SensorService] Invalid value for ${sensorId}:`, value);
      return;
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

    // Update gauge if value changed
    if (changed) {
      gaugeRenderer.updateGauge(sensor, clampedValue);

      // Check thresholds
      const violation = thresholdService.checkViolation(sensorId, clampedValue);
      if (violation) {
        this.handleViolation(violation);
      }

      // Update gauge status
      const thresholds = thresholdService.getAllThresholds();
      gaugeRenderer.setStatus(sensor, clampedValue, thresholds);

      // Update chart
      const group = sensor.group;
      chartManager.updateChart(group);

      // Notify listeners
      this.notifyListeners(sensorId, clampedValue, rawData);

      // Update recommendations (if ML available)
      if (typeof updateRecommendations === 'function') {
        updateRecommendations();
      }
    }

    return true;
  }

  // Handle threshold violation
  handleViolation(violation) {
    console.warn('[SensorService] Threshold violation:', violation);

    // Show alert UI
    showAlert(violation.type, violation.message);

    // Add to log
    addLog(violation.type === 'danger' ? 'error' : 'warn', violation.message);

    // Notify service
    thresholdService.notifyViolation(violation);

    // Send to Telegram if configured
    if (TELEGRAM_CONFIG?.enabled && TELEGRAM_CONFIG.botToken !== 'YOUR_TELEGRAM_BOT_TOKEN') {
      sendTelegramAlert(
        `[${violation.type === 'danger' ? 'KRITIS' : 'PERHATIAN'}] ${violation.message}`
      );
    }
  }

  // Subscribe to sensor updates
  onReading(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify listeners
  notifyListeners(sensorId, value, rawData) {
    this.listeners.forEach((cb) => cb({ sensorId, value, rawData }));
  }

  // Get sensor statistics
  getStatistics(sensorId) {
    return dataStore.getSummaryStats(sensorId);
  }

  // Get all current readings
  getAllReadings() {
    return dataStore.getAllReadings();
  }

  // Export data as CSV
  exportCSV() {
    const allGroups = Object.keys(SENSOR_GROUPS);
    let csv = 'Time,';

    // Header
    const sensors = Object.values(SENSORS);
    csv += sensors.map((s) => `${s.label} (${s.unit})`).join(',') + '\n';

    // Find max history length
    const maxLength = Math.max(...sensors.map((s) => dataStore.getHistory(s.id).length));

    // Rows
    for (let i = 0; i < maxLength; i++) {
      const row = [];

      // Get time from first sensor
      const firstSensorHistory = dataStore.getHistory(sensors[0].id);
      if (firstSensorHistory[i]) {
        row.push(firstSensorHistory[i].time);
      } else {
        row.push('-');
      }

      // Get values for each sensor
      sensors.forEach((sensor) => {
        const history = dataStore.getHistory(sensor.id);
        if (history[i]) {
          row.push(history[i].value);
        } else {
          row.push('-');
        }
      });

      csv += row.join(',') + '\n';
    }

    return csv;
  }

  // Download CSV
  downloadCSV() {
    if (typeof currentUser === 'undefined' || currentUser?.role !== 'admin') {
      console.warn('[SensorService] Download CSV ditolak: hanya admin yang diizinkan');
      if (typeof addLog === 'function') {
        addLog('warn', 'Unduh CSV hanya tersedia untuk admin');
      }
      return false;
    }

    const csv = this.exportCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agrisense_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  }

  // Reset all data
  resetAllData() {
    dataStore.reset();
    thresholdService.resetCooldowns();
    Object.values(SENSOR_GROUPS).forEach((group) => {
      chartManager.updateChart(group.id);
    });
  }
}

const sensorService = new SensorService();
