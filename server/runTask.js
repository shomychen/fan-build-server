const join = require("path");
// import {join} from 'path';
const rimraf = require("rimraf");
const kill = require('tree-kill'); // 杀死任务进程

const spawn = require('child_process').spawn;
const taskConfig = require("./utils/task.config");

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

async function runCommand(npmClient, runArgs, targetDir) {
  console.log('命令开始执行')
  const cmdNpmClient = npmClient || 'npm'
  // spawn方法接受两个参数，第一个是可执行文件，第二个是参数数组。
  // window上执行的话，需要用.cmd
  const child = spawn(process.platform === 'win32' ? `${cmdNpmClient}.cmd` : cmdNpmClient, [...runArgs], {
    cwd: targetDir,
    // stdio: ['inherit', 'inherit', 'inherit']
    // stdio: 'pipe'
    // stdio: ipc ? [null, null, null, 'ipc'] : 'pipe'
  })

  return child;
}

function handleChildProcess(child, opts, { npmClient, runArgs }) {

  child.stdout.on('data', buffer => {
    if (opts.onData) opts.onData(buffer.toString());
  });
  child.stderr.on('data', buffer => {
    if (opts.onData) opts.onData(buffer.toString());
  });
  child.on('exit', (code, signal) => {
    console.log(`子进程因收到信号 ${signal} 而终止`);
    /*    if (signal === 'SIGINT' || signal === 'SIGTERM') {
          // 用户取消任务
          console.log('用户取消任务是SIGINT 吗', signal)
          opts.onSuccess({
            state: 'init'
          })
        } else if (signal === 'SIGTERM') {
          // 用户取消任务
          opts.onSuccess({
            state: 'init'
          });
        } else {
          code !== 0 ? opts.onFailed(new Error(`command failed: ${npmClient} ${runArgs.join(' ')}`).toString()) : opts.onSuccess({
            state: 'success'
          });
        }*/
    // 退出code不为0时，打印报错信息
    code !== 0 ? opts.onFailed(new Error(`command failed: ${npmClient} ${runArgs.join(' ')}`).toString()) : opts.onSuccess(code);
  });

  // // 销毁进程
  process.on('exit', () => {
    child.kill('SIGTERM');
    console.log('销毁进程')
  });
}

async function installDeps(npmClient, targetDir, opts) {
  let args = [];

  if (['yarn', 'tyarn', 'ayarn'].includes(npmClient)) {
    args = [];
  } else if (['tnpm', 'npm', 'cnpm', 'pnpm'].includes(npmClient)) {
    args = ['install'];
  }

  await excuCommand(npmClient, args, targetDir, opts);
}

function setResultInfo([name, key, type, typeName, state, stateName]) {
  return {
    projectName: name, // 项目名称
    projectId: key, // 项目ID
    taskType: type,
    taskTypeName: typeName,
    taskState: state,
    taskStateName: stateName,
  }
}

let proc = {}; // 当前执行的进程 （按项目ID分）

