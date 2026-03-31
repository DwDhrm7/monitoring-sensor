# Reference Project Analysis: /Projects/HTML/Monitoring

**Project Type**: Vanilla JavaScript HTML/CSS Dashboard for Agri-IoT Sensor Monitoring  
**Total Codebase**: ~3,279 lines of JavaScript + 1,338 lines of CSS  
**Architecture**: Client-side ML engine with real-time MQTT data + Open-Meteo weather integration

---

## 1. FILE STRUCTURE & ORGANIZATION

```
/Monitoring/
├── index.html                          # Main HTML + DOM structure
├── style.css                           # 1,338 lines of styling (dual-theme support)
├── ml-engine.js                        # 525 lines - ML prediction system
├── recommendations.js                  # 243 lines - Render ML recommendations UI
├── config.local.example.js             # 27 lines - Config template
│
├── js/
│   ├── core/
│   │   └── script.js                   # 1,012 lines - Main app logic
│   ├── config/
│   │   ├── config.js                   # 46 lines - Base config
│   │   ├── config.local.js             # 57 lines - Local credentials (gitignored)
│   │   └── sensors.config.js           # 247 lines - Sensor definitions
│   ├── services/
│   │   ├── mqtt-manager.js             # 361 lines - MQTT/WebSocket connection
│   │   ├── data-store.js               # 131 lines - Centralized state management
│   │   ├── threshold-service.js        # 159 lines - Alert threshold logic
│   │   └── sensor-service.js           # 181 lines - Sensor data processing
│   └── renderer/
│       ├── chart-manager.js            # 174 lines - Chart.js wrapper
│       └── gauge-renderer.js           # 116 lines - Gauge UI rendering
└── README.md                           # Project documentation
```

---

## 2. JAVASCRIPT FILES & PURPOSES

### Core Services (Backend Logic)

#### `js/services/mqtt-manager.js` (361 lines)
- **Purpose**: MQTT over WebSocket connection manager
- **Features**:
  - Multiple broker URL fallback support
  - Auto-reconnect with exponential backoff
  - WS/WSS protocol normalization
  - Authentication (username/password)
  - Message subscription & routing
  - Connection status callbacks
- **Key Classes**: `MQTTManager`
- **Exported**: `mqttManager` (singleton)

#### `js/services/data-store.js` (131 lines)
- **Purpose**: Centralized state container for all sensor readings
- **Features**:
  - In-memory history (max 20 entries per sensor)
  - localStorage persistence (disabled by default)
  - Current readings dictionary
  - History per sensor with timestamps
  - Summary statistics (min/max/avg)
- **Key Classes**: `DataStore`
- **Storage**: localStorage key: `agrisense_datastore`
- **Exported**: `dataStore` (singleton)

#### `js/services/sensor-service.js` (181 lines)
- **Purpose**: High-level sensor reading processor
- **Features**:
  - Reading validation & clamping to sensor ranges
  - Threshold violation detection
  - Alert generation
  - Gauge updates
  - Chart updates
  - ML data collection
  - CSV export for sensor data
  - Event listener subscriptions
- **Key Classes**: `SensorService`
- **Exported**: `sensorService` (singleton)

#### `js/services/threshold-service.js` (159 lines)
- **Purpose**: Violation detection & alerting management
- **Features**:
  - Per-sensor min/max threshold configuration
  - 60-second cooldown to prevent alert spam
  - Violation state tracking
  - Admin-configurable thresholds
  - Telegram alert integration
  - localStorage persistence: `agrisense_thresholds`

### Rendering & Visualization

#### `js/renderer/chart-manager.js` (174 lines)
- **Purpose**: Dynamic chart creation using Chart.js
- **Features**:
  - Multi-sensor line charts per sensor group
  - Real-time data updates
  - Responsive canvas sizing
  - Custom animations (400ms easing)
  - Tooltip customization
  - Cross-hair hover display
