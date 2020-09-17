const sockjs = require('sockjs'); // 与服务端进行连接
const { createWriteStream, existsSync } = require('fs');
// const get  = require( 'lodash/get');
// const os = require('os');
const chalk = require('chalk');
const request = require('./utils/request');
const { handleCoreData, procGroup } = require('./runTask');
const taskConfig = require("./utils/task.config");
const conns = {}; // 存储多个连接，并进行保存
let logs = []; // 存储日志信息
function setStateInfo([name, key, type, state]) {
  return {
    projectName: name, // 项目名称
    projectId: key,  // 项目ID
    id: key,
    taskType: type,  // 任务类型(BUILD\DEPLOY\INSTALL)
    taskTypeName: taskConfig[type] ? taskConfig[type].name : '',
    taskState: state, // 任务状态(process\success\failure)
    taskStateName: taskConfig[type].states ? taskConfig[type].states[state] : '',
  }
}

const iing = ([name, key, type, state]) => {
  return {
    projectName: name, // 项目名称
    projectId: key,  // 项目ID
  }
}


const initPageSocket = (server) => {
  const sockjs_echo = sockjs.createServer();

  sockjs_echo.on('connection', conn => {
    if (!conn) {
      return;
    }

    conns[conn.id] = conn; // 存储连接

    const connsArr = Object.keys(conns);
    console.log('当前已有的任务集合', procGroup())
    console.log('当前有的连接数量', connsArr)
    // this.connctions = conns
    console.log(`🔗 ${chalk.green('Connected to')}: ${conn.id}`);
    // console.log('当前存储的this.connctions', conns)


    // 服务端发送消息给客户端
    function send(action) {
      const message = JSON.stringify(action);
      const { type, payload } = action;
      if (type.startsWith('@@action')) {
        console.log(chalk.green.bold(`>>>> 需要更新进程日志 ${type}`), formatLogMessage(JSON.stringify(payload)))
      }
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
      console.log('success 成功提示', type)
      taskProcessLog(payload) // 更新并推送日志
      send({ type: `${type}/success`, payload });
    }

    function failure(type, payload) {
      console.log('failuclosere 失败提示', type)
      taskProcessLog(payload) // 更新并推送日志
      send({ type: `${type}/failure`, payload });
    }

    function progress(type, payload) {
      console.log('执行中', type, payload.taskType)
      taskProcessLog(payload) // 更新并推送日志
      send({ type: `${type}/progress`, payload });
    }

    // 更新并推送日志,用于保存到日志文件并在客户端的终端进行打印
    const taskProcessLog = (payload) => {
      const { key, log, taskType } = payload;
      console.log("需要执行日志更新", payload, taskType)
      if (!taskType) return
      try {
        let options = {
          flags: 'a', //
          encoding: 'utf8', // utf8编码
        }
        let logFileName = payload.taskType // 最终值只有'BUILD'与’INSTALL'
        if (['TESTCOPY', 'BUILDAndDEPLOY', 'DEPLOY'].indexOf(taskType) > -1) logFileName = 'BUILD'  // 都归属于构建发布模块（在同一个页面内）
        let stderr = createWriteStream(`./log/${logFileName}.${key}.log`, options);
        // 创建logger
        let logger = new console.Console(stderr);
        logger.log(log); // 真实项目中调用下面即可记录错误日志
        send({
          type: '@@tasks/log/process', // 进程日志（还需要执行创建当前项目相关的日志文件）
          payload,
        })
      } catch (e) {

      }
    }
    // 创建或更新当前任务对应的任务操作日志
    const log = (type, message) => {
      // 拼装日志消息消息
      // const payload = {
      //   date: +new Date(),
      //   type,
      //   message,
      // };
      const msg = `${chalk.bgCyan(`[${type}]日志=>`)} ${JSON.stringify(message)}`;
      const logFunc = type === 'error' ? console.error : console.log;
      logFunc(msg);
      const logUpdateResut = (async () => {
        const json = await request(type === 'create' ? '/api/log/save' : '/api/log/update', 'POST', message)
        send({
          type: '@@log/message',
          payload: json,
        });
        return json
      })();
      return logUpdateResut;
    };

    /**
     * 更新当前任务状态
     * @params {String} key 当前项目ID
     * @params {String} status 任务状态：process/success/failure/init
     * @params {String} result 任务状态相关显示文本参数
     * @params {String} logInfo 错误日志提示（用于返回警告提示等）
     *
     */
    const updateStates = (key, status, result, logInfo) => {
      const { projectName, taskType, taskState } = result;
      console.log('参数包含projectName,key,taskType,taskState', key, status, result, logInfo)
      // const result = {
      //   ...setStateInfo([projectName, key, taskType, taskState]),
      //   ...params
      // }
      // console.log('打印个方法返回值', result)
      console.log('更新当前任务状态', `${chalk.gray(`[${key}]`)} ${taskType}`); // 服务端控制台打包当前日志信息
      // console.log('updateStates==>>参数结果', setStateInfo)
      (async () => {
        result.id = key
        const json = await request('/api/project/taskUpdate', 'POST', result) // 更新项目详情信息
        send({
          type: '@@tasks/state/update',
          payload: {
            status,
            result,
            errorLog: (logInfo && logInfo.errorLog)
          },
        });
        console.log('接口获取事件=>>更新当前任务状态', json);
      })();
    };

    // 发送当前连接的sockjsid
    send({
      type: '@@connect/info',
      payload: conn.id
    })
    // 断开
    conn.on('close', () => {
      console.log(`😿 ${chalk.red('Disconnected to')}: ${conn.id}`);
      delete conns[conn.id];
    });

    conn.on('data', async message => {
      console.log('接收到由客户端返回的消息', message)
      try {
        const { type, payload, key, taskType } = JSON.parse(message);
        console.log(chalk.blue.bold('<<<<'), formatLogMessage(message));
        if (type.startsWith('@@')) {
          console.log('返回请求带@@开头，执行handleCoreData', type, procGroup.key, payload)
          await handleCoreData(
            { type, payload, key, taskType },
            {
              log,
              send,
              success: success.bind(this, type),
              failure: failure.bind(this, type),
              progress: progress.bind(this, type),
              updateStates,
            }
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
