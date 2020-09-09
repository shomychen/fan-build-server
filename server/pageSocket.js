const sockjs = require('sockjs'); // 与服务端进行连接
// const get  = require( 'lodash/get');
// const os = require('os');
const chalk = require('chalk');
const fetch = require('node-fetch');
const { handleCoreData, procGroup } = require('./runTask');
const conns = {}; // 存储多个连接，并进行保存
let logs = []; // 存储日志信息
const initPageSocket = (server) => {
  const sockjs_echo = sockjs.createServer();

  sockjs_echo.on('connection', conn => {
    if (!conn) {
      return;
    }

    conns[conn.id] = conn; // 存储连接

    console.log('当前已有的任务集合', procGroup())
    // console.log('当前有的连接数量', conns)
    // this.connctions = conns
    console.log(`🔗 ${chalk.green('Connected to')}: ${conn.id}`);
    // console.log('当前存储的this.connctions', conns)

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

    // 更新当前任务状态
    const stats = (key, status ,result) => {
      const {taskType} = result;
      const msg = `${chalk.gray(`[${key}]`)} ${taskType}`;
          console.log('更新当前任务状态', msg); // 服务端控制台打包当前日志信息
      (async () => {
        result.id = key
        const response = await fetch('http://127.0.0.1:4000/api/project/taskUpdate', {
          method: 'POST',
          body: JSON.stringify(result),
          headers: { 'Content-Type': 'application/json' }
        });
        const json = await response.json();
        send({
          type: '@@task/state/update',
          payload: {
            status,
            result
          },
        });

        console.log('接口获取事件', json);
      })();

    };

    // 断开
    conn.on('close', () => {
      console.log(`😿 ${chalk.red('Disconnected to')}: ${conn.id}`);
      delete conns[conn.id];
    });

    conn.on('data', async message => {
      console.log('接收到由客户端返回的消息', message.type)
      try {
        const { type, payload, key, taskType } = JSON.parse(message);
        console.log(chalk.blue.bold('<<<<'), formatLogMessage(message));
        if (type.startsWith('@@')) {
          console.log('返回请求带@@开头，执行handleCoreData', type, procGroup.key)
          await handleCoreData(
            { type, payload, key, taskType },
            {
              log,
              send,
              success: success.bind(this, type),
              failure: failure.bind(this, type),
              progress: progress.bind(this, type),
              stats
            },
            logs
          );
        } else {
          console.log('返回另外一种监听事件，项目ID：', key, type)
          success(type, {
            result: '测试：返回结果',
            key
          })
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

  sockjs_echo.installHandlers(server, {
    prefix: '/page-socket',
    log: () => {
      console.log(`😿 服务端sockjs启动监听目录 ${chalk.red('/page-socket')}`)
    },
  });
}
module.exports = initPageSocket
