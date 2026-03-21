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
    this.orchestrator = null;

    // Connect to orchestrator if enabled
    if (config.orchestrator && window.AetherOrchestrator) {
      this.orchestrator = window.AetherOrchestrator.getInstance();
      this.orchestrator.register(this.namespace, this);
    }

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
    };
  }

  handlePulse(pulse) {
    if (pulse.vars) {
      this.applyVariables(pulse.vars);
      this.stateCache.set('vars', {...this.stateCache.get('vars'), ...pulse.vars});
      // Broadcast shared vars to orchestrator
      if (this.orchestrator && pulse.shared) {
        Object.entries(pulse.vars).forEach(([k, v]) => {
          this.orchestrator.setState(k, v);
        });
      }
    }

    if (pulse.content) {
      this.injectContent(pulse.content);
    }

    if (pulse.phase === 'complete' || pulse.phase === 'ghost') {
      this.restoreFocus();
    }
  }

  applyVariables(vars) {
    const scope = this.container;
    Object.entries(vars).forEach(([key, value]) => {
      scope.style.setProperty(key, value);
    });
  }

  injectContent(contentMap) {
    Object.entries(contentMap).forEach(([slot, text]) => {
      const el = this.container.querySelector(`[data-aether-slot="${slot}"]`);
      if (el) {
        el.textContent = text;
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
    if (el.id) return `#${el.id}`;
    if (el.dataset.aetherSlot) return `[data-aether-slot="${el.dataset.aetherSlot}"]`;
    return el.tagName.toLowerCase();
  }

  observeSlots() {
    // MutationObserver for slot changes (future: two-way binding)
  }

  destroy() {
    if (this.orchestrator) {
      this.orchestrator.unregister(this.namespace);
    }
    this.eventSource?.close();
    this.stateCache.clear();
  }
}

window.AetherKernel = AetherKernel;

export { AetherKernel };
export default AetherKernel;
