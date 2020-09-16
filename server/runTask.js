const { join } = require("path");
const { existsSync, createReadStream, writeFile } = require("fs");
const rimraf = require("rimraf"); // 删除文件夹
const kill = require('tree-kill'); // 杀死任务进程
// const del = require('del');
const iconv = require('iconv-lite');
const { spawn, exec } = require('child_process');
const taskConfig = require("./utils/task.config");
const request = require('./utils/request');

const encoding = 'cp936';
const binaryEncoding = 'binary';

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

// 执行子进程管理
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
    if (code !== 0) result.description = new Error(`用户操作停止，Command failed: ${npmClient} ${runArgs.join(' ')}`).toString()
    log('update', { id: logId, ...result }); // 操作日志更新
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
  return {
    projectName: name, // 项目名称
    projectId: key,  // 项目ID
    taskType: type,  // 任务类型(BUILD\DEPLOY\INSTALL)
    taskTypeName: taskConfig[type] ? taskConfig[type].name : '',
    taskState: state, // 任务状态(process\success\failure)
    taskStateName: taskConfig[type].states ? taskConfig[type].states[state] : '',
  }
}


function setTaskState([name, key, type, state]) {
  return {
    taskState: state, // 任务状态(process\success\failure)
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
    exec(`svn up ${cwd}`, (err, stdout, stderr) => {
      if (err) return reject(err); // 返回 error
      resolve(stdout, stderr)
    })
  })
}

// await updateProjectSvn(targetDir).then(() => {
//   progress({ key, log: `\x1b[1;32m> Svn update 【${targetDir}】 success.\x1b[39m\n`, taskType })
// }).catch(error => {
//   failure({ key, log: `\x1b[1;31m> Svn update  【${targetDir}】 failure!\x1b[39m\n`, taskType })
//   log('update', { id: data._id, description: error.toString(), ...setResultInfo([payload.name, key, taskType, 'failure']) })
//   stats(key, 'error', { errorInfo: error.toString(), ...setResultInfo([payload.name, key, taskType, 'failure']) })
// })

// 执行svn相关命令
/**
 * @param {string} command 执行命令
 * @param {string} tips 描述文本
 * */
function svnCommands(command, { type, payload, key, taskType, targetDir }, { log, send, success, failure, progress, stats }, data) {
  return new Promise((resolve, reject) => {
    exec(command, { encoding: binaryEncoding }, (err, stdout, stderr) => {
      if (err) {
        const error = iconv.decode(Buffer.from(err.toString(), binaryEncoding), encoding)
        failure({ key, log: error, taskType })
        log('update', { id: data._id, description: error, ...setResultInfo([payload.name, key, taskType, 'failure']) })
        stats(key, 'error', { errorInfo: error, ...setResultInfo([payload.name, key, taskType, 'failure']) })
        reject()
      }
      if (progress) progress({ key, log: iconv.decode(Buffer.from(stdout, binaryEncoding), encoding).toString(), taskType })
      resolve(stdout, stderr)
      // console.log(iconv.decode(Buffer.from(stdout, binaryEncoding), encoding));
      // console.log(iconv.decode(Buffer.from(stderr, binaryEncoding), encoding));
    })
  })


}