- **Library**: Chart.js v4.4.1 (CDN via umd.min.js)
- **Key Classes**: `ChartManager`
- **Exported**: `chartManager` (singleton)

#### `js/renderer/gauge-renderer.js` (116 lines)
- **Purpose**: Animated gauge components for current readings
- **Features**:
  - Dynamic gauge HTML generation
  - Progress bar visualization
  - Min/max range display
  - Threshold status classes (`.warn`, `.danger`)
  - Smooth value transitions
- **Key Classes**: `GaugeRenderer`
- **Exported**: `gaugeRenderer` (singleton)

### Configuration

#### `js/config/sensors.config.js` (247 lines)
- **Purpose**: Sensor definitions & metadata
- **Structure**:
  ```javascript
  const SENSORS = {
    suhu: { id, group, label, unit, min, max, topics, fieldNames, chart, threshold, gauge, precision },
    kelembapan: { ... },
    ec: { ... },
    tds: { ... },
    suhuAir: { ... }
  }
  
  const SENSOR_GROUPS = {
    lingkungan: { id, label, subLabel, sensors: [...] },
    nutrisi: { id, label, subLabel, sensors: [...] }
  }
  ```
- **5 Configured Sensors**:
  - `suhu` (Suhu Udara / Air Temp) — 0-100°C, chart max 100
  - `kelembapan` (Humidity) — 0-100%, chart max 100
  - `ec` (Electrical Conductivity) — 0-5000 µS/cm
  - `tds` (Total Dissolved Solids) — 0-3000 ppm
  - `suhuAir` (Water Temperature) — 0-100°C, chart max 100
- **2 Sensor Groups**:
  - `lingkungan` (Environment): suhu, kelembapan
  - `nutrisi` (Nutrition): ec, tds, suhuAir

#### `js/config/config.js` & `config.local.js` (46 + 57 lines)
- **Public Config** (`config.js`):
  ```javascript
  window.MQTT_CONFIG = { brokerUrl, username, password, topicXY, topicBSK }
  window.INFLUX_CONFIG = { host, db, interval }
  window.BACKEND_CONFIG = { enabled, transport, baseUrl, endpoints }
  window.OPENMETEO_CONFIG = { enabled, latitude, longitude, timezone, city }
  window.TELEGRAM_CONFIG = { enabled, botToken, chatId }
  ```
- **Local Config** (`config.local.js` — gitignored):
  - Actual credentials (MQTT broker, InfluxDB, Telegram)
  - Example in `/Monitoring/config.local.example.js`

### Core Application Logic

#### `js/core/script.js` (1,012 lines)
**Main application orchestrator**

**Sections**:
1. **User Authentication** (lines ~1-100)
   - USERS object: `{ admin, petani }`
   - Default credentials: `admin/admin123`, `petani/petani123`
   - Session management with 5-min TTL
   - localStorage key: `agrisense_session`

2. **Theme Management** (lines ~100-200)
   - Light/Dark mode toggle
   - Persistent theme in localStorage: `agrisense_theme`
   - CSS variable switching via `data-theme` attribute

3. **MQTT Connection** (lines ~200-350)
   - Connects to configured MQTT broker
   - Subscribes to `sensor/xy-md02` and `sensor/bsk-ec100`
   - Message parsing with field mapping
   - Connection status tracking

4. **InfluxDB Fallback** (lines ~350-450)
   - HTTP polling alternative to MQTT
   - Configured via `INFLUX_CONFIG`
   - 5-second poll interval

5. **Dynamic UI Generation** (lines ~450-650)
   - Sensor gauges rendered per SENSOR_GROUPS
   - Charts created via ChartManager
   - Threshold settings panel (admin-only)
   - Event log display

6. **Weather Integration** (lines ~510-550)
   - Open-Meteo API fetch with 30-min interval
   - WMO code mapping to Indonesian descriptions
   - Updates ML recommendations on weather change

7. **Alert & Notification System** (lines ~650-800)
   - Alert container for threshold violations
   - Telegram integration (if configured)
   - Event logging with timestamps
   - Color-coded alerts (ok/warn/danger)

