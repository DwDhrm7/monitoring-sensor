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
  const brokerUrl = process.env.MQTT_BROKER_URL || 'ws://45.39.198.19:9001';
  const brokerUrlsStr = process.env.MQTT_BROKER_URLS || brokerUrl;
  const brokerUrls = brokerUrlsStr.split(',').map((url: string) => url.trim());

  return {
    brokerUrl: brokerUrl,
    brokerUrls: brokerUrls.length > 0 ? brokerUrls : [brokerUrl],
    username: process.env.MQTT_USERNAME || 'candes',
    password: process.env.MQTT_PASSWORD || 'candestampan',
    topicXY: 'sensor/xy-md02',
    topicBSK: 'sensor/bsk-ec100',
  };
}
