// ══════════════════════════════════════════════════════════════
//  Weather Service — Open-Meteo API Integration
//  Free weather data API with no authentication required
//  Provides hourly & daily forecasts for crop recommendations
// ══════════════════════════════════════════════════════════════

export interface WeatherData {
  city: string;
  latitude: number;
  longitude: number;
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  rainfall: number;
  weatherCode: number;
  desc: string;
  updateTime: number;
}

export interface HourlyWeather {
  time: string;
  temp: number;
  humidity: number;
  windSpeed: number;
  rainfall: number;
  soilTemp: number;
  soilMoisture: number;
}

export interface DailyWeather {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  windSpeed: number;
  rainDays: number;
}

// WMO Weather Code to Indonesian Description
const WMO_DESCRIPTIONS: Record<number, { desc: string; emoji: string }> = {
  0: { desc: 'Cerah', emoji: '☀️' },
  1: { desc: 'Sebagian berawan', emoji: '🌤️' },
  2: { desc: 'Mendung', emoji: '☁️' },
  3: { desc: 'Sangat mendung', emoji: '☁️' },
  45: { desc: 'Kabut', emoji: '🌫️' },
  48: { desc: 'Kabut membeku', emoji: '🌫️' },
  51: { desc: 'Hujan ringan', emoji: '🌧️' },
  53: { desc: 'Hujan sedang', emoji: '🌧️' },
  55: { desc: 'Hujan lebat', emoji: '⛈️' },
  61: { desc: 'Hujan sedikit', emoji: '🌧️' },
  63: { desc: 'Hujan', emoji: '🌧️' },
  65: { desc: 'Hujan lebat', emoji: '⛈️' },
  71: { desc: 'Salju ringan', emoji: '❄️' },
  73: { desc: 'Salju', emoji: '❄️' },
  75: { desc: 'Salju lebat', emoji: '❄️' },
  77: { desc: 'Granula salju', emoji: '❄️' },
  80: { desc: 'Shower ringan', emoji: '🌧️' },
  81: { desc: 'Shower', emoji: '⛈️' },
  82: { desc: 'Shower lebat', emoji: '⛈️' },
  85: { desc: 'Salju shower ringan', emoji: '❄️' },
  86: { desc: 'Salju shower', emoji: '❄️' },
  95: { desc: 'Badai', emoji: '⛈️' },
  96: { desc: 'Badai dengan hujan es ringkan', emoji: '⛈️' },
  99: { desc: 'Badai dengan hujan es', emoji: '⛈️' },
};

function getWeatherDescription(code: number): { desc: string; emoji: string } {
  return WMO_DESCRIPTIONS[code] || { desc: 'Tidak diketahui', emoji: '❓' };
}

// Default Locations in Indonesia (latitude, longitude)
const LOCATIONS = {
  jakarta: { lat: -6.2088, lon: 106.8456, name: 'Jakarta' },
  bandung: { lat: -6.9175, lon: 107.6191, name: 'Bandung' },
  surabaya: { lat: -7.25, lon: 112.75, name: 'Surabaya' },
  medan: { lat: 3.5952, lon: 98.6722, name: 'Medan' },
  makassar: { lat: -5.1477, lon: 119.4327, name: 'Makassar' },
};

class WeatherService {
  private lastUpdate: number = 0;
  private updateInterval: number = 30 * 60 * 1000; // 30 minutes
  private weatherCache: WeatherData | null = null;
  private selectedLocation: { lat: number; lon: number; name: string } = LOCATIONS.jakarta;

  setLocation(lat: number, lon: number, name: string = 'Lokasi Custom'): void {
    this.selectedLocation = { lat, lon, name };
    this.weatherCache = null;
  }

  setLocationByName(locationName: string): void {
    const loc = LOCATIONS[locationName as keyof typeof LOCATIONS];
    if (loc) {
      this.selectedLocation = loc;
      this.weatherCache = null;
    }
  }

