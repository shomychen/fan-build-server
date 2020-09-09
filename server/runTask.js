const { join } = require("path");
const rimraf = require("rimraf");
const kill = require('tree-kill'); // 杀死任务进程

const spawn = require('child_process').spawn;
const taskConfig = require("./utils/task.config");
const fetch = require('node-fetch');

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

function handleChildProcess(child, opts, { npmClient, runArgs ,key}) {
  child.stdout.on('data', buffer => {
    if (opts.onData) opts.onData(buffer.toString());
  });
  child.stderr.on('data', buffer => {
    if (opts.onData) opts.onData(buffer.toString());
  });
  child.on('exit', (code, signal) => {
    console.log(`子进程因收到信号 ${signal} 而终止`);
    console.log('runArgs', runArgs)
    delete proc[key]; // 删除当前项目处理中的进程
    code !== 0 ? opts.onFailed(new Error(`command failed: ${npmClient} ${runArgs.join(' ')}`).toString()) : opts.onSuccess(code);
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
async function handleCoreData({ type, payload, key, taskType }, { log, send, success, failure, progress, stats }, logs) {
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
        let runArgs = ['run', payload.buildCommand]  // 构建命令 构建目录配置为空或者 '/'时，执行npm run build，打包产物需要部署到根目录
        if (type === '@@actions/DEPLOY') {
          runArgs = ['run', payload.deployCommand]  // 打包命令
        }
        if (type === '@@actions/BUILDAndDEPLOY') {
          runArgs = ['run', 'build:sub:ci']  // 构建与打包命令
        }
        log('info', `${taskType} project: ${payload.name}`);
        // 更新当前任务状态
        stats(key, 'process', { ...setResultInfo([payload.name, key, taskType, 'process']) })
        progress({ key, data: `Executing ${npmClient} ${runArgs.join(' ')}...` })
        try {
          console.log('执行命令', runArgs)
          console.log('当前是否已经存在任务', proc[key])
          proc[key] = runCommand(npmClient, targetDir, runArgs)
          handleChildProcess(proc[key], {
            onData: (data) => progress({ key, data }),
            onSuccess: (code) => {
              stats(key, 'success', { ...setResultInfo([payload.name, key, taskType, 'success']) })
              success({
                key,
                data: code,
                // result: { ...setResultInfo([payload.name, key, taskType, 'success']) }
              })
            },
            onFailed: (error) => {
              stats(key, 'error', { ...setResultInfo([payload.name, key, taskType, 'failure']) })
              failure({
                key,
                data: error,
                // result: { ...setResultInfo([payload.name, key, taskType, 'failure']) }
              })
            }
          }, { npmClient, runArgs, targetDir, key });
        }
        catch (error) {
          failure({
            key,
            data: error.toString(),
            result: { ...setResultInfo([payload.name, key, taskType, 'failure']) }
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
              ...setResultInfo([payload.name, key, taskType, 'failure'])
            }
          });
          return;
        }
        console.log('执行取消进行 pid', proc[key].pid)
        console.log(proc[key].pid)
        kill(proc[key].pid);
        delete proc[key]
        break;
      // 安装依赖包
      case '@@actions/INSTALL':
        progress({ key, data: `>> ${npmClient} ${getNpmClientArgus(npmClient).join(' ')}`, result: { ...setResultInfo([payload.name, key, taskType, 'process']) } })
        try {
          targetDir = 'D:\\Workerspace\\S-Person\\1-fanzhuo\\fan-build-server\\app' // 暂时使用其他目录
          // this.emit(TaskEventType.STD_OUT_DATA, 'Cleaning node_modules...\n');
          stats(key, 'process', { ...setResultInfo([payload.name, key, taskType, 'process']) })
          // 重装 node_modules 时先清空，否则可能会失败
          progress({ key, data: 'Cleaning node_modules...\n' })
          await cleanNodeModules(targetDir);
          progress({ key, data: 'Cleaning node_modules success.\n' })
          proc[key] = runCommand(npmClient, targetDir, getNpmClientArgus(npmClient))
          handleChildProcess(proc[key], {
            onData: (data) => progress({ key, data }),
            onSuccess: (code) => {
              stats(key, 'success', { ...setResultInfo([payload.name, key, taskType, 'success']) })
              success({
                key, data: code,
                result: { ...setResultInfo([payload.name, key, taskType, 'success']) }
              })
            },
            onFailed: (error) => {
              stats(key, 'error', { ...setResultInfo([payload.name, key, taskType, 'failure']) })
              failure({
                key, data: error
              })
            }
          }, { npmClient, runArgs: getNpmClientArgus(npmClient), targetDir, key });
        }
        catch (error) {
          failure({
            key,
            data: error.toString(),
            result: {
              ...setResultInfo([payload.name, key, taskType, 'failure'])
            }
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
          proc[key] = runCommand(npmClient, targetDir, runArgs)
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
                data: 0
              });
            },
            onFailed: (error) => {
              failure({
                key,
                data: error
              });
            }
          }, { npmClient, runArgs, targetDir, key });
        }
        catch (error) {
          console.log('进行异常')
          failure({
            key,
            data: error,
            result: {
              ...setResultInfo([payload.name, key, taskType, 'failure'])
            }
          });
        }
        break;
      default:
        console.log('其他执行事件')
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
        (async () => {
          const body = {
            id: '5f5088bf3eec6447246e1830',
            taskType: '',
            taskTypeName: '',
            taskState: '',
            taskStateName: '',
          };
          const response = await fetch('http://127.0.0.1:4000/api/project/taskUpdate', {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
          });
          const json = await response.json();

          console.log('接口获取事件', json);
        })();
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
