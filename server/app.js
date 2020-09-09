const Koa = require('koa');
const router = require('./router.js'); // 路由集合
const dbModule = require('./utils/db.js'); // 连接数据库
const config = require('./config.json');
const bodyParser = require('koa-bodyparser'); // 获取post提交的数据
const sockjs = require('sockjs'); // 与服务端进行连接
const http = require('http');
const exec = require('child_process').exec;
const process = require('process');
const initTerminal = require('./terminalSocket');
const initPageSocket = require('./pageSocket');

// 测试连接并执行node及相应命令（使用 child_process.exec，只有打印最张结果数据，不像spawn，可以打印所有进程）
const testLinkNode = (conn) => {
  try {
    // Step1.跳转到指定目录
    process.chdir('D:\\Workerspace\\svn\\webdesign\\trunk\\library\\basic-manage-2.0');
    console.log(`New directory: ${process.cwd()}`);
    conn.write(`New directory: ${process.cwd()}\r\n`)
    // Step2.执行命令
    exec('npm run test:copy', function (err, stdout, stderr) {
      if (err) {
        // result.errCode = 500;
        // result.msg = "操作失败,请重试！";
        // result.data = err;
        conn.write('\r\n' + err.replace(/\n/g, '\r\n') + '\r\n') // 发送信息给客户端
      } else {
        console.log('stdout ', stdout);//标准输出
        conn.write(stdout.replace(/\n/g, '\r\n') + '\r\n') // 发送信息给客户端
      }
    })
  } catch (err) {
    console.error(`chdir: ${err}`);
    conn.write(err) // 发送信息给客户端
  }

}


// 2. koa server
const app = new Koa();

app.use(bodyParser()); // 转换POST请求的参数


app.use(router.routes()) // 引用路由
  .use(router.allowedMethods())  // 作用： 这是官方文档的推荐用法,我们可以看到router.allowedMethods()用在了路由匹配router.routes()之后,所以在当所有路由中间件最后调用.此时根据ctx.status设置response响应头

const server = http.createServer(app.callback());

initPageSocket.call(this, server); // socket '/page-socket'
initTerminal.call(this, server); // 另外一个socket '/terminal-socket'
server.listen(9999, '0.0.0.0');

console.log('[socket启动成功] Listening on 0.0.0.0:9999');
const port = process.env.PORT || config.port
app.listen(port); // 端口号监听
console.log(`服务已启动，请打开下面链接访问: \nhttp://127.0.0.1:${port}/`);
