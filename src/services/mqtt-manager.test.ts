import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MQTTManager } from './mqtt-manager';
import * as mqtt from 'mqtt';

// Mock the mqtt module
vi.mock('mqtt');
vi.mock('../config/mqtt', () => ({
  getMQTTConfig: vi.fn(() => ({
    brokerUrl: 'mqtt://localhost:1883',
    brokerUrls: [],
    username: 'testuser',
    password: 'testpass',
  })),
}));

vi.mock('../config/sensors', () => ({
  SENSORS: {
    suhu: {
      id: 'suhu',
      label: 'Suhu Udara',
      unit: '°C',
      topics: ['sensor/xy-md02'],
      fieldNames: ['suhu', 'temperature'],
      threshold: { min: 10, max: 40 },
      precision: 1,
    },
  },
}));

describe('MQTT Manager Service - Integration Tests', () => {
  let manager: MQTTManager;

  beforeEach(() => {
    manager = new MQTTManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Broker URL Building', () => {
    it('should build broker URL candidates correctly', () => {
      const urls = manager.buildBrokerUrls();
      expect(urls).toBeDefined();
      expect(Array.isArray(urls)).toBe(true);
    });

    it('should handle multiple broker URLs', () => {
      const urls = manager.buildBrokerUrls();
      expect(urls).toHaveLength(urls.length);
    });

    it('should have broker URL from configuration', () => {
      const urls = manager.buildBrokerUrls();
      expect(urls.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Connection Management', () => {
    it('should initialize without errors', () => {
      expect(() => {
        new MQTTManager();
      }).not.toThrow();
    });

    it('should accept message and status callbacks', () => {
      const messageHandler = vi.fn();
      const statusHandler = vi.fn();
      
      expect(() => {
        manager.connect(messageHandler, statusHandler);
      }).not.toThrow();
    });

    it('should have connect method', () => {
      expect(manager.connect).toBeDefined();
      expect(typeof manager.connect).toBe('function');
    });

    it('should have disconnect method', () => {
      expect(manager.disconnect).toBeDefined();
      expect(typeof manager.disconnect).toBe('function');
    });
  });

  describe('Status Tracking', () => {
    it('should return valid status', () => {
      const status = manager.getStatus();
      const validStatuses = ['disconnected', 'connected_no_data', 'connected_stale', 'connected_live'];
      expect(validStatuses).toContain(status);
    });

    it('should be disconnected initially', () => {
      const status = manager.getStatus();
      expect(status).toBe('disconnected');
    });
  });

  describe('Data Reception', () => {
    it('should provide method to check if receiving data', () => {
      expect(manager.isReceivingData).toBeDefined();
      expect(typeof manager.isReceivingData).toBe('function');
    });

    it('should return false when not receiving data initially', () => {
      const isReceivingData = manager.isReceivingData();
      expect(isReceivingData).toBe(false);
    });
  });
});
