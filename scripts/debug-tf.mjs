import * as tf from '@tensorflow/tfjs';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const modelDir = path.join(projectRoot, 'public', 'model');
const modelJsonPath = path.join(modelDir, 'model.json');

let augRegistered = false;

function ensureAugmentationStubs(tfInstance) {
  if (augRegistered) return;
  const { serialization, layers } = tfInstance;
  if (!serialization || !layers) return;

  class NoOpRandomFlip extends layers.Layer {
    static className = 'RandomFlip';
    constructor(config) {
      super(config || {});
    }
    call(inputs) {
      return Array.isArray(inputs) ? inputs[0] : inputs;
    }
    getConfig() {
      return { ...super.getConfig() };
    }
  }

  class NoOpRandomRotation extends layers.Layer {
    static className = 'RandomRotation';
    constructor(config) {
      super(config || {});
    }
    call(inputs) {
      return Array.isArray(inputs) ? inputs[0] : inputs;
    }
    getConfig() {
      return { ...super.getConfig() };
    }
  }

  serialization.registerClass(NoOpRandomFlip);
  serialization.registerClass(NoOpRandomRotation);
  augRegistered = true;
}

function normalizeInboundNodesStructure(node, stats = { mutated: 0 }) {
  if (!node || typeof node !== 'object') return stats;

  if (Array.isArray(node)) {
    node.forEach((entry) => normalizeInboundNodesStructure(entry, stats));
    return stats;
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === 'inbound_nodes' && Array.isArray(value)) {
      const needsNormalization = value.some((entry) => !Array.isArray(entry));
      if (needsNormalization) {
        stats.mutated += 1;
        node[key] = value.map((entry) => {
          if (Array.isArray(entry)) return entry;
          if (!entry || typeof entry !== 'object') return entry;
          const args = Array.isArray(entry.args) ? entry.args : [];
          const connections = args
            .map((arg) => {
              const history = arg?.config?.keras_history;
              if (!Array.isArray(history)) return null;
              const [layerName, nodeIndex = 0, tensorIndex = 0] = history;
              return [layerName, nodeIndex, tensorIndex, entry.kwargs || {}];
            })
            .filter(Boolean);
          return [connections.length ? connections : []];
        });
      }
    } else if (value && typeof value === 'object') {
      normalizeInboundNodesStructure(value, stats);
    }
  }

  return stats;
}

async function loadModelArtifacts() {
  const json = JSON.parse(fs.readFileSync(modelJsonPath, 'utf-8'));
  const buffers = [];
  for (const group of json.weightsManifest || []) {
    for (const relPath of group.paths || []) {
      const absPath = path.join(modelDir, relPath);
      buffers.push(fs.readFileSync(absPath));
    }
  }
  const weightBuffer = Buffer.concat(buffers);
  const weightData = weightBuffer.buffer.slice(
    weightBuffer.byteOffset,
    weightBuffer.byteOffset + weightBuffer.byteLength
  );
  return {
    modelTopology: json.modelTopology,
    weightSpecs: json.weightsManifest?.flatMap((group) => group.weights || []) || [],
    weightData,
  };
}

async function main() {
  console.log('Project root:', projectRoot);
  console.log('Loading artifacts from', modelJsonPath);
  const artifacts = await loadModelArtifacts();
  const { mutated } = normalizeInboundNodesStructure(artifacts.modelTopology, { mutated: 0 });
  console.log('Inbound node patches applied:', mutated);

  await tf.setBackend('cpu');
  await tf.ready();
  console.log('TF backend ready:', tf.getBackend(), 'version:', tf.version_tfjs);
  ensureAugmentationStubs(tf);

  console.time('tf.loadLayersModel');
  const model = await tf.loadLayersModel(tf.io.fromMemory(artifacts));
  console.timeEnd('tf.loadLayersModel');

  model.summary();
}

main().catch((err) => {
  console.error('Failed to load model:', err);
  process.exit(1);
});
