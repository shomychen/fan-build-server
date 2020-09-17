import { init as initSocket, callRemote, listenRemote } from './socket';
import { message, notification } from "antd";
import { getDvaApp } from 'umi';
// import { getTerminalRefIns } from './utils/terminal.js'

// import SockJS from 'sockjs-client';// 推送监听
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
        // 任务相关执行事件 TODO。执行终端打印需要放到model内监听事件处理
        if (type.startsWith('@@actions')) {
          const status = type.substring(type.lastIndexOf('/') + 1); // 执行状态有 ’/process','/success','/failure'结尾
          /* console.log('推送action类型', type, '状态', status, '回传参数', payload)
         const taskType = getResultTaskType(type.substring(0, type.lastIndexOf('/')))
           console.log(taskType, '项目ID：',payload.key)
         let terminal;
         if (['TESTCOPY', 'BUILD', 'BUILDAndDEPLOY', 'DEPLOY'].indexOf(taskType) > -1) {
           terminal = getTerminalRefIns('BUILD', payload.key)  // 判断推送至该项目的“构建发布的终端显示
         } else {
           terminal = getTerminalRefIns(taskType, payload.key) // 任务类型为 INSTALL
         }*/
          /*   if (['progress', 'success', 'failure'].indexOf(status) > -1) {
            if (status === 'success' || status === 'progress') {
                 console.log(status === 'success' ? '执行成功：success' : '命令执行中：progress', payload)
                 terminal && terminal.write(`\r\n ${payload.log.replace(/\n/g, '\r\n')}`)
               }
               if (status === 'failure') {
                 console.log('命令执行失败：failure', payload)
                 terminal && terminal.write(`\r\n\x1b[31m[ERROR]\x1b[39m ${payload.log.replace(/\n/g, '\r\n')}\n`)
               }
          }*/
          if (type.indexOf('/cancel') !== -1) {
            console.log('执行取消相关操作，更新')
          }
        } else {
          // console.log('其他非\'@@actions\'开头任务执行事件', type, payload)
        }
      },
    });
    console.log('Init socket success')
    // _log('Init socket success');
  } catch (e) {
    console.error('Init socket failed', e);
  }
  oldRender();

  try {
    const result = await callRemote({ type: '@@project/getList' });
    console.log('@@project/getList ==> data', result)
  }
  catch (e) {
    console.log(e)
  }
  try {
    // 监听任务状态更新
    listenRemote({
      type: '@@tasks/state/update',
      onMessage: ({ result, status, errorLog }) => {
        console.log('监听 @@task/state/update', result, '返回状态：', status)
        // 更新 state 数据
        getDvaApp()._store.dispatch({
          type: 'task/updateRunTaskResult',
          payload: { ...result},
        });
        const { taskTypeName, taskStateName, projectName, errorInfo } = result;
        if (status === 'init') {
          if (errorLog) message.error(errorLog)
        } else if (status !== 'process') {
          notification[status]({
            message: `${projectName} - ${taskTypeName}${taskStateName}`,
            description: status === 'error' ? errorInfo : ``,
            duration: 8
          })
        }
      },
    });
  }
  catch (e) {
    console.log(e)
  }
  /*  try {
      listenRemote({
        type: '@@connect/info',
        onMessage: (connId) => {
          console.log('监听 @@connect/info', connId)
        },
      });
    }
    catch (e) {
      console.log(e)
    }*/
}
