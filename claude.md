# Aether UI

## Zero-Hydration Interface Framework for Agentic Systems

---

## 1. Core Philosophy

### 1.1 The Inversion

Traditional UI frameworks (React, Vue, Angular) treat the browser as an application runtime. They ship JavaScript to the client, hydrate virtual DOM, reconcile state, and generate HTML at runtime.

Aether UI inverts this: the browser is a projection surface. The agent owns the interface DNA—structure, style, and logic live in the Knowledge Graph. The browser receives pre-computed HTML slivers via SSE and renders them through a 2KB kernel.

**Key Insight:** UI is not built. It is manifested from agent intelligence.

### 1.2 Semantic Projection

| Layer | Traditional | Aether |
|-------|-------------|--------|
| Data | Fetched, parsed, stored in state | Distilled to Canonical Model |
| Logic | Client-side JSX execution | Server-side intent resolution |
| Structure | Runtime component tree | Pre-computed sliver graph |
| Style | Runtime CSS-in-JS | CSS variable injection |
| Render | Virtual DOM reconciliation | Direct HTML projection |

### 1.3 The Three-Body Problem Solved

Aether addresses three simultaneous constraints:

1. **Speed:** Sub-50ms intent-to-pixel latency
2. **Size:** 2KB client payload vs 40-200KB React bundles
3. **Sovereignty:** Agent owns UI, not host framework

---

## 2. Architecture

### 2.1 Knowledge Graph DNA

The agent's understanding of interface lives in three node types:

#### Anatomy Nodes (Structure)
```json
{
  "@type": "AnatomyNode",
  "nodeId": "https://aether.io/anatomy/weather-card",
  "structuralHash": "a1b2c3...",
  "template": "&lt;article data-aether-slot='condition'&gt;&lt;h2 data-aether-slot='location'&gt;&lt;/h2&gt;&lt;p data-aether-slot='temperature'&gt;&lt;/p&gt;&lt;/article&gt;",
  "bindings": {
    "location": {"path": "/location/locality", "fallback": "Unknown"},
    "temperature": {"path": "/observation/temperature", "transform": "celsius"},
    "condition": {"path": "/observation/condition"}
  },
  "accessibility": {
    "role": "article",
    "liveRegion": "polite",
    "focusTarget": "h2"
  }
}