const { join } = require("path");
const { existsSync } = require("fs");
const rimraf = require("rimraf");
const kill = require('tree-kill'); // 杀死任务进程

const { spawn, exec } = require('child_process');
const taskConfig = require("./utils/task.config");
const fetch = require('node-fetch');
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
        reject(new Error(`command failed: ${npmClient} ${runArgs.join(' ')}`).toString());
        return;
      }
      resolve(child);
    });
    /*   // 成功执行，并按流方式打印
       child.stdout.on('data', buffer => {
         progress({
           data: buffer.toString()
         })
       })
       child.stderr.on('data', data => {
         failure({
           data: data.toString()
         })
       })
       // 进程退出
       child.on('close', code => {
         success({
           data: code.toString()
         })
       })
       // 进程执行错误
       child.on('error', code => {
         failure({
           data: code.toString()
         })
       })*/
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

async function handleChildProcess(child, { progress, success, failure, stats }, { npmClient, runArgs, key, payload, taskType },) {
  child.stdout.on('data', buffer => {
    if (progress) progress({ key, data: buffer.toString() })
  });
  child.stderr.on('data', buffer => {
    if (progress) progress({ key, data: buffer.toString() })
  });
  child.on('exit', (code, signal) => {
    console.log(`子进程因收到信号 ${signal} 而终止`);
    console.log('runArgs', runArgs)
    delete proc[key]; // 删除当前项目处理中的进程
    stats(key, code !== 0 ? 'error' : 'success', { ...setResultInfo([payload.name, key, taskType, code !== 0 ? 'failure' : 'success']) })
    if (code !== 0) {
      failure({
        key,
        data: new Error(`command failed: ${npmClient} ${runArgs.join(' ')}`).toString(),
      })
    } else {
      success({
        key,
        data: code,
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
  return new Promise((resolve, reject)=> {
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
  console.log('调用相关执行action', type, key, taskType)
  // console.log('调用相关执行action - 参数', payload)
  if (type.startsWith('@@actions')) {
    let targetDir = payload.filePath;
    let npmClient = payload.npmClient || 'npm'
    console.log('projectID', key)
    console.log('是否存在目录', targetDir, existsSync(targetDir))
    // 判断是否存在目录，不存在，则返回异常
    if (!existsSync(targetDir)) {
      failure({
        key,
        data: `目录：${targetDir} 不存在\n`
      })
      return
    }
    switch (type) {
      case '@@actions/DEPLOY': // 部署/发布
      case '@@actions/BUILD':  // 构建
      case '@@actions/BUILDAndDEPLOY':
        let runArgs = ['run', payload.buildCommand]  // 构建命令 构建目录配置为空或者 '/'时，执行npm run build，打包产物需要部署到根目录
        if (type === '@@actions/DEPLOY') {
          runArgs = ['run', payload.deployCommand]  // 打包命令
          if (!existsSync(join(targetDir, payload.buildPath))) {
            failure({
              key,
              data: `部署文件不存在，请先执行构建！\n`
            })
            return
          }
        }
        if (type === '@@actions/BUILDAndDEPLOY') {
          runArgs = ['run', 'build:sub:ci']  // 构建与打包命令
        }
        // Step1.更新操作日志
        log('info', `${taskType} project: ${payload.name}`);
        // Step2.更新当前任务状态
        stats(key, 'process', { ...setResultInfo([payload.name, key, taskType, 'process']) })
        // Step3.显示当前执行命令
        progress({ key, data: `\x1b[1;36m> Executing ${npmClient} ${runArgs.join(' ')}...\x1b[39m\n` })
        // Step4.更新当前执行项目的SVN
        await updateProjectSvn(targetDir).then(()=> {
          progress({ key, data: `\x1b[1;32m> Svn update 【${targetDir}】 success.\x1b[39m\n` })
        }).catch(e=> {
          failure({ key, data: `\x1b[1;31m Svn update  【${targetDir}】 failure!\x1b[39m\n` })
        })
        try {
          console.log('执行命令', runArgs)
          console.log('当前是否已经存在任务', proc[key])
          proc[key] = runCommand(npmClient, targetDir, runArgs)
          await handleChildProcess(proc[key], { progress, success, failure, stats, }, { npmClient, runArgs, targetDir, key, payload, taskType });
        }
        catch (error) {
          failure({
            key,
            data: error.toString()
          })
          stats(key, 'error', { ...setResultInfo([payload.name, key, taskType, 'failure']) })
        }
        break;
      // 取消当前执行的任务(销毁子进程)
      case '@@actions/CANCEL':
        console.log('currentTask', taskType)
        if (!proc[key]) {
          failure({
            key,
            data: new Error(`${taskType} 进程不存在`).toString(),
          });
          stats(key, 'error', { ...setResultInfo([payload.name, key, taskType, 'failure']) })
          return;
        }
        kill(proc[key].pid); // 销毁进程后，会有子进程内部的 close 执行 failure 事件
        delete proc[key]
        break;
      // 安装依赖包
      case '@@actions/INSTALL':
        stats(key, 'process', { ...setResultInfo([payload.name, key, taskType, 'process']) })
        progress({ key, data: `>> ${npmClient} ${getNpmClientArgus(npmClient).join(' ')}`, result: { ...setResultInfo([payload.name, key, taskType, 'process']) } })
        try {
          targetDir = 'D:\\Workerspace\\S-Person\\1-fanzhuo\\fan-build-server\\app' // 暂时使用其他目录
          // 重装 node_modules 时先清空，否则可能会失败
          progress({ key, data: 'Cleaning node_modules...\n' })
          await cleanNodeModules(targetDir);
          progress({ key, data: 'Cleaning node_modules success.\n' })
          proc[key] = runCommand(npmClient, targetDir, getNpmClientArgus(npmClient))
          await handleChildProcess(proc[key], { progress, success, failure, stats, }, { npmClient, runArgs: getNpmClientArgus(npmClient), targetDir, key, payload, taskType });
        }
        catch (error) {
          failure({
            key,
            data: error.toString()
          });
          stats(key, 'error', { ...setResultInfo([payload.name, key, taskType, 'failure']) })
        }
        break;
      case '@@actions/TESTCOPY':
        targetDir = 'D:\\Workerspace\\svn\\webdesign\\trunk\\library\\basic-manage-2.0'
        stats(key, 'process', { ...setResultInfo([payload.name, key, taskType, 'process']) })
        try {
          let runArgs = ['run', 'test:copy']  // 构建目录配置为空或者 '/'时，执行npm run build，打包产物需要部署到根目录
          proc[key] = runCommand(npmClient, targetDir, runArgs)
          await handleChildProcess(proc[key], { progress, success, failure, stats, }, { npmClient, runArgs, targetDir, key });
        }
        catch (error) {
          failure({
            key,
            data: error.toString()
          });
          stats(key, 'error', { ...setResultInfo([payload.name, key, taskType, 'failure']) })
        }
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
        console.log('接口获取事件->项目列表>>>', respon);
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
        break;
      default:
        break;
    }
  }
}

exports.procGroup = function () {
  return proc
}
exports.handleCoreData = handleCoreData
