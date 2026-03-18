import terser from '@rollup/plugin-terser';

export default {
  input: 'src/kernel/aether-kernel.js',
  output: {
    file: 'dist/aether-kernel.min.js',
    format: 'iife',
    name: 'AetherKernel'
  },
  plugins: [
    terser({
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
    })
  ]
};
