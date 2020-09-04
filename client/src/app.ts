import { init as initSocket, callRemote, currentSockRemote } from './socket';
import { message, notification} from "antd";
import { getDvaApp } from 'umi';
// import { getTerminalRefIns } from './pages/Project/components/terminal.js'

// import debug from '@/debug';
import debug from 'debug';

const _log = debug('init');

export async function render(oldRender): void {
  oldRender();
  console.log('执行入口，Init Socket Connection 初始化sockjs连接 监听\'/page-socket\'')
  // Init Socket Connection 初始化sockjs连接 监听'/page-socket'
  try {
    await initSocket({
      onMessage({ type, payload }) {
        console.log('推送action类型', type)
        if (type.indexOf('/progress') !== -1 || type.indexOf('/success') !== -1 || type.indexOf('/failure') !== -1 && window.terminal) {
          if (type.indexOf('/success') !== -1) {
            console.log('执行成功：success', payload)
            // 原来window.g_app._store 需要用 getDvaApp() 替换
            getDvaApp()._store.dispatch({
              type: 'task/updateRunTaskResult',
              payload: payload.result,
            });
            const {taskTypeName, taskStateName, projectName} = payload.result;
            notification.success({
              message: `${taskTypeName}${taskStateName}` ,
              description: `${projectName}项目任务执行结果`,
              duration: 8
            })
            window.terminal.write(`\r\n Process finished with exit code ${payload.data}`)
          }
          if (type.indexOf('/failure') !== -1) {
            console.log('命令执行失败：failure', payload)
            window.terminal.write(`\r\n\x1b[31m[ERROR]\x1b[39m ${payload.data.replace(/\n/g, '\r\n')}`)
          }
          if (type.indexOf('/progress') !== -1) {
            // let str = new TextDecoder().decode(payload.payload);
            console.log('progress', payload.data)
            window.terminal.write(`\r\n ${payload.data.replace(/\n/g, '\r\n')}`)
          }
        }
        if (type.indexOf('/cancel') !== -1) {
          console.log('执行取消相关操作，更新')
        }
      },
    });
    console.log('Init socket success')
    // _log('Init socket success');
  } catch (e) {
    console.error('Init socket failed', e);
  }
  try {
    const { data } = callRemote({ type: '@@project/list' });
    console.log('data', data)
  }
  catch (e) {
    console.log(e)
  }

  // console.log('当前已 初始化的，currentSockRemote', currentSockRemote())
}
