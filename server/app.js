// import assert from "assert";


const Koa = require('koa');
const router = require('./router.js'); // 路由集合
const dbModule = require('./utils/db.js'); // 连接数据库
const config = require('./config.json');
const bodyParser = require('koa-bodyparser'); // 获取post提交的数据
const sockjs = require('sockjs'); // 与服务端进行连接
const http = require('http');
const chalk = require('chalk');
const exec = require('child_process').exec;
const os = require('os');
const spawn = require('child_process').spawn;
const nodeSpawn = require('node-pty').spawn;
const process = require('process');
const initTerminal = require('./terminalSocket');
const runCommand = require('./utils/runCommand');
// 1. Echo sockjs server
// const sockjs_opts = {
//   prefix: '/terminal-socket'
// };
// 获取本地命令行版本号
const getDefaultShell = () => {
  console.log('当前运行的系统命令行版本 process.platform')
  if (process.platform === 'darwin') {
    return process.env.SHELL || '/bin/bash';
  }

  if (process.platform === 'win32') {
    return process.env.COMSPEC || 'cmd.exe';
  }
  return process.env.SHELL || '/bin/sh';
};

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
const sockjs_echo = sockjs.createServer();

const conns = {}; // 存储多个连接，并进行保存

let term;
let logs = []; // 存储日志信息
const handleChildProcess = (proc, failure, type) => {
  proc.on('message', msg => {
    console.log(msg)
    // this.updateState(msg);
  });

  proc.stdout.setEncoding('utf8');
  proc.stdout.on('data', log => {
    console.log(log)
    // this.emit(TaskEventType.STD_OUT_DATA, log);
  });

  proc.stderr.setEncoding('utf8');
  proc.stderr.on('data', log => {
    console.log('error,', log)
    // failure({type, payload: log});
  });

  proc.on('exit', (code, signal) => {
    // this.state = code === 1 ? TaskState.FAIL : TaskState.INIT;
    // (async () => {
    //   this.emit(TaskEventType.STATE_EVENT, await this.getDetail());
    // })();
  });

  process.on('exit', () => {
    proc.kill('SIGTERM');
  });
}

async function handleCoreData({ type, payload, key }, { log, send, success, failure, progress }, connection) {
  console.log('调用相关执行action', type, key)
  console.log('调用相关执行action - 参数', payload)
  switch (type) {
    case '@@actions/BUILD':
      try {
        // process.chdir('D:\\Workerspace\\svn\\webdesign\\trunk\\library\\basic-manage-2.0');
        const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], {
          cwd: payload.filePath || process.cwd()
        })
        child.stdout.on('data', buffer => {
          console.log(`spawn  stdout: ${buffer}`) // 返回类型为 buffer
          progress({
            data: buffer.toString()
          })
        })
        child.stderr.on('data', data => {
          console.log(`spawn stderr: ${data}`)
          failure({
            data: data.toString()
          })
        })
        child.on('close', code => {
          console.log(`npm  进程退出，退出码: ${code}`)
          success({
            data: code.toString()
          })
        })
        child.on('error', code => {
          console.log(`npm 进程错误，错误码 ${code}`)
          // console.log(JSON.stringify(code))
          failure({
            data: code.toString()
          })
        })
      }
      catch (e) {
        console.log('child error', e)
      }
      break;
    // case '@@actions/installDependencies':
    //   this.config.setProjectNpmClient({
    //     key: payload.key,
    //     npmClient: payload.npmClient,
    //   });
    //   this.installDeps(payload.npmClient, payload.projectPath, {
    //     taobaoSpeedUp: this.hasTaobaoSpeedUp(),
    //     onProgress: progress,
    //     onSuccess: success,
    //   });
    //   break;
    default:
      break
  }
}

