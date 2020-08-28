const Koa = require('koa');
const router = require('./router.js'); // 路由集合
const dbModule = require('./utils/db.js'); // 连接数据库
const config = require('./config.json');
const bodyParser = require('koa-bodyparser'); // 获取post提交的数据
const sockjs = require('sockjs'); // 与服务端进行连接
const http = require('http');
const chalk = require('chalk');
const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
const process = require('process');
// 1. Echo sockjs server
// const sockjs_opts = {
//   prefix: '/terminal-socket'
// };
const sockjs_echo = sockjs.createServer();

const conns = {}; // 存储多个连接，并进行保存
// socket 连接
sockjs_echo.on('connection', conn => {
  if (!conn) {
    return;
  }

  conns[conn.id] = conn; // 存储连接
  console.log('当前有的连接数量', conns)
  console.log(`🔗 ${chalk.green('Connected to')}: ${conn.id}`);

  // 服务端发送消息给客户端
  function send(action) {
    const message = JSON.stringify(action);
    console.log(chalk.green.bold('>>>>'), formatLogMessage(message));
    Object.keys(conns).forEach(id => {
      conns[id].write(message);
    });
  }
  // 样式化返回信息
  function formatLogMessage(message) {
    let ret = message.length > 500 ? `${message.slice(0, 500)} ${chalk.gray('...')}` : message;
    ret = ret.replace(/{"type":"(.+?)"/, `{"type":"${chalk.magenta.bold('$1')}"`);
    return ret;
  }
  function success(type, payload) {
    console.log('success 成功提示', type , payload)
    send({ type: `${type}/success`, payload });
  }
  function failure(type, payload) {
    console.log('failuclosere 失败提示', type , payload)
    send({ type: `${type}/failure`, payload });
  }
  function progress(type, payload) {
    console.log('执行中', type , payload)
    send({ type: `${type}/progress`, payload });
  }

  const log = (type, message) => {
    // 拼装报错消息
    const payload = {
      date: +new Date(),
      type,
      message,
    };
    const msg = `${chalk.gray(`[${type}]`)} ${message}`;
    console.log('回传日志信息', msg)
    const logFunc = type === 'error' ? console.error : console.log;
    logFunc(msg); // 服务端控制台打包当前日志信息
    // this.logs.push(payload);
    send({
      type: '@@log/message',
      payload,
    });
  };


  // 断开
  conn.on('close', () => {
    console.log(`😿 ${chalk.red('Disconnected to')}: ${conn.id}`);
    // delete conns[conn.id];
  });

  conn.on('data', async message => {
    console.log('接收到由客户端返回的消息', message)
    // const { type, payload, $lang: lang, $key: key } = JSON.parse(message);
    try {
      // conn.write(message) // 发送信息给客户端
      const { type, payload, $lang: lang, $key: key } = JSON.parse(message);
      console.log(chalk.blue.bold('<<<<'), formatLogMessage(message));
      const serviceArgs = {
        action: { type, payload, lang },
        log,
        send,
        success: success.bind(this, type),
        failure: failure.bind(this, type),
        progress: progress.bind(this, type),
      };

      // TODO.在这里面执行相关事件，是否成功后回调 相关事件，如 success failure progress ，里面有对应发出日志消息


      // 打包
      if (message === '打包') {
        try {
          // Step1.跳转到指定目录
          process.chdir('D:\\Workerspace\\svn\\webdesign\\trunk\\library\\basic-manage-2.0');
          console.log(`New directory: ${process.cwd()}`);
          conn.write(`New directory: ${process.cwd()}`)
          // Step2.执行命令
          exec('npm run start', function (err, stdout, stderr) {
            if (err) {
              // result.errCode = 500;
              // result.msg = "操作失败,请重试！";
              // result.data = err;
              conn.write(err) // 发送信息给客户端
            } else {
              console.log('stdout ', stdout);//标准输出
              conn.write(stdout) // 发送信息给客户端
            }
          })
        } catch (err) {
          console.error(`chdir: ${err}`);
          conn.write(err) // 发送信息给客户端
        }

      }
    }
    catch (e) {
      console.error(chalk.red(e.stack));
    }
  })

});

// 2. koa server
const app = new Koa();

app.use(bodyParser()); // 转换POST请求的参数


app.use(router.routes()) // 引用路由
  .use(router.allowedMethods())  // 作用： 这是官方文档的推荐用法,我们可以看到router.allowedMethods()用在了路由匹配router.routes()之后,所以在当所有路由中间件最后调用.此时根据ctx.status设置response响应头

const server = http.createServer(app.callback());
sockjs_echo.installHandlers(server, {
  prefix: '/terminal-socket',
  log: () => {
    console.log(`😿 服务端sockjs启动监听目录 ${chalk.red('/terminal-socket')}`)
  },
});
;

server.listen(9999, '0.0.0.0');
console.log('[socket启动成功] Listening on 0.0.0.0:9999');
const port = process.env.PORT || config.port
app.listen(port); // 端口号监听
console.log(`服务已启动，请打开下面链接访问: \nhttp://127.0.0.1:${port}/`);
