# Integration Testing Guide - Astro Monitoring Dashboard

## Setup Complete ✅

Your Astro monitoring project is now configured with **Vitest** for integration testing.

## Available Commands

Run tests with:

```bash
# Run tests once
npm run test:run

# Run tests in watch mode
npm test

# Run tests with UI dashboard
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Test Files Structure

### 1. **Sensor Configuration Tests** (`src/config/sensors.test.ts`)
Tests the sensor configuration structure and validation:
- ✓ Verify all sensors have correct properties
- ✓ Validate field name mappings
- ✓ Check threshold values
- ✓ Ensure precision settings are correct

**12 tests** covering sensor data structure and thresholds

### 2. **MQTT Manager Service Tests** (`src/services/mqtt-manager.test.ts`)
Tests the MQTT connection and message handling:
- ✓ Build broker URL candidates
- ✓ Accept callbacks for messages and status changes
- ✓ Track connection status
- ✓ Monitor data reception

**11 tests** covering connection management and status tracking

### 3. **Integration Tests** (`src/__integration__.test.ts`)
Tests how components work together:
- ✓ Sensor data processing from multiple topics
- ✓ Field name extraction with different formats
- ✓ Data validation against thresholds
- ✓ Data precision handling
- ✓ Multiple sensor data handling
- ✓ Connection status with sensor data
- ✓ Stale data detection

**9 tests** covering end-to-end workflows

## Total: 32 Tests Passing ✅

## How to Write More Tests

Create a `.test.ts` file next to your code:

```typescript
import { describe, it, expect } from 'vitest';
import { yourFunction } from './your-file';

describe('Your Feature', () => {
  it('should do something', () => {
    const result = yourFunction();
    expect(result).toBe(expectedValue);
  });
});
```

## Test Results

```
Test Files  3 passed (3)
Tests       32 passed (32)
```

## Next Steps

1. **Run watch mode during development:**
   ```bash
   npm test
   ```
   Tests will re-run whenever you save files

2. **Add more integration tests:**
   - Test MQTT message parsing
   - Test sensor data transformation
   - Test error handling

3. **Check coverage:**
   ```bash
   npm run test:coverage
   ```

## Configuration

Vitest config is in `vitest.config.ts`:
- Uses `happy-dom` environment for fast testing
- Includes glob patterns for test discovery
- Coverage reporting configured

The tests are now ready to catch bugs and ensure your MQTT monitoring dashboard works correctly!
