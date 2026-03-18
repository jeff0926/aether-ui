/**
 * <aether-runtime> Web Component
 * Framework-agnostic host integration
 */

class AetherRuntime extends HTMLElement {
  static observedAttributes = ['endpoint', 'namespace', 'mood'];

  constructor() {
    super();
    this._kernel = null;
    this._shadow = this.attachShadow({ mode: 'open', delegatesFocus: true });
  }

  connectedCallback() {
    this.renderShell();
    this.initializeKernel();
  }

  renderShell() {
    this._shadow.innerHTML = `
      <style>
        :host {
          display: block;
          contain: layout style paint;
        }
        :host([data-aether-connected]) .status { opacity: 0; }
        :host([data-aether-error]) .status { color: var(--error, #dc2626); }
        .sliver-container { transition: all var(--tempo, 0.3s); }
      </style>
      <div class="status" aria-live="polite">Connecting...</div>
      <div class="sliver-container" part="sliver">
        <slot></slot>
      </div>
    `;
  }

  initializeKernel() {
    const config = {
      endpoint: this.getAttribute('endpoint'),
      namespace: this.getAttribute('namespace'),
      mood: this.getAttribute('mood')
    };

    // Use host element as container so kernel can find slotted content
    const container = this;

    // Lazy load kernel if not present
    if (!window.AetherKernel) {
      this.loadKernel().then(() => {
        this._kernel = new window.AetherKernel(container, config);
      });
    } else {
      this._kernel = new window.AetherKernel(container, config);
    }
  }

  async loadKernel() {
    // In production, inline the 2KB kernel or load from CDN
    const script = document.createElement('script');
    script.src = '/dist/aether-kernel.min.js';
    document.head.appendChild(script);
    return new Promise(resolve => {
      script.onload = resolve;
    });
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (!this._kernel) return;
    // Dynamic reconfiguration
    if (name === 'mood') {
      this._kernel.applyVariables({ '--mood': newVal });
    }
  }

  disconnectedCallback() {
    this._kernel?.destroy();
  }
}

customElements.define('aether-runtime', AetherRuntime);

export { AetherRuntime };
