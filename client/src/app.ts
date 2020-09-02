import { init as initSocket, callRemote, currentSockRemote } from './socket';
import {message} from "antd";
// import { getTerminalRefIns } from './pages/Project/components/terminal.js'

// import debug from '@/debug';
import debug from 'debug';

const _log = debug('init');

export async function render(oldRender): void {
  console.log('执行入口，Init Socket Connection 初始化sockjs连接 监听\'/page-socket\'')
  // Init Socket Connection 初始化sockjs连接 监听'/umiui'
  try {
    await initSocket({
      onMessage({type, payload}) {
        if (type.indexOf('/progress') !== -1 || type.indexOf('/success') !== -1 || type.indexOf('/failure') !== -1  && window.terminal) {
          if (type.indexOf('/success') !== -1) {
            console.log('success', payload.data)
            if (payload.data === '0') {
              message.success('构建成功')
            }
            window.terminal.write(`\r\n Process finished with exit code ${payload.data.replace(/\n/g, '\r\n')}`)
          }
          if (type.indexOf('/failure') !== -1) {
            console.log('failure', payload.data)
            window.terminal.write(`\r\n\x1b[31m[ERROR]\x1b[39m ${payload.data.replace(/\n/g, '\r\n')}`)
          }
          if (type.indexOf('/progress') !== -1) {
            // let str = new TextDecoder().decode(payload.payload);
            console.log('progress', payload.data)
            window.terminal.write(`\r\n ${payload.data.replace(/\n/g, '\r\n')}`)
          }
        }
      },
    });
    console.log('Init socket success')
    // _log('Init socket success');
  } catch (e) {
    console.error('Init socket failed', e);
  }
  try {
    const {data} = callRemote({type: '@@project/list'});
    console.log('data', data)
  }
  catch (e) {
    console.log(e)
  }

  // console.log('当前已 初始化的，currentSockRemote', currentSockRemote())
  oldRender();
}
