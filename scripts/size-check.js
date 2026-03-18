import { readFileSync } from 'fs';
import { gzipSync } from 'zlib';

const TARGET_SIZE = 2048; // 2KB

try {
  const code = readFileSync('dist/aether-kernel.min.js');
  const gzipped = gzipSync(code);
  const size = gzipped.length;

  console.log(`Kernel size: ${size} bytes (gzipped)`);
  console.log(`Target: ${TARGET_SIZE} bytes`);

  if (size <= TARGET_SIZE) {
    console.log(`Status: PASS (${TARGET_SIZE - size} bytes to spare)`);
    process.exit(0);
  } else {
    console.log(`Status: FAIL - need ${size - TARGET_SIZE} bytes reduction`);
    process.exit(1);
  }
} catch (err) {
  console.error('Error: Could not read dist/aether-kernel.min.js');
  console.error('Run "npm run build" first.');
  process.exit(1);
}
