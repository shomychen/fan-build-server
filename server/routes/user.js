const Router = require('koa-router')
const router = new Router()

router.get("/info", async ctx => {
  ctx.body = {
    code: 200,
    msg: "这是个用户的接口"
  }
})

router.post("/login", async ctx => {
  let {name, password} = ctx.request.body;
  if(name == 'admin' && password=='123456'){
    ctx.body = {
      code: 200,
      msg:  `Hello ${name}`
    }
  }else{
    ctx.body = {
      code: 200,
      msg: '账号信息错误'
    }
  }
})
module.exports = router.routes()
