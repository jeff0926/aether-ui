# Enterprise Design System Integration

## Overview

Aether doesn't ship HTML. Host systems provide semantic components. Agents possess them via CSS variables.

## Universal EDS Possession

### Host Component (Any Design System)

```html
<!-- Provided by SAP Fiori, Adobe AEM, Carbon, etc. -->
<div class="eds-card" data-aether-possessable="true">
  <h3 class="eds-card-title" data-aether-slot="title"></h3>
  <p class="eds-card-body" data-aether-slot="body"></p>
</div>
```

### PSI Mapping (Presentation-Semantic Interface)

```json
{
  "@context": "https://aether.io/psi/v1",
  "host": "sap-fiori-2024",
  "mappings": {
    "--eds-card-bg": "--background-subtle",
    "--eds-card-border": "--accent-color",
    "--eds-title-font": "--font-heading",
    ".eds-card:hover": {
      "transform": "scale(var(--hover-scale))",
      "transition": "all var(--tempo)"
    }
  }
}
```

## Token Registry

Standard tokens all hosts map to:

| Token | Purpose | Default |
|-------|---------|---------|
| `--tempo` | Animation duration | 0.3s |
| `--accent-color` | Primary action/alert | #0ea5e9 |
| `--background-subtle` | Secondary surfaces | #f8fafc |
| `--font-heading` | Typography | system-ui |
| `--hover-scale` | Interaction feedback | 1.02 |
| `--ghost-opacity` | Degraded state | 0.6 |
| `--error` | Error state | #dc2626 |
| `--success` | Success state | #22c55e |
| `--warning` | Warning state | #f59e0b |

## Integration Flow

1. Agent detects host EDS from `meta` tag or header
2. Loads `psi.jsonld` mapping for that host
3. Projects CSS variables that override host defaults
4. Injects content into `data-aether-slot` attributes

## Example: SAP Fiori Integration

```html
<head>
  <meta name="eds-system" content="sap-fiori-2024">
</head>
<body>
  <aether-runtime endpoint="/api/sse" namespace="dashboard">
    <!-- Fiori components with Aether slots -->
    <ui5-card>
      <ui5-card-header slot="header">
        <span data-aether-slot="title"></span>
      </ui5-card-header>
      <div data-aether-slot="content"></div>
    </ui5-card>
  </aether-runtime>
</body>
```

## Example: Carbon Design System

```html
<head>
  <meta name="eds-system" content="ibm-carbon-v11">
</head>
<body>
  <aether-runtime endpoint="/api/sse" namespace="alerts">
    <cds-tile>
      <h4 data-aether-slot="title"></h4>
      <p data-aether-slot="body"></p>
    </cds-tile>
  </aether-runtime>
</body>
```

## Mood-Based Styling

Aether supports mood-based visual adjustments:

```javascript
// SSE pulse with mood-appropriate styling
{
  "phase": "deliberation",
  "vars": {
    "--tempo": "0.15s",        // Faster for urgency
    "--accent-color": "#dc2626" // Red for critical
  }
}
```

| Mood | Tempo | Accent | Use Case |
|------|-------|--------|----------|
| neutral | 0.3s | #0ea5e9 | Normal operation |
| urgent | 0.15s | #dc2626 | Critical alerts |
| calm | 0.5s | #22c55e | Success states |
| thinking | 0.2s | #8b5cf6 | Processing |

## Custom Token Mapping

Create a PSI mapping file for your design system:

```json
{
  "@context": "https://aether.io/psi/v1",
  "host": "my-design-system",
  "version": "1.0.0",
  "mappings": {
    "--my-primary": "--accent-color",
    "--my-surface": "--background-subtle",
    "--my-transition": "--tempo"
  },
  "components": {
    "my-card": {
      "slots": ["title", "body", "footer"],
      "possessable": true
    }
  }
}
```
