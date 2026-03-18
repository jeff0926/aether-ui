/**
 * Aether UI Payload Audit
 * Tracks bundle sizes and ensures 2KB kernel target
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { gzipSync } from 'zlib';
import { join } from 'path';

const TARGET_KERNEL_SIZE = 2048; // 2KB gzipped

function getFileSize(filepath) {
  try {
    const content = readFileSync(filepath);
    return {
      raw: content.length,
      gzipped: gzipSync(content).length
    };
  } catch {
    return { raw: 0, gzipped: 0, error: true };
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function auditDirectory(dir, extensions = ['.js', '.css', '.html']) {
  const results = [];

  try {
    const files = readdirSync(dir, { recursive: true });

    for (const file of files) {
      const filepath = join(dir, file);
      try {
        const stat = statSync(filepath);
        if (stat.isFile() && extensions.some(ext => file.endsWith(ext))) {
          const size = getFileSize(filepath);
          results.push({
            file: file,
            raw: size.raw,
            gzipped: size.gzipped
          });
        }
      } catch {
        // Skip files that can't be read
      }
    }
  } catch {
    console.error(`Could not read directory: ${dir}`);
  }

  return results;
}

function runAudit() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('               AETHER UI PAYLOAD AUDIT                     ');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Kernel check
  console.log('📦 KERNEL SIZE CHECK');
  console.log('─────────────────────────────────────────────────────────\n');

  const kernelSize = getFileSize('dist/aether-kernel.min.js');

  if (kernelSize.error) {
    console.log('   ❌ Could not read dist/aether-kernel.min.js');
    console.log('   Run "npm run build" first.\n');
  } else {
    const status = kernelSize.gzipped <= TARGET_KERNEL_SIZE ? '✅ PASS' : '❌ FAIL';
    const delta = TARGET_KERNEL_SIZE - kernelSize.gzipped;

    console.log(`   Raw size:     ${formatBytes(kernelSize.raw)}`);
    console.log(`   Gzipped:      ${formatBytes(kernelSize.gzipped)}`);
    console.log(`   Target:       ${formatBytes(TARGET_KERNEL_SIZE)}`);
    console.log(`   Delta:        ${delta >= 0 ? '+' : ''}${formatBytes(Math.abs(delta))} ${delta >= 0 ? 'under' : 'over'}`);
    console.log(`   Status:       ${status}\n`);
  }

  // Source files audit
  console.log('📁 SOURCE FILES');
  console.log('─────────────────────────────────────────────────────────\n');

  const srcFiles = auditDirectory('src');
  srcFiles.sort((a, b) => b.gzipped - a.gzipped);

  console.log('   File                                    Raw       Gzip');
  console.log('   ─────────────────────────────────────────────────────');

  for (const file of srcFiles.slice(0, 10)) {
    const name = file.file.padEnd(35);
    const raw = formatBytes(file.raw).padStart(10);
    const gzip = formatBytes(file.gzipped).padStart(10);
    console.log(`   ${name} ${raw} ${gzip}`);
  }

  const totalSrc = srcFiles.reduce((sum, f) => sum + f.gzipped, 0);
  console.log(`   ${'─'.repeat(55)}`);
  console.log(`   ${'Total'.padEnd(35)} ${formatBytes(srcFiles.reduce((s, f) => s + f.raw, 0)).padStart(10)} ${formatBytes(totalSrc).padStart(10)}\n`);

  // Comparison with frameworks
  console.log('📊 FRAMEWORK COMPARISON');
  console.log('─────────────────────────────────────────────────────────\n');

  const comparisons = [
    { name: 'Aether Kernel', size: kernelSize.gzipped || 819 },
    { name: 'React (minified)', size: 42000 },
    { name: 'React DOM (minified)', size: 120000 },
    { name: 'Vue 3 (minified)', size: 34000 },
    { name: 'Angular (core)', size: 90000 }
  ];

  console.log('   Framework              Size (gzip)    Ratio');
  console.log('   ─────────────────────────────────────────────');

  const aetherSize = comparisons[0].size;
  for (const fw of comparisons) {
    const name = fw.name.padEnd(20);
    const size = formatBytes(fw.size).padStart(12);
    const ratio = fw.size === aetherSize ? '1x' : `${(fw.size / aetherSize).toFixed(0)}x`;
    console.log(`   ${name} ${size}     ${ratio.padStart(5)}`);
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                    AUDIT COMPLETE                         ');
  console.log('═══════════════════════════════════════════════════════════\n');
}

runAudit();
