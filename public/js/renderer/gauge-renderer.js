// ══════════════════════════════════════════════════════════════
//  AgriSense — Gauge Renderer
//  Dynamic gauge rendering for any sensor
// ══════════════════════════════════════════════════════════════

class GaugeRenderer {
  constructor() {
    this.charts = {}; // Stored chart instances
  }

  // Create gauge HTML dynamically
  createGaugeHTML(sensor) {
    const { id, label, unit, gauge } = sensor;
    return `
      <div class="gauge-card ${gauge.cssClass}" id="card-${id}">
        <div class="gauge-label">${label}</div>
        <div class="gauge-value" id="val-${id}">–</div>
        <div class="gauge-unit">${unit}</div>
        <div class="gauge-bar-wrap"><div class="gauge-bar" id="bar-${id}"></div></div>
        <div class="gauge-minmax"><span>${sensor.min}</span><span>${sensor.max}</span></div>
      </div>
    `;
  }

  // Update gauge with new value
  updateGauge(sensor, value) {
    const { id, max, displayFormat } = sensor;
    const el = document.getElementById(`val-${id}`);
    const bar = document.getElementById(`bar-${id}`);
    const card = document.getElementById(`card-${id}`);

    if (!el || !bar || !card) {
      console.warn(`[GaugeRenderer] Elements not found for sensor: ${id}`);
      return;
    }

    if (value === null || value === undefined) {
      el.textContent = '–';
      bar.style.width = '0%';
      return;
    }

    // Update display value
    el.textContent = displayFormat ? displayFormat(value) : value.toFixed(1);

    // Update bar
    const pct = Math.min(100, (value / max) * 100);
    bar.style.width = pct + '%';

    // Mark as loaded
    card.classList.add('loaded');
  }

  // Check threshold and apply status classes
  setStatus(sensor, value, thresholds) {
    const { id, threshold } = sensor;
    const card = document.getElementById(`card-${id}`);

    if (!card) return;

    card.classList.remove('warn', 'danger');

    if (value === null || value === undefined) return;

    // Get threshold for this sensor (from config or saved)
    const sensorThreshold = thresholds[id] || threshold;

    if (!sensorThreshold) return;

    let level = null;

    if (
      sensorThreshold.min !== undefined &&
      value < sensorThreshold.min
    ) {
      level = 'warn';
    } else if (
      sensorThreshold.max !== undefined &&
      value > sensorThreshold.max
    ) {
      level = 'danger';
    }

    if (level) {
      card.classList.add(level);
    }
  }

  // Create gauge section HTML
  createSectionHTML(group, sensors) {
    const { id, label, subLabel } = group;
    let gaugesHTML = sensors.map((sensor) => this.createGaugeHTML(sensor)).join('');

    return `
      <div class="sensor-section">
        <div class="section-header">
          <span class="section-label">${label}</span>
          <span class="section-sub">${subLabel}</span>
          <div class="section-line"></div>
        </div>
        <div class="gauges-grid">
          ${gaugesHTML}
        </div>
      </div>
    `;
  }

  // Format gauge value for display
  formatGaugeValue(sensor, value) {
    if (value === null || value === undefined) return '–';
    const formatted = sensor.displayFormat ? sensor.displayFormat(value) : value.toFixed(1);
    return formatted;
  }
}

const gaugeRenderer = new GaugeRenderer();
