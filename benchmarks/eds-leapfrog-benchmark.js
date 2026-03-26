/**
 * EDS Leapfrog Benchmark
 * Compares Adobe Way (React) vs Aether Way performance
 */

import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { gzipSync } from 'zlib';

const ITERATIONS = 10;
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

async function measurePage(browser, url, name) {
  const results = [];

  for (let i = 0; i < ITERATIONS; i++) {
    const context = await browser.newContext({
      // Disable cache for accurate measurements
      bypassCSP: true
    });
    const page = await context.newPage();

    // Clear all storage
    await context.clearCookies();

    const metrics = {
      name,
      iteration: i + 1,
      url
    };

    // Use domcontentloaded instead of networkidle (SSE never idles)
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Wait a moment for paint metrics to register
    await page.waitForTimeout(500);

    // Measure core web vitals
    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      const resources = performance.getEntriesByType('resource');

      // Calculate JS size
      const jsResources = resources.filter(r =>
        r.initiatorType === 'script' ||
        r.name.endsWith('.js')
      );

      return {
        // Navigation timing
        domContentLoaded: nav?.domContentLoadedEventEnd - nav?.startTime,
        domInteractive: nav?.domInteractive - nav?.startTime,
        loadComplete: nav?.loadEventEnd - nav?.startTime,

        // Paint timing
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,

        // Resource analysis
        resourceCount: resources.length,
        jsResources: jsResources.map(r => ({
          name: r.name.split('/').pop(),
          size: r.transferSize || 0,
          duration: r.duration
        })),
        totalJsSize: jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
        totalJsCount: jsResources.length
      };
    });

    metrics.timing = timing;

    // Check for specific elements
    const pageAnalysis = await page.evaluate(() => {
      return {
        hasAetherRuntime: !!document.querySelector('aether-runtime'),
        hasReactRoot: !!document.querySelector('[data-reactroot]') ||
                      !!document.getElementById('root')?.children.length,
        aetherConnected: document.querySelector('aether-runtime')
          ?.hasAttribute('data-aether-connected'),
        slotCount: document.querySelectorAll('[data-aether-slot]').length
      };
    });
    metrics.pageAnalysis = pageAnalysis;

    results.push(metrics);
    await context.close();
  }

  return results;
}