/*
 * @param type 当前执行事件类型
 * @param payload 项目等相关参数
 * @param key 当前执行项目ID
 * @param log 日志
 * @param send 发送消息到服务端,sockjs的.send相关方法
 * @param success  // 发送消息到服务端==>执行成功
 * @param failure  // 发送消息到服务端==>执行失败
 * @param progress // 发送消息到服务端==>执行
 *
* */
async function handleCoreData({ type, payload, key, taskType }, { log, send, success, failure, progress }, connection) {
  console.log('调用相关执行action', type, key, taskType)
  // console.log('调用相关执行action - 参数', payload)
  if (type.startsWith('@@actions')) {
    let targetDir = payload.filePath || process.cwd()
    let npmClient = payload.npmClient || 'npm'
    console.log('projectID', key)
    switch (type) {
      case '@@actions/DEPLOY': // 部署/发布
      case '@@actions/BUILD':  // 构建
      case '@@actions/BUILDAndDEPLOY':
        try {
          if (payload.buildCommand) {
            console.log('TODO,没有执行命令，则不执行');
          }
          let runArgs = ['run', payload.buildCommand]  // 构建目录配置为空或者 '/'时，执行npm run build，打包产物需要部署到根目录
          if (type === '@@actions/DEPLOY') {
            runArgs = ['run', payload.deployCommand]  // 打包命令
          }
          if (type === '@@actions/BUILDAndDEPLOY') {
            runArgs = ['run', 'build:sub:ci']  // 打包命令
          }
          console.log('执行命令', runArgs)
          console.log('当前是否已经存在任务', proc[key])
          proc[key] = await runCommand(npmClient, runArgs, targetDir)
          console.log('当前是否已经存在任务->>', proc[key])
          handleChildProcess(proc[key], {
            onData: (data) => progress({ key, data }),
            onSuccess: (code) => success({
              key, data: code,
              result: { ...setResultInfo([payload.name, key, taskType, taskConfig[taskType].name, 'success', '成功']) }
            }),
            onFailed: (error) => failure({
              key, data: error,
              result: {
                ...setResultInfo([payload.name, key, taskType, taskConfig[taskType].name, 'failure', '失败'])
              }
            })
          }, { npmClient, runArgs, targetDir });
        }
        catch (error) {
          failure({
            key,
            data: error.toString(),
            result: {
              ...setResultInfo([payload.name, key, taskType, taskConfig[taskType].name, 'failure', '失败'])
            }
          })
        }
        break;
      // 取消当前执行的任务
      case '@@actions/CANCEL':
        console.log('currentTask', taskType)
        if (!proc[key]) {
          failure({
            key,
            data: new Error(`${taskType} 进程不存在`).toString(),
            result: {
              ...setResultInfo([payload.name, key, taskType, taskConfig[taskType].name, 'failure', '失败'])
            }
          });
          return;
        }
        console.log('执行取消进行 pid', proc[key].pid)
        // 子任务执行结束
        // if ([TaskState.FAIL].indexOf(this.state) > -1) {
        //   return;
        // }
        // proc.kill('SIGINT');
        // proc.kill('SIGINT');
        // proc.kill('SIGTERM');
        console.log(proc[key].pid)
        kill(proc[key].pid);
        delete proc[key]
        break;
      // 安装依赖包
      case '@@actions/INSTALL':
        console.log('执行安装包命令')
        try {
          targetDir = 'D:\\Workerspace\\github\\umi-ui\\projectA' // 暂时使用其他目录

          // 重装 node_modules 时先清空，否则可能会失败
          rimraf.sync(join(targetDir, 'node_modules'));
          await installDeps(npmClient, targetDir, {
            onData: (data) => {
              progress({
                data,
                key
              })
            }
          })
          success({
            key,
            data: 0,
            msg: '安装成功'
          });
        }
        catch (error) {
          failure({
            key,
            data: error
          });
        }
        break;
      case '@@actions/TESTCOPY':
        targetDir = 'D:\\Workerspace\\svn\\webdesign\\trunk\\library\\basic-manage-2.0'
        try {
          if (payload.buildCommand) {
            console.log('TODO,没有执行命令，则不执行');
          }
          let runArgs = ['run', 'test:copy']  // 构建目录配置为空或者 '/'时，执行npm run build，打包产物需要部署到根目录
          proc[key] = await runCommand(npmClient, runArgs, targetDir)
          handleChildProcess(proc[key], {
            onData: (data) => {
              progress({
                data,
                key,
              })
            },
            onSuccess: () => {
              success({
                key,
                data: 0,
                result: {
                  ...setResultInfo([payload.name, key, taskType, taskConfig[taskType].name, 'success', '成功'])
                }
              });
            },
            onFailed: (error) => {
              failure({
                key,
                data: error,
                result: {
                  ...setResultInfo([payload.name, key, taskType, taskConfig[taskType].name, 'failure', '失败'])
                }
              });
            }
          }, { npmClient, runArgs, targetDir });
        }
        catch (error) {
          console.log('进行异常')
          failure({
            key,
            data: error,
            result: {
              ...setResultInfo([payload.name, key, taskType, taskConfig[taskType].name, 'failure', '失败'])
            }
          });
        }
        break;

      default:
        console.log('其他执行事件')
        break
    }
  } else {
    console.log('执行其他相关的事件', type)
  }
}

exports.procGroup = function () {
  return proc
}
exports.handleCoreData = handleCoreData
