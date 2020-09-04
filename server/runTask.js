const spawn = require('child_process').spawn;

/**
 *
 * @param npmClient 当前运行客户端（npm,yarn等）
 * @param targetDir 当前执行目录
 * @param runArgs 当前执行命令scripts
 * @param log 日志
 * @param opts 参数配置
 * @return {Promise<void>}
 */

async function runCommand(npmClient, runArgs, targetDir, opts) {
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
      resolve();
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

async function installDeps(npmClient, targetDir, opts) {
  let args = [];

  if (['yarn', 'tyarn', 'ayarn'].includes(npmClient)) {
    args = [];
  } else if (['tnpm', 'npm', 'cnpm', 'pnpm'].includes(npmClient)) {
    args = ['install'];
  }

  await runCommand(npmClient, args, targetDir, opts);
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
async function handleCoreData({ type, payload, key }, { log, send, success, failure, progress }, connection) {
  console.log('调用相关执行action', type, key)
  // console.log('调用相关执行action - 参数', payload)
  if (type.startsWith('@@actions')) {
    let targetDir = payload.filePath || process.cwd()
    let npmClient = payload.npmClient || 'npm'
    switch (type) {
      // 构建
      case '@@actions/BUILD':
        try {
          if (payload.buildCommand) {
            console.log('TODO,没有执行命令，则不执行');
          }
          let runArgs = ['run', payload.buildCommand]  // 构建目录配置为空或者 '/'时，执行npm run build，打包产物需要部署到根目录
          console.log('执行命令', runArgs)
          await runCommand(npmClient, runArgs, targetDir, {
            onData: (data) => {
              console.log('返回的进程日志', data)
              progress({
                data
              })
            }
          })

          success({
            data: 0,
            result: {
              ...setResultInfo([payload.name, key, 'BUILD', '构建', 'success', '成功'])
            }
          });
        }
        catch (error) {
          failure({
            data: error,
            result: {
              ...setResultInfo([payload.name, key, 'BUILD', '构建', 'failure', '失败'])
            }
          });
        }
        break;
      case '@@actions/BUILDAndDEPLOY':
        try {
          const runArgs = ['run', 'build']
          await runCommand({ targetDir, npmClient, runArgs }, { log, send, success, failure, progress })
        }
        catch (e) {
          console.log('child error', e)
        }
        break;
      // 部署/发布
      case '@@actions/DEPLOY':
        try {
          const runArgs = ['run', 'build']
          await runCommand({ targetDir, npmClient, runArgs }, { log, send, success, failure, progress })
        }
        catch (e) {
          console.log('child error', e)
        }
        break;
      // 取消当前执行的任务
      case '@@actions/CANCEL':

        break;
      // 安装依赖包
      case '@@actions/INSTALL':
        console.log('执行安装包命令')
        try {
          targetDir = 'D:\\Workerspace\\github\\umi-ui\\projectA' // 暂时使用其他目录
          await installDeps(npmClient, targetDir, {
            onData: (data) => {
              progress({
                data
              })
            }
          })
          success({
            data: 0,
            msg: '安装成功'
          });
        }
        catch (error) {
          failure({
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
          console.log('执行命令', runArgs)
          await runCommand(npmClient, runArgs, targetDir, {
            onData: (data) => {
              console.log('返回的进程日志', data)
              progress({
                data
              })
            }
          })
          success({
            data: 0,
            result: {
              ...setResultInfo([payload.name, key, 'BUILD', '构建', 'success', '成功'])
            }
          });
        }
        catch (error) {
          failure({
            data: error,
            result: {
              ...setResultInfo([payload.name, key, 'BUILD', '构建', 'failure', '失败'])
            }
          });
        }
        break;

      default:
        break
    }
  } else {
    console.log('执行其他相关的事件', type)
  }
}

module.exports = handleCoreData
