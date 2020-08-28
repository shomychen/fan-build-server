import {defineConfig, utils} from 'umi';
import {dark} from '@umijs/ui-theme';
import LessThemePlugin from 'webpack-less-theme-plugin';
import { join, parse } from "path";
const {winPath} = utils;

const {NODE_ENV} = process.env;
const externalCSS = ['xterm/css/xterm.css'];
const externalJS = [
  `react/umd/react.${NODE_ENV === 'production' ? 'production.min' : 'development'}.js`,
  `react-dom/umd/react-dom.${NODE_ENV === 'production' ? 'production.min' : 'development'}.js`,
  'moment/min/moment.min.js',
  'antd/dist/antd.min.js',
  'sockjs-client/dist/sockjs.min.js',
  'xterm/lib/xterm.js',
];

const publicPath = NODE_ENV === 'development' ? 'http://localhost:8002/' : '/'; // 开发环境用 / 会无法识别文件

export default defineConfig({
  // presets: ['@umijs/preset-react'],
  // plugins: ['@umijs/plugin-esbuild'],
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
          title: '项目管理',
          component: '@/pages/Dashboard'
        },
        {
          path: '/notes',
          title: '测试',
          component: '@/pages/Notes',
        },
        {
          path: '/project/:id',
          title: '任务管理',
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
  links: [
    ...externalCSS.map(external => ({
      rel: 'stylesheet',
      href: `${publicPath}${parse(external).base}`,
    })),
  ],
  headScripts: [
    // polyfill
    ...externalJS.map(external => ({
      src: `${publicPath}${parse(external).base}`,
      crossOrigin: 'anonymous',
    })),
  ],
  externals: {
    react: 'window.React',
    'react-dom': 'window.ReactDOM',
    antd: 'window.antd',
    xterm: 'window.Terminal',
    moment: 'moment',
  },
  antd: {},
  theme: dark,
  proxy: {
    '/api': {
      target: 'http://localhost:4000/', //
      changeOrigin: true,
      // pathRewrite: { '^/web': '/web' },
    },
  },
});
