import { init as initSocket, callRemote, currentSockRemote } from './socket';
import { getTerminalRefIns } from './pages/Project/components/terminal.js'

// import debug from '@/debug';
import debug from 'debug';

const _log = debug('init');

export async function render(oldRender): void {
  console.log('执行入口，Init Socket Connection 初始化sockjs连接 监听\'/page-socket\'')
  // Init Socket Connection 初始化sockjs连接 监听'/umiui'
  try {
    await initSocket({
      onMessage({type, payload}) {
        console.log('客户端接收服务端信息', type, payload)
        // getTerminalRefIns()
        // if (type === '@@actions/BUILD/success' && payload) {
        //   const terminal = getTerminalRefIns('BUILD', payload)
        //   console.log('获取到terminal烤瓷冠', payload,  window.termianl)
        //   // 组件内部赋值
        //   if ( window.terminal) {
        //     window.terminal.write(`\r\n\x1b[90m[LOG]\x1b[0m ${JSON.stringify(payload)}`)
        //   }
        // }
        if (type.indexOf('/success') !== -1 || type.indexOf('/failure') !== -1  && window.terminal) {
          window.terminal.write(`\r\n\x1b[90m[${type.indexOf('/success') !== -1 ? 'LOG': 'ERROR'}]\x1b[0m ${JSON.stringify(payload)}`)
        }

        if (window.terminal) {
        }
        if (type === '@@core/log') {
          console.log(window.xterm)
          window?.xterm?.writeln?.(`\x1b[90m[LOG]\x1b[0m ${payload}`);
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

  console.log('当前已 初始化的，currentSockRemote', currentSockRemote())
  oldRender();
}
