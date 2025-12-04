import fs from 'node:fs';
import path from 'node:path';

const modelPath = path.resolve('public/model/model.json');
const backupPath = path.resolve('public/model/model.original.json');

const raw = fs.readFileSync(modelPath, 'utf-8');
const json = JSON.parse(raw);

let batchPatched = 0;
let inboundPatched = 0;

function normalizeInboundArray(entry) {
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
  inboundPatched += 1;
  return [connections.length ? connections : []];
}

function walk(node) {
  if (!node || typeof node !== 'object') return;

  if (Array.isArray(node)) {
    node.forEach((child) => walk(child));
    return;
  }

  if ('batch_shape' in node && !('batch_input_shape' in node)) {
    node.batch_input_shape = node.batch_shape;
    delete node.batch_shape;
    batchPatched += 1;
  }

  if (Array.isArray(node.inbound_nodes)) {
    const needsPatch = node.inbound_nodes.some((entry) => !Array.isArray(entry));
    if (needsPatch) {
      node.inbound_nodes = node.inbound_nodes.map(normalizeInboundArray);
    }
  }

  Object.values(node).forEach((child) => walk(child));
}

walk(json);

if (!fs.existsSync(backupPath)) {
  fs.writeFileSync(backupPath, raw);
  console.log('Backup saved to', backupPath);
}

fs.writeFileSync(modelPath, JSON.stringify(json));

console.log('batch_input_shape patches:', batchPatched);
console.log('inbound_nodes patches:', inboundPatched);
