import React, { useEffect } from 'react';
import { Button, Space } from 'antd';
import styles from './CodeColumn.less'
import Terminal from '@/components/Terminal'
import SockJS from 'sockjs-client';
// import request  from 'umi-request';
import { AttachAddon } from 'xterm-addon-attach';
import InstallTerminal from './InstallTerminal'
import BuildlTerminal from './BuildlTerminal'

interface CodeProps {
  /** Layout 类型（项目列表、项目详情，loading 页） */
  // type: 'detail' | 'list' | 'loading';
  className?: string;
  title?: string;
  active: 'install' | 'build';
  actions?: Array<{}>;
  data?: object;
  onAction?: (key?: String) => void
}

let socket: any;
const CodeColumn: React.FC<CodeProps> = (props) => {
  const {active, title, actions = [], onAction} = props;
  const handleControl = (key?: String) => {
    // 执行构建命令
    socket.send(`npm run ${key}`); // 会同时将信息打印到终端
    // terminalRef.write(`${key}`); // 编辑器打印命令
    console.log(key , active)
    if (onAction) onAction(key)
  }
  const [terminalRef, setTerminalRef] = React.useState();
  const handleInit = async (xterm, fitAddon) => {
    if (!socket) {
      socket = new SockJS('http://localhost:9999/terminal-socket');
      socket.onclose = () => {
        socket = null;
      };
      xterm.loadAddon(new AttachAddon(socket, {bidirectional: false}));
      xterm.focus();
      await handleResize(xterm);
    }
    setTerminalRef(xterm);
  };
  const handleResize = async xterm => {
    // const { rows, cols } = xterm;
    // try {
    //   await request(`/terminal/resize?rows=${rows}&cols=${cols}`);
    // } catch (e) {
    //   console.error('resize Terminal error', e);
    // }
  };
  useEffect(() => {
    console.log('渲染变化了吗', )
    // terminalRef.clear(); // 清空终端
    return () => {
      // socket.
      // 销毁终端
      if (terminalRef) terminalRef.clear(); // 清空终端
      // if (terminalRef) terminalRef.dispose()
    }
  }, [])
  return <div className={styles.codeColumn}>
    <div className={styles.headerBar}>{title}</div>
    <Space className={styles.actionBar}>
      {
        active === 'build' ? <>
            <Button type={"primary"} onClick={() => handleControl('build')}>构建</Button>
            <Button type={"primary"} onClick={() => handleControl('buildAndPush')}>构建并发布</Button></>
          : <Button type={"primary"} onClick={() => handleControl('install')}>安装</Button>
      }</Space>
    {
      active === 'build' ? <BuildlTerminal/> : <InstallTerminal/>
    }
  </div>
}
export default CodeColumn;
