const spawn = require('child_process').spawn;

/**
 *
 * @param cwd 当前执行目录
 * @param npmClient 当前运行客户端（npm,yarn等）
 * @param runArgs 当前执行命令scripts
 * @param log 日志
 * @param send 发送消息到服务端,sockjs的.send相关方法
 * @param success  // 发送消息到服务端==>执行成功
 * @param failure  // 发送消息到服务端==>执行失败
 * @param progress // 发送消息到服务端==>执行中
 * @return {Promise<void>}
 */

async function runCommand({ cwd, npmClient, runArgs }, { log, send, success, failure, progress }) {
  const child = spawn(process.platform === 'win32' ? `${npmClient}.cmd` : npmClient, [...runArgs], {
    cwd
  })
  // 成功执行，并按流方式打印
  child.stdout.on('data', buffer => {
    // console.log(`spawn  stdout: ${buffer}`) // 返回类型为 buffer
    progress({
      data: buffer.toString()
    })
  })
  child.stderr.on('data', data => {
    // console.log(`spawn stderr: ${data}`)
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
    // console.log(JSON.stringify(code))
    failure({
      data: code.toString()
    })
  })
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
  console.log('调用相关执行action - 参数', payload)
  let cwd = payload.filePath || process.cwd()
  let npmClient = payload.npmClient || 'npm'
  switch (type) {
    case '@@actions/BUILD':
      try {
        const runArgs = ['run', 'build']
        await runCommand({ cwd, npmClient, runArgs }, { log, send, success, failure, progress })
      }
      catch (e) {
        console.log('child error', e)
      }
      break;
    case '@@actions/BUILDAndDEPLOY':
      try {
        const runArgs = ['run', 'build']
        await runCommand({ cwd, npmClient, runArgs }, { log, send, success, failure, progress })
      }
      catch (e) {
        console.log('child error', e)
      }
      break;
    // 取消当前执行的任务
    case '@@actions/CANCEL':
      break;
    case '@@actions/TESTCOPY':
      cwd = 'D:\\Workerspace\\svn\\webdesign\\trunk\\library\\basic-manage-2.0'
      npmClient = 'npm'
      await runCommand({ cwd, npmClient, runArgs: ['run', 'test:copy'] }, { log, send, success, failure, progress })
      break;

    default:
      break
  }
}

module.exports = handleCoreData
