/**
 * Aether UI Kernel v0.2
 * Zero-hydration projection runtime
 * Target: 2KB gzipped
 */

class AetherKernel {
  constructor(container, config = {}) {
    this.container = container;
    this.endpoint = config.endpoint;
    this.namespace = config.namespace;
    this.stateCache = new Map();
    this.focusPath = null;
    this.eventSource = null;

    this.init();
  }

  init() {
    this.preserveFocus();
    this.connect();
    this.observeSlots();
  }

  connect() {
    const url = new URL(this.endpoint, window.location.href);
    url.searchParams.set('namespace', this.namespace);
    url.searchParams.set('init', 'true');

    this.eventSource = new EventSource(url.toString());

    this.eventSource.onopen = () => {
      this.container.setAttribute('data-aether-connected', 'true');
      this.container.removeAttribute('data-aether-error');
    };

    this.eventSource.onmessage = (event) => {
      const pulse = JSON.parse(event.data);
      this.handlePulse(pulse);
    };

    this.eventSource.onerror = () => {
      this.container.setAttribute('data-aether-error', 'true');
      this.container.removeAttribute('data-aether-connected');
      // Auto-reconnect handled by browser
    };
  }

  handlePulse(pulse) {
    // Phase: reflex | deliberation | complete | ghost

    if (pulse.vars) {
      this.applyVariables(pulse.vars);
      this.stateCache.set('vars', {...this.stateCache.get('vars'), ...pulse.vars});
    }

    if (pulse.content) {
      this.injectContent(pulse.content);
    }

    if (pulse.phase === 'complete' || pulse.phase === 'ghost') {
      this.restoreFocus();
    }
  }

  applyVariables(vars) {
    const scope = this.container.shadowRoot || this.container;
    Object.entries(vars).forEach(([key, value]) => {
      scope.style.setProperty(key, value);
    });
  }

  injectContent(contentMap) {
    Object.entries(contentMap).forEach(([slot, text]) => {
      const el = this.container.querySelector(`[data-aether-slot="${slot}"]`);
      if (el) {
        el.textContent = text; // XSS-safe
      }
    });
  }

  preserveFocus() {
    const active = document.activeElement;
    if (active && this.container.contains(active)) {
      this.focusPath = this.generatePath(active);
    }
  }

  restoreFocus() {
    if (!this.focusPath) return;
    const el = this.container.querySelector(this.focusPath);
    if (el) {
      el.focus();
      el.scrollIntoView({ block: 'nearest' });
    }
    this.focusPath = null;
  }

  generatePath(el) {
    // Simple selector generation for focus restoration
    if (el.id) return `#${el.id}`;
    if (el.dataset.aetherSlot) return `[data-aether-slot="${el.dataset.aetherSlot}"]`;
    return el.tagName.toLowerCase();
  }

  observeSlots() {
    // MutationObserver for slot changes (future: two-way binding)
  }

  destroy() {
    this.eventSource?.close();
    this.stateCache.clear();
  }
}

// Auto-initialize from DOM
document.querySelectorAll('aether-runtime').forEach(el => {
  const config = {
    endpoint: el.getAttribute('endpoint'),
    namespace: el.getAttribute('namespace')
  };
  el._aether = new AetherKernel(el, config);
});

// Expose globally for IIFE builds
if (typeof window !== 'undefined') {
  window.AetherKernel = AetherKernel;
}

export { AetherKernel };
export default AetherKernel;
