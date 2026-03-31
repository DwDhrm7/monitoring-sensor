// ══════════════════════════════════════════════════════════════
//  AgriSense — MQTT Manager
//  Generic MQTT connection and message handling
// ══════════════════════════════════════════════════════════════

class MQTTManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.lastMessageTime = null;
    this.hasReceivedMessage = false;
    this.listeners = new Set();
    this.reconnectInterval = 2000;
    this.reconnectTimer = null;
    this.connectionStarted = false;
    this.brokerUrls = [];
    this.brokerIndex = 0;
    this.onMessageCallback = null;
    this.onStatusChangeCallback = null;
  }

  buildBrokerUrls() {
    const configuredUrls = Array.isArray(window.MQTT_CONFIG?.brokerUrls)
      ? window.MQTT_CONFIG.brokerUrls
      : [window.MQTT_CONFIG?.brokerUrl];
    const candidates = [];

    configuredUrls
      .filter(Boolean)
      .forEach((rawUrl) => {
        const normalizedVariants = this.normalizeBrokerUrl(rawUrl);
        normalizedVariants.forEach((url) => {
          if (!candidates.includes(url)) {
            candidates.push(url);
          }
        });
      });

    return candidates;
  }

  normalizeBrokerUrl(rawUrl) {
    try {
      const url = new URL(rawUrl);
      const variants = [];
      const pathVariants = url.pathname && url.pathname !== '/'
        ? [url.pathname]
        : ['/mqtt', '/ws', '/'];

      pathVariants.forEach((pathname) => {
        const variant = new URL(url.toString());
        variant.pathname = pathname;
        variants.push(variant.toString());

        if (variant.protocol === 'ws:' && variant.port === '443') {
          const secureVariant = new URL(variant.toString());
          secureVariant.protocol = 'wss:';
          variants.push(secureVariant.toString());
        }
      });

      return variants;
    } catch (err) {
      console.warn('[MQTT] brokerUrl tidak valid, memakai nilai asli:', rawUrl, err);
      return [rawUrl];
    }
  }

  getConnectionOptions() {
    const clientId = 'agrisense-' + Math.random().toString(16).slice(2, 8);

    return {
      clientId,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: this.reconnectInterval,
      keepalive: 30,
      protocolVersion: 4,
      username: window.MQTT_CONFIG.username,
      password: window.MQTT_CONFIG.password,
    };
  }

  resetConnectionState() {
    this.isConnected = false;
    this.hasReceivedMessage = false;
    this.lastMessageTime = null;
  }

  teardownClient() {
    if (!this.client) return;
    this.client.removeAllListeners();
    this.client.end(true);
    this.client = null;
  }

  moveToNextBrokerUrl() {
    if (this.connectionStarted || !this.brokerUrls.length) {
      return false;
    }

    if (this.brokerIndex >= this.brokerUrls.length - 1) {
      return false;
    }

    this.brokerIndex += 1;
    console.warn('[MQTT] Mencoba endpoint WebSocket berikutnya:', this.brokerUrls[this.brokerIndex]);
    this.connectClient();
    return true;
  }

  connectClient() {
    const brokerUrl = this.brokerUrls[this.brokerIndex];
    const options = this.getConnectionOptions();

    console.log('[MQTT] Starting connection to', brokerUrl);

    try {
      this.teardownClient();
      this.client = mqtt.connect(brokerUrl, options);

      this.client.on('connect', () => {
        this.connectionStarted = true;
        this.isConnected = true;
        this.lastMessageTime = null;
        this.hasReceivedMessage = false;
        console.log('[MQTT] Connected successfully, subscribing to topics...');
        this.onStatusChangeCallback?.('connected_no_data');
        this.subscribe();
      });

      this.client.on('message', (topic, message) => {
        const wasReceivingData = this.hasReceivedMessage;
        this.hasReceivedMessage = true;
        this.lastMessageTime = Date.now();
        console.log(`[MQTT] Message from ${topic}`);
        if (!wasReceivingData) {
          this.onStatusChangeCallback?.('connected_live');
        }
        this.handleMessage(topic, message, this.onMessageCallback);
      });

      this.client.on('error', (err) => {
        console.error('[MQTT] Connection Error:', err);
        this.resetConnectionState();

        let errorMsg = err.message || String(err);
        if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
          console.error('[MQTT] Authentication failed - check username/password');
        } else if (errorMsg.includes('ECONNREFUSED')) {
          console.error('[MQTT] Connection refused - broker not reachable');
        } else if (errorMsg.includes('ENOTFOUND')) {
          console.error('[MQTT] Broker hostname not found');
        }

        const switched = this.moveToNextBrokerUrl();
        if (!switched) {
          this.onStatusChangeCallback?.('error');
        }
      });

      this.client.on('close', () => {
        console.log('[MQTT] Connection closed');
        this.resetConnectionState();

        const switched = this.moveToNextBrokerUrl();
        if (!switched) {
          this.onStatusChangeCallback?.('disconnected');
        }
      });

      this.client.on('disconnect', () => {
        console.log('[MQTT] Disconnected from broker');
        this.resetConnectionState();
        this.onStatusChangeCallback?.('disconnected');
      });

      this.client.on('reconnect', () => {
        console.log('[MQTT] Attempting to reconnect...');
        this.onStatusChangeCallback?.('connecting');
      });
    } catch (err) {
      console.error('[MQTT] Connection initialization failed:', err);
      this.resetConnectionState();
      const switched = this.moveToNextBrokerUrl();
      if (!switched) {
        this.onStatusChangeCallback?.('error');
      }
    }
  }

  // Connect to MQTT broker
  connect(onMessage, onStatusChange) {
    if (this.client && this.isConnected) {
      console.log('[MQTT] Already connected');
      return;
    }

    // Validate MQTT library is loaded
    if (typeof mqtt === 'undefined') {
      console.error('[MQTT] mqtt.js library not loaded!');
      onStatusChange?.('error');
      return;
    }

    // Validate config
    if (!window.MQTT_CONFIG || !window.MQTT_CONFIG.brokerUrl) {
      console.error('[MQTT] MQTT_CONFIG not defined or brokerUrl missing');
      onStatusChange?.('error');
      return;
    }

    this.onMessageCallback = onMessage;
    this.onStatusChangeCallback = onStatusChange;
    this.connectionStarted = false;
    this.brokerUrls = this.buildBrokerUrls();
    this.brokerIndex = 0;

    if (!this.brokerUrls.length) {
      console.error('[MQTT] Tidak ada brokerUrl yang valid');
      onStatusChange?.('error');
      return;
    }

    console.log('[MQTT] Candidate broker URLs:', this.brokerUrls);
    onStatusChange?.('connecting');
    this.connectClient();
  }

  // Subscribe to all relevant topics
  subscribe() {
    if (!this.client) return;

    const topics = new Set();

    // Add all sensor topics
    Object.values(SENSORS).forEach((sensor) => {
      sensor.topics.forEach((topic) => {
        topics.add(topic);
      });
    });

    // Add wildcard
    topics.add('sensor/#');

    topics.forEach((topic) => {
      this.client.subscribe(topic, { qos: 0 }, (err) => {
        if (err) {
          console.error(`[MQTT] Failed to subscribe to ${topic}:`, err);
        } else {
          console.log(`[MQTT] Subscribed to ${topic}`);
        }
      });
    });

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  // Handle incoming MQTT message
  handleMessage(topic, message, callback) {
    try {
      const data = JSON.parse(message.toString());
      const timestamp = Date.now();

      const emittedSensorIds = new Set();
      const matchingSensors = Object.values(SENSORS).filter((sensor) =>
        sensor.topics.some((candidateTopic) => topic.includes(candidateTopic))
      );

      if (matchingSensors.length > 0) {
        matchingSensors.forEach((sensor) => {
          const value = extractSensorValue(sensor, data);
          if (value !== null && !isNaN(value)) {
            emittedSensorIds.add(sensor.id);
            callback?.(sensor.id, value, data, topic, timestamp);
          }
        });
      }

      // Also scan payload fields directly so mixed/unknown topics still map correctly.
      Object.entries(data).forEach(([fieldName, value]) => {
        const candidateSensors = findSensorsByFieldName(fieldName);
        if (!candidateSensors.length) return;

        const topicMatchedSensors = candidateSensors.filter((sensor) =>
          sensor.topics.some((candidateTopic) => topic.includes(candidateTopic))
        );

        let sensor = null;
        if (topicMatchedSensors.length === 1) {
          sensor = topicMatchedSensors[0];
        } else if (candidateSensors.length === 1) {
          sensor = candidateSensors[0];
        } else {
          console.warn(
            `[MQTT] Field ambigu "${fieldName}" pada topic ${topic}, dilewati agar tidak menabrak sensor`,
            candidateSensors.map((item) => item.id)
          );
          return;
        }

        if (emittedSensorIds.has(sensor.id)) return;

        const parsedValue = parseFloat(value);
        if (!isNaN(parsedValue)) {
          emittedSensorIds.add(sensor.id);
          callback?.(sensor.id, parsedValue, data, topic, timestamp);
        }
      });

      if (emittedSensorIds.size === 0) {
        console.warn(`[MQTT] Tidak ada sensor yang cocok untuk topic ${topic}`, data);
      }
    } catch (err) {
      console.error('[MQTT] Message parse error:', err);
    }
  }

  // Subscribe to updates
  onMessage(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Disconnect
  disconnect() {
    this.teardownClient();
    this.resetConnectionState();
    this.connectionStarted = false;
    this.brokerUrls = [];
    this.brokerIndex = 0;
    this.onMessageCallback = null;
    this.onStatusChangeCallback = null;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
  }

  // Get connection status
  getStatus() {
    if (!this.isConnected) return 'disconnected';
    if (!this.hasReceivedMessage || !this.lastMessageTime) return 'connected_no_data';
    
    const timeSinceMessage = Date.now() - this.lastMessageTime;
    if (timeSinceMessage > 30 * 1000) return 'connected_stale'; // 30s without data

    return 'connected_live';
  }

  // Check if data is flowing
  isReceivingData() {
    if (!this.isConnected || !this.hasReceivedMessage) return false;
    if (!this.lastMessageTime) return false;
    return Date.now() - this.lastMessageTime < 20 * 1000; // Within 20s
  }
}

const mqttManager = new MQTTManager();