  async fetchWeather(): Promise<WeatherData | null> {
    const now = Date.now();

    // Return cached data if within update interval
    if (this.weatherCache && now - this.lastUpdate < this.updateInterval) {
      return this.weatherCache;
    }

    try {
      const { lat, lon, name } = this.selectedLocation;

      // Open-Meteo API call
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,rain` +
          `&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm&timezone=auto`
      );

      if (!response.ok) {
        console.error(`[Weather] API error: ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (!data.current) {
        console.error('[Weather] Invalid response structure');
        return null;
      }

      const current = data.current;
      const desc = getWeatherDescription(current.weather_code || 0).desc;

      this.weatherCache = {
        city: name,
        latitude: lat,
        longitude: lon,
        temp: Math.round(current.temperature_2m * 10) / 10,
        feelsLike: Math.round(current.temperature_2m * 10) / 10, // Open-Meteo doesn't provide feels_like in free tier
        humidity: current.relative_humidity_2m || 0,
        windSpeed: Math.round(current.wind_speed_10m * 10) / 10,
        rainfall: current.rain || 0,
        weatherCode: current.weather_code || 0,
        desc,
        updateTime: now,
      };

      this.lastUpdate = now;
      return this.weatherCache;
    } catch (error) {
      console.error('[Weather] Fetch error:', error);
      return null;
    }
  }

  async fetchHourlyForecast(hours: number = 24): Promise<HourlyWeather[]> {
    try {
      const { lat, lon } = this.selectedLocation;

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&hourly=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,rain,soil_temperature_0cm,soil_moisture_0_1cm` +
          `&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm&timezone=auto&forecast_days=3`
      );

      if (!response.ok) return [];

      const data = await response.json();

      if (!data.hourly || !data.hourly.time) return [];

      const result: HourlyWeather[] = [];
      const times = data.hourly.time;
      const temps = data.hourly.temperature_2m || [];
      const humidities = data.hourly.relative_humidity_2m || [];
      const windSpeeds = data.hourly.wind_speed_10m || [];
      const rainfall = data.hourly.rain || [];
      const soilTemps = data.hourly.soil_temperature_0cm || [];
      const soilMoisture = data.hourly.soil_moisture_0_1cm || [];

      for (let i = 0; i < Math.min(hours, times.length); i++) {
        result.push({
          time: times[i],
          temp: temps[i] || 0,
          humidity: humidities[i] || 0,
          windSpeed: windSpeeds[i] || 0,
          rainfall: rainfall[i] || 0,
          soilTemp: soilTemps[i] || 0,
          soilMoisture: soilMoisture[i] || 0,
        });
      }

      return result;
    } catch (error) {
      console.error('[Weather] Hourly forecast error:', error);
      return [];
    }
  }

  async fetchDailyForecast(days: number = 7): Promise<DailyWeather[]> {
    try {
      const { lat, lon } = this.selectedLocation;

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,rain_days,wind_speed_10m_max` +
          `&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm&timezone=auto`
      );

      if (!response.ok) return [];

      const data = await response.json();

      if (!data.daily || !data.daily.time) return [];

      const result: DailyWeather[] = [];
      const times = data.daily.time;
      const tempMaxes = data.daily.temperature_2m_max || [];
      const tempMins = data.daily.temperature_2m_min || [];
      const precips = data.daily.precipitation_sum || [];
      const rainDays = data.daily.rain_days || [];
      const windSpeeds = data.daily.wind_speed_10m_max || [];

      for (let i = 0; i < Math.min(days, times.length); i++) {
        result.push({
          date: times[i],
          tempMax: tempMaxes[i] || 0,
          tempMin: tempMins[i] || 0,
          precipitation: precips[i] || 0,
          windSpeed: windSpeeds[i] || 0,
          rainDays: rainDays[i] || 0,
        });
      }

      return result;
    } catch (error) {
      console.error('[Weather] Daily forecast error:', error);
      return [];
    }
  }

  getLastData(): WeatherData | null {
    return this.weatherCache;
  }

  getAvailableLocations(): Record<string, { lat: number; lon: number; name: string }> {
    return LOCATIONS;
  }

  getCurrentLocation(): { lat: number; lon: number; name: string } {
    return this.selectedLocation;
  }

  // Try to get user's location via browser Geolocation API
  async detectUserLocation(): Promise<{ lat: number; lon: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        () => {
          resolve(null);
        }
      );
    });
  }
}

// ── Singleton Instance ───────────────────────────────────────
export const weatherService = new WeatherService();
