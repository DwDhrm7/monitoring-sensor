import { describe, it, expect } from 'vitest';
import { CROPS } from './ml-model';

describe('ML Model - CROPS Configuration', () => {
  it('should have 13 configured crops', () => {
    const cropKeys = Object.keys(CROPS);
    expect(cropKeys.length).toBe(13);
  });

  it('should have correct configuration for each crop', () => {
    Object.values(CROPS).forEach((crop) => {
      expect(crop).toHaveProperty('id');
      expect(crop).toHaveProperty('name');
      expect(crop).toHaveProperty('icon');
      expect(crop).toHaveProperty('category');
      expect(crop).toHaveProperty('growthMonths');
      expect(crop).toHaveProperty('ideal');
      expect(crop).toHaveProperty('seasonFit');
      expect(crop).toHaveProperty('stageWeights');
      expect(crop).toHaveProperty('baseYield');
      expect(crop).toHaveProperty('tips');
      expect(crop).toHaveProperty('difficulty');

      expect(crop.seasonFit.length).toBe(12);
      expect(crop.stageWeights).toHaveProperty('seedling');
      expect(crop.stageWeights).toHaveProperty('vegetative');
      expect(crop.stageWeights).toHaveProperty('harvest');

      const totalWeight =
        crop.stageWeights.seedling + crop.stageWeights.vegetative + crop.stageWeights.harvest;
      expect(totalWeight).toBeCloseTo(1.0);
    });
  });

  it('should validate specific values for Selada', () => {
    const selada = CROPS['selada'];
    expect(selada).toBeDefined();
    expect(selada.name).toBe('Selada');
    expect(selada.category).toBe('Sayuran Daun');
    expect(selada.difficulty).toBe('Mudah');
    expect(selada.ideal.tempMin).toBe(18);
    expect(selada.ideal.tempMax).toBe(24);
  });
});
