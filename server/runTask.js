const { join, resolve } = require("path");
const { existsSync, createReadStream, writeFile, readFileSync } = require("fs");
const rimraf = require("rimraf"); // 删除文件夹
const kill = require('tree-kill'); // 杀死任务进程
// const del = require('del');
const { spawn, exec } = require('child_process');
const taskConfig = require("./utils/task.config");
const request = require('./utils/request');
const { newError, iconvDecode } = require('./utils/commons');
const { copyFiles, existToDest } = require('./utils/copyAndDest');


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
        reject(newError(`Command failed: ${npmClient} ${runArgs.join(' ')}`));
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
async function handleChildProcess(child, { progress, success, failure, updateStates, log }, { npmClient, runArgs, key, payload, taskType, logId },) {
  return new Promise((resolve, reject) => {
    child.stdout.on('data', buffer => {
      console.log(`process子进程执行中`);
      if (progress) progress({ key, log: buffer.toString(), taskType })
    });
    child.stderr.on('data', buffer => {
      if (progress) progress({ key, log: buffer.toString(), taskType })
    });
    child.on('exit', (code, signal) => {
      delete proc[key]; // 删除当前项目处理中的进程
      const result = setResultInfo([payload.name, key, taskType, code !== 0 ? 'failure' : 'success'])
      if (code !== 0){
        result.description = new Error(`用户操作停止，Command failed: ${npmClient} ${runArgs.join(' ')}`).toString()
        result.errorInfo = new Error(`用户操作停止，Command failed: ${npmClient} ${runArgs.join(' ')}`).toString()
      }
      log('update', { id: logId, ...result }); // 操作日志更新
      updateStates(key, code !== 0 ? 'error' : 'success', { ...result })
      if (code !== 0) {
        failure({ key, log: newError(`Command failed: ${npmClient} ${runArgs.join(' ')}`), taskType, })
        reject()
      } else {
        success({
          key,
          log: `\x1b[1;32m> Process finished with exit code ${code}\x1b[39m\n\n`, taskType,
        })
        resolve()
      }
      // code !== 0 ? opts.onFailed(new Error(`command failed: ${npmClient} ${runArgs.join(' ')}`).toString()) : opts.onSuccess(code);
    });
    // // 销毁进程
    process.on('exit', () => {
      child.kill('SIGTERM');
      console.log('销毁进程')
      // delete proc.child
    });
  })
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
    exec(`svn up ${cwd}`, { encoding: 'binary' }, (err, stdout, stderr) => {
      if (err) return reject(iconvDecode(err.toString())); // 返回 error
      resolve(iconvDecode(stdout), iconvDecode(stderr))
    })
  })
}

// failure({ key, log: `\x1b[1;31m> Svn update  【${targetDir}】 failure!\x1b[39m\n`, taskType })
// log('update', { id: data._id, description: error.toString(), ...setResultInfo([payload.name, key, taskType, 'failure']) })
// updateStates(key, 'error', { errorInfo: error.toString(), ...setResultInfo([payload.name, key, taskType, 'failure']) })

// 执行svn相关命令
/**
 * @param {string} command 执行命令
 * @param {string} tips 描述文本
 * */
function svnCommands(command, { type, payload, key, taskType, targetDir }, { log, send, success, failure, progress, updateStates }, data) {
  return new Promise((resolve, reject) => {
    exec(command, { encoding: 'binary' }, (err, stdout, stderr) => {
      if (err) {
        const error = iconvDecode(err.toString()) // 转换乱码文本
        updateStates(key, 'error', { errorInfo: error, ...setResultInfo([payload.name, key, taskType, 'failure']) })
        failure({ key, log: error, taskType })
        log('update', { id: data._id, description: error, ...setResultInfo([payload.name, key, taskType, 'failure']) })
        reject(err)
      }
      if (progress) progress({ key, log: iconvDecode(stdout), taskType })
      resolve(stdout, stderr)
    })
  })


}

