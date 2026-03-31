window.MQTT_CONFIG = {
  brokerUrl: 'wss://43fb5c6796dd440693f33baa44223b55.s1.eu.hivemq.cloud:8884/mqtt',
  brokerUrls: [
    'wss://43fb5c6796dd440693f33baa44223b55.s1.eu.hivemq.cloud:8884/mqtt',
    'wss://43fb5c6796dd440693f33baa44223b55.s1.eu.hivemq.cloud:443/mqtt',
  ],
  username: 'arthur',
  password: 'Arthur1234',
  topicXY: 'sensor/xy-md02',
  topicBSK: 'sensor/bsk-ec100',
};

window.INFLUX_CONFIG = {
  host: 'http://192.168.0.79:8086',
  db: 'sensor_db',
  interval: 5000,
};

window.BACKEND_CONFIG = {
  enabled: false,
  transport: 'mqtt_direct',
  baseUrl: 'http://45.39.198.19:8000',
  pollInterval: 5000,
  authToken: '',
  mqtt: {
    host: '43fb5c6796dd440693f33baa44223b55.s1.eu.hivemq.cloud',
    port: 8883,
    ssl: true,
    username: 'arthur',
    password: 'Arthur1234',
    topics: [
      'sensor/xy-md02',
      'sensor/bsk-ec100',
      'sensor/#',
    ],
  },
  endpoints: {
    latest: '/api/sensors/latest',
    health: '/health',
    stream: '/api/sensors/stream',
  },
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
