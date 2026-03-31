window.MQTT_CONFIG = Object.assign({
  brokerUrl: 'wss://your-broker-url:8884/mqtt',
  username: 'YOUR_MQTT_USERNAME',
  password: 'YOUR_MQTT_PASSWORD',
  topicXY: 'sensor/xy-md02',
  topicBSK: 'sensor/bsk-ec100',
}, window.MQTT_CONFIG || {});

window.INFLUX_CONFIG = Object.assign({
  host: 'http://localhost:8086',
  db: 'sensor_db',
  interval: 5000,
}, window.INFLUX_CONFIG || {});

window.BACKEND_CONFIG = Object.assign({
  enabled: false,
  transport: 'mqtt_direct',
  baseUrl: 'http://127.0.0.1:8000',
  pollInterval: 5000,
  authToken: '',
  endpoints: {
    latest: '/api/sensors/latest',
    health: '/health',
    stream: '/api/sensors/stream',
  },
}, window.BACKEND_CONFIG || {});
window.BACKEND_CONFIG.endpoints = Object.assign({
  latest: '/api/sensors/latest',
  health: '/health',
  stream: '/api/sensors/stream',
}, window.BACKEND_CONFIG.endpoints || {});

window.OPENMETEO_CONFIG = Object.assign({
  enabled: true,
  latitude: -8.65,
  longitude: 115.2167,
  timezone: 'Asia/Singapore',
  city: 'Denpasar',
}, window.OPENMETEO_CONFIG || {});
const OPENMETEO_CONFIG = window.OP
window.TELEGRAM_CONFIG = Object.assign({
  enabled: true,
  botToken: 'YOUR_TELEGRAM_BOT_TOKEN',
  chatId: 'YOUR_TELEGRAM_CHAT_ID',
}, window.TELEGRAM_CONFIG || {});
const TELEGRAM_CONFIG = window.TELEGRAM_CONFIG;
