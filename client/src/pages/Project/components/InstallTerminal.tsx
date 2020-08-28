import React, { useEffect } from 'react';
import { Button, Space } from 'antd';
import styles from './CodeColumn.less'
import Terminal from '@/components/Terminal'
import SockJS from 'sockjs-client';
// import request  from 'umi-request';
import { AttachAddon } from 'xterm-addon-attach';

interface CodeProps {
  /** Layout 类型（项目列表、项目详情，loading 页） */
  // type: 'detail' | 'list' | 'loading';
  // className?: string;
  title?: string;
  // active: 'install' | 'build';
  // actions?: Array<{}>;
  // data?: object;
  onAction?: (key?: String) => void
}

let socket: any;
const InstallTerminal: React.FC<CodeProps> = (props) => {
  const {title, onAction} = props;
  const handleControl = (key?: String) => {
    // 执行构建命令
    socket.send(`npm run ${key}`); // 会同时将信息打印到终端
    // terminalRef.write(`${key}`); // 编辑器打印命令
    if (onAction) onAction(key)
  }
  const [terminalRef, setTerminalRef] = React.useState();
  const handleInit = async (xterm, fitAddon) => {
    if (!socket) {
      socket = new SockJS('http://localhost:9999/terminal-socket');
      socket.onclose = () => {
        socket = null;
      };
      socket.onmessage = (e) => {
        console.log('接收服务端返回的消息', e)
      };
      xterm.loadAddon(new AttachAddon(socket, {bidirectional: false}));
      xterm.focus();
      await handleResize(xterm);
    }
    setTerminalRef(xterm);
  };
  const handleResize = async xterm => {
    // const { rows, cols } = xterm;
    // console.log('行列变化', rows, cols)
    // try {
    //   await request(`/terminal/resize?rows=${rows}&cols=${cols}`);
    // } catch (e) {
    //   console.error('resize Terminal error', e);
    // }
  };
  useEffect(() => {
    // terminalRef.clear(); // 清空终端
    return () => {
      // if (socket) socket.close(); // 离开后断开连接
      // socket.
      // 销毁终端
      // if (terminalRef) terminalRef.clear(); // 清空终端
      // if (terminalRef) terminalRef.dispose()
    }
  }, [])
  return <div className={styles.codeColumn}>
    <div className={styles.headerBar}>{title}</div>
    <Space className={styles.actionBar}><Button type={"primary"} onClick={() => handleControl('install')}>安装</Button></Space><Terminal
    // defaultValue={'默认值'}
    onInit={handleInit}
    onResize={handleResize}
    // config={{
    //   cursorBlink: true,
    //   disableStdin: false,
    // }}
  >
  </Terminal></div>
}
export default InstallTerminal;