8. **Refresh & Initialization** (lines ~800-1012)
   - Clean reconnection handler
   - Chart destruction
   - Data store reset

### Machine Learning System

#### `ml-engine.js` (525 lines)
**Local ML prediction engine with seasonal modeling**

**Key Components**:

1. **Seasonal Climate Model** (lines ~10-30)
   - Monthly temperature/humidity averages for Indonesia
   - Used as baseline for projections

2. **Crop Knowledge Base** (lines ~35-250)
   - **13 Crops**: Selada, Bayam, Kangkung, Pakcoy, Sawi, Basil, Mentimun, Tomat, Cabai, Seledri, Stroberi, Paprika, Melon
   - Each crop has:
     - `ideal`: temp/humidity/EC/TDS/water temp ranges
     - `seasonFit`: monthly planting suitability [0-1]
     - `stageWeights`: growth stage sensitivity
     - `tips`: cultivation advice (Indonesian)
     - `difficulty`: Mudah/Sedang/Sulit
   - Example: **Kangkung**
     ```javascript
     ideal: { tempMin: 25, tempMax: 32, humMin: 60, humMax: 90, 
              ecMin: 2.1, ecMax: 2.8, tdsMin: 1050, tdsMax: 1400, wtMin: 20, wtMax: 28 }
     seasonFit: [0.9,0.9,0.9,0.8,0.7,0.7,0.7,0.7,0.8,0.9,0.9,0.9]
     stageWeights: { seedling: 0.2, vegetative: 0.6, harvest: 0.2 }
     ```

3. **DataCollector Class** (lines ~250-310)
   - Records sensor readings to localStorage: `agrisense_ml_data`
   - Max 5,000 historical records
   - Deduplication (skips duplicate consecutive readings)
   - Normalized format: `{ t: timestamp, T: temp, H: humidity, E: EC, D: TDS, W: waterTemp }`

4. **Feature Extractor** (lines ~315-360)
   - Calculates statistics from raw records:
     - **Mean**: average value
     - **Std Dev**: standard deviation
     - **Trend**: linear regression slope
   - Returns features object for all 5 sensor types

5. **Seasonal Projection** (lines ~365-420)
   - Projects 6-month environmental conditions
   - Uses current trend + seasonal variance
   - Outputs monthly predictions: temp, humidity, EC, TDS, water temp

6. **Crop Fit Scoring** (lines ~425-465)
   - Scores each crop against projected conditions
   - Weights by growth stage (seedling/vegetative/harvest)
   - Applies seasonal planting bonus
   - Calculates success rate (0-100%)

7. **Main Prediction Function** (lines ~467-520)
   ```javascript
   mlPredict() → { predictions, features, projections, dataPointCount, currentMonth }
   ```
   - Returns ranked list of suitable crops
   - Fallback to single reading if < 3 data points
   - Exported to window for recommendations.js

#### `recommendations.js` (243 lines)
**Render ML recommendation panel**

**Key Functions**:

1. **renderRecommendations()** - Main UI renderer
   - ML status bar (badge + data point count + weather)
   - Current sensor readings display
   - 6-month projection charts (mini)
   - Top 3-5 crop recommendations
   - Each recommendation shows:
     - Crop icon & name
     - Success rate percentage
     - Ideal conditions vs. current
     - Monthly fit breakdown
     - Tips & cultivation advice
   - Admin-only CSV export button

2. **Weather Integration**
   - Dynamically incorporates `window.weatherData`
   - Displays: temperature, rain, precipitation from Open-Meteo

3. **Chart Rendering**
   - Mini projection charts for each crop
   - Shows monthly temperature/humidity trends

---

## 3. HTML STRUCTURE & LIBRARIES

### Entry Point: `index.html` (6.2 KB)

