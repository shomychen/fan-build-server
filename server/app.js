const Koa = require('koa');
const router = require('./router.js'); // 路由集合
const dbModule = require('./utils/db.js');
const config = require('./config.json');
const bodyParser = require('koa-bodyparser'); // 获取post提交的数据
const app = new Koa();

app.use(bodyParser()); // 转换POST请求的参数


app.use(router.routes()) // 引用路由
  .use(router.allowedMethods())  // 作用： 这是官方文档的推荐用法,我们可以看到router.allowedMethods()用在了路由匹配router.routes()之后,所以在当所有路由中间件最后调用.此时根据ctx.status设置response响应头

const port = process.env.PORT || config.port
app.listen(port); // 端口号监听
console.log(`服务已启动，请打开下面链接访问: \nhttp://127.0.0.1:${port}/`);
