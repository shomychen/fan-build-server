const { join } = require("path");
const { existsSync, createReadStream, writeFile   } = require("fs");
const rimraf = require("rimraf"); // 删除文件夹
const kill = require('tree-kill'); // 杀死任务进程
const { spawn, exec } = require('child_process');
const taskConfig = require("./utils/task.config");
const request = require('./utils/request');

let proc = {}; // 当前执行的进程 （按项目ID分）
/**
 *
 * @param npmClient 当前运行客户端（npm,yarn等）
 * @param targetDir 当前执行目录
 * @param runArgs 当前执行命令scripts
 * @param log 日志
 * @param opts 参数配置
 * @return {Promise<void>}
 */

async function excuCommand(npmClient, runArgs, targetDir, opts) {
  return new Promise((resolve, reject) => {
    // if (['tnpm', 'npm', 'cnpm'].includes(npmClient)) {
    //   runArgs.push('-d');
    // }
    const cmdNpmClient = npmClient || 'npm'
    // spawn方法接受两个参数，第一个是可执行文件，第二个是参数数组。
    // window上执行的话，需要用.cmd
    const child = spawn(process.platform === 'win32' ? `${cmdNpmClient}.cmd` : cmdNpmClient, [...runArgs], {
      cwd: targetDir,
    })

    child.stdout.on('data', buffer => {
      if (opts.onData) opts.onData(buffer.toString());
    });
    child.stderr.on('data', buffer => {
      if (opts.onData) opts.onData(buffer.toString());
    });
    child.on('close', code => {
      // 退出code不为0时，打印报错信息
      if (code !== 0) {
        reject(new Error(`\x1b[31mcommand failed: ${npmClient} ${runArgs.join(' ')}\n\n`).toString());
        return;
      }
      resolve(child);
    });
  })

}

/**
 *
 * @param npmClient 当前运行客户端（npm,yarn等）
 * @param targetDir 当前执行目录
 * @param runArgs 当前执行命令scripts
 *
 */
function runCommand(npmClient, targetDir, runArgs) {
  console.log('开始执行命令')
  const cmdNpmClient = npmClient || 'npm'
  // spawn方法接受两个参数，第一个是可执行文件，第二个是参数数组。
  // window上执行的话，需要用.cmd
  const child = spawn(process.platform === 'win32' ? `${cmdNpmClient}.cmd` : cmdNpmClient, [...runArgs], {
    cwd: targetDir,
  })

  return child;
}

async function handleChildProcess(child, { progress, success, failure, stats, log }, { npmClient, runArgs, key, payload, taskType, logId },) {
  child.stdout.on('data', buffer => {
    if (progress) progress({ key, log: buffer.toString(), taskType })
  });
  child.stderr.on('data', buffer => {
    if (progress) progress({ key, log: buffer.toString(), taskType })
  });
  child.on('exit', (code, signal) => {
    console.log(`子进程因收到信号 ${signal} 而终止`);
    console.log('runArgs', runArgs)
    delete proc[key]; // 删除当前项目处理中的进程
    const result = setResultInfo([payload.name, key, taskType, code !== 0 ? 'failure' : 'success'])
    log('update', { id: logId, ...result })
    stats(key, code !== 0 ? 'error' : 'success', { ...result })
    if (code !== 0) {
      failure({
        key,
        log: new Error(`\x1b[31mCommand failed: ${npmClient} ${runArgs.join(' ')}\x1b[39m\n`).toString(), taskType,
      })
    } else {
      success({
        key,
        log: `\r\n\x1b[1;32m> Process finished with exit code ${code}\x1b[39m\n\n`, taskType,
      })
    }
    // code !== 0 ? opts.onFailed(new Error(`command failed: ${npmClient} ${runArgs.join(' ')}`).toString()) : opts.onSuccess(code);
  });

  // // 销毁进程
  process.on('exit', () => {
    child.kill('SIGTERM');
    console.log('销毁进程')
    // delete proc.child
  });
}

