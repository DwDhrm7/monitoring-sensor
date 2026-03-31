// ══════════════════════════════════════════════════════════════
//  AgriSense — Main Application Script (Refactored)
//  Clean, service-oriented implementation
// ══════════════════════════════════════════════════════════════

// ── User accounts ─────────────────────────────────────────────
const USERS = {
  admin: { password: 'admin123', role: 'admin', name: 'Admin' },
  petani: { password: 'petani123', role: 'user', name: 'Petani' },
};

const SESSION_KEY = 'agrisense_session';
const SESSION_TTL = 5 * 60 * 1000; // 5 menit
const THEME_KEY = 'agrisense_theme';

// ─── State ──────────────────────────────────────────────────
let currentUser = null;
let mqttStatusInterval = null;
let initTimer = null;
let backendPollTimer = null;
let backendHasConnected = false;

function isAdminUser() {
  return currentUser?.role === 'admin';
}

// ──────────────────────────────────────────
//  SESSION MANAGEMENT
// ──────────────────────────────────────────
function saveSession(username) {
  const session = { username, loginTime: Date.now() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    const elapsed = Date.now() - session.loginTime;
    if (elapsed < SESSION_TTL) {
      return session;
    }
    // Session expired
    localStorage.removeItem(SESSION_KEY);
    return null;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function getSavedTheme() {
  const storedTheme = localStorage.getItem(THEME_KEY);
  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme;
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function updateThemeToggleUI(theme) {
  const button = document.getElementById('btn-theme-toggle');
  const icon = document.getElementById('theme-toggle-icon');
  const label = document.getElementById('theme-toggle-label');
  if (!button || !icon || !label) return;

  const isDark = theme === 'dark';
  button.setAttribute('aria-pressed', String(isDark));
  button.setAttribute('aria-label', isDark ? 'Aktifkan light mode' : 'Aktifkan dark mode');
  icon.textContent = isDark ? '🌙' : '☀️';
  label.textContent = isDark ? 'Light' : 'Dark';
}

function applyTheme(theme) {
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light';
  document.body.dataset.theme = resolvedTheme;
  localStorage.setItem(THEME_KEY, resolvedTheme);
  updateThemeToggleUI(resolvedTheme);
}

function toggleTheme() {
  const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
}

// ──────────────────────────────────────────
//  LOGIN & AUTHENTICATION
// ──────────────────────────────────────────
function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('login-user').value.trim();
  const password = document.getElementById('login-pass').value;
  const errorEl = document.getElementById('login-error');

  const user = USERS[username];
  if (user && user.password === password) {
    currentUser = { username, ...user };
    errorEl.classList.remove('show');
    saveSession(username);
    showDashboard();
  } else {
    errorEl.classList.add('show');
    document.getElementById('login-pass').value = '';
  }

  return false;
}

function tryAutoLogin() {
  const session = loadSession();
  if (session && USERS[session.username]) {
    const user = USERS[session.username];
    currentUser = { username: session.username, ...user };
    // Refresh session timestamp
    saveSession(session.username);
    showDashboard();
    return true;
  }
  return false;
}

function showDashboard() {
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('dashboard').classList.add('active');
  document.getElementById('user-display-name').textContent = currentUser.name;

  // Admin-only features
  if (currentUser.role === 'admin') {
    document.getElementById('threshold-section').style.display = 'block';
  } else {
    document.getElementById('threshold-section').style.display = 'none';
  }

  // Initialize UI
  initializeUI();
  updateRecommendations();
  initRealtimeConnection();
}

function handleLogout() {
  try {
    console.log('[Auth] Logging out...');
    
    // Disconnect MQTT
    if (typeof mqttManager !== 'undefined' && mqttManager) {
      mqttManager.disconnect();
    }
    if (backendPollTimer) {
      clearInterval(backendPollTimer);
      backendPollTimer = null;
    }
    
    // Clear intervals
    if (mqttStatusInterval) clearInterval(mqttStatusInterval);
    if (initTimer) clearTimeout(initTimer);
    
    // Clear session
    clearSession();
    currentUser = null;
    
    // Reset data store
    if (typeof dataStore !== 'undefined' && dataStore) {
      dataStore.reset();
    }
    
    // Destroy charts
    if (typeof chartManager !== 'undefined' && chartManager) {
      chartManager.destroyAll();
    }
    
    // Hide dashboard, show login
    const dashboard = document.getElementById('dashboard');
    const loginPage = document.getElementById('login-page');
    const loginError = document.getElementById('login-error');
    const thresholdSection = document.getElementById('threshold-section');
    const logBody = document.getElementById('log-body');
    const sensorSections = document.getElementById('sensor-sections');
    const chartSections = document.getElementById('chart-sections');
    const recommendationContent = document.getElementById('recommendation-content');
    
    if (dashboard) dashboard.classList.remove('active');
    if (loginPage) loginPage.style.display = 'flex';
    if (document.getElementById('login-user')) document.getElementById('login-user').value = '';
    if (document.getElementById('login-pass')) document.getElementById('login-pass').value = '';
    if (loginError) loginError.classList.remove('show');
    if (thresholdSection) thresholdSection.style.display = 'none';
    if (logBody) logBody.innerHTML = '';
    if (sensorSections) sensorSections.innerHTML = '';
    if (chartSections) chartSections.innerHTML = '';
    if (recommendationContent) {
      recommendationContent.innerHTML = '<p class="rec-waiting">Menunggu data sensor...</p>';
    }
    
    console.log('[Auth] Logout successful');
  } catch (err) {
    console.error('[Auth] Logout error:', err);
    window.location.reload();
  }
}

// ──────────────────────────────────────────
//  UI INITIALIZATION
// ──────────────────────────────────────────
function initializeUI() {
  try {
    console.log('[UI] Initializing user interface...');
    
    // Validate dependencies
    if (typeof SENSORS === 'undefined') {
      throw new Error('SENSORS configuration not loaded');
    }
    if (typeof gaugeRenderer === 'undefined') {
      throw new Error('gaugeRenderer not initialized');
    }
    if (typeof chartManager === 'undefined') {
      throw new Error('chartManager not initialized');
    }
    
    // Generate sensor sections with gauges
    console.log('[UI] Generating gauge sections...');
    const sensorSectionsHTML = getAllGroups()
      .map((group) => {
        const sensors = getSensorsByGroup(group.id);
        return gaugeRenderer.createSectionHTML(group, sensors);
      })
      .join('');
    
    const sensorContainer = document.getElementById('sensor-sections');
    if (!sensorContainer) {
      throw new Error('sensor-sections container not found in DOM');
    }
    sensorContainer.innerHTML = sensorSectionsHTML;
    console.log('[UI] Gauge sections rendered: ' + getAllGroups().length + ' groups');

    // Generate chart sections
    console.log('[UI] Generating chart sections...');
    const chartSectionsHTML = getAllGroups()
      .map((group) => chartManager.createChartHTML(group.id))
      .join('');
    
    const chartContainer = document.getElementById('chart-sections');
    if (!chartContainer) {
      throw new Error('chart-sections container not found in DOM');
    }
    chartContainer.innerHTML = chartSectionsHTML;
    console.log('[UI] Chart sections rendered');

    // Create chart instances
    console.log('[UI] Creating chart instances...');
    getAllGroups().forEach((group) => {
      try {
        chartManager.createChart(group.id);
        console.log(`[UI] Chart created for ${group.id}`);
      } catch (err) {
        console.error(`[UI] Failed to create chart for ${group.id}:`, err);
      }
    });

    // Generate threshold inputs
    console.log('[UI] Generating threshold inputs...');
    generateThresholdInputs();

    // Load and display thresholds
    console.log('[UI] Loading thresholds...');
    loadThresholdsUI();

    // Re-render recommendations for the current role/session
    updateRecommendations();

    addLog('ok', 'UI diinisialisasi');
    console.log('[UI] Initialization complete');
  } catch (err) {
    console.error('[UI] Initialization failed:', err);
    addLog('error', 'Gagal inisialisasi UI: ' + err.message);
  }
}

function generateThresholdInputs() {
  const container = document.getElementById('thr-container');
  let html = '';

  Object.entries(SENSORS).forEach(([id, sensor]) => {
    const threshold = thresholdService.getThreshold(id);
    const hasMin = threshold.min !== undefined;
    const hasMax = threshold.max !== undefined;

    if (hasMin) {
      html += `
        <div class="threshold-item">
          <label>${sensor.label} Min (${sensor.unit})</label>
          <input type="number" id="thr-${id}-min" value="${threshold.min}" disabled>
        </div>
      `;
    }

    if (hasMax) {
      html += `
        <div class="threshold-item">
          <label>${sensor.label} Max (${sensor.unit})</label>
          <input type="number" id="thr-${id}-max" value="${threshold.max}" disabled>
        </div>
      `;
    }
  });

  container.innerHTML = html;
}

function loadThresholdsUI() {
  const thresholds = thresholdService.getAllThresholds();

  Object.entries(thresholds).forEach(([sensorId, threshold]) => {
    if (threshold.min !== undefined) {
      const el = document.getElementById(`thr-${sensorId}-min`);
      if (el) el.value = threshold.min;
    }
    if (threshold.max !== undefined) {
      const el = document.getElementById(`thr-${sensorId}-max`);
      if (el) el.value = threshold.max;
    }
  });
}

function showAlert(type, msg) {
  const c = document.getElementById('alert-container');
  const div = document.createElement('div');
  div.className = `alert alert-${type === 'danger' ? 'danger' : 'warn'}`;
  const alertPrefix = type === 'danger' ? '[Kritis]' : '[Perhatian]';
  div.innerHTML = `<span>${alertPrefix} ${msg}</span><span class="alert-close" onclick="this.parentElement.remove()">×</span>`;
  c.prepend(div);
  setTimeout(() => div.remove(), 10000);
  
  if (Notification.permission === 'granted') {
    new Notification('AgriSense Alert', { body: msg });
  }
  
  // Telegram Integration
  if (TELEGRAM_CONFIG && TELEGRAM_CONFIG.enabled && TELEGRAM_CONFIG.botToken && TELEGRAM_CONFIG.chatId) {
    if (TELEGRAM_CONFIG.botToken !== 'YOUR_TELEGRAM_BOT_TOKEN') {
      sendTelegramAlert(`${alertPrefix} ${msg}`);
    }
  }
}

function sendTelegramAlert(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage`;
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CONFIG.chatId,
      text: `*AgriSense Alert*\n${message}`,
      parse_mode: 'Markdown'
    })
  }).catch(err => console.error("Telegram alert error:", err));
}

function addLog(level, msg) {
  const el = document.getElementById('log-body');
  const ts = new Date().toLocaleTimeString('id-ID');
  const div = document.createElement('div');
  div.className = `log-entry ${level}`;
  div.innerHTML = `<span class="ts">${ts}</span>${msg}`;
  el.prepend(div);
  while (el.children.length > 100) el.lastChild.remove();
}

function clearLog() { document.getElementById('log-body').innerHTML = ''; }

function toggleEditThreshold(isEditing, isCancel = false) {
  const inputs = document.querySelectorAll('.threshold-item input');
  inputs.forEach(input => {
    input.disabled = !isEditing;
  });
  
  document.getElementById('btn-edit-thr').style.display = isEditing ? 'none' : 'inline-flex';
  document.getElementById('btn-cancel-thr').style.display = isEditing ? 'inline-flex' : 'none';
  document.getElementById('btn-save-thr').style.display = isEditing ? 'inline-flex' : 'none';

  if (!isEditing && isCancel) {
    // Revert inputs to last saved state
    loadThresholdsUI();
  }
}

function saveThresholdsButtonClick() {
  const inputs = document.querySelectorAll('.threshold-item input');
  let errorCount = 0;
  
  inputs.forEach(input => {
    const match = input.id.match(/thr-(\w+)-(min|max)$/);
    if (!match) return;
    
    const [_, sensorId, minmax] = match;
    const value = parseFloat(input.value);
    const fullSensorId = sensorId === 'temp-bsk' ? 'suhuAir' : sensorId;
    
    if (isNaN(value)) {
      addLog('error', `Nilai ${fullSensorId} tidak valid`);
      errorCount++;
      return;
    }
    
    // Get current thresholds for this sensor
    const currentThresholds = thresholdService.getThreshold(fullSensorId) || {};
    const newThresholds = { ...currentThresholds };
    
    if (minmax === 'min') {
      newThresholds.min = value;
    } else {
      newThresholds.max = value;
    }
    
    // Validate min <= max
    if (newThresholds.min !== undefined && newThresholds.max !== undefined) {
      if (newThresholds.min > newThresholds.max) {
        addLog('error', `Batas minimum tidak boleh lebih besar dari maksimum`);
        errorCount++;
        return;
      }
    }
    
    thresholdService.setThreshold(fullSensorId, newThresholds.min, newThresholds.max);
  });
  
  if (errorCount === 0) {
    addLog('ok', 'Konfigurasi disimpan');
    toggleEditThreshold(false);
  }
}

// ── Weather Data & WMO Codes ─────────────────────────────────
window.weatherData = null;

const WMO_CODES = {
  0: {desc: 'Cerah'},
  1: {desc: 'Sebagian Berawan'},
  2: {desc: 'Berawan'},
  3: {desc: 'Mendung'},
  45: {desc: 'Berkabut'}, 48: {desc: 'Kabut Embun'},
  51: {desc: 'Gerimis Ringan'}, 53: {desc: 'Gerimis'}, 55: {desc: 'Gerimis Lebat'},
  61: {desc: 'Hujan Ringan'}, 63: {desc: 'Hujan Sedang'}, 65: {desc: 'Hujan Lebat'},
  71: {desc: 'Salju Ringan'}, 73: {desc: 'Salju'}, 75: {desc: 'Salju Lebat'},
  95: {desc: 'Badai Petir'}, 96: {desc: 'Badai Petir & Hujan Es'}
};

// ── Refresh Handler ──────────────────────────────────────────
function handleRefresh() {
  addLog('ok', 'Melakukan refresh data...');
  
  // Disconnect current connection
  if (mqttManager) {
    mqttManager.disconnect();
  }
  if (influxInterval) {
    clearInterval(influxInterval);
    influxInterval = null;
  }
  if (mqttStatusInterval) {
    clearInterval(mqttStatusInterval);
    mqttStatusInterval = null;
  }
  
  // Reset data store
  dataStore.reset();
  
  // Destroy chart instances
  chartManager.destroyAll();
  
  // Re-initialize UI
  initializeUI();
  
  // Reconnect to data source
  initRealtimeConnection();
  
  addLog('ok', 'Refresh selesai');
}

function setConnectionStatus(status) {
  const pill = document.getElementById('status-pill');
  const label = document.getElementById('conn-label');

  pill.className = 'status-pill';

  if (status === 'connected' || status === 'connected_live') {
    pill.classList.add('live');
    label.textContent = 'Terhubung';
  } else if (status === 'connected_no_data') {
    label.textContent = 'Menunggu data...';
  } else if (status === 'connected_stale') {
    pill.classList.add('error');
    label.textContent = 'Data terhenti';
  } else if (status === 'connecting') {
    label.textContent = 'Menghubungkan...';
  } else if (status === 'error') {
    pill.classList.add('error');
    label.textContent = 'Gagal';
  } else {
    label.textContent = 'Terputus';
  }

  if (status === 'connected' || status === 'connected_live') {
    document.getElementById('last-update').textContent = 'Diperbarui ' + new Date().toLocaleTimeString('id-ID');
  }
}

async function fetchWeather() {
  if (!OPENMETEO_CONFIG || !OPENMETEO_CONFIG.enabled) return;
  try {
    const lat = OPENMETEO_CONFIG.latitude;
    const lon = OPENMETEO_CONFIG.longitude;
    const tz = encodeURIComponent(OPENMETEO_CONFIG.timezone);
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,rain,precipitation&hourly=precipitation_probability,precipitation,rain,wind_speed_10m,soil_temperature_18cm,soil_moisture_1_to_3cm&timezone=${tz}&past_days=7`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Open-Meteo API Error');
    const data = await res.json();
    
    const current = data.current;
    
    // Find closest code or default to cloudy
    const code = current.weather_code;
    const weatherInfo = WMO_CODES[code] || WMO_CODES[3]; 

    window.weatherData = {
      temp: current.temperature_2m,
      desc: weatherInfo.desc,
      rain: current.rain,
      precip: current.precipitation,
      city: OPENMETEO_CONFIG.city
    };
    
    addLog('ok', `Info Cuaca: ${window.weatherData.city} - ${weatherInfo.desc} (${current.temperature_2m}°C)`);
    updateRecommendations(); // Re-render ML with weather data
  } catch (e) {
    addLog('warn', 'Gagal memuat cuaca Open-Meteo: ' + e.message);
  }
}

// Fetch weather initially and every 30 mins
setTimeout(fetchWeather, 2000);
setInterval(fetchWeather, 30 * 60 * 1000);

// ── Update Recommendations (ML-powered) ──────────────────────
function updateRecommendations() {
  // Map new data structure to ML engine format
  window.latestReadings = {
    temp: dataStore.readings.suhu ?? null,
    humidity: dataStore.readings.kelembapan ?? null,
    ec: dataStore.readings.ec ?? null,
    tds: dataStore.readings.tds ?? null,
    waterTemp: dataStore.readings.suhuAir ?? null
  };
  
  // Feed data into ML collector for learning
  if (typeof mlRecordReading === 'function') {
    mlRecordReading(window.latestReadings);
  }
  
  // Render ML predictions
  if (typeof renderRecommendations === 'function') {
    renderRecommendations();
  }
}

// ══════════════════════════════════════════════════════════════
//  CONNECTION STATUS & UI UPDATES (Unified Handler)
// ══════════════════════════════════════════════════════════════
function setConnectionStatus(status) {
  const pill = document.getElementById('status-pill');
  const label = document.getElementById('conn-label');

  pill.className = 'status-pill';

  if (status === 'connected' || status === 'connected_live') {
    pill.classList.add('live');
    label.textContent = 'Terhubung';
  } else if (status === 'connected_no_data') {
    label.textContent = 'Menunggu data MQTT...';
  } else if (status === 'connected_stale') {
    pill.classList.add('error');
    label.textContent = 'Data terhenti';
  } else if (status === 'connecting') {
    label.textContent = 'Menghubungkan...';
  } else if (status === 'error') {
    pill.classList.add('error');
    label.textContent = 'Gagal';
  } else {
    label.textContent = 'Terputus';
  }

  if (status === 'connected' || status === 'connected_live') {
    document.getElementById('last-update').textContent = 'Diperbarui ' + new Date().toLocaleTimeString('id-ID');
  }
}

function getRealtimeTransport() {
  if (!BACKEND_CONFIG?.enabled) return 'mqtt_direct';
  return BACKEND_CONFIG.transport || 'http_poll';
}

function getRealtimeSourceLabel() {
  const transport = getRealtimeTransport();
  if (transport === 'http_poll') return 'API';
  if (transport === 'sse') return 'SSE';
  if (transport === 'websocket') return 'WS';
  return 'MQTT';
}

function setConnectionBadgeLabel() {
  const badge = document.getElementById('conn-badge');
  if (badge) {
    badge.textContent = getRealtimeSourceLabel();
  }
}

function clearRealtimeTimers() {
  if (mqttStatusInterval) {
    clearInterval(mqttStatusInterval);
    mqttStatusInterval = null;
  }
  if (backendPollTimer) {
    clearInterval(backendPollTimer);
    backendPollTimer = null;
  }
}

function buildBackendUrl(pathname) {
  const baseUrl = (BACKEND_CONFIG?.baseUrl || '').replace(/\/+$/, '');
  const path = pathname?.startsWith('/') ? pathname : `/${pathname || ''}`;
  return `${baseUrl}${path}`;
}

function getBackendPortHint() {
  try {
    const url = new URL(BACKEND_CONFIG?.baseUrl || '');
    if (url.port === '1883') {
      return 'Port 1883 adalah raw MQTT broker, bukan HTTP API.';
    }
    if (url.port === '9001') {
      return 'Port 9001 biasanya WebSocket MQTT, bukan endpoint HTTP /api.';
    }
  } catch (err) {
    return '';
  }

  return '';
}

function getBackendHeaders() {
  const headers = { Accept: 'application/json' };
  if (BACKEND_CONFIG?.authToken) {
    headers.Authorization = `Bearer ${BACKEND_CONFIG.authToken}`;
  }
  return headers;
}

function getBackendPayloadRoot(payload) {
  if (!payload || typeof payload !== 'object') return {};
  return payload.sensors || payload.readings || payload.data || payload;
}

function getBackendTimestamp(payload) {
  if (!payload || typeof payload !== 'object') return Date.now();
  const candidate = payload.timestamp || payload.time || payload.created_at;
  const parsed = candidate ? new Date(candidate).getTime() : NaN;
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function processBackendPayload(payload) {
  const data = getBackendPayloadRoot(payload);
  const timestamp = getBackendTimestamp(payload);
  let processedCount = 0;

  getAllSensors().forEach((sensor) => {
    let value = null;

    if (sensor.id in data) {
      value = parseFloat(data[sensor.id]);
    } else {
      value = extractSensorValue(sensor, data);
    }

    if (value === null || Number.isNaN(value)) return;

    processedCount += 1;
    sensorService.handleReading(sensor.id, value, payload, 'backend', timestamp);
  });

  return processedCount;
}

async function fetchBackendLatest() {
  const latestEndpoint = BACKEND_CONFIG?.endpoints?.latest;
  if (!latestEndpoint) {
    throw new Error('BACKEND_CONFIG.endpoints.latest belum diisi');
  }

  const response = await fetch(buildBackendUrl(latestEndpoint), {
    method: 'GET',
    headers: getBackendHeaders(),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload = await response.json();
  const processedCount = processBackendPayload(payload);
  if (processedCount === 0) {
    setConnectionStatus('connected_no_data');
    if (!backendHasConnected) {
      addLog('warn', 'Backend terhubung, tetapi payload belum memuat field sensor yang dikenali');
    }
    return;
  }

  setConnectionStatus('connected_live');
  if (!backendHasConnected) {
    addLog('ok', 'Backend Python terhubung');
  }
  backendHasConnected = true;
  document.getElementById('last-update').textContent = 'Diperbarui ' + new Date().toLocaleTimeString('id-ID');
}

function startBackendPolling() {
  clearRealtimeTimers();
  backendHasConnected = false;
  setConnectionBadgeLabel();
  setConnectionStatus('connecting');
  addLog('ok', `Menghubungkan ke backend Python (${buildBackendUrl(BACKEND_CONFIG.endpoints.latest)})...`);

  const pollOnce = async () => {
    try {
      await fetchBackendLatest();
    } catch (err) {
      setConnectionStatus('error');
      const hint = getBackendPortHint();
      const message = hint ? `${err.message}. ${hint}` : err.message;
      if (backendHasConnected) {
        addLog('warn', 'Koneksi backend terputus: ' + message);
      } else {
        addLog('error', 'Gagal menghubungi backend Python: ' + message);
      }
      backendHasConnected = false;
    }
  };

  pollOnce();
  backendPollTimer = setInterval(pollOnce, BACKEND_CONFIG.pollInterval || 5000);
}

function initRealtimeConnection() {
  const transport = getRealtimeTransport();
  setConnectionBadgeLabel();

  if (transport === 'mqtt_direct') {
    initMQTT();
    return;
  }

  if (transport === 'http_poll') {
    startBackendPolling();
    return;
  }

  setConnectionStatus('error');
  addLog('error', `Transport backend "${transport}" belum diimplementasikan. Gunakan "mqtt_direct" atau "http_poll".`);
}

// ══════════════════════════════════════════════════════════════
//  MQTT (PRIMARY) - Via Service Manager
// ══════════════════════════════════════════════════════════════
function initMQTT() {
  clearRealtimeTimers();
  setConnectionBadgeLabel();
  setConnectionStatus('connecting');
  addLog('ok', 'Menghubungkan ke MQTT broker...');

  // Handle incoming sensor data from MQTT
  const mqttCallback = (sensorId, value, rawData, topic, timestamp) => {
    try {
      const sensor = getSensorById(sensorId);
      if (!sensor) {
        console.warn(`[MQTT] Sensor tidak ditemukan untuk id: ${sensorId}`);
        return;
      }

      // Validate value is within sensor range
      if (isNaN(value) || value < sensor.min || value > sensor.max) {
        console.warn(`[MQTT] Nilai ${value} untuk ${sensor.id} di luar range [${sensor.min}, ${sensor.max}]`);
        return;
      }
      
      // Process through sensor service
      sensorService.handleReading(sensor.id, value, rawData, topic, timestamp);
      
    } catch (err) {
      addLog('error', `Parse error: ${err.message}`);
      console.error('[MQTT]', err);
    }
  };
  
  // Handle status changes
  const statusCallback = (status) => {
    setConnectionStatus(status);
    
    if (status === 'connected_no_data') {
      addLog('warn', 'Koneksi MQTT belum dianggap aktif karena data sensor belum masuk');
    } else if (status === 'connected' || status === 'connected_live') {
      addLog('ok', 'MQTT terhubung');
      
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
      
      // Update last-update timestamp
      document.getElementById('last-update').textContent = 'Diperbarui ' + new Date().toLocaleTimeString('id-ID');
      
      // Clear status check interval if exists
      if (mqttStatusInterval) clearInterval(mqttStatusInterval);
      
      // Monitor connection health - if no data for 30s, start fallback
      mqttStatusInterval = setInterval(() => {
        const mqttStatus = mqttManager.getStatus();
        if (mqttStatus === 'connected_stale') {
          setConnectionStatus(mqttStatus);
        }
      }, 30000);
      
    } else if (status === 'error') {
      addLog('error', 'MQTT error. Dashboard menunggu data MQTT berikutnya.');
    }
  };
  
  // Connect via manager
  mqttManager.connect(mqttCallback, statusCallback);
}

// ══════════════════════════════════════════════════════════════
//  InfluxDB FALLBACK (disabled; dashboard follows MQTT only)
// ══════════════════════════════════════════════════════════════
let influxInterval = null;

function startInfluxFallback() {
  addLog('warn', 'Fallback InfluxDB dinonaktifkan. Menunggu data MQTT.');
}

async function queryInflux(query) {
  const url = `${INFLUX_CONFIG.host}/query?db=${encodeURIComponent(INFLUX_CONFIG.db)}&q=${encodeURIComponent(query)}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const json = await resp.json();
  const series = json?.results?.[0]?.series?.[0];
  if (!series) return [];
  const cols = series.columns;
  return series.values.map(row => {
    const obj = {};
    cols.forEach((c, i) => obj[c] = row[i]);
    return obj;
  });
}

async function fetchInfluxData() {
  try {
    setConnectionStatus('connected');
    
    // Fetch XY data (Temperature & Humidity)
    const xy = await queryInflux('SELECT * FROM sensor_suhu ORDER BY time DESC LIMIT 20');
    if (xy.length > 0) {
      const latestXY = xy[0];
      const suhu = latestXY.suhu || latestXY.temp || latestXY.temperature;
      const kelembapan = latestXY.kelembapan || latestXY.humidity;
      
      if (suhu !== undefined) {
        sensorService.handleReading('suhu', suhu, latestXY, 'influx', new Date().toLocaleTimeString('id-ID'));
      }
      if (kelembapan !== undefined) {
        sensorService.handleReading('kelembapan', kelembapan, latestXY, 'influx', new Date().toLocaleTimeString('id-ID'));
      }
      
      // Update XY chart with historical data
      const reversedXY = [...xy].reverse();
      if (chartManager.charts && chartManager.charts.lingkungan) {
        chartManager.charts.lingkungan.data.labels = reversedXY.map(d => new Date(d.time).toLocaleTimeString('id-ID'));
        chartManager.charts.lingkungan.data.datasets[0].data = reversedXY.map(d => d.suhu || d.temp || d.temperature);
        chartManager.charts.lingkungan.data.datasets[1].data = reversedXY.map(d => d.kelembapan || d.humidity);
        chartManager.charts.lingkungan.update();
      }
    }

    // Fetch BSK data (EC, TDS, Water Temperature)
    const bsk = await queryInflux('SELECT * FROM sensor_bskec100 ORDER BY time DESC LIMIT 20');
    if (bsk.length > 0) {
      const latestBSK = bsk[0];
      const ec = latestBSK.ec || latestBSK.EC;
      const tds = latestBSK.tds || latestBSK.TDS;
      const temp = latestBSK.temperature || latestBSK.temp || latestBSK.suhu;
      
      if (ec !== undefined) {
        sensorService.handleReading('ec', ec, latestBSK, 'influx', new Date().toLocaleTimeString('id-ID'));
      }
      if (tds !== undefined) {
        sensorService.handleReading('tds', tds, latestBSK, 'influx', new Date().toLocaleTimeString('id-ID'));
      }
      if (temp !== undefined) {
        sensorService.handleReading('suhuAir', temp, latestBSK, 'influx', new Date().toLocaleTimeString('id-ID'));
      }
      
      // Update BSK chart with historical data
      const reversedBSK = [...bsk].reverse();
      if (chartManager.charts && chartManager.charts.nutrisi) {
        chartManager.charts.nutrisi.data.labels = reversedBSK.map(d => new Date(d.time).toLocaleTimeString('id-ID'));
        chartManager.charts.nutrisi.data.datasets[0].data = reversedBSK.map(d => d.ec || d.EC);
        chartManager.charts.nutrisi.data.datasets[1].data = reversedBSK.map(d => d.tds || d.TDS);
        chartManager.charts.nutrisi.data.datasets[2].data = reversedBSK.map(d => d.temperature || d.temp || d.suhu);
        chartManager.charts.nutrisi.update();
      }
    }

    addLog('ok', 'Data fetched dari InfluxDB');
    document.getElementById('last-update').textContent = 'Diperbarui ' + new Date().toLocaleTimeString('id-ID');

    // Update recommendations
    updateRecommendations();

  } catch (err) {
    setConnectionStatus('error');
    addLog('error', 'InfluxDB error: ' + err.message);
  }
}

// ══════════════════════════════════════════════════════════════
//  OPEN-METEO WEATHER INTEGRATION
// ══════════════════════════════════════════════════════════════
async function fetchWeather() {
  if (!OPENMETEO_CONFIG || !OPENMETEO_CONFIG.enabled) return;
  try {
    const lat = OPENMETEO_CONFIG.latitude;
    const lon = OPENMETEO_CONFIG.longitude;
    const tz = encodeURIComponent(OPENMETEO_CONFIG.timezone);
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,rain,precipitation&hourly=precipitation_probability,precipitation,rain,wind_speed_10m,soil_temperature_18cm,soil_moisture_1_to_3cm&timezone=${tz}&past_days=7`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Open-Meteo API Error');
    const data = await res.json();
    
    const current = data.current;
    
    // Find closest code or default to cloudy
    const code = current.weather_code;
    const weatherInfo = WMO_CODES[code] || WMO_CODES[3]; 

    window.weatherData = {
      temp: current.temperature_2m,
      desc: weatherInfo.desc,
      rain: current.rain,
      precip: current.precipitation,
      city: OPENMETEO_CONFIG.city
    };
    
    addLog('ok', `Info Cuaca: ${window.weatherData.city} - ${weatherInfo.desc} (${current.temperature_2m}°C)`);
    updateRecommendations(); // Re-render ML with weather data
  } catch (e) {
    addLog('warn', 'Gagal memuat cuaca Open-Meteo: ' + e.message);
  }
}

// Fetch weather initially and every 30 mins
setTimeout(fetchWeather, 2000);
setInterval(fetchWeather, 30 * 60 * 1000);

// ══════════════════════════════════════════════════════════════
//  INITIALIZATION
// ══════════════════════════════════════════════════════════════
applyTheme(getSavedTheme());

// Try auto-login from saved session
if (!tryAutoLogin()) {
  // Show login page (default state)
  document.getElementById('login-page').style.display = 'flex';
}

// Event listeners for UI controls
document.getElementById('btn-view-log')?.addEventListener('click', function () {
  document.getElementById('log-panel').classList.toggle('open');
});

document.getElementById('btn-close-log')?.addEventListener('click', function () {
  document.getElementById('log-panel').classList.remove('open');
});

document.getElementById('btn-clear-log')?.addEventListener('click', clearLog);

document.getElementById('btn-refresh')?.addEventListener('click', handleRefresh);

document.getElementById('btn-edit-thr')?.addEventListener('click', function () {
  toggleEditThreshold(true);
});

document.getElementById('btn-cancel-thr')?.addEventListener('click', function () {
  toggleEditThreshold(false, true);
});

document.getElementById('btn-save-thr')?.addEventListener('click', saveThresholdsButtonClick);
