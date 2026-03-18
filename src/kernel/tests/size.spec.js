import { test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { gzipSync } from 'zlib';

test('kernel is <= 2KB gzipped', () => {
  const code = readFileSync('dist/aether-kernel.min.js');
  const gzipped = gzipSync(code);
  expect(gzipped.length).toBeLessThanOrEqual(2048);
});

test('kernel exports AetherKernel class', () => {
  const code = readFileSync('dist/aether-kernel.min.js', 'utf-8');
  expect(code).toContain('AetherKernel');
});