**External Libraries (CDN)**:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/mqtt/5.3.5/mqtt.min.js"></script>
```

**Charting Library**: **Chart.js v4.4.1**
- UMD build from CDN
- Used for multi-sensor time-series line charts
- Responsive with custom animations
- Tooltip customization

**MQTT Library**: **mqtt.js v5.3.5**
- WebSocket/WebSocket Secure support
- Browser-compatible MQTT client
- Message subscriptions & publishing

**Script Load Order** (matters for dependencies):
```
1. config.js (base config)
2. config.local.js (credentials override)
3. sensors.config.js (SENSORS, SENSOR_GROUPS)
4. data-store.js (DataStore class)
5. gauge-renderer.js (GaugeRenderer class)
6. chart-manager.js (ChartManager class)
7. threshold-service.js (ThresholdService class)
8. mqtt-manager.js (MQTTManager class)
9. sensor-service.js (SensorService class)
10. ml-engine.js (ML prediction pipeline)
11. recommendations.js (ML UI rendering)
12. script.js (Main app orchestrator)
```

**HTML Sections**:
1. **Login Page** (`#login-page`):
   - Username/password form
   - Simple in-memory auth (no backend)
   - Shows on pageload if no session

2. **Dashboard** (`#dashboard`):
   - Header: branding, connection status, theme toggle, user badge
   - Info bar: last update time, MQTT badge
   - Alert container: dynamic alerts
   - Sensor sections: gauges per group (generated)
   - Chart sections: line charts per group (generated)
   - Recommendations panel: ML crop suggestions
   - Threshold settings: admin-only threshold editor
   - Event log: timestamp-labeled events

---

## 4. STYLING & CSS

### File: `style.css` (1,338 lines)

**Color System** (CSS Variables):
```css
Light Mode:
  --bg: #f4f6f0 (light green background)
  --surface: #ffffff
  --green-primary: #2d8a4e
  --orange: #e88a25
  --blue: #3b82f6
  --red: #dc3545

Dark Mode:
  --bg: #0f1713 (dark green background)
  --surface: #16211b
  --green-primary: #63c184
  etc.
```

**Component Classes**:
- `.gauge-card` — Sensor reading card with progress bar
- `.chart-card` — Container for Chart.js canvas
- `.btn`, `.btn-outline`, `.btn-green` — Button variants
- `.alert` — Alert messages
- `.status-pill` — Connection status indicator
- `.sensor-section` — Group container with label
- `.gauges-grid` — Multi-column gauge layout
- `.login-page`, `.login-card`, `.login-form` — Auth UI
- `.threshold-grid` — Threshold editor layout
- `.log-card` — Event log display
- `.section-header`, `.section-line` — Section styling

**Responsive Breakpoints**:
- Desktop: Full width
- Tablet (768px): Adjusted grid columns
- Mobile (480px): Single column layout (inferred from grid)

**Fonts**:
- Primary: Inter (weights: 300, 400, 500, 600, 700)
- Accent: Outfit (weights: 400, 500, 600, 700, 800)
- From Google Fonts CDN

**Visual Effects**:
- Shadows: --shadow-xs, --shadow-sm, --shadow-md, --shadow-lg
- Border radius: --radius-sm, --radius-md, --radius-lg, --radius-xl
- Dual-theme support (~600 lines for light + dark variants)

---

