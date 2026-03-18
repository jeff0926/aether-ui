/**
 * Aether Adapter: 3-mode integration API
 */

class AetherAdapter {
  constructor(options = {}) {
    this.observers = new Map();
    this.interceptors = new Map();
    this.config = options;
  }

  // Mode 1: Snap-In (coexistence)
  snapIn(targetSelector, aetherConfig) {
    const host = document.querySelector(targetSelector);
    if (!host) throw new Error(`Target not found: ${targetSelector}`);

    const aether = document.createElement('aether-runtime');
    Object.entries(aetherConfig).forEach(([key, val]) => {
      aether.setAttribute(key, val);
    });

    host.appendChild(aether);
    return aether;
  }

  // Mode 2: Jump-In (replacement)
  jumpIn(reactRootId, aetherConfig) {
    const reactRoot = document.getElementById(reactRootId);
    if (!reactRoot) throw new Error(`React root not found: ${reactRootId}`);

    // Extract React props before destruction
    const props = this.extractReactProps(reactRoot);
    const canonical = aetherConfig.transformer?.(props) || props;

    // Trap React unmount (prevent cleanup errors)
    if (window.ReactDOM) {
      const original = window.ReactDOM.unmountComponentAtNode;
      window.ReactDOM.unmountComponentAtNode = (node) => {
        if (node.id === 'aether-claimed') return false;
        return original.call(window.ReactDOM, node);
      };
    }

    // Destroy React, claim territory
    reactRoot.innerHTML = '';
    reactRoot.id = 'aether-claimed';

    // Mount Aether
    const aether = document.createElement('aether-runtime');
    aether.setAttribute('context', JSON.stringify(canonical));
    Object.entries(aetherConfig).forEach(([key, val]) => {
      if (key !== 'transformer') aether.setAttribute(key, val);
    });

    reactRoot.appendChild(aether);
    return aether;
  }

  // Mode 3: Net-New trigger
  netNew(routePattern, edgeEndpoint) {
    return fetch(`${edgeEndpoint}/check?route=${encodeURIComponent(routePattern)}`)
      .then(r => r.json())
      .then(({ eligible, config }) => {
        if (eligible) {
          window.__AETHER_NETNEW__ = true;
          window.__AETHER_CONFIG__ = config;
        }
        return eligible;
      })
      .catch(() => false);
  }

  // Data interception
  interceptFetch(originalUrl, transformer) {
    const original = window.fetch;
    window.fetch = (url, ...args) => {
      if (url === originalUrl || url.includes(originalUrl)) {
        return original.call(window, url, ...args)
          .then(r => r.clone().json())
          .then(data => {
            const canonical = transformer(data);
            this.broadcast('data', canonical);
            return new Response(JSON.stringify(canonical));
          });
      }
      return original.call(window, url, ...args);
    };
  }

  broadcast(event, data) {
    document.querySelectorAll('aether-runtime').forEach(el => {
      el.dispatchEvent(new CustomEvent(`aether:${event}`, {
        detail: data,
        bubbles: false
      }));
    });
  }

  extractReactProps(node) {
    // Heuristic: React stores props on internal fiber
    const fiber = node._reactRootContainer?._internalRoot?.current;
    return fiber?.memoizedProps || {};
  }
}

export { AetherAdapter };
