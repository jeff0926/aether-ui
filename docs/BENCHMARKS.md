# Aether UI Benchmarks

## Target Metrics

| Metric | React 18 | A2UI | Aether | Improvement |
|--------|----------|------|--------|-------------|
| Time to Interactive | 200-500ms | 100-300ms | <50ms | 10x |
| JavaScript Payload | 80-200KB | 15-40KB | 2KB | 40-100x |
| First Contentful Paint | 150-400ms | 100-250ms | <30ms | 5x |
| Cumulative Layout Shift | 0.1-0.3 | 0.05-0.2 | <0.05 | 2x |
| Lighthouse Performance | 70-85 | 75-90 | 95-100 | - |

## Running Benchmarks

### Size Check

```bash
npm run test:size
```

Output:
```
Kernel size: 819 bytes (gzipped)
Target: 2048 bytes
Status: PASS (1229 bytes to spare)
```

### TTI Benchmark

```bash
npm run benchmark
```

Requires dev server running (`npm run dev`).

### Payload Audit

```bash
node benchmarks/payload-audit.js
```

## Methodology

### Time to Interactive (TTI)

Measured via Playwright:

```javascript
const tti = await page.evaluate(() => {
  const nav = performance.getEntriesByType('navigation')[0];
  return nav.domContentLoadedEventEnd - nav.startTime;
});
```

### First Contentful Paint (FCP)

```javascript
const fcp = await page.evaluate(() => {
  const paint = performance.getEntriesByType('paint');
  return paint.find(p => p.name === 'first-contentful-paint')?.startTime;
});
```

### JS Transfer Size

```javascript
const jsSize = await page.evaluate(() => {
  return performance.getEntriesByType('resource')
    .filter(r => r.initiatorType === 'script')
    .reduce((sum, r) => sum + r.transferSize, 0);
});
```

## Results Summary

### Kernel Size

```
┌──────────────────────┬──────────┬──────────┐
│ Metric               │ Target   │ Actual   │
├──────────────────────┼──────────┼──────────┤
│ Raw size             │ -        │ 1,847 B  │
│ Gzipped              │ ≤2,048 B │ 819 B    │
│ Status               │ -        │ PASS     │
└──────────────────────┴──────────┴──────────┘
```

### Framework Comparison

```
┌──────────────────────┬──────────────┬───────┐
│ Framework            │ Size (gzip)  │ Ratio │
├──────────────────────┼──────────────┼───────┤
│ Aether Kernel        │ 819 B        │ 1x    │
│ React (minified)     │ 42 KB        │ 51x   │
│ React DOM            │ 120 KB       │ 146x  │
│ Vue 3                │ 34 KB        │ 41x   │
│ Angular (core)       │ 90 KB        │ 110x  │
└──────────────────────┴──────────────┴───────┘
```

## CI Integration

Add to `.github/workflows/ci.yml`:

```yaml
- name: Build
  run: npm run build

- name: Size Check
  run: npm run test:size

- name: Unit Tests
  run: npm test -- --run
```

## Lighthouse CI

```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:5173/examples/net-new/"]
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.95}],
        "total-byte-weight": ["error", {"maxNumericValue": 50000}]
      }
    }
  }
}
```
