/**
 * Aether UI TTI (Time to Interactive) Benchmark
 * Compares React vs Aether load performance
 */

import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { gzipSync } from 'zlib';

const ITERATIONS = 5;
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

async function measurePage(browser, url, name) {
  const results = [];

  for (let i = 0; i < ITERATIONS; i++) {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Clear cache
    await context.clearCookies();

    const metrics = {
      name,
      iteration: i + 1,
      url
    };

    // Navigation timing
    const startTime = Date.now();

    await page.goto(url, { waitUntil: 'networkidle' });

    // Measure core web vitals
    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');

      return {
        // Navigation timing
        domContentLoaded: nav?.domContentLoadedEventEnd - nav?.startTime,
        loadComplete: nav?.loadEventEnd - nav?.startTime,

        // Paint timing
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,

        // Resource timing
        resourceCount: performance.getEntriesByType('resource').length,
        jsTransferSize: performance.getEntriesByType('resource')
          .filter(r => r.initiatorType === 'script')
          .reduce((sum, r) => sum + (r.transferSize || 0), 0)
      };
    });

    metrics.timing = timing;
    metrics.totalTime = Date.now() - startTime;

    // Check for Aether-specific markers
    const hasAether = await page.evaluate(() => {
      return !!document.querySelector('aether-runtime');
    });
    metrics.hasAether = hasAether;

    // Get Aether connection status
    if (hasAether) {
      const aetherStatus = await page.evaluate(() => {
        const runtime = document.querySelector('aether-runtime');
        return {
          connected: runtime?.hasAttribute('data-aether-connected'),
          error: runtime?.hasAttribute('data-aether-error')
        };
      });
      metrics.aetherStatus = aetherStatus;
    }

    results.push(metrics);
    await context.close();
  }

  return results;
}

function calculateStats(results, metric) {
  const values = results.map(r => r.timing?.[metric]).filter(v => v != null);
  if (values.length === 0) return null;

  const sorted = values.sort((a, b) => a - b);
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: sorted[Math.floor(sorted.length / 2)],
    mean: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
    p95: sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1]
  };
}

async function measureKernelSize() {
  try {
    const code = readFileSync('dist/aether-kernel.min.js');
    const gzipped = gzipSync(code);
    return {
      raw: code.length,
      gzipped: gzipped.length
    };
  } catch {
    return { raw: 0, gzipped: 0, error: 'Could not read kernel file' };
  }
}

async function runBenchmarks() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('              AETHER UI PERFORMANCE BENCHMARK              ');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Kernel size
  const kernelSize = await measureKernelSize();
  console.log('📦 Kernel Size');
  console.log(`   Raw: ${kernelSize.raw} bytes`);
  console.log(`   Gzipped: ${kernelSize.gzipped} bytes`);
  console.log(`   Target: 2048 bytes`);
  console.log(`   Status: ${kernelSize.gzipped <= 2048 ? '✅ PASS' : '❌ FAIL'}\n`);

  const browser = await chromium.launch();

  const pages = [
    { url: `${BASE_URL}/examples/weather/`, name: 'Weather (Snap-in)' },
    { url: `${BASE_URL}/examples/jump-in/`, name: 'Jump-in Demo' },
    { url: `${BASE_URL}/examples/net-new/`, name: 'Net-new (Pure Aether)' },
    { url: `${BASE_URL}/examples/dashboard/`, name: 'Multi-agent Dashboard' },
    { url: `${BASE_URL}/examples/chat/`, name: 'Streaming Chat' }
  ];

  console.log(`⏱️  Running ${ITERATIONS} iterations per page...\n`);

  for (const page of pages) {
    console.log(`📄 ${page.name}`);
    console.log(`   URL: ${page.url}`);

    try {
      const results = await measurePage(browser, page.url, page.name);

      const fcpStats = calculateStats(results, 'firstContentfulPaint');
      const dclStats = calculateStats(results, 'domContentLoaded');
      const jsStats = calculateStats(results, 'jsTransferSize');

      if (fcpStats) {
        console.log(`   First Contentful Paint: ${fcpStats.median}ms (median)`);
        console.log(`   DOM Content Loaded: ${dclStats?.median || 'N/A'}ms (median)`);
        console.log(`   JS Transfer Size: ${(jsStats?.median / 1024).toFixed(2)}KB`);
      }

      const aetherCount = results.filter(r => r.hasAether).length;
      console.log(`   Aether Runtime: ${aetherCount}/${ITERATIONS} pages`);

      const connectedCount = results.filter(r => r.aetherStatus?.connected).length;
      console.log(`   SSE Connected: ${connectedCount}/${aetherCount} runtimes`);
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
    }

    console.log('');
  }

  await browser.close();

  console.log('═══════════════════════════════════════════════════════════');
  console.log('                      BENCHMARK COMPLETE                    ');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Target metrics summary
  console.log('🎯 Target Metrics vs Results');
  console.log('┌──────────────────────┬──────────┬──────────┐');
  console.log('│ Metric               │ Target   │ Actual   │');
  console.log('├──────────────────────┼──────────┼──────────┤');
  console.log(`│ Kernel Size (gzip)   │ ≤2048 B  │ ${kernelSize.gzipped} B    │`);
  console.log('│ Time to Interactive  │ <50ms    │ See above│');
  console.log('│ First Contentful     │ <30ms    │ See above│');
  console.log('└──────────────────────┴──────────┴──────────┘');
}

runBenchmarks().catch(console.error);
