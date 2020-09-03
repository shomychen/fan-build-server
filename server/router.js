const Router = require('koa-router')
const { createAction } = require('./utils/commons.js');
/*
// 方式一：
const test = require('./routes/test'); // 测试用
const user = require('./routes/user'); // 用户
const router = new Router({
  prefix: '/api' // 统一添加前缀 api
})
router.use('/test', test);
router.use('/user', user);
*/
// 方式二
const testController = require('./controllers/test.js');
const ciController = require('./controllers/ci.js');
const projectController= require('./controllers/project.js');
const router = new Router()

let INTERFACE_CONFIG = {
  test: {
    prefix: '/test/', // API前缀
    controller: testController
  },
  ci: {
    prefix: '/ci/', // API前缀
    controller: ciController
  },
  project: {
    prefix: '/project/', // API前缀
    controller: projectController
  },

}
let routerConfig = {
  test: [
    {
      action: 'testGet', // 指controller内的方法
      path: 'get', // 指请求API 的 path
      method: 'get'
    },
    {
      action: 'queryById',
      path: 'detail',
      method: 'post'
    },
    {
      action: 'createSave',
      path: 'save',
      method: 'post'
    },
    {
      action: 'update',
      path: 'update',
      method: 'post'
    },
    {
      action: 'deleteById',
      path: 'delete',
      method: 'post'
    },
  ],
  ci: [
    {
      action: 'checkNode', // 指controller内的方法
      path: 'check', // 指请求API 的 path
      method: 'post'
    },
    {
      action: 'callTest', // 指controller内的方法
      path: 'call/test', // 指请求API 的 path
      method: 'get'
    },
    {
      action: 'changePath', // 指controller内的方法
      path: 'change/path', // 指请求API 的 path
      method: 'get'
    },
    {
      action: 'initNpmClients', // 指controller内的方法
      path: 'fetch/npmClient', // 指请求API 的 path
      method: 'get'
    },

  ],
  project: [
    {
      action: 'fetchPage', // 指controller内的方法
      path: 'page', // 指请求API 的 path
      method: 'get'
    },
    {
      action: 'queryById',
      path: 'detail',
      method: 'get'
    },
    {
      action: 'createSave',
      path: 'save',
      method: 'post'
    },
    {
      action: 'update',
      path: 'update',
      method: 'post'
    },
    {
      action: 'deleteById',
      path: 'delete',
      method: 'post'
    },
  ],
  task: []
  // socketInit: [
  //
  // ],
}



for (let ctrl in routerConfig) {
  let actions = routerConfig[ctrl];
  actions.forEach(item => {
    let routerController = INTERFACE_CONFIG[ctrl].controller;
    let routerPath = INTERFACE_CONFIG[ctrl].prefix + item.path; // 如 /test/get
    createAction(router, '/api', routerController, item.action, routerPath, item.method);
  });
}

module.exports = router
