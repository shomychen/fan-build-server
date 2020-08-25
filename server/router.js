const Router = require('koa-router')
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
const testController = require('./controllers/test.js');
const router = new Router()

let INTERFACE_CONFIG = {
  test: {
    prefix: '/test/',
    controller: testController
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
  ]
}

/**
 *
 * @param {*} router router
 * @param {*} baseurl 前缀目录base_url_path
 * @param {*} routerController controller
 * @param {*} path  routerPath
 * @param {*} method request_method , post get put delete ...
 * @param {*} action controller 方法名
 * @param {*} ws enable ws
 *
 * @example
 */
const createAction = (router, baseurl, routerController, action, path, method, ws) => {
  router[method](baseurl + path, async ctx => {
    let inst = new routerController(ctx); // 创建实例
    try {
      await inst.init(ctx); // 初始化（执行controller/base内的init
      ctx.params = Object.assign({}, ctx.request.query, ctx.request.body, ctx.params);
      await inst[action].call(inst, ctx); // 执行controller内的方法，如controller/test.js内的 testGet()
    } catch (err) {
      ctx.body = {
        code: 40011,
        msg: '服务出错'
      }
      console.log(err, 'error');
    }
  });
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