## 5. DATA FLOW & ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                      MQTT BROKER / INFLUX                       │
│  Topics: sensor/xy-md02, sensor/bsk-ec100                       │
│  Payloads: { suhu, kelembapan, ec, tds, suhuAir }               │
└────────────────────────────┬────────────────────────────────────┘
                             │ (JSON payload)
                             ▼
                    ┌─────────────────┐
                    │   MQTT Manager  │ (mqtt-manager.js)
                    │ - Connection    │
                    │ - Message Rx    │
                    │ - Auto-reconnect│
                    └────────┬────────┘
                             │
                     ┌───────▼────────┐
                     │ Message Parse  │
                     │ Field mapping  │
                     └───────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
    ┌─────────┐      ┌──────────────┐      ┌──────────┐
    │ Data    │      │ Sensor       │      │ ML Data  │
    │ Store   │      │ Service      │      │ Collector│
    │ (Memory)│      │ (Processing) │      │ (localStorage)
    └─────────┘      └─────┬────────┘      └──────────┘
        │                   │
        ├─────────────────┐ │
        │                 │ │  (Thresholds)
        ▼                 ▼ ▼
    ┌────────────────────────────────┐
    │    Threshold Service           │
    │ - Min/Max violation check      │
    │ - 60s cooldown per sensor      │
    │ - Alert generation            │
    │ - Telegram notification        │
    └────────────────────────────────┘
        │ (Violations)
        ▼
    ┌──────────────────────────────────────┐
    │         Alert Manager               │
    │ - UI alerts (warn/danger)           │
    │ - Event log appending              │
    │ - Telegram sending                 │
    └──────────────────────────────────────┘

Parallel: UI Updates
    ┌──────────────────────────────────┐
    │  Gauge Renderer                  │
    │  - Update gauge value display    │
    │  - Progress bar width            │
    │  - Status class (warn/danger)    │
    └──────────────────────────────────┘
    
    ┌──────────────────────────────────┐
    │  Chart Manager                   │
    │  - Push data point to dataset    │
    │  - Update Chart.js instance      │
    │  - 400ms animation               │
    └──────────────────────────────────┘

Async: ML Prediction & Weather
    ┌──────────────────────────────────┐
    │  Open-Meteo Weather API          │
    │  - fetch() → JSON                │
    │  - 30-min refresh interval       │
    │  - Fallback on error             │
    └──────────────────────────────────┘
           │
           ▼
    ┌──────────────────────────────────┐
    │  ML Engine (ml-engine.js)        │
    │  - Feature extraction (mean,std) │
    │  - Seasonal projection (6mo)     │
    │  - Crop scoring (13 crops)       │
    │  - Yield prediction              │
    └──────────────────────────────────┘
           │
           ▼
    ┌──────────────────────────────────┐
    │  Recommendations Panel           │
    │  (recommendations.js)            │
    │  - Top 5 crops ranked            │
    │  - Success rates %               │
    │  - Monthly breakdown             │
    │  - Cultivation tips              │
    └──────────────────────────────────┘
