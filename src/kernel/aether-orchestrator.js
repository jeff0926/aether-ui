/**
 * Aether Orchestrator - Multi-agent coordination
 * Target: <500B minified
 */

class AetherOrchestrator {
  static _instance = null;

  static getInstance() {
    if (!AetherOrchestrator._instance) {
      AetherOrchestrator._instance = new AetherOrchestrator();
    }
    return AetherOrchestrator._instance;
  }

  constructor() {
    this.agents = new Map();
    this.state = new Map();
    this.listeners = new Set();
  }

  register(id, kernel) {
    this.agents.set(id, kernel);
    // Sync existing state to new agent
    this.state.forEach((v, k) => kernel.applyVariables({ [k]: v }));
  }

  unregister(id) {
    this.agents.delete(id);
  }

  setState(key, value) {
    this.state.set(key, value);
    this.broadcast({ [key]: value });
  }

  getState(key) {
    return this.state.get(key);
  }

  broadcast(vars) {
    this.agents.forEach(kernel => kernel.applyVariables(vars));
    this.listeners.forEach(fn => fn(vars));
  }

  onStateChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  sync(sourceId, targetId, keys) {
    const source = this.agents.get(sourceId);
    const target = this.agents.get(targetId);
    if (!source || !target) return;
    const vars = {};
    keys.forEach(k => {
      const v = this.state.get(k);
      if (v !== undefined) vars[k] = v;
    });
    target.applyVariables(vars);
  }
}

window.AetherOrchestrator = AetherOrchestrator;

export { AetherOrchestrator };
export default AetherOrchestrator;