//  执行“构建”或“发布”任务
async function runBuildOrDeploy(method, { type, payload, key, taskType, targetDir }, { log, send, success, failure, progress, updateStates }) {
  // if (method === '')
  const initResultInfo = setResultInfo([payload.name, key, taskType, 'init']);
  const processInfo = setResultInfo([payload.name, key, taskType, 'process']);
  const failureInfo = setResultInfo([payload.name, key, taskType, 'failure']);
  // const successInfo = setResultInfo([payload.name, key, taskType, 'success']);
  return new Promise((resolve, reject) => {
    (async () => {
      const runArgs = ['run', method === 'BUILD' ? payload.buildCommand : payload.deployCommand]
      // TODO需要移除
      if (type === '@@actions/DEPLOY') {
        if (!existsSync(join(targetDir, payload.buildPath))) {
          await updateStates(key, 'init', initResultInfo, { errorLog: `部署目录不存在，请先执行构建！\n` }); // 任务状态设置为init
          failure({ key, log: newError(`部署目录${join(targetDir, payload.buildPath)}不存在，请先执行构建！`), taskType })
          reject()
          return
        }
      }
      // Step1.创建操作日志
      const buildLogInfo = await log('create', processInfo, key); // 返回数据库数据
      console.log('创建操作日志返回对应的ID', buildLogInfo.data)
      const { data } = buildLogInfo;
      // Step2.更新当前任务状态
      await updateStates(key, 'process', processInfo)
      // Step3.打印显示当前执行命令
      progress({ key, log: `\x1b[1;36m> Executing ${'npm'} ${runArgs.join(' ')}...\x1b[39m\n`, taskType })
      // Step4.更新当前执行项目的SVN
      updateProjectSvn(targetDir).then((stdout, stderr) => {
        console.log('Step4.更新当前执行项目的SVN ==> stdout', stdout)
        progress({ key, log: `\x1b[1;32m> Svn update 【${targetDir}】 success.\x1b[39m\n`, taskType }); // 打印SVN更新成功提示
        try {
          console.log('执行命令', runArgs, '当前是否已经存在任务对应的PID==>', proc[key] ? proc[key].pid : '')
          proc[key] = runCommand('npm', targetDir, runArgs)
          handleChildProcess(proc[key], { progress, success, failure, updateStates, log }, { npmClient: 'npm', runArgs, targetDir, key, payload, taskType, logId: data._id }).then(() => {
            console.log('BUILD或ISNTALLhandleChildProcess =>>成功')
            resolve()
          }).catch((e) => {
            console.log('BUILD或ISNTALLhandleChildProcess =>>报错', e)
            reject(e)
          });
        }
        catch (error) {
          updateStates(key, 'error', { errorInfo: error.toString(), ...failureInfo})
          failure({ key, log: error.toString(), taskType })
          log('update', { id: data._id, description: error.toString(), ...failureInfo })
          reject(error)
        }
      }).catch(error => {
        updateStates(key, 'error', { errorInfo: error, ...failureInfo })
        failure({ key, log: error, taskType })
        log('update', { id: data._id, description: error, ...failureInfo })
        reject(error)
      })
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
 * @param {Function}  updateStates // 发送消息到服务端==>更新任务状态（请求接口）
 *
* */
async function handleCoreData({ type, payload, key, taskType }, { log, send, success, failure, progress, updateStates }) {
  console.log('调用相关执行action', type, key, taskType)
  // console.log('调用相关执行action - 参数', payload)
  const dataParams = { type, payload, key, taskType }
  const methodParams = { log, send, success, failure, progress, updateStates }

  if (type.startsWith('@@actions')) {
    let targetDir = payload.filePath;
    let npmClient = payload.npmClient || 'npm'
    let runArgs;
    console.log('projectID', key)
    console.log('是否存在目录', targetDir, existsSync(targetDir))
    // 判断是否存在目录，不存在，则返回异常
    if (!existsSync(targetDir)) {
      await updateStates(key, 'init', { ...setResultInfo([payload.name, key, taskType, 'init']) }, { errorLog: `当前项目目录：${targetDir} 不存在,无法操作！` })
      return
    }

    let pkg;
    try {
      const data = readFileSync(`${payload.filePath}\\package.json`, 'utf8');
      // 等待操作结果返回，然后打印结果
      pkg = JSON.parse(data)
    } catch (e) {
      console.log('读取packages.json文件发生错误');
    }
    switch (type) {
      case '@@actions/BUILD':  // 构建
        runBuildOrDeploy('BUILD', { ...dataParams, targetDir }, methodParams).then(() => {
          console.log('成功后执行=>>isRunning')
        }).catch(e => {
          console.log(e, '失败后执行')
        })
        break;
      // 部署/发布
      case '@@actions/DEPLOY':

        runBuildOrDeploy('DEPLOY', { ...dataParams, targetDir: payload.filePath }, methodParams).then(() => {
          console.log('==>执行部署成功后执行')
        }).catch(e => {
          console.log('==>执行部署成功失败后执行', e)
        })
        return
        const versionArg = pkg.version.split('.'); // 获取版本号
        versionArg.splice(2, 1, Number(versionArg[2]) + 1) // 版本号新增1
        const patchVersion = versionArg.join('.');
        // Step1. 判断目录是否存在
        if (!existsSync(join(targetDir, payload.buildPath))) {
         await updateStates(key, 'init', { ...setResultInfo([payload.name, key, taskType, 'init']) }, { errorLog: `部署文件目录不存在，请先执行构建！` })
          return
        }
        // Step2.创建操作日志
        const buildLogInfo = await log('create', { ...setResultInfo([payload.name, key, taskType, 'process']) }, key);
        const { data = { _id: 'testetsetst' } } = buildLogInfo; // 创建操作日志返回对应的ID
        // Step3.更新当前任务状态
        await updateStates(key, 'process', { ...setResultInfo([payload.name, key, taskType, 'process']) })
        // Step4.显示当前执行命令
        progress({ key, log: `\x1b[1;36m> Executing Deploy...\x1b[39m\n`, taskType })
        const stepsCommand = {
          SubStep1: {
            value: 'SubStep1',
            desc: '更新当前项目的资源文件',
            command: `svn up ${targetDir}` // 更新当前项目的资源文件
          },
          SubStep2: {
            value: 'SubStep2',
            desc: '更新部署目录资源文件',
            command: `svn up ${payload.deployFilePath}`
          },
          SubStep3: {
            desc: '删除部署目录SVN上一版本文件',
            command: `svn delete ${payload.deployFilePath}\\${payload.buildPath}\\* -m "前端 删除上一版本 v${pkg.version} 发布文件"` // 直接源文件删除
          },
          SubStep4: {
            desc: '删除文件提交SVN',
            command: `svn ci -m "前端 删除上一版本 v${pkg.version} 发布文件"` // 直接源文件删除
          },
          SubStep5: {
            desc: '复制构建目录文件到部署目录',
            func: async () => {
              if (!existsSync(payload.deployFilePath)) {
               await updateStates(key, 'init', { ...setResultInfo([payload.name, key, 'BUILD', 'init']) }, { errorLog: `部署站点目录不存在，请确认是否载入资源到本地！` })
                return
              }
              // 需要复制文件到指定目录
              await existToDest(`${payload.filePath}\\${payload.buildPath}`, `${payload.deployFilePath}\\${payload.buildPath}`, copyFiles).then(() => {
                console.log('拷贝成功', `${payload.buildPath}==>>>至===>>>${payload.deploySvnPath}`)
              }).catch(e => {
                console.log('拷贝失败')
                console.log(e)
              })
            }
          },
          SubStep6: {
            desc: '添加新文件到svn进程内',
            command: `svn add ${payload.deployFilePath}\\${payload.buildPath}* --force`
          },
          SubStep7: {
            desc: '部署文件提交上传至svn',
            command: `svn ci -m "前端 ${payload.buildPath} 站点更新 v${patchVersion}" ${payload.deployFilePath}\\${payload.buildPath}\\*`
          },
          SubStep8: {
            desc: '当前项目版本号增加',
            func: () => {
              pkg.version = patchVersion
              let newPkgContent = JSON.stringify(pkg, null, 2); // 格式化json，带2个空格缩进
              writeFile(`${targetDir}\\package.json`, newPkgContent, 'utf8', (err) => {
                if (err) throw err;
                console.log('success done');
              });
            }
          },
          SubStep9: {
            desc: '当前项目版本号增加并上传到svn',
            command: `svn ci -m "更新版本控制 v${patchVersion}" ${payload.filePath}\\package.json`
          },
        }

        const stepsCommands = [
          {
            value: 'SubStep1',
            desc: '更新当前项目的资源文件',
            command: `svn up ${targetDir}` // 更新当前项目的资源文件
          },
          {
            value: 'SubStep2',
            desc: '更新部署目录资源文件',
            command: `svn up ${payload.deployFilePath}`
          },
          {
            value: 'SubStep3',
            desc: '删除部署目录SVN上一版本文件',
            command: `svn delete ${payload.deployFilePath}\\${payload.buildPath}\\* -m "前端 删除上一版本 v${pkg.version} 发布文件"` // 直接源文件删除
          },
          {
            value: 'SubStep4',
            desc: '删除文件提交SVN',
            command: `svn ci -m "前端 删除上一版本 v${pkg.version} 发布文件"` // 直接源文件删除
          },
          {
            value: 'SubStep5',
            desc: '复制构建目录文件到部署目录',
            func: async () => {
              if (!existsSync(payload.deployFilePath)) {
              await  updateStates(key, 'init', { ...setResultInfo([payload.name, key, 'BUILD', 'init']) }, { errorLog: `部署站点目录不存在，请确认是否载入资源到本地！` })
                return
              }
              // 需要复制文件到指定目录
              await existToDest(`${payload.filePath}\\${payload.buildPath}`, `${payload.deployFilePath}\\${payload.buildPath}`, copyFiles).then(() => {
                console.log('拷贝成功', `${payload.buildPath}==>>>至===>>>${payload.deploySvnPath}`)
              }).catch(e => {
                console.log('拷贝失败')
                console.log(e)
              })
            }
          },
          {
            value: 'SubStep6',
            desc: '添加新文件到svn进程内',
            command: `svn add ${payload.deployFilePath}\\${payload.buildPath}* --force`
          }, {
            value: 'SubStep7',
            desc: '部署文件提交上传至svn',
            command: `svn ci -m "前端 ${payload.buildPath} 站点更新 v${patchVersion}" ${payload.deployFilePath}\\${payload.buildPath}\\*`
          },
          {
            value: 'SubStep8',
            desc: '当前项目版本号增加',
            func: () => {
              pkg.version = patchVersion
              let newPkgContent = JSON.stringify(pkg, null, 2); // 格式化json，带2个空格缩进
              writeFile(`${targetDir}\\package.json`, newPkgContent, 'utf8', (err) => {
                if (err) throw err;
                console.log('success done');
              });
            }
          },
          {
            value: 'SubStep9',
            desc: '当前项目版本号增加并上传到svn',
            command: `svn ci -m "更新版本控制 v${patchVersion}" ${payload.filePath}\\package.json`
          },
        ]
        const testLog = `svn log ${payload.deploySvnPath}\\dd` // 删除SVN命令
        await svnCommands(testLog, { ...dataParams, targetDir }, methodParams, data).then((stdout, stderr) => {
          console.log('stdout, stderr', stdout, stderr)
          progress({ key, log: `\x1b[1;32m> ST delete 【${payload.deploySvnPath}】 success.\x1b[39m\n`, taskType })
        }).catch(error => {
          failure({ key, log: `\x1b[1;31m> ST update  【${payload.deploySvnPath}】 failure!\x1b[39m\n`, taskType })
        })
        //  --执行成功
        const successResult = setResultInfo([payload.name, key, taskType, 'success'])
        await updateStates(key, 'success', { ...successResult }) // 任务状态更新
        success({
          key,
          log: `\r\n\x1b[1;32m> Process finished with exit code ${'success'}\x1b[39m\n\n`, taskType,
        })
        log('update', { id: data._id, ...successResult }); // 操作日志更新
        //  --/end执行成功
        /*  await svnCommands(comDelete, { ...dataParams, targetDir }, methodParams, data).then(() => {
            progress({ key, log: `\x1b[1;32m> Svn delete 【${payload.deploySvnPath}】 success.\x1b[39m\n`, taskType })
          }).catch(error => {
            failure({ key, log: `\x1b[1;31m> Svn update  【${payload.deploySvnPath}】 failure!\x1b[39m\n`, taskType })
            // log('update', { id: data._id, description: error.toString(), ...setResultInfo([payload.name, key, taskType, 'failure']) })
            // updateStates(key, 'error', { errorInfo: error.toString(), ...setResultInfo([payload.name, key, taskType, 'failure']) })
          })*/
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
        runBuildOrDeploy('BUILD', { ...dataParams, targetDir }, methodParams).then(() => {
          console.log('成功后执行=>>isRunning')
          runBuildOrDeploy('DEPLOY', { ...dataParams, targetDir: payload.filePath }, methodParams).then(() => {
            console.log('==>执行部署成功后执行')
          }).catch(e => {
            console.log('==>执行部署成功失败后执行', e)
          })
        }).catch(e => {
          console.log('==>失败后执行', e)
        })
        console.log('==>==>上面部署与发布成功后才执行这条')
        break;
      // 安装依赖包
      case '@@actions/INSTALL':
        targetDir = 'D:\\Workerspace\\S-Person\\1-fanzhuo\\fan-build-server\\app' // TODO 暂时使用其他目录
        // Step1.创建操作日志
        const installLogInfo = await log('create', { ...setResultInfo([payload.name, key, taskType, 'process']) }, key);
        console.log('创建操作日志返回对应的ID', installLogInfo.data)
        // Step2.更新当前任务状态
        updateStates(key, 'process', { ...setResultInfo([payload.name, key, taskType, 'process']) })
        // Step3.显示当前执行命令
        progress({ key, log: `\x1b[1;36m> Executing ${npmClient} ${getNpmClientArgus(npmClient).join(' ')}...\x1b[39m\n` , taskType} )
        try {
          // 重装 node_modules 时先清空，否则可能会失败
          progress({ key, log: 'Cleaning node_modules...\n' , taskType} )
          await cleanNodeModules(targetDir).then(() => {
            console.log('' +
              '')
          });
          progress({ key, log: 'Cleaning node_modules success.\n' , taskType} )
          runArgs = getNpmClientArgus(npmClient)
          proc[key] = runCommand(npmClient, targetDir, runArgs)
          handleChildProcess(proc[key],methodParams,
            { npmClient, runArgs, key, payload, taskType, logId: installLogInfo.data ? installLogInfo.data._id : undefined }).then(() => {
            console.log('INSTALL==>>handleChildProcess =>>成功')
          }).catch((e) => {
            console.log('INSTALL==>>handleChildProcess =>>报错', e)
          });
        }
        catch (error) {
          failure({ key, log: error.toString() });
          log('update', { id: installLogInfo.data ? installLogInfo.data._id : undefined, ...setResultInfo([payload.name, key, taskType, 'failure']) })
          updateStates(key, 'error', { errorInfo: error.toString(), ...setResultInfo([payload.name, key, taskType, 'failure']) })
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
        updateStates(key, 'process', { ...setResultInfo([payload.name, key, taskType, 'process']) })
        // Step3.显示当前执行命令
        // progress({ key, log: `\n\x1b[1;36m> Executing ${npmClient} ${runArgs.join(' ')}...\x1b[39m\n`, taskType })
        try {
          // { ...dataParams, targetDir }, methodParams { progress, success, failure, updateStates, log }
          await handleChildProcess(proc[key], methodParams,
            { npmClient, runArgs, key, payload, taskType, logId: testLogInfo.data ? testLogInfo.data._id : undefined });
        }
        catch (error) {
          failure({ key, log: error.toString(), taskType });
          log('update', { id: installLogInfo.data ? installLogInfo.data._id : undefined, ...setResultInfo([payload.name, key, taskType, 'failure']) })
          updateStates(key, 'error', { errorInfo: error.toString(), ...setResultInfo([payload.name, key, taskType, 'failure']) })
        }
        break;

      // 取消当前执行的任务(销毁子进程)
      case '@@actions/CANCEL':
        const versionArgC = pkg.version.split('.');
        versionArgC.splice(2, 1, Number(versionArgC[2]) + 1)
        if (!proc[key]) {
          failure({
            key,
            log: newError(`${taskType} 进程不存在`), taskType,
          });
          updateStates(key, 'error', { errorInfo: `${taskType} 进程不存在`, ...setResultInfo([payload.name, key, taskType, 'failure']) })
          log('update', { id: payload.logId, ...setResultInfo([payload.name, key, taskType, 'failure']) }) // payload.logId 由初次创建时，生成到项目内的logId
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
          console.log('接收到的文件流执行次数', str);
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
