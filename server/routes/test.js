const Router = require('koa-router')

const router = new Router()
/**
 * 实际接口 /page => /api/test/page
 * 实际接口 /testName => /api/test/testName
 * */
router.get("/page", async (ctx, next) => {
  ctx.body = {
    code: 200,
    msg: "hello koa for page",
    // name: name,
    other: '3'
  }
  next();
})

router.get("/testName", async (ctx, next) => {
  ctx.body = {
    code: 200,
    msg: "hello  koa for testName"
  }
  next();
})
// 获取get请求的参数
router.get("/getQueryParam", async (ctx, next) => {
  let url = ctx.url;

  let request = ctx.request;
  let req_query = request.query;
  let req_queryString = request.querystring;

  let ctx_query = ctx.query;
  let ctx_queryString = ctx.querystring;
  ctx.body = {
    code: 200,
    msg: "这是个GET返回请求参数的API",
    url,
    req_query,
    req_queryString,
    ctx_query,
    ctx_queryString,
  }
  next();
})

module.exports = router.routes()
