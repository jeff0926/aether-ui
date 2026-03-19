```markdown
# Aether UI

**2KB zero-hydration UI framework. Agent-owned, edge-native, streaming.**

---

## What It Is

Aether projects UI from agent intelligence via Server-Sent Events. No virtual DOM. No hydration. No React.

| | Traditional | Aether |
|--|-------------|--------|
| Client JS | 80-200KB | **2KB** |
| Time to Interactive | 200-600ms | **<50ms** |
| Rendering | Hydrate, reconcile, patch | **Project directly** |
| Real-time | WebSocket + state management | **Native SSE** |

---

## Quick Start

```bash
npm install aether-ui
```

```html
<aether-runtime 
  endpoint="/api/sse"
  namespace="weather-alert">
</aether-runtime>
```

```javascript
// Server streams slivers
{
  vars: { '--accent-color': '#dc2626' },
  content: { 'title': 'Heat Warning', 'body': '95°F' }
}
```

---

## Architecture

**Kernel** (2KB): SSE, CSS injection, slot rendering  
**Orchestrator** (+442B): Multi-agent state sharing  
**Adapter**: React/Vue/Angular integration (3 modes)

---

## Examples

```bash
git clone https://github.com/aether/ui.git
cd aether-ui && npm install && npm run dev
```

- `/examples/weather/` — Snap-in with React
- `/examples/jump-in/` — Replace React
- `/examples/net-new/` — Pure Aether
- `/examples/dashboard/` — Multi-agent
- `/examples/chat/` — Streaming
- `/examples/orchestrator-test.html` — State sharing

---

## Performance

| Metric | React | A2UI | Aether |
|--------|-------|------|--------|
| Payload | 80-200KB | 15-40KB | **2KB** |
| TTI | 200-600ms | 100-300ms | **<50ms** |
| Lighthouse | 70-85 | 75-90 | **95-100** |

---

## Documentation

- `docs/ARCHITECTURE.md` — System design
- `docs/API.md` — Kernel & orchestrator reference
- `docs/ADAPTER.md` — Framework integration
- `docs/EDGE.md` — Deployment
- `docs/BENCHMARKS.md` — Performance validation
- `paper/main.tex` — arXiv submission

---

## License

MIT

**Paper:** "Semantic Projection: Zero-Hydration UI for Agentic Systems" (in preparation, 2026)



