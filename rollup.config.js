import terser from '@rollup/plugin-terser';

const terserConfig = {
  compress: {
    passes: 3,
    pure_getters: true,
    unsafe: true,
    unsafe_comps: true
  },
  mangle: {
    properties: {
      regex: /^_/ // Only mangle private
    }
  }
};

export default [
  {
    input: 'src/kernel/aether-kernel.js',
    output: {
      file: 'dist/aether-kernel.min.js',
      format: 'iife'
    },
    plugins: [terser(terserConfig)]
  },
  {
    input: 'src/kernel/aether-orchestrator.js',
    output: {
      file: 'dist/aether-orchestrator.min.js',
      format: 'iife'
    },
    plugins: [terser(terserConfig)]
  }
];
