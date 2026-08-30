import assert from 'node:assert/strict';
import { evaluatePcCompatibility } from '../src/lib/pcCompatibility';
import type { IPCBuild, IPCComponent } from '../src/types';

function part(type: IPCComponent['type'], specifications: Record<string, string>): IPCComponent {
  return {
    _id: type,
    type,
    name: type,
    brand: 'Test',
    price: 1,
    image: '',
    specifications,
    compatibility: [],
    stock: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const incompatibleBuild: IPCBuild = {
  CPU: part('CPU', { Socket: 'AM5', Power: '170W' }),
  GPU: part('GPU', { Power: '320W' }),
  RAM: part('RAM', { Type: 'DDR5' }),
  Storage: part('Storage', {}),
  Motherboard: part('Motherboard', { Socket: 'LGA1700', Format: 'ATX', 'RAM Type': 'DDR5' }),
  PSU: part('PSU', { Wattage: '1000W' }),
  Case: part('Case', { 'Form Factor': 'Mid Tower', 'Cooler Clearance': '170mm' }),
  Cooler: part('Cooler', { Height: '165mm' }),
};

const result = evaluatePcCompatibility(incompatibleBuild);
assert.equal(
  result.status,
  'incompatible',
  'AM5 CPU paired with LGA1700 motherboard must not be marked compatible'
);

const compatibleBuild: IPCBuild = {
  ...incompatibleBuild,
  Motherboard: part('Motherboard', { Socket: 'AM5', Format: 'ATX', 'RAM Type': 'DDR5' }),
};
assert.equal(evaluatePcCompatibility(compatibleBuild).status, 'compatible');

const unknownDataBuild: IPCBuild = {
  ...compatibleBuild,
  Case: part('Case', { 'Form Factor': 'Mid Tower' }),
};
assert.equal(evaluatePcCompatibility(unknownDataBuild).status, 'warning');

console.log('PC compatibility regression test passed');