```

---

## 6. KEY FEATURES IMPLEMENTED

### 1. **Real-Time Sensor Monitoring**
- MQTT over WebSocket connection (auto-reconnect with fallback brokers)
- 5 dual-sensor readings (temp, humidity, EC, TDS, water temp)
- Live gauge visualization with progress bars
- 20-entry per-sensor history in memory
- Dual-theme UI (light/dark mode)

### 2. **Data Visualization with Chart.js**
- Multi-line charts per sensor group (Environment & Nutrition)
- Real-time chart updates with 400ms smooth animation
- Responsive canvas sizing
- Tooltip hover display
- Chart destruction & recreation on refresh

**Chart Configuration**:
```javascript
{
  type: 'line',
  data: { labels: [], datasets: [] },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400, easing: 'easeOutQuart' },
    interaction: { mode: 'index', intersect: false },
    scales: { 
      x: { /* time labels */ },
      y: { min: 0, max: ymax /* per group */ }
    },
    plugins: { legend: false, tooltip: { /* custom */ } }
  }
}
```

### 3. **Machine Learning Model (Local)**
- **Approach**: Statistical model + rule-based scoring (no neural networks)
- **Data**: Stores up to 5,000 sensor readings in localStorage
- **Features**: Mean, std dev, trend (linear regression) per sensor
- **Predictions**: 6-month seasonal projections for each of 13 crops
- **Scoring**:
  - Evaluates crop ideal ranges vs. projected conditions
  - Weights by growth stage (seedling 0.2-0.3, vegetative 0.5-0.6, harvest 0.2-0.5)
  - Applies seasonal planting bonus
  - Returns success rate 0-100%

**Crop List**:
1. **Selada** (Lettuce) — Easy, 45 days, 18-24°C, 50-70% RH
2. **Bayam** (Spinach) — Easy, 30 days, 16-28°C, 50-70% RH
3. **Kangkung** (Water Spinach) — Easy, 30 days, 25-32°C, 60-90% RH
4. **Pakcoy** — Easy, 40 days, 18-27°C, 50-70% RH
5. **Sawi** (Mustard Greens) — Easy, 35 days, 18-27°C, 50-70% RH
6. **Basil/Kemangi** (Herb) — Easy, 60 days, 20-30°C, 40-60% RH
7. **Mentimun** (Cucumber) — Easy, 45 days, 21-30°C, 60-75% RH
8. **Tomat** (Tomato) — Medium, 80 days, 20-27°C, 60-70% RH
9. **Cabai** (Chili) — Medium, 90 days, 21-29°C, 55-70% RH
10. **Seledri** (Celery) — Medium, 90 days, 16-24°C, 50-70% RH
11. **Stroberi** (Strawberry) — Hard, 90 days, 17-25°C, 60-75% RH
12. **Paprika** — Hard, 120 days, 18-25°C, 55-70% RH
13. **Melon** (Cantaloupe) — Medium, 90 days, 25-32°C, 50-65% RH

### 4. **Weather API Integration (Open-Meteo)**
- **Free API**: No authentication required
- **Data Points**:
  - Current: temperature, weather code, rain intensity, precipitation
  - Hourly: wind speed, soil temperature, soil moisture (24-hour history)
- **Update Interval**: 30 minutes refresh
- **WMO Code Mapping**: 
  ```
  0: Cerah (Clear)
  1: Sebagian Berawan (Partly Cloudy)
  3: Mendung (Overcast)
  51-65: Gerimis/Hujan (Drizzle/Rain) Light/Medium/Heavy
  71-75: Salju (Snow)
  95-96: Badai Petir (Thunderstorm)
  ```
- **Usage**:
  - Enhances ML predictions
  - Displayed in recommendations panel
  - Influences crop suitability scoring

**API Endpoint**:
```
https://api.open-meteo.com/v1/forecast?
  latitude=-8.65
  longitude=115.2167
  current=temperature_2m,weather_code,rain,precipitation
  hourly=precipitation_probability,precipitation,rain,wind_speed_10m,soil_temperature_18cm,soil_moisture_1_to_3cm
  timezone=Asia/Singapore
  past_days=7
```

### 5. **Threshold Violation Detection & Alerts**
- Per-sensor min/max thresholds (configurable by admin)
- 60-second cooldown per sensor to prevent alert spam
- Three alert levels:
  - **OK** (green): Within threshold
  - **Warn** (yellow): Below min or above max
  - **Danger** (red): Critical violation
- Alert UI:
  - Dismissible alert cards with icons
  - Color-coded badges
  - Timestamp logging
- Telegram integration (optional):
  - Sends critical alerts to configured chat
  - Requires bot token + chat ID configuration

### 6. **Authentication & Role-Based Access**
- Simple in-memory user database:
  ```
  admin / admin123 → admin role
  petani / petani123 → user role
  ```
- Session management:
  - 5-minute TTL
  - localStorage persistence: `agrisense_session`
  - Auto-logout on expiry
- Admin-only features:
  - Threshold editing panel
  - ML dataset download (CSV export)
  - Data reset functionality

### 7. **Event Logging & Audit Trail**
- Timestamped log entries:
  ```
  [12:34:56] OK: MQTT Connected
  [12:35:10] WARN: Suhu exceeds maximum
  [12:35:15] ERROR: Connection lost
  ```
- Log types: ok, warn, error
- Clear log button (purges UI only)
- Displayed in collapsible log panel

### 8. **Data Export & Persistence**
- **Sensor Data CSV**: 
  - Time, all sensor values
  - Download button (admin-only)
  - Triggered via SensorService.downloadCSV()
- **ML Training Dataset CSV**:
  - Timestamp, T, H, EC, TDS, waterTemp
  - Up to 5,000 records
  - Admin-downloadable via mlExportDataset()
- **Threshold Configuration**:
  - localStorage key: `agrisense_thresholds`
  - Survives page reloads

---

## 7. CONFIGURATION FILES & API KEYS

### `config.local.js` (Sample from reference)
```javascript
window.MQTT_CONFIG = {
  brokerUrl: 'ws://45.39.198.19:9001',
  brokerUrls: [ /* 3 fallbacks */ ],
  username: 'candes',
  password: 'candestampan',
  topicXY: 'sensor/xy-md02',
  topicBSK: 'sensor/bsk-ec100',
};

