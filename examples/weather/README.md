# Weather Example: Snap-In Mode

## Technical Specification

**Integration Mode:** Snap-In
**Complexity:** Low
**Primary Validation:** React/Aether coexistence without interference
**URL:** `http://localhost:5173/examples/weather/`

---

## Abstract

This example demonstrates Aether's **Snap-In** integration mode, where Aether components coexist alongside an existing React application without modification to the React codebase. The example validates that:

1. Aether's 2KB kernel operates independently of React's runtime
2. SSE streams update Aether slots without triggering React re-renders
3. CSS variable injection provides smooth visual transitions
4. Both systems can share the same viewport without interference

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Browser Viewport                           │
├───────────────────────────┬─────────────────────────────────────┤
│                           │                                     │
│     React Application     │      Aether Runtime                 │
│     ┌─────────────────┐   │      ┌─────────────────┐            │
│     │  WeatherApp     │   │      │ <aether-runtime>│            │
│     │  Component      │   │      │                 │            │
│     │                 │   │      │  ┌───────────┐  │            │
│     │  useState()     │   │      │  │ SSE Stream│  │            │
│     │  useEffect()    │   │      │  └─────┬─────┘  │            │
│     │  re-renders     │   │      │        │        │            │
│     │                 │   │      │        ▼        │            │
│     │  ~40KB JS       │   │      │  [data-aether-  │            │
│     │  ~200ms hydrate │   │      │   slot] inject  │            │
│     └─────────────────┘   │      │                 │            │
│                           │      │  2KB kernel     │            │
│                           │      │  <50ms TTI      │            │
│                           │      └─────────────────┘            │
│                           │                                     │
└───────────────────────────┴─────────────────────────────────────┘
```

---

## Hypothesis

**H1:** An Aether runtime can be inserted into a React application without modifying React components or build configuration.

**H2:** Aether's SSE-driven updates will not trigger React's reconciliation cycle.

**H3:** The combined payload (React + Aether kernel) can still achieve better real-time performance than React alone for streaming use cases.

---

## Experimental Setup

### Control: React Component
```jsx
function WeatherApp() {
  const [data, setData] = useState({ temp: 72, condition: 'Sunny' });
  const [renderTime, setRenderTime] = useState(null);

  useEffect(() => {
    const start = performance.now();
    requestAnimationFrame(() => {
      setRenderTime((performance.now() - start).toFixed(2));
    });
  }, [data]);

  return (
    <div>
      <h2>Legacy Weather (React)</h2>
      <div className="metric">Temperature: {data.temp}°F</div>
      {/* Re-renders on every state change */}
    </div>
  );
}
```

### Treatment: Aether Runtime
```html
<aether-runtime endpoint="/api/sse" namespace="weather-alert" mood="urgent">
  <div class="alert-card">
    <h4 data-aether-slot="alert-title">Loading...</h4>
    <p data-aether-slot="alert-body">Connecting to stream...</p>
    <small data-aether-slot="alert-time"></small>
  </div>
</aether-runtime>
```

---

## SSE Protocol

### Namespace: `weather-alert`

**Endpoint:** `/api/sse?namespace=weather-alert`

**Message Format:**
```json
{
  "phase": "deliberation",
  "vars": {
    "--accent-color": "#f59e0b",
    "--background-subtle": "#f59e0b15"
  },
  "content": {
    "alert-title": "Wind Advisory",
    "alert-body": "Gusts up to 45 mph expected",
    "alert-time": "12:34:56 PM"
  }
}
```

**Update Frequency:** 3 seconds

**Alert Rotation:**
| Alert | Color | Hex |
|-------|-------|-----|
| Wind Advisory | Orange | `#f59e0b` |
| Heat Warning | Red | `#dc2626` |
| Air Quality | Purple | `#8b5cf6` |
| Clear Conditions | Green | `#22c55e` |

---

## Measurements

### Expected Results

| Metric | React Component | Aether Runtime |
|--------|-----------------|----------------|
| Initial JS Payload | ~150KB (React+ReactDOM) | 2KB (kernel) |
| Hydration Time | ~200ms | 0ms (no hydration) |
| Update Latency | ~50ms (re-render) | <10ms (slot injection) |
| Main Thread Blocking | Yes | No |
| SSE Reconnection | Manual | Automatic (EventSource) |

### How to Measure

1. Open Chrome DevTools → Performance tab
2. Click "Start profiling and reload page"
3. Wait for SSE updates to cycle
4. Analyze:
   - React re-render markers (purple)
   - Aether slot updates (green paint markers)
   - Main thread activity during updates

---

## Code Analysis

### Kernel Initialization
```javascript
// Inside <aether-runtime> web component
connectedCallback() {
  this.renderShell();        // Shadow DOM shell
  this.initializeKernel();   // Create AetherKernel instance
}

initializeKernel() {
  const config = {
    endpoint: this.getAttribute('endpoint'),
    namespace: this.getAttribute('namespace'),
    mood: this.getAttribute('mood'),
    orchestrator: this.hasAttribute('orchestrator')
  };

  // Pass host element, not shadow root
  this._kernel = new window.AetherKernel(this, config);
}
```

### Slot Injection (XSS-Safe)
```javascript
injectContent(contentMap) {
  Object.entries(contentMap).forEach(([slot, text]) => {
    const el = this.container.querySelector(`[data-aether-slot="${slot}"]`);
    if (el) {
      el.textContent = text;  // textContent prevents XSS
    }
  });
}
```

### CSS Variable Application
```javascript
applyVariables(vars) {
  const scope = this.container;
  Object.entries(vars).forEach(([key, value]) => {
    scope.style.setProperty(key, value);
  });
}
```

---

## Failure Modes

| Failure | Symptom | Resolution |
|---------|---------|------------|
| SSE connection refused | "Connecting..." persists | Check `/api/sse` endpoint |
| Slots not updating | Content stays static | Verify `data-aether-slot` attributes |
| CSS not transitioning | Instant color changes | Check `--tempo` CSS variable |
| React interference | Aether slots re-render | Ensure Aether is outside React root |

---

## Files

```
weather/
├── README.md          # This specification
└── index.html         # Demo page with React + Aether
```

---

## Reproducibility

### Environment
- Node.js 18+
- npm 9+
- Modern browser (Chrome 90+, Firefox 88+, Safari 14+)

### Steps
```bash
cd aether-ui
npm install
npm run build
npm run dev
# Navigate to http://localhost:5173/examples/weather/
```

### Validation
1. React panel shows "Legacy Weather" with update button
2. Aether panel shows cycling alerts (3-second interval)
3. Alert colors transition smoothly
4. React render time displays in React panel
5. No console errors

---

## Conclusion

This example validates that Aether's snap-in mode enables **incremental adoption** in existing React applications. Development teams can introduce Aether for real-time components (alerts, notifications, live data) without modifying existing React architecture, providing a low-risk path to evaluating zero-hydration benefits.

---

## References

- [Aether Architecture Documentation](../../docs/ARCHITECTURE.md)
- [Adapter Mode Guide](../../docs/ADAPTER.md)
- [SSE Specification](https://html.spec.whatwg.org/multipage/server-sent-events.html)

---

*Aether UI v0.2 | Snap-In Mode Reference Implementation*
