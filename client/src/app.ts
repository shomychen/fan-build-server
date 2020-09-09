import { init as initSocket, callRemote, listenRemote } from './socket';
import { message, notification } from "antd";
import { getDvaApp } from 'umi';
import { getTerminalRefIns } from './utils/terminal.js'

// import SockJS from 'sockjs-client';// 推送监听
// import { getTerminalRefIns } from './pages/Project/components/terminal.js'

// import debug from '@/debug';
import debug from 'debug';

const _log = debug('init');
// 获取任务类型，如： @@action/TESTCOPY 返回 TESTCOPY
const getResultTaskType = (actionName: string) => {
  return actionName.substring(actionName.lastIndexOf('/') + 1)
}

export async function render(oldRender): void {
  console.log('执行入口，Init Socket Connection 初始化sockjs连接 监听\'/page-socket\'')
  // Init Socket Connection 初始化sockjs连接 监听'/page-socket'
  try {
    await initSocket({
      onMessage({ type, payload }) {
        // 任务相关执行事件
        if (type.startsWith('@@actions')) {
          const status = type.substring(type.lastIndexOf('/') + 1); // 执行状态有 ’/process','/success','/failure'结尾
          console.log('推送action类型', type, '状态', status, '回传参数', payload)
          const taskType = getResultTaskType(type.substring(0, type.lastIndexOf('/')))
          console.log(taskType)
          let terminal;
          if (['TESTCOPY', 'BUILD', 'BUILDAndDEPLOY', 'DEPLOY'].indexOf(taskType) > -1) {
            terminal = getTerminalRefIns('BUILD', payload.key)  // 判断推送至该项目的“构建发布的终端显示
          } else {
            terminal = getTerminalRefIns(taskType, payload.key)
          }
          if (['progress', 'success', 'failure'].indexOf(status) > -1) {
            if (status === 'success') {
              console.log('执行成功：success', payload)
              terminal && terminal.write(`\r\n Process finished with exit code ${payload.data}`) // 需要替换下执行的命令行
            }
            if (status === 'failure') {
              console.log('命令执行失败：failure', payload)
              terminal && terminal.write(`\r\n\x1b[31m[ERROR]\x1b[39m ${payload.data.replace(/\n/g, '\r\n')}`)
            }
            // 执行成功或失败
            if (status === 'failure' || status === 'success') {
              // 原来window.g_app._store 需要用 getDvaApp() 替换 TODO，状态更新调整至服务端更新，避免连接关闭
              // getDvaApp()._store.dispatch({
              //   type: 'task/updateRunTaskResult',
              //   payload: payload.result,
              // });
              // const { taskTypeName, taskStateName, projectName } = payload.result;
              // notification[status === 'success' ? 'success' : 'error']({
              //   message: `${taskTypeName}${taskStateName}`,
              //   description: `${projectName}项目任务执行结果`,
              //   duration: 8
              // })
            }
            if (status === 'progress') {
              // let str = new TextDecoder().decode(payload.payload);
              console.log('命令执行中：progress', payload.data)
              terminal && terminal.write(`\r\n ${payload.data.replace(/\n/g, '\r\n')}`)
            }
          }
          if (type.indexOf('/cancel') !== -1) {
            console.log('执行取消相关操作，更新')
          }
        } else {
          console.log('其他任务执行事件',type,payload)
        }
      },
    });
    console.log('Init socket success')
    // _log('Init socket success');
  } catch (e) {
    console.error('Init socket failed', e);
  }
  try {
    const { data } = callRemote({ type: '@@project/taskList' });
    console.log('data', data)
  }
  catch (e) {
    console.log(e)
  }
  try {
    listenRemote({
      type: '@@task/state/update',
      onMessage: ({ result, status }) => {
        console.log('监听 @@task/state/update', result)
        // 更新 state 数据
        getDvaApp()._store.dispatch({
          type: 'task/updateRunTaskResult',
          payload: { ...result },
        });
        const { taskTypeName, taskStateName, projectName } = result;
        if (status !== 'process') {
          notification[status]({
            message: `${taskTypeName}${taskStateName}`,
            description: `${projectName}项目任务执行结果`,
            duration: 8
          })
        }
      },
    });
  }
  catch (e) {
    console.log(e)
  }

  oldRender();
  // console.log('当前已 初始化的，currentSockRemote', currentSockRemote())
}
