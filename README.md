# AgriSense Monitoring Dashboard — Astro Edition

Modern, lightweight, and modular smart farm monitoring platform built with **Astro framework**. This project provides a robust dashboard for real-time sensor data visualization, machine learning-based crop recommendations, and automated alerts.

## ✨ Features

- 🟢 **Real-time Monitoring**: Live data streaming via MQTT (Secure WebSockets).
- 📊 **Dynamic Charts**: Interactive historical data visualization using Chart.js.
- 🌾 **Smart Recommendations**: ML-powered crop suitability analysis based on environmental conditions.
- 🌙 **Modern UI/UX**: Premium design with dynamic Dark Mode support and responsive layout.
- ⚠️ **Automated Alerts**: Threshold-based notifications for critical sensor values.
- ⚡ **Astro Powered**: High performance, static site generation, and modern developer experience.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Local Development

```bash
npm run dev
```

Visit: `http://localhost:4321`

### 3. Build for Production

```bash
npm run build
npm run preview
```

## 📁 Configuration

The dashboard uses a modular configuration system located in `public/js/config/`:

- **`config.js`**: Main configuration for MQTT, InfluxDB, and external services.
- **`config.local.js`**: Local overrides for development and specific broker credentials.
- **`sensors.config.js`**: Sensor definitions, groupings, units, and display formatting.

### MQTT Setup

To change broker settings, edit `public/js/config/config.local.js`:

```javascript
window.MQTT_CONFIG = {
  brokerUrl: 'wss://your-broker.cloud:8884/mqtt',
  username: 'your_user',
  password: 'your_password',
  // ...
};
```

## 🏗️ Project Architecture

This project is structured as an **Astro wrapper** around a modular vanilla JavaScript application:

- **Astro Component System**: Used for layout and page structure (`src/layouts`, `src/pages`).
- **Vanilla JS Core**: Complex logic, services, and state management reside in `public/js/` for maximum flexibility.
- **ML Engine**: On-device machine learning in `public/ml-engine.js` for real-time recommendations.

---

**Built with ❤️ for modern agriculture monitoring**
