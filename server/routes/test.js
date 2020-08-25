const Router = require('koa-router')
const TestModelBefore = require('../models/testBefore.js') // 常规模式
const TestModel = require('../models/test.js') // 类继承
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


//新建一个用来操作数据库的接口
router.post('/addPerson', async function (ctx) {
  //创建这个模型的实例啦
  const reqParams = ctx.request.body
  console.log(reqParams)
  const person = new TestModelBefore({
    //通过post请求得到的body里的数据，添加到数据库
    // username: ctx.request.body.username,
    // password: ctx.request.body.password
    ...reqParams
  })
  // //保存这条数据哦
  // await person.save()
  // //返回这个操作的状态看看，不能总是0
  // ctx.body = {
  //   code:0
  // }

  //换一种写法，我们需要捕获一下异常
  let code
  try {
    //save方法是模型封装好的，实例可以调用这个方法
    await person.save()
    code = 200
  } catch (error) {
    code = -1
  }
  ctx.body = {
    code: code
  }
})

router.post('/getPerson', async function (ctx) {
  const result = await TestModelBefore.findOne({ username: ctx.request.body.username }, 'username age -_id') // 查询单个用户信息  // -_id 表示不返回_id字段
  const results = await TestModelBefore.find() // 查询所有信息
  const resultPage = await TestModelBefore.find({}, {}, { skip: 2, limit: 2 })  // 分页（跳过前两个文档，且只显示两个文档）
  // 使用 aggregate 聚合管道,将筛选出来的字段进行重写
  const resultAggregate = await TestModelBefore.aggregate([
      { $match: { username: ctx.request.body.username } }, // 匹配条件
      {
        $project: {
          _id: 0, // 排除返回 _id字段
          myid: "$_id", // 重新定义ID名称
          username: 1, // 需要返回 username
          age: 'age' // 需要返回 qge
        }
      }
    ],
    (err, docs) => {
      // if (err) {
      //   console.log(err);
      //   return;
      // }
      // console.log(JSON.stringify(docs, null, 2));
    })
  ctx.body = {
    code: 200,
    result,
    results,
    resultPage,
    resultAggregate,
  }
})

// 执行命令

module.exports = router.routes()
