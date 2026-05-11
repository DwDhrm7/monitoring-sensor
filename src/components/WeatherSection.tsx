'use client';
import { useState, useEffect } from 'react';

export default function WeatherSection() {
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=-8.65&longitude=115.22&current_weather=true'
        );
        const data = await res.json();
        setWeather(data.current_weather);
      } catch (err) {
        console.error('Failed to fetch weather', err);
      }
    }
    fetchWeather();
  }, []);

  return (
    <div className="sensor-section">
      <div className="section-header">
        <span className="section-label">Cuaca Lokal</span>
        <span className="section-sub">OPEN-METEO</span>
        <div className="section-line"></div>
      </div>
      <div
        className="chart-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px',
        }}
      >
        {weather ? (
          <>
            <div>
              <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--text)' }}>
                {weather.temperature}°C
              </div>
              <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                Angin: {weather.windspeed} km/h
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text)' }}>
                Denpasar
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Bali, ID</div>
            </div>
          </>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>Memuat data cuaca...</p>
        )}
      </div>
    </div>
  );
}