// 获取安装包命令
const getNpmClientArgus = (npmClient) => {
  let args = [];

  if (['yarn', 'tyarn', 'ayarn'].includes(npmClient)) {
    args = [];
  } else if (['tnpm', 'npm', 'cnpm', 'pnpm'].includes(npmClient)) {
    args = ['install'];
  }
  return args
}

function setResultInfo([name, key, type, state]) {
  console.log('setResultInfo', type)
  return {
    projectName: name, // 项目名称
    projectId: key, // 项目ID
    taskType: type,
    taskTypeName: taskConfig[type] ? taskConfig[type].name : '',
    taskState: state,
    taskStateName: taskConfig[type].states ? taskConfig[type].states[state] : '',
  }
}

// 重装 node_modules 时先清空，否则可能会失败
async function cleanNodeModules(targetDir) {
  return new Promise((resolve, reject) => {
    const nodeModulePath = join(targetDir, 'node_modules');
    rimraf(nodeModulePath, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// 更新SVN文件
async function updateProjectSvn(cwd) {
  return new Promise((resolve, reject) => {
    exec(`svn up ${cwd}`, err => {
      if (err) return reject(err); // 返回 error
      resolve()
    })
  })
}

/*
 * @param {String} type 当前执行事件名
 * @param {Object} payload 项目等相关参数
 * @param {String} key 当前执行项目ID
 * @param {String} taskType 当前执行任务类型
 * @param {Function} log 日志（任务进行进程日志）
 * @param {Function} send 发送消息到服务端,sockjs的.send相关方法
 * @param {Function} success  // 发送消息到服务端==>执行成功
 * @param {Function}  failure  // 发送消息到服务端==>执行失败
 * @param {Function}  progress // 发送消息到服务端==>执行
 * @param {Function}  stats // 发送消息到服务端==>更新任务状态（请求接口）
 *
* */
async function handleCoreData({ type, payload, key, taskType }, { log, send, success, failure, progress, stats }, logs) {
  console.log('调用相关执行action', type, key, taskType, payload)
  // console.log('调用相关执行action - 参数', payload)
  if (type.startsWith('@@actions')) {
    let targetDir = payload.filePath;
    let npmClient = payload.npmClient || 'npm'
    let runArgs;
    console.log('projectID', key)
    console.log('是否存在目录', targetDir, existsSync(targetDir))
    // 判断是否存在目录，不存在，则返回异常
    if (!existsSync(targetDir)) {
      failure({
        key,
        log: `目录：${targetDir} 不存在\n`
      })
      return
    }
    switch (type) {
      case '@@actions/DEPLOY': // 部署/发布
      case '@@actions/BUILD':  // 构建
      case '@@actions/BUILDAndDEPLOY':
        runArgs = ['run', payload.buildCommand]  // 构建命令 构建目录配置为空或者 '/'时，执行npm run build，打包产物需要部署到根目录
        if (type === '@@actions/DEPLOY') {
          runArgs = ['run', payload.deployCommand]  // 打包命令
          if (!existsSync(join(targetDir, payload.buildPath))) {
            failure({
              key,
              log: `部署文件不存在，请先执行构建！\n`
            })
            return
          }
        }
        if (type === '@@actions/BUILDAndDEPLOY') {
          runArgs = ['run', 'build:sub:ci']  // 构建与打包命令
        }
        // Step1.创建操作日志
        const buildLogInfo = await log('create', { ...setResultInfo([payload.name, key, taskType, 'process']) }, key);
        console.log('创建操作日志返回对应的ID', buildLogInfo.data)
        const { data } = buildLogInfo;
        // Step2.更新当前任务状态
        stats(key, 'process', { ...setResultInfo([payload.name, key, taskType, 'process']) })
        // Step3.显示当前执行命令
        progress({ key, log: `\r\n\x1b[1;36m> Executing ${npmClient} ${runArgs.join(' ')}...\x1b[39m\n`, taskType })
        // Step4.更新当前执行项目的SVN
        await updateProjectSvn(targetDir).then(() => {
          progress({ key, log: `\x1b[1;32m> Svn update 【${targetDir}】 success.\x1b[39m\n`, taskType })
        }).catch(e => {
          failure({ key, log: `\x1b[1;31m> Svn update  【${targetDir}】 failure!\x1b[39m\n`, taskType })
          log('update', { id: data._id, ...setResultInfo([payload.name, key, taskType, 'failure']) })
        })
        try {
          console.log('执行命令', runArgs, '当前是否已经存在任务对应的PID==>', proc[key] ? proc[key].pid : '')
          proc[key] = runCommand(npmClient, targetDir, runArgs)
          await handleChildProcess(proc[key], { progress, success, failure, stats, log }, { npmClient, runArgs, targetDir, key, payload, taskType, logId: data._id });
        }
        catch (error) {
          failure({ key, log: error.toString(), taskType })
          console.log('data._id', data._id, 'stateLotId', payload.logId)
          log('update', { id: data._id, ...setResultInfo([payload.name, key, taskType, 'failure']) })
          stats(key, 'error', { errorInfo: error.toString(), ...setResultInfo([payload.name, key, taskType, 'failure']) })
        }
        break;
      // 安装依赖包
      case '@@actions/INSTALL':
        // Step1.创建操作日志
        const installLogInfo = await log('create', { ...setResultInfo([payload.name, key, taskType, 'process']) }, key);
        console.log('创建操作日志返回对应的ID', installLogInfo.data)
        // Step2.更新当前任务状态
        stats(key, 'process', { ...setResultInfo([payload.name, key, taskType, 'process']) })
        // Step3.显示当前执行命令
        progress({ key, log: `\r\n\x1b[1;36m> Executing ${npmClient} ${getNpmClientArgus(npmClient).join(' ')}...\x1b[39m\n` })
        try {
          targetDir = 'D:\\Workerspace\\S-Person\\1-fanzhuo\\fan-build-server\\app' // 暂时使用其他目录
          // 重装 node_modules 时先清空，否则可能会失败
          progress({ key, log: 'Cleaning node_modules...\n' })
          await cleanNodeModules(targetDir);
          progress({ key, log: 'Cleaning node_modules success.\n' })
          runArgs = getNpmClientArgus(npmClient)
          proc[key] = runCommand(npmClient, targetDir, runArgs)
          await handleChildProcess(proc[key], { progress, success, failure, stats, log },
            { npmClient, runArgs, key, payload, taskType, logId: installLogInfo.data ? installLogInfo.data._id : undefined });
        }
        catch (error) {
          failure({ key, log: error.toString() });
          log('update', { id: installLogInfo.data ? installLogInfo.data._id : undefined, ...setResultInfo([payload.name, key, taskType, 'failure']) })
          stats(key, 'error', { ...setResultInfo([payload.name, key, taskType, 'failure']) })
        }
        break;

      // 测试执行事件
      case '@@actions/TESTCOPY':
        targetDir = 'D:\\Workerspace\\svn\\webdesign\\trunk\\library\\basic-manage-2.0'
        runArgs = ['run', 'test:copy']  // 构建目录配置为空或者 '/'时，执行npm run build，打包产物需要部署到根目录
        proc[key] = runCommand(npmClient, targetDir, runArgs)
        // Step1.创建操作日志
        const testLogInfo = await log('create', { ...setResultInfo([payload.name, key, taskType, 'process']) }, key);
        console.log('创建操作日志返回对应的ID', testLogInfo.data, taskType)
        stats(key, 'process', { ...setResultInfo([payload.name, key, taskType, 'process']) })
        // Step3.显示当前执行命令
        progress({ key, log: `\n\x1b[1;36m> Executing ${npmClient} ${runArgs.join(' ')}...\x1b[39m\n`, taskType })
        try {
          await handleChildProcess(proc[key], { progress, success, failure, stats, log },
            { npmClient, runArgs, key, payload, taskType, logId: testLogInfo.data ? testLogInfo.data._id : undefined });
        }
        catch (error) {
          failure({ key, log: error.toString(), taskType });
          log('update', { id: installLogInfo.data ? installLogInfo.data._id : undefined, ...setResultInfo([payload.name, key, taskType, 'failure']) })
          stats(key, 'error', { errorInfo: error.toString(), ...setResultInfo([payload.name, key, taskType, 'failure']) })
        }
        break;

      // 取消当前执行的任务(销毁子进程)
      case '@@actions/CANCEL':
        console.log('currentTask 进程不存在', taskType, '上一次的日志ID：', payload.logId)
        if (!proc[key]) {
          failure({
            key,
            log: new Error(`${taskType} 进程不存在`).toString(), taskType,
          });
          log('update', { id: payload.logId, ...setResultInfo([payload.name, key, taskType, 'failure']) }) // payload.logId 由初次创建时，生成到项目内的logId
          stats(key, 'error', { errorInfo: new Error(`${taskType} 进程不存在`).toString(), ...setResultInfo([payload.name, key, taskType, 'failure']) })
          return;
        }
        kill(proc[key].pid); // 销毁进程后，会有子进程内部的 close 执行 failure 事件
        delete proc[key]
        break;
      default:
        break
    }
  } else {
    console.log('执行非action事件', type)
    switch (type) {
      case '@@project/taskList': // 获取项目列表  // 拼装日志消息消息
        const payload = {
          date: +new Date(),
          data: proc,
        };
        send({
          type: '@@project/taskList',
          payload
        });
        break;
      // 测试使用调用接口获取项目详情
      case '@@project/detail':
        const res = await request('/api/project/taskUpdate', 'POST', {
          id: '5f5976d9af60556028149d24',
          taskType: '',
          taskTypeName: '',
          taskState: '',
          taskStateName: '',
        })
        console.log('接口获取事件=>更新任务状态', res);
        // const res = await request('/api/project/page', 'GET', {id:'5f5062dbe18012507085b8e8'})
        // console.log('接口获取事件->项目列表>>>', res);
        break;
      // 测试使用调用接口获取项目详情
      case '@@project/getList':
        const respon = await request('/api/project/page', 'GET')
        console.log('接口获取事件->项目列表>>>',);
        success(respon);
        break;
      case '@@log/getHistory':
        logs.map((logItem, index) => `[${index}]获取历史日志 ==》 ${JSON.stringify(logItem)}`)
        send({
          type: '@@log/getHistory/result',
          payload,
          data: logs,
        });
        break;
      case '@@log/clear':
        logs = [];
        success();
        break;
      // 读取任务进程历史记录 日志
      case '@@tasks/log/history':
        if (!taskType) return
        console.log('是否存在目录 ', existsSync(`./log/${taskType}.${key}.log`))
        if (!existsSync(`./log/${taskType}.${key}.log`)) {
          console.log('日志文件不存在')
          return
        }
        const fileReadStream = createReadStream(`./log/${taskType}.${key}.log`);
        let str = '';
        fileReadStream.on('data', (data) => {
          // console.log("接收到" + data.length);   //文件比较大时，会多次读取，多次执行该回调函数
          str += data;
        })
        fileReadStream.on('end', () => {
          // console.log('接收到的文件流');
          // console.log(str);
          success({ key, log: str });
          // console.log(" --- 结束 接收到的文件流---");
        })
        fileReadStream.on('error', (error) => {
          failure({ key, result: error.toString() })
        })
        break;
      // 清空指定项目的任务进程日志
      case '@@tasks/log/clear':
        if (!existsSync(`./log/${taskType}.${key}.log`)) {
          console.log('日志文件不存在')
          return
        }
        writeFile(`./log/${taskType}.${key}.log`,'',err => {
        if (err) {
          console.log('清空文件失败')
          failure({ key, done: false, result: err.toString() })
        } else {
          console.log('清空文件成功')
          success({ key, done: true, result: '清空成功' })
        }
      });
        // unlink(`./log/${taskType}.${key}.log`, err => {
        //   if (err) {
        //     console.log('删除文件失败')
        //     failure({ key, done: false, result: err.toString() })
        //   } else {
        //     console.log('删除文件成功')
        //     success({ key, done: true, result: '清空成功' })
        //   }
        // });
        break
      default:
        break;
    }
  }
}

exports.procGroup = function () {
  return proc
}
exports.handleCoreData = handleCoreData
