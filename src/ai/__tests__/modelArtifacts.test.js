import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const modelPath = path.resolve(process.cwd(), 'public', 'model', 'model.json');

describe('local TF.js model artifact', () => {
  it('is exported as a layers-model with batch_input_shape on every InputLayer', () => {
    const raw = fs.readFileSync(modelPath, 'utf-8');
    const data = JSON.parse(raw);

    expect(data.format).toBe('layers-model');

    const inputLayerConfigs = [];
    const visit = (node) => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        node.forEach(visit);
        return;
      }
      if (node.class_name === 'InputLayer' && node.config) {
        inputLayerConfigs.push(node.config);
      }
      Object.values(node).forEach(visit);
    };

    visit(data.modelTopology?.model_config);
    expect(inputLayerConfigs.length).toBeGreaterThan(0);

    for (const cfg of inputLayerConfigs) {
      expect(cfg.batch_input_shape, 'InputLayer harus memiliki batch_input_shape').toBeTruthy();
    }
  });
});
