# Architecture Diagrams

## Technical Specification

**Purpose:** Visual documentation of Aether's architecture
**Format:** SVG (scalable, embeddable, version-controllable)
**Location:** `examples/diagrams/`

---

## Abstract

This directory contains technical architecture diagrams that visualize Aether's core concepts. These SVG diagrams are designed for:

1. **Documentation** → Embed in README files and technical specs
2. **Presentations** → Use in slides and demos
3. **Education** → Explain Aether to new developers
4. **Comparison** → Show differences from React/traditional approaches

---

## Diagram Index

| Diagram | Purpose | Key Concepts |
|---------|---------|--------------|
| `kernel-vs-react.svg` | Compare Aether kernel to React pipeline | TTI, hydration, reconciliation |
| `orchestrator-mesh.svg` | Multi-agent coordination topology | Hub/spoke, state sync, broadcast |
| `adapter-modes.svg` | Integration mode decision flowchart | Snap-In, Jump-In, Net-New |

---

## Diagram 1: Kernel vs React

### File: `kernel-vs-react.svg`

**Purpose:** Side-by-side comparison of Aether's 2KB kernel vs React's rendering pipeline.

**Visual Structure:**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐  │
│  │                         │  │                             │  │
│  │     React Pipeline      │  │     Aether Kernel           │  │
│  │                         │  │                             │  │
│  │  Bundle (40KB)          │  │  Kernel (2KB)               │  │
│  │      ↓                  │  │      ↓                      │  │
│  │  Parse JS               │  │  Init SSE                   │  │
│  │      ↓                  │  │      ↓                      │  │
│  │  Create VDOM            │  │  Parse Message              │  │
│  │      ↓                  │  │      ↓                      │  │
│  │  Reconcile              │  │  Inject Content             │  │
│  │      ↓                  │  │      ↓                      │  │
│  │  Hydrate                │  │  Apply CSS Vars             │  │
│  │      ↓                  │  │      ↓                      │  │
│  │  DOM Ready              │  │  DOM Ready                  │  │
│  │                         │  │                             │  │
│  │  TTI: ~600ms            │  │  TTI: <50ms                 │  │
│  │                         │  │                             │  │
│  └─────────────────────────┘  └─────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key Metrics Shown:**
- Bundle size comparison (40KB vs 2KB)
- Pipeline steps (6 vs 5)
- Time to Interactive (~600ms vs <50ms)
- Main thread status (Blocked vs Free)

**Use Cases:**
- Explaining why Aether is faster
- Demonstrating hydration elimination
- Comparing architectural complexity

---

## Diagram 2: Orchestrator Mesh

### File: `orchestrator-mesh.svg`

**Purpose:** Visualize multi-agent state coordination via AetherOrchestrator.

**Visual Structure:**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                     AetherOrchestrator                          │
│                      (Singleton Hub)                            │
│                           │                                     │
│            ┌──────────────┼──────────────┐                      │
│            │              │              │                      │
│            ▼              ▼              ▼                      │
│     ┌───────────┐  ┌───────────┐  ┌───────────┐                │
│     │  Agent A  │  │  Agent B  │  │  Agent C  │                │
│     │  Kernel   │  │  Kernel   │  │  Kernel   │                │
│     └───────────┘  └───────────┘  └───────────┘                │
│            │              │              │                      │
│            └──────────────┼──────────────┘                      │
│                           │                                     │
│                    State Broadcast                              │
│                    CSS Var Sync                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key Concepts Shown:**
- Singleton orchestrator pattern
- Hub-and-spoke topology
- State broadcast mechanism
- CSS variable synchronization
- Agent registration/unregistration

**API Methods Illustrated:**
```javascript
orchestrator.register(id, kernel)
orchestrator.setState(key, value)
orchestrator.broadcast(vars)
orchestrator.sync(sourceId, targetId, keys)
```

**Use Cases:**
- Multi-agent dashboard design
- Understanding cross-kernel communication
- Planning orchestrator integration

---

## Diagram 3: Adapter Modes

### File: `adapter-modes.svg`

**Purpose:** Decision flowchart for choosing integration mode.

