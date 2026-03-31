// ══════════════════════════════════════════════════════════════
//  AgriSense — Chart Manager
//  Dynamic chart creation and management for sensor groups
// ══════════════════════════════════════════════════════════════

class ChartManager {
  constructor() {
    this.charts = {}; // { [groupId]: Chart instance }
  }

  // Create chart for a group
  createChart(groupId) {
    const group = SENSOR_GROUPS[groupId];
    if (!group) {
      console.warn(`[ChartManager] Unknown group: ${groupId}`);
      return null;
    }

    const canvasId = `chart-${groupId}`;
    const canvas = document.getElementById(canvasId);

    if (!canvas) {
      console.warn(`[ChartManager] Canvas not found: ${canvasId}`);
      return null;
    }

    // Build datasets for all sensors in this group
    const datasets = group.sensors.map((sensorId) => {
      const sensor = SENSORS[sensorId];
      return {
        label: sensor.label,
        data: [],
        borderColor: sensor.chart.color,
        backgroundColor: sensor.chart.backgroundColor,
        borderWidth: sensor.chart.borderWidth,
        pointRadius: 0,
        tension: sensor.chart.tension,
        fill: true,
      };
    });

    // Determine max Y value for this group
    const ymax = Math.max(...group.sensors.map((sId) => SENSORS[sId].chartMaxValue));

    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400, easing: 'easeOutQuart' },
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            ticks: {
              color: '#8f9f8f',
              font: { family: 'Inter', size: 10 },
              maxRotation: 0,
              maxTicksLimit: 8,
            },
            grid: { color: 'rgba(0,0,0,0.03)' },
            border: { color: 'rgba(0,0,0,0.06)' },
          },
          y: {
            min: 0,
            max: ymax,
            ticks: { color: '#8f9f8f', font: { family: 'Inter', size: 10 } },
            grid: { color: 'rgba(0,0,0,0.03)' },
            border: { color: 'rgba(0,0,0,0.06)' },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#fff',
            borderColor: 'rgba(0,0,0,0.08)',
            borderWidth: 1,
            titleColor: '#5a6b5a',
            bodyColor: '#1a2e1a',
            titleFont: { family: 'Inter', size: 11 },
            bodyFont: { family: 'Inter', size: 12, weight: '600' },
            cornerRadius: 10,
            padding: 12,
            displayColors: true,
            usePointStyle: true,
          },
        },
      },
    });

    this.charts[groupId] = chart;
    return chart;
  }

  // Get chart instance
  getChart(groupId) {
    return this.charts[groupId] || null;
  }

  // Update chart data
  updateChart(groupId) {
    const chart = this.getChart(groupId);
    if (!chart) return;

    const group = SENSOR_GROUPS[groupId];
    if (!group) return;

    // Get latest label (time) from first sensor's history
    const firstSensorId = group.sensors[0];
    const firstHistory = dataStore.getHistory(firstSensorId);

    // Update labels from time
    const labels = firstHistory.map((h) => h.time);
    chart.data.labels = labels;

    // Update each dataset with corresponding sensor data
    group.sensors.forEach((sensorId, index) => {
      const history = dataStore.getHistory(sensorId);
      const values = history.map((h) => h.value);
      chart.data.datasets[index].data = values;
    });

    chart.update('none'); // Update without animation (for real-time performance)
  }

  // Create chart HTML structure
  createChartHTML(groupId) {
    const group = SENSOR_GROUPS[groupId];
    if (!group) return '';

    const sensorLabels = group.sensors
      .map((sId) => {
        const sensor = SENSORS[sId];
        const color = sensor.chart.color;
        return `<div class="legend-item"><div class="legend-dot" style="background:${color}"></div>${sensor.label}</div>`;
      })
      .join('');

    return `
      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">Histori ${group.label}</span>
          <div class="chart-legend">
            ${sensorLabels}
          </div>
        </div>
        <div class="chart-wrap"><canvas id="chart-${groupId}"></canvas></div>
      </div>
    `;
  }

  // Clear all charts
  destroyAll() {
    Object.values(this.charts).forEach((chart) => {
      if (chart) chart.destroy();
    });
    this.charts = {};
  }

  // Clear specific chart
  destroy(groupId) {
    const chart = this.charts[groupId];
    if (chart) {
      chart.destroy();
      delete this.charts[groupId];
    }
  }
}

const chartManager = new ChartManager();
