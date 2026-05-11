import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'AgriSense — Smart Farm Monitor',
  description: 'Dashboard monitoring sensor pertanian real-time untuk petani modern',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const mqttConfig = {
    brokerUrl: process.env.PUBLIC_MQTT_BROKER_URL || '',
    brokerUrls: process.env.PUBLIC_MQTT_BROKER_URLS?.split(',') || [],
    username: process.env.PUBLIC_MQTT_USERNAME || '',
    password: process.env.PUBLIC_MQTT_PASSWORD || '',
  };

  return (
    <html lang="id">
      <head>
        <Script id="mqtt-config" strategy="beforeInteractive">
          {`window.MQTT_CONFIG = Object.assign({}, window.MQTT_CONFIG, ${JSON.stringify(mqttConfig)});`}
        </Script>
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"
          strategy="beforeInteractive"
        ></Script>
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/mqtt/5.3.5/mqtt.min.js"
          strategy="beforeInteractive"
        ></Script>
        <link rel="stylesheet" href="/style.css" />

        {/* Order matters! Config first, then services, then main app */}
        <script src="/js/config/config.js" defer></script>
        <script src="/js/config/config.local.js" defer></script>
        <script src="/js/config/sensors.config.js" defer></script>
        <script src="/js/services/data-store.js" defer></script>
        <script src="/js/renderer/gauge-renderer.js" defer></script>
        <script src="/js/renderer/chart-manager.js" defer></script>
        <script src="/js/services/threshold-service.js" defer></script>
        <script src="/js/services/mqtt-manager.js" defer></script>
        <script src="/js/services/sensor-service.js" defer></script>
        <script src="/ml-engine.js" defer></script>
        <script src="/recommendations.js" defer></script>
        <script src="/js/core/script.js" defer></script>
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
