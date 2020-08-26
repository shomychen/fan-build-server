import {defineConfig, utils} from 'umi';
import {dark} from '@umijs/ui-theme';
import LessThemePlugin from 'webpack-less-theme-plugin';
import {join} from "path";
const {winPath} = utils;

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  routes: [
    // {
    //   path: '/project',
    //   component: '@/layouts/Project',
    //   routes: [
    //     {
    //       path: '/project/select',
    //       component: '@/pages/project',
    //     },
    //     {
    //       component: '404',
    //     },
    //   ],
    // },
    // {path: '/project', component: '@/pages/index'},
    {
      path: '/',
      component: '@/layouts/Layout',
      routes: [
        {
          path: '/',
          title: '项目',
          component: '@/pages/Dashboard'
        },
        {
          path: '/notes',
          title: '测试',
          component: '@/pages/Notes',
        },
        {
          path: '/project/:id',
          title: '任务',
          hideInMenu: true,
          component: '@/pages/Project',
        },
        {
          component: '404',
        },
      ],
    },
    {
      component: '404',
    },
  ],
  cssLoader: {
    modules: {
      getLocalIdent: (
        context: {
          resourcePath: string;
        },
        _: string,
        localName: string,
      ) => {
        if (
          context.resourcePath.includes('node_modules') ||
          context.resourcePath.includes('global.less')
        ) {
          return localName;
        }
        const match = context.resourcePath.match(/src(.*)/);

        if (match && match[1]) {
          const fanBuildPath = match[1].replace('.less', '');
          const arr = winPath(fanBuildPath)
            .split('/')
            .map((a: string) => a.replace(/([A-Z])/g, '-$1'))
            .map((a: string) => a.toLowerCase());
          return `fan-build${arr.join('-')}_${localName}`.replace(/--/g, '-');
        }

        return localName;
      },
    },
  },
  chainWebpack(config) {
    config.plugin('webpack-less-theme').use(
      new LessThemePlugin({
        theme: join(__dirname, './src/styles/parameters.less'),
      }),
    );
    return config;
  },
  theme: dark,
  proxy: {
    '/api': {
      target: 'http://localhost:4000/', //
      changeOrigin: true,
      // pathRewrite: { '^/web': '/web' },
    },
  },
});
