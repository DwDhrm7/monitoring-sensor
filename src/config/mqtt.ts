// MQTT Configuration
export interface MQTTConfig {
  brokerUrl: string;
  brokerUrls: string[];
  username: string;
  password: string;
  topicXY: string;
  topicBSK: string;
}

export function getMQTTConfig(): MQTTConfig {
  const brokerUrl = import.meta.env.MQTT_BROKER_URL || 'ws://45.39.198.19:9001';
  const brokerUrlsStr = import.meta.env.MQTT_BROKER_URLS || brokerUrl;
  const brokerUrls = brokerUrlsStr.split(',').map((url: string) => url.trim());

  return {
    brokerUrl: brokerUrl,
    brokerUrls: brokerUrls.length > 0 ? brokerUrls : [brokerUrl],
    username: import.meta.env.MQTT_USERNAME || 'candes',
    password: import.meta.env.MQTT_PASSWORD || 'candestampan',
    topicXY: 'sensor/xy-md02',
    topicBSK: 'sensor/bsk-ec100',
  };
}