window.INFLUX_CONFIG = {
  host: 'http://192.168.0.79:8086',
  db: 'sensor_db',
  interval: 5000,  // 5-sec poll
};

window.BACKEND_CONFIG = {
  enabled: false,
  transport: 'mqtt_direct',
  baseUrl: 'http://45.39.198.19:8000',
  endpoints: { latest, health, stream }
};

window.OPENMETEO_CONFIG = {
  enabled: true,
  latitude: -8.65,
  longitude: 115.2167,
  timezone: 'Asia/Singapore',
  city: 'Denpasar',
};

window.TELEGRAM_CONFIG = {
  enabled: true,
  botToken: 'YOUR_TELEGRAM_BOT_TOKEN',
  chatId: 'YOUR_TELEGRAM_CHAT_ID',
};
```

### MQTT Message Format
**Expected JSON payload** on topics:
```javascript
{
  suhu: 28.5,           // Temperature °C
  kelembapan: 72,       // Humidity %RH
  ec: 1200,             // EC µS/cm
  tds: 600,             // TDS ppm
  suhuAir: 26.0         // Water temp °C
}
```

### Open-Meteo API (Free, No Auth)
- Latitude/Longitude based
- Returns JSON with hourly + current data
- 30-minute update interval

---

## 8. STATIC ASSETS

**Images/Icons**: None (emoji icons used: 🌾🌡️💧📊🥬🥒🍅🌶️, etc.)

**Fonts**: 
- Inter (Google Fonts) — UI typography
- Outfit (Google Fonts) — Headings/accent

**Stylesheets**: 
- 1,338 lines of custom CSS (no Bootstrap/Tailwind)
- Dual-theme support (light/dark)

---

## 9. DATA STORAGE LOCATIONS

| Data | Storage | Key | Max Size |
|------|---------|-----|----------|
| Current Sensor Readings | Memory (DataStore) | — | 5 values |
| Sensor History | Memory | — | 20 entries/sensor |
| ML Training Records | localStorage | `agrisense_ml_data` | 5,000 records |
| Session Info | localStorage | `agrisense_session` | 1 object (small) |
| Thresholds Config | localStorage | `agrisense_thresholds` | 5-10KB |
| Theme Preference | localStorage | `agrisense_theme` | "light" or "dark" |
| Datastore (optional) | localStorage | `agrisense_datastore` | ~100KB (disabled) |

---

## 10. RECOMMENDED PORTING STRATEGY FOR ASTRO PROJECT

### Direct Ports (Can reuse largely as-is)
1. ✅ **Services**: mqtt-manager.ts, data-store.ts, threshold-service.ts, sensor-service.ts
   - Already service-oriented, minimal view dependencies
   - Convert to TypeScript classes

2. ✅ **ML Engine**: ml-engine.js 
   - Pure algorithm, no DOM dependencies
   - Port to TypeScript function library

3. ✅ **Config**: sensors.config.ts
   - Just data structures
   - Excellent TypeScript candidate

### Partial Adaptation Required
4. 🔄 **Chart Manager**: chart-manager.ts
   - Replace Chart.js Canvas with Astro/React component integration
   - Keep data update logic
   - Your project already uses Chart.js v4.4.1 ✅

5. 🔄 **Gauge Renderer**: gauge-renderer.ts
   - Already CSS-based, minimal DOM manipulation
   - Adapt to Astro component rendering
   - CSS classes compatible with existing globals.css

6. 🔄 **Recommendations Panel**: recommendations.ts
   - Pure rendering logic
   - Adapt to Astro/React component

### Architecture Reuse
- ✅ Sensor definitions (5 sensors, 2 groups)
- ✅ ML crop knowledge base (13 crops, complete scoring)
- ✅ Threshold management pattern
- ✅ Event logging system
- ✅ Weather API integration
- ✅ Authentication (already in Astro project)
- ✅ localStorage persistence keys

---

## 11. COMPARISON WITH ASTRO MONITORING PROJECT

| Feature | Reference | Astro Project | Status |
|---------|-----------|---------------|---------|
| MQTT Manager | ✅ 361 lines | ✅ Already implemented | Align implementations |
| Data Store | ✅ 131 lines | ✅ Already implemented | Align API |
| Threshold Service | ✅ 159 lines | ✅ Already implemented | Verify feature parity |
| Sensor Service | ✅ 181 lines | ✅ Already implemented | Compare | 
| Chart.js Integration | ✅ 174 lines | ✅ Already using v4.4.1 | Adopt manager pattern |
| Gauges | ✅ 116 lines | ✅ Exists | Compare CSS |
| ML Engine | ✅ 525 lines | ❌ Missing | **MAJOR FEATURE TO PORT** |
| Recommendations UI | ✅ 243 lines | ❌ Missing | **NEW COMPONENT** |
| Weather API | ✅ Integrated | ❌ Missing | **NEW INTEGRATION** |
| Telegram Alerts | ✅ Supported | ❌ Missing | Optional enhancement |
| 13-crop ML Model | ✅ Complete | ❌ Missing | **CRITICAL PORT** |

---

## 12. KEY INSIGHTS FOR FEATURE PORTING

### ML Model Architecture
- **Not using**: Neural networks, TensorFlow.js, complex algorithms
- **Using**: Statistical summaries (mean, std, trend) + rule-based crop scoring
- **Why**: Lightweight, transparent, works with small datasets (30+ readings)
- **Implementation**: Pure functions, no external ML library needed
- **Portability**: 100% portable to Astro/TypeScript

### Weather Integration
- **API**: Open-Meteo (free, no auth required)
- **Update**: Every 30 minutes
- **Usage**: Enhances ML crop recommendations
- **Fallback**: Graceful degradation if API fails
- **Portability**: Simple async fetch, easy to integrate

### Data Flow Philosophy
- **Streaming**: Real-time MQTT → immediate UI update
- **Batch Processing**: ML happens on-demand when rendering recommendations
- **Persistence**: critical config in localStorage, sensor history in RAM
- **Scalability**: Current design handles 20 readings/sensor fine, could extend to 5000+ in ML storage

### Performance Considerations
- Chart.js animation set to 400ms (smooth but quick)
- Max 20 history entries in active display (memory efficient)
- ML feature extraction on 50-point window (fast)
- 60-second alert cooldown (prevents spam)
- 30-minute weather refresh (API-friendly)

---

## Summary

The reference project is a **production-ready, lightweight IoT dashboard** built entirely with vanilla JavaScript. It demonstrates:

1. **Clean Architecture**: Service-oriented design with clear separation of concerns
2. **Feature-Rich ML**: 13-crop recommendation engine with 6-month projections
3. **Real-Time Integration**: MQTT + Weather API + Telegram
4. **User Experience**: Dual-theme UI, responsive gauges, live charts
5. **Data Intelligence**: Threshold alerts, event logging, CSV export

**Most Valuable for Porting**:
- Complete ML crop knowledge base (13 crops with thresholds)
- Seasonal projection algorithm
- Weather API integration pattern
- Recommendation rendering logic
- Alert cooldown management

Your Astro project already has the **foundation services implemented**. Adding the ML engine and weather integration would make it significantly more capable for farm decision-support.