//  执行“构建”或“发布”任务
async function runBuildOrDeploy(method, { type, payload, key, taskType, targetDir }, { log, send, success, failure, progress, stats }) {
  // if (method === '')
  return new Promise((resolve, reject) => {
    (async () => {
      const runArgs = ['run', method === 'BUILD' ? payload.buildCommand : payload.deployCommand]
      // TODO需要移除
      if (type === '@@actions/DEPLOY') {
        if (!existsSync(join(targetDir, payload.buildPath))) {
          failure({ key, log: `部署文件不存在，请先执行构建！\n`, taskType })
          return
        }
      }
      // Step1.创建操作日志
      const buildLogInfo = await log('create', { ...setResultInfo([payload.name, key, taskType, 'process']) }, key);
      console.log('创建操作日志返回对应的ID', buildLogInfo.data)
      const { data } = buildLogInfo;
      // Step2.更新当前任务状态
      stats(key, 'process', { ...setResultInfo([payload.name, key, taskType, 'process']) })
      // Step3.显示当前执行命令
      progress({ key, log: `\x1b[1;36m> Executing ${'npm'} ${runArgs.join(' ')}...\x1b[39m\n`, taskType })
      // Step4.更新当前执行项目的SVN
      await updateProjectSvn(targetDir).then((stdout, stderr) => {
        console.log('Step4.更新当前执行项目的SVN ==> stdout', stdout)
        progress({ key, log: `\x1b[1;32m> Svn update 【${targetDir}】 success.\x1b[39m\n`, taskType })
      }).catch(error => {
        failure({ key, log: `\x1b[1;31m> Svn update  【${targetDir}】 failure!\x1b[39m\n`, taskType })
        log('update', { id: data._id, description: error.toString(), ...setResultInfo([payload.name, key, taskType, 'failure']) })
        stats(key, 'error', { errorInfo: error.toString(), ...setResultInfo([payload.name, key, taskType, 'failure']) })
      })
      try {
        console.log('执行命令', runArgs, '当前是否已经存在任务对应的PID==>', proc[key] ? proc[key].pid : '')
        proc[key] = runCommand('npm', targetDir, runArgs)
        await handleChildProcess(proc[key], { progress, success, failure, stats, log }, { npmClient: 'npm', runArgs, targetDir, key, payload, taskType, logId: data._id });
        resolve()
      }
      catch (error) {
        failure({ key, log: error.toString(), taskType })
        log('update', { id: data._id, description: error.toString(), ...setResultInfo([payload.name, key, taskType, 'failure'],) })
        stats(key, 'error', { errorInfo: error.toString(), ...setResultInfo([payload.name, key, taskType, 'failure']) })
        reject(error)
      }
    })()
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
async function handleCoreData({ type, payload, key, taskType }, { log, send, success, failure, progress, stats }) {
  console.log('调用相关执行action', type, key, taskType)
  // console.log('调用相关执行action - 参数', payload)

  const dataParam = { type, payload, key, taskType }
  const methodParams = { log, send, success, failure, progress, stats }
  if (type.startsWith('@@actions')) {
    let targetDir = payload.filePath;
    let npmClient = payload.npmClient || 'npm'
    let runArgs;
    console.log('projectID', key)
    console.log('是否存在目录', targetDir, existsSync(targetDir))
    // 判断是否存在目录，不存在，则返回异常
    if (!existsSync(targetDir)) {
      stats(key, 'init', { ...setResultInfo([payload.name, key, taskType, 'init']) }, { errorLog: `当前项目目录：${targetDir} 不存在,无法操作！` })
      return
    }
    switch (type) {
      case '@@actions/BUILD':  // 构建
        await runBuildOrDeploy('BUILD', { ...dataParam, targetDir }, methodParams)
        /* runArgs = ['run', payload.buildCommand]  // 构建命令 构建目录配置为空或者 '/'时，执行npm run build，打包产物需要部署到根目录
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
         progress({ key, log: `\x1b[1;36m> Executing ${npmClient} ${runArgs.join(' ')}...\x1b[39m\n`, taskType })
         // Step4.更新当前执行项目的SVN
         await updateProjectSvn(targetDir).then(() => {
           progress({ key, log: `\x1b[1;32m> Svn update 【${targetDir}】 success.\x1b[39m\n`, taskType })
         }).catch(error => {
           failure({ key, log: `\x1b[1;31m> Svn update  【${targetDir}】 failure!\x1b[39m\n`, taskType })
           log('update', { id: data._id, ...setResultInfo([payload.name, key, taskType, 'failure']) })
           stats(key, 'error', { errorInfo: error.toString(), ...setResultInfo([payload.name, key, taskType, 'failure']) })
         })
         try {
           console.log('执行命令', runArgs, '当前是否已经存在任务对应的PID==>', proc[key] ? proc[key].pid : '')
           proc[key] = runCommand(npmClient, targetDir, runArgs)
           await handleChildProcess(proc[key], { progress, success, failure, stats, log }, { npmClient, runArgs, targetDir, key, payload, taskType, logId: data._id });
         }
         catch (error) {
           failure({ key, log: error.toString(), taskType })
           log('update', { id: data._id, ...setResultInfo([payload.name, key, taskType, 'failure']) })
           stats(key, 'error', { errorInfo: error.toString(), ...setResultInfo([payload.name, key, taskType, 'failure']) })
         }*/
        break;
      case '@@actions/DEPLOY': // 部署/发布
        // await runBuildOrDeploy('DEPLOY', {...dataParam, targetDir:payload.filePath }, methodParams)
        // Step1. 判断目录是否存在
        if (!existsSync(join(targetDir, payload.buildPath))) {
          stats(key, 'init', { ...setResultInfo([payload.name, key, taskType, 'init']) }, { errorLog: `部署文件目录不存在，请先执行构建！` })
          return
        }
        // Step2.创建操作日志
        const buildLogInfo = await log('create', { ...setResultInfo([payload.name, key, taskType, 'process']) }, key);
        const { data } = buildLogInfo; // 创建操作日志返回对应的ID
        // Step3.更新当前任务状态
        stats(key, 'process', { ...setResultInfo([payload.name, key, taskType, 'process']) })
        // Step4.显示当前执行命令
        progress({ key, log: `\x1b[1;36m> Executing Deploy...\x1b[39m\n`, taskType })
        // Step2. 清空部署目录下的文件
        // exec(`svn delete ${payload.deploySvnPath}\* -m "前端 删除上一版本发布文件"`, (err, stdout, stderr) => {
        //   if (err) return // done(err); // 返回 error
        //   console.log(`stdout: ${stdout}`);
        //   console.error(`stderr: ${stderr}`);
        //   // done(); // 完成 task
        // })

        // await svnCommands(`svn log ${payload.deploySvnPath}\\ddd `, { type, payload, key, taskType, targetDir }, { log, send, success, failure, progress, stats }, data)
        // return
        // await svnCommands(`svn up ${payload.deploySvnPath}`, { type, payload, key, taskType, targetDir }, { log, send, success, failure, progress, stats }, data)
        // await svnCommands(`svn log ${payload.deploySvnPath}`, { type, payload, key, taskType, targetDir }, { log, send, success, failure, progress, stats }, data)
        console.log('执行下一下')
        // 先删除上一版本的部署日志 需要获取package.json的版本号
        // SubStep1.更新站点目录SVN文件
        const stepUpdate = `svn up  ${payload.deployFilePath}`
        const comDelete = `svn delete ${payload.deploySvnPath} -m "前端 删除上一版本发布文件"` // 删除SVN命令
        await svnCommands(comDelete, { ...dataParam, targetDir }, methodParams, data).then(() => {
          progress({ key, log: `\x1b[1;32m> Svn delete 【${payload.deploySvnPath}】 success.\x1b[39m\n`, taskType })
        }).catch(error => {
          failure({ key, log: `\x1b[1;31m> Svn update  【${payload.deploySvnPath}】 failure!\x1b[39m\n`, taskType })
          // log('update', { id: data._id, description: error.toString(), ...setResultInfo([payload.name, key, taskType, 'failure']) })
          // stats(key, 'error', { errorInfo: error.toString(), ...setResultInfo([payload.name, key, taskType, 'failure']) })
        })
        // try {
        //
        //   del([`${payload.deployFilePath}\\*`], { force: true });
        // }
        // catch (e) {
        //   console.log('删除是否成功', e)
        // }
        // console.log('清空结果', deletedPaths)
        // progress({ key, log: `\x1b[1;32m> Clear deployFilePath 【${targetDir}】 success.\x1b[39m\n`, taskType })
        break;
      // 构建并发布
      case '@@actions/BUILDAndDEPLOY':
        runBuildOrDeploy('BUILD', { type, payload, key, taskType, targetDir }, { log, send, success, failure, progress, stats }).then(() => {
          console.log('内部执行完成 才执行这些')
        })
        console.log('上面执行成功才执行下面')
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
          stats(key, 'error', { errorInfo: error.toString(), ...setResultInfo([payload.name, key, taskType, 'failure']) })
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
        // progress({ key, log: `\n\x1b[1;36m> Executing ${npmClient} ${runArgs.join(' ')}...\x1b[39m\n`, taskType })
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
      // case '@@log/getHistory':
      //   logs.map((logItem, index) => `[${index}]获取历史日志 ==》 ${JSON.stringify(logItem)}`)
      //   send({
      //     type: '@@log/getHistory/result',
      //     payload,
      //     data: logs,
      //   });
      //   break;
      // case '@@log/clear':
      //   logs = [];
      //   success();
      //   break;
      // 读取任务进程历史记录 日志
      case '@@tasks/log/history':
        if (!taskType) return
        console.log('是否存在目录 ', existsSync(`./log/${taskType}.${key}.log`))
        if (!existsSync(`./log/${taskType}.${key}.log`)) {
          console.log('日志文件不存在')
          failure({ key, result: '日志文件不存在' })
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
          if (str) success({ key, log: str });
          // console.log(" --- 结束 接收到的文件流---");
        })
        fileReadStream.on('error', (error) => {
          failure({ key, result: error.toString() })
        })
        break;
      // 清空指定项目的任务进程日志
      case '@@tasks/log/clear':
        if (!existsSync(`./log/${taskType}.${key}.log`)) {
          // console.log('日志文件不存在')
          success({ key, done: true, result: '日志文件不存在' })
          return
        }
        writeFile(`./log/${taskType}.${key}.log`, '', err => {
          if (err) {
            console.log('清空文件失败')
            failure({ key, done: false, result: err.toString() })
          } else {
            console.log('清空文件成功')
            success({ key, done: true, result: '清空成功' })
          }
        });
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