**Visual Structure:**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    Integration Decision                         │
│                                                                 │
│                    ┌─────────────────┐                          │
│                    │  Existing App?  │                          │
│                    └────────┬────────┘                          │
│                             │                                   │
│              ┌──────────────┴──────────────┐                    │
│              │                             │                    │
│             YES                           NO                    │
│              │                             │                    │
│    ┌─────────┴─────────┐                   │                    │
│    │  Replace React?   │           ┌───────▼───────┐            │
│    └─────────┬─────────┘           │   Net-New     │            │
│              │                     │   Mode        │            │
│       ┌──────┴──────┐              │               │            │
│       │             │              │  Zero         │            │
│      YES           NO              │  framework    │            │
│       │             │              │  Pure Aether  │            │
│ ┌─────▼─────┐ ┌─────▼─────┐        └───────────────┘            │
│ │  Jump-In  │ │  Snap-In  │                                     │
│ │  Mode     │ │  Mode     │                                     │
│ │           │ │           │                                     │
│ │  Replace  │ │  Add      │                                     │
│ │  React    │ │  alongside│                                     │
│ │  component│ │  React    │                                     │
│ └───────────┘ └───────────┘                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Decision Points:**
1. **Existing app?** → Determines if migration needed
2. **Replace React?** → Determines integration aggressiveness
3. **High-frequency updates?** → Suggests Aether benefit level

**Mode Characteristics:**

| Mode | Risk | Effort | Benefit |
|------|------|--------|---------|
| Snap-In | Low | Low | Incremental |
| Jump-In | Medium | Medium | Component-level |
| Net-New | Low | High | Maximum |

**Use Cases:**
- Migration planning
- Architecture decisions
- Team discussions

---

## SVG Design Principles

### Color Palette
```css
--diagram-primary: #0ea5e9;     /* Aether blue */
--diagram-secondary: #8b5cf6;   /* Purple accent */
--diagram-success: #22c55e;     /* Green/good */
--diagram-warning: #f59e0b;     /* Orange/caution */
--diagram-danger: #dc2626;      /* Red/bad */
--diagram-neutral: #64748b;     /* Gray */
--diagram-bg: #f8fafc;          /* Light background */
--diagram-text: #1e293b;        /* Dark text */
```

### Typography
- **Headers:** Bold, 16-18px
- **Labels:** Regular, 12-14px
- **Annotations:** Italic, 10-12px
- **Font:** system-ui (matches Aether docs)

### Layout
- **Minimum width:** 600px
- **Aspect ratio:** 16:9 or 4:3
- **Padding:** 24px minimum
- **Arrow style:** Rounded, with directional indicators

---

## Embedding Diagrams

### In Markdown
```markdown
![Kernel vs React](./diagrams/kernel-vs-react.svg)
```

### In HTML
```html
<img src="./diagrams/kernel-vs-react.svg" alt="Kernel vs React comparison" />

<!-- Or inline for styling -->
<object type="image/svg+xml" data="./diagrams/kernel-vs-react.svg">
  Kernel vs React comparison
</object>
```

### In Presentations
SVG files can be imported directly into:
- Google Slides
- PowerPoint
- Keynote
- Figma

---

## Creating New Diagrams

### Recommended Tools
1. **Figma** → Best for complex diagrams
2. **draw.io** → Free, exports clean SVG
3. **Excalidraw** → Hand-drawn aesthetic
4. **Code** → Direct SVG authoring

### Checklist for New Diagrams
- [ ] Uses Aether color palette
- [ ] Clear visual hierarchy
- [ ] Accessible contrast ratios
- [ ] Descriptive `<title>` element
- [ ] Responsive viewBox
- [ ] No embedded fonts (use system-ui)
- [ ] Optimized file size (<50KB)

### SVG Template
```svg
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450">
  <title>Diagram Title</title>
  <desc>Description for accessibility</desc>

  <!-- Background -->
  <rect fill="#f8fafc" width="800" height="450"/>

  <!-- Content -->
  <g id="content">
    <!-- Diagram elements here -->
  </g>
</svg>
```

---

## Files

```
diagrams/
├── README.md                  # This specification
├── kernel-vs-react.svg        # Pipeline comparison
├── orchestrator-mesh.svg      # Multi-agent topology
└── adapter-modes.svg          # Integration flowchart
```

---

## Future Diagrams

Planned additions:
- [ ] `sse-flow.svg` → SSE message lifecycle
- [ ] `sliver-anatomy.svg` → Sliver structure breakdown
- [ ] `knowledge-graph.svg` → Agent DNA visualization
- [ ] `performance-waterfall.svg` → Lighthouse comparison

---

## References

- [Aether Architecture Documentation](../../docs/ARCHITECTURE.md)
- [SVG Best Practices](https://developer.mozilla.org/en-US/docs/Web/SVG)
- [Accessible SVG Guidelines](https://www.w3.org/WAI/tutorials/images/complex/)

---

*Aether UI v0.2 | Architecture Diagram Collection*
