import { defineConfig } from 'umi';

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  routes: [
    { path: '/', component: '@/pages/index' },
  ],
  proxy: {
    '/api': {
      target: 'http://172.16.13.57:4000/', //
      changeOrigin: true,
      // pathRewrite: { '^/web': '/web' },
    },
  },
});