function calculateStats(values) {
  if (!values.length) return null;
  const sorted = values.filter(v => v != null).sort((a, b) => a - b);
  if (!sorted.length) return null;

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: sorted[Math.floor(sorted.length / 2)],
    mean: (sorted.reduce((a, b) => a + b, 0) / sorted.length).toFixed(2),
    p95: sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1]
  };
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(2)} KB`;
}

async function measureKernelSize() {
  const sizes = {};

  try {
    const kernel = readFileSync('dist/aether-kernel.min.js');
    sizes.kernel = { raw: kernel.length, gzipped: gzipSync(kernel).length };
  } catch { sizes.kernel = { error: true }; }

  try {
    const orch = readFileSync('dist/aether-orchestrator.min.js');
    sizes.orchestrator = { raw: orch.length, gzipped: gzipSync(orch).length };
  } catch { sizes.orchestrator = { error: true }; }

  return sizes;
}

async function runBenchmarks() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║           EDS LEAPFROG PERFORMANCE BENCHMARK                  ║');
  console.log('║           Adobe React vs Aether UI Comparison                 ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');

  // Bundle sizes
  const sizes = await measureKernelSize();
  console.log('┌─────────────────────────────────────────────────────────────────┐');
  console.log('│ 📦 AETHER UI BUNDLE SIZE                                        │');
  console.log('├─────────────────────────────────────────────────────────────────┤');
  console.log(`│   Kernel:       ${sizes.kernel.raw} B raw  │  ${sizes.kernel.gzipped} B gzipped              │`);
  console.log(`│   Orchestrator: ${sizes.orchestrator.raw} B raw   │  ${sizes.orchestrator.gzipped} B gzipped               │`);
  console.log(`│   Total:        ${sizes.kernel.raw + sizes.orchestrator.raw} B raw  │  ${sizes.kernel.gzipped + sizes.orchestrator.gzipped} B gzipped             │`);
  console.log('└─────────────────────────────────────────────────────────────────┘');
  console.log('');

  const browser = await chromium.launch();

  const testPages = [
    {
      url: `${BASE_URL}/examples/eds-leapfrog/adobe-way.html`,
      name: 'Adobe Way (React + EDS)',
      type: 'react'
    },
    {
      url: `${BASE_URL}/examples/eds-leapfrog/aether-way.html`,
      name: 'Aether Way (2KB Kernel)',
      type: 'aether'
    }
  ];

  console.log(`⏱️  Running ${ITERATIONS} iterations per page...\n`);

  const allResults = {};

  for (const testPage of testPages) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📄 ${testPage.name}`);
    console.log(`   ${testPage.url}`);
    console.log('');

    try {
      const results = await measurePage(browser, testPage.url, testPage.name);
      allResults[testPage.type] = results;

      // Calculate statistics
      const fcpValues = results.map(r => r.timing?.firstContentfulPaint).filter(Boolean);
      const dclValues = results.map(r => r.timing?.domContentLoaded).filter(Boolean);
      const diValues = results.map(r => r.timing?.domInteractive).filter(Boolean);
      const jsValues = results.map(r => r.timing?.totalJsSize).filter(Boolean);

      const fcpStats = calculateStats(fcpValues);
      const dclStats = calculateStats(dclValues);
      const diStats = calculateStats(diValues);
      const jsStats = calculateStats(jsValues);

      console.log('   ┌────────────────────────┬────────────┬────────────┬────────────┐');
      console.log('   │ Metric                 │ Median     │ Min        │ P95        │');
      console.log('   ├────────────────────────┼────────────┼────────────┼────────────┤');
      console.log(`   │ First Contentful Paint │ ${String(fcpStats?.median?.toFixed(0) || 'N/A').padEnd(6)} ms │ ${String(fcpStats?.min?.toFixed(0) || 'N/A').padEnd(6)} ms │ ${String(fcpStats?.p95?.toFixed(0) || 'N/A').padEnd(6)} ms │`);
      console.log(`   │ DOM Interactive        │ ${String(diStats?.median?.toFixed(0) || 'N/A').padEnd(6)} ms │ ${String(diStats?.min?.toFixed(0) || 'N/A').padEnd(6)} ms │ ${String(diStats?.p95?.toFixed(0) || 'N/A').padEnd(6)} ms │`);
      console.log(`   │ DOM Content Loaded     │ ${String(dclStats?.median?.toFixed(0) || 'N/A').padEnd(6)} ms │ ${String(dclStats?.min?.toFixed(0) || 'N/A').padEnd(6)} ms │ ${String(dclStats?.p95?.toFixed(0) || 'N/A').padEnd(6)} ms │`);
      console.log('   └────────────────────────┴────────────┴────────────┴────────────┘');

      console.log('');
      console.log(`   📊 JavaScript Analysis:`);
      console.log(`      Total JS Size: ${formatBytes(jsStats?.median || 0)}`);
      console.log(`      JS File Count: ${results[0]?.timing?.totalJsCount || 0}`);

      if (results[0]?.timing?.jsResources?.length) {
        console.log('      Files:');
        results[0].timing.jsResources.slice(0, 5).forEach(r => {
          console.log(`        - ${r.name}: ${formatBytes(r.size)}`);
        });
      }

      console.log('');
      console.log(`   🔍 Page Analysis:`);
      const analysis = results[0]?.pageAnalysis;
      console.log(`      Has Aether Runtime: ${analysis?.hasAetherRuntime ? '✅ Yes' : '❌ No'}`);
      console.log(`      Aether Connected: ${analysis?.aetherConnected ? '✅ Yes' : '⏳ Pending'}`);
      console.log(`      Aether Slots: ${analysis?.slotCount || 0}`);

    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
    }
    console.log('');
  }

  await browser.close();

  // Comparison summary
  if (allResults.react && allResults.aether) {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    COMPARISON SUMMARY                         ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');

    const reactFCP = calculateStats(allResults.react.map(r => r.timing?.firstContentfulPaint).filter(Boolean));
    const aetherFCP = calculateStats(allResults.aether.map(r => r.timing?.firstContentfulPaint).filter(Boolean));

    const reactJS = calculateStats(allResults.react.map(r => r.timing?.totalJsSize).filter(Boolean));
    const aetherJS = calculateStats(allResults.aether.map(r => r.timing?.totalJsSize).filter(Boolean));

    const reactDI = calculateStats(allResults.react.map(r => r.timing?.domInteractive).filter(Boolean));
    const aetherDI = calculateStats(allResults.aether.map(r => r.timing?.domInteractive).filter(Boolean));

    console.log('┌──────────────────────┬────────────────┬────────────────┬────────────────┐');
    console.log('│ Metric               │ Adobe (React)  │ Aether         │ Improvement    │');
    console.log('├──────────────────────┼────────────────┼────────────────┼────────────────┤');

    if (reactFCP && aetherFCP) {
      const fcpImprovement = (reactFCP.median / aetherFCP.median).toFixed(1);
      console.log(`│ First Contentful     │ ${String(reactFCP.median.toFixed(0)).padEnd(6)} ms     │ ${String(aetherFCP.median.toFixed(0)).padEnd(6)} ms     │ ${fcpImprovement}x faster     │`);
    }

    if (reactDI && aetherDI) {
      const diImprovement = (reactDI.median / aetherDI.median).toFixed(1);
      console.log(`│ DOM Interactive      │ ${String(reactDI.median.toFixed(0)).padEnd(6)} ms     │ ${String(aetherDI.median.toFixed(0)).padEnd(6)} ms     │ ${diImprovement}x faster     │`);
    }

    if (reactJS && aetherJS) {
      const jsImprovement = (reactJS.median / aetherJS.median).toFixed(0);
      console.log(`│ JS Payload           │ ${formatBytes(reactJS.median).padEnd(12)} │ ${formatBytes(aetherJS.median).padEnd(12)} │ ${jsImprovement}x smaller     │`);
    }

    console.log('└──────────────────────┴────────────────┴────────────────┴────────────────┘');
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('                     BENCHMARK COMPLETE                            ');
  console.log(`                     ${new Date().toISOString()}                   `);
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('');

  // Output JSON for paper
  const jsonOutput = {
    timestamp: new Date().toISOString(),
    iterations: ITERATIONS,
    bundleSizes: sizes,
    results: {
      react: allResults.react ? {
        fcp: calculateStats(allResults.react.map(r => r.timing?.firstContentfulPaint).filter(Boolean)),
        domInteractive: calculateStats(allResults.react.map(r => r.timing?.domInteractive).filter(Boolean)),
        jsSize: calculateStats(allResults.react.map(r => r.timing?.totalJsSize).filter(Boolean))
      } : null,
      aether: allResults.aether ? {
        fcp: calculateStats(allResults.aether.map(r => r.timing?.firstContentfulPaint).filter(Boolean)),
        domInteractive: calculateStats(allResults.aether.map(r => r.timing?.domInteractive).filter(Boolean)),
        jsSize: calculateStats(allResults.aether.map(r => r.timing?.totalJsSize).filter(Boolean))
      } : null
    }
  };

  console.log('📋 JSON Output for Paper:');
  console.log(JSON.stringify(jsonOutput, null, 2));
}

runBenchmarks().catch(console.error);
