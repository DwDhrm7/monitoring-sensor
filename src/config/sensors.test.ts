import { describe, it, expect } from 'vitest';
import { SENSORS } from './sensors';
import type { SensorConfig } from './sensors';

describe('Sensor Configuration - Integration Tests', () => {
  describe('Sensor Data Structure', () => {
    it('should have suhu (temperature) sensor configured', () => {
      expect(SENSORS.suhu).toBeDefined();
      expect(SENSORS.suhu.id).toBe('suhu');
    });

    it('should have kelembapan (humidity) sensor configured', () => {
      expect(SENSORS.kelembapan).toBeDefined();
      expect(SENSORS.kelembapan.id).toBe('kelembapan');
    });

    it('suhu sensor should have correct properties', () => {
      const suhuSensor = SENSORS.suhu;
      expect(suhuSensor.label).toBe('Suhu Udara');
      expect(suhuSensor.unit).toBe('°C');
      expect(suhuSensor.icon).toBe('🌡️');
      expect(suhuSensor.precision).toBe(1);
    });

    it('suhu sensor should have topic mappings', () => {
      const suhuSensor = SENSORS.suhu;
      expect(suhuSensor.topics).toContain('sensor/xy-md02');
      expect(suhuSensor.fieldNames).toContain('suhu');
      expect(suhuSensor.fieldNames.length).toBeGreaterThan(0);
    });

    it('sensors should have valid thresholds', () => {
      Object.values(SENSORS).forEach((sensor: SensorConfig) => {
        if (sensor.threshold.min !== undefined && sensor.threshold.max !== undefined) {
          expect(sensor.threshold.min).toBeLessThan(sensor.threshold.max);
          expect(typeof sensor.threshold.min).toBe('number');
          expect(typeof sensor.threshold.max).toBe('number');
        }
      });
    });
  });

  describe('Sensor Validation', () => {
    it('should have precision values for all sensors', () => {
      Object.values(SENSORS).forEach((sensor: SensorConfig) => {
        expect(sensor.precision).toBeGreaterThanOrEqual(0);
        expect(sensor.precision).toBeLessThanOrEqual(2);
      });
    });

    it('should have at least one field name per sensor', () => {
      Object.values(SENSORS).forEach((sensor: SensorConfig) => {
        expect(sensor.fieldNames.length).toBeGreaterThan(0);
        expect(typeof sensor.fieldNames[0]).toBe('string');
      });
    });

    it('should have at least one topic per sensor', () => {
      Object.values(SENSORS).forEach((sensor: SensorConfig) => {
        expect(sensor.topics.length).toBeGreaterThan(0);
        expect(typeof sensor.topics[0]).toBe('string');
      });
    });

    it('field names should be valid for JSON data extraction', () => {
      const suhuSensor = SENSORS.suhu;
      expect(suhuSensor.fieldNames).toContain('suhu');
      expect(suhuSensor.fieldNames).toContain('temperature');
      expect(suhuSensor.fieldNames.some(f => f.length > 0)).toBe(true);
    });
  });

  describe('Sensor Thresholds', () => {
    it('suhu should have proper temperature thresholds', () => {
      const suhuSensor = SENSORS.suhu;
      expect(suhuSensor.threshold.min).toBe(10);
      expect(suhuSensor.threshold.max).toBe(40);
    });

    it('kelembapan should have proper humidity thresholds', () => {
      const kelembapanSensor = SENSORS.kelembapan;
      expect(kelembapanSensor.threshold.min).toBe(40);
      expect(kelembapanSensor.threshold.max).toBe(80);
    });

    it('thresholds should be realistic for each sensor type', () => {
      Object.entries(SENSORS).forEach(([sensorId, sensor]) => {
        if (sensor.threshold.min !== undefined && sensor.threshold.max !== undefined) {
          if (sensor.unit === '°C') {
            // Temperature should be between -50 and 60
            expect(sensor.threshold.min).toBeGreaterThan(-50);
            expect(sensor.threshold.max).toBeLessThan(60);
          }
          if (sensor.unit === '%RH') {
            // Humidity should be between 0 and 100
            expect(sensor.threshold.min).toBeGreaterThanOrEqual(0);
            expect(sensor.threshold.max).toBeLessThanOrEqual(100);
          }
        }
      });
    });
  });
});
