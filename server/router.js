const Router = require('koa-router')
const test = require('./routes/test'); // 测试用
const user = require('./routes/user'); // 用户

const router = new Router({
  prefix: '/api' // 统一添加前缀 api
})

router.use('/test', test);
router.use('/user', user);

module.exports = router