// socket 连接
sockjs_echo.on('connection', conn => {
  if (!conn) {
    return;
  }

  conns[conn.id] = conn; // 存储连接

  // console.log('当前有的连接数量', conns)
  this.connctions = conns
  console.log(`🔗 ${chalk.green('Connected to')}: ${conn.id}`);
console.log('当前存储的this.connctions', this.connctions)
  // 服务端发送消息给客户端
  function send(action) {
    const message = JSON.stringify(action);
    console.log(chalk.green.bold('>>>> 服务端发送消息给客户端:'), formatLogMessage(message));
    Object.keys(conns).forEach(id => {
      console.log('当前监听到的id', id)
      conns[id].write('\r\n' + message + '\r\n');
    });
  }

  // 样式化返回信息
  function formatLogMessage(message) {
    let ret = message.length > 500 ? `${message.slice(0, 500)} ${chalk.gray('...')}` : message;
    ret = ret.replace(/{"type":"(.+?)"/, `{"type":"${chalk.magenta.bold('$1')}"`);
    return ret;
  }

  function success(type, payload) {
    console.log('success 成功提示', type, payload)
    send({ type: `${type}/success`, payload });
  }

  function failure(type, payload) {
    console.log('failuclosere 失败提示', type, payload)
    send({ type: `${type}/failure`, payload });
  }

  function progress(type, payload) {
    console.log('执行中', type, payload)
    send({ type: `${type}/progress`, payload });
  }

  const log = (type, message) => {
    // 拼装日志消息消息
    const payload = {
      date: +new Date(),
      type,
      message,
    };
    const msg = `${chalk.gray(`[${type}]`)} ${message}`;
    console.log('回传日志信息', msg)
    const logFunc = type === 'error' ? console.error : console.log;
    logFunc(msg); // 服务端控制台打包当前日志信息
    logs.push(payload);
    send({
      type: '@@log/message',
      payload,
    });
  };


  // 断开
  conn.on('close', () => {
    console.log(`😿 ${chalk.red('Disconnected to')}: ${conn.id}`);
    delete conns[conn.id];
  });

  conn.on('data', async message => {
    console.log('接收到由客户端返回的消息', message)
    try {
      const { type, payload, key } = JSON.parse(message);
      console.log(chalk.blue.bold('<<<<'), formatLogMessage(message));
      // console.log(chalk.blue.bold('<<<<'), type, payload, key);
      // if (type === 'INSTALL') {
      //   testLinkNode(conn) // 测试
      // }
      console.log(typeof  type)

      if (type.startsWith('@@')) {
        console.log('返回请求带@@开头，执行handleCoreData', type)
        await handleCoreData(
          { type, payload, key },
          {
            log,
            send,
            success: success.bind(this, type),
            failure: failure.bind(this, type),
            progress: progress.bind(this, type),
          },
          conn
        );
      } else {
        console.log('返回另外一种异常，如org.umi.开头', key)
        // assert 断言 当第一个参数对应的布尔值为true时，不会有任何提示，返回undefined。当第一个参数对应的布尔值为false时，会抛出一个错误，该错误的提示信息就是第二个参数设定的字符串。
        // assert(this.servicesByKey[key], `service of key ${key} not exists.`);
        // const service = this.servicesByKey[key];
        // await service.applyPlugins({
        //   key: 'onUISocket',
        //   type: service.ApplyPluginsType.event,
        //   args: serviceArgs,
        // });
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
console.log('当前文件内部this', this)
sockjs_echo.installHandlers(server, {
  prefix: '/page-socket',
  log: (e) => {
    console.log(`😿 服务端sockjs启动监听目录 ${chalk.red('/page-socket')}`, e)
  },
});

initTerminal.call(this, server); // 另外一个socket '/terminal-socket'

server.listen(9999, '0.0.0.0');
console.log('[socket启动成功] Listening on 0.0.0.0:9999');
const port = process.env.PORT || config.port
app.listen(port); // 端口号监听
console.log(`服务已启动，请打开下面链接访问: \nhttp://127.0.0.1:${port}/`);
