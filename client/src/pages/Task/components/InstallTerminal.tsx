import React, { useEffect } from 'react';
import { Button, Space } from 'antd';
import { CaretRightOutlined, PauseOutlined, InfoCircleOutlined } from '@ant-design/icons';
import styles from './index.less'
import Terminal from '@/components/Terminal'
import SockJS from 'sockjs-client';
// import request  from 'umi-request';
import { AttachAddon } from 'xterm-addon-attach';
import { getTerminalRefIns, setTerminalRefIns } from '@/utils/terminal.js'

interface CodeProps {
  /** Layout 类型（项目列表、项目详情，loading 页） */
  // type: 'detail' | 'list' | 'loading';
  // className?: string;
  title?: string;
  // active: 'install' | 'build';
  // actions?: Array<{}>;
  data?: object;
  projectId?: string;
  onAction?: (key?: String) => void
}

let socket: any;
const InstallTerminal: React.FC<CodeProps> = (props) => {
  const { title, onAction, projectId, data } = props;
  const { status } = data;
  const handleControl = (key?: String) => {
    socket.send('npm run client:dev' + '\r\n');
    // 执行构建命令
    // socket.send(JSON.stringify({
    //   type: key,
    //   payload: {},
    //   key: projectId,
    //   lang: 'zh-cn',
    //   data,
    // }) + '\r\n'); // 会同时将信息打印到终端
    // terminalRef.write(`${key}`); // 编辑器打印命令
    if (onAction) onAction(key)
  }
  const [terminalRef, setTerminalRef] = React.useState();
  const handleInit = async (xterm, fitAddon) => {
    if (!socket) {
      socket = new SockJS('http://localhost:9999/terminal-socket'); // TODO.发布的时候，需要使用相对路径
      socket.onclose = () => {
        socket = null;
      };
      socket.onmessage = (e) => {
        console.log('接收服务端返回的消息', e)
      };
      console.log('没有时创建 sockjs')
      xterm.loadAddon(new AttachAddon(socket, { bidirectional: false }));
      xterm.focus();
      await handleResize(xterm);
    } else {
      console.log('执行初始化')
      // 执行构建命令
      socket.send(JSON.stringify({
        type: 'getLost',
        payload: {
          msg: '获取历史记录的值'
        },
        key: projectId,
        lang: 'zh-cn'
      }) + '\r\n'); // 会同时将信息打印到终端
      socket.send(setTerminalRefIns('INSTALL', projectId, xterm))
    }

    setTerminalRef(xterm);
    setTerminalRefIns('INSTALL', projectId, xterm); // 存储到全局
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

  // 执行中的任务类型不为INSTALL，也不包括默认DEFUA且任务状态等于process
  const isInstallRunning =  data.taskType === 'INSTALL' && data.taskState === 'process'; // 安装进行中
  const isTaskRunning = isInstallRunning || data.taskType !== 'DEFAULT' ||  data.taskState === 'process'// 其他任务进行中
  console.log(isInstallRunning,  isTaskRunning)
  return <div className={styles.codeColumn}>
    <div className={styles.headerBar}>{title}</div>
    <Space className={styles.actionBar}>
      <Button type={"primary"} onClick={() => handleControl(isInstallRunning ? 'CANCEL' : 'INSTALL')}
              disabled={data.status === '0'}
      >
        {isInstallRunning ? (
          <>
            <PauseOutlined />
            <span className={styles.runningText}>
              {' '}停止
                  </span>
          </>
        ) : (
          <>
            <CaretRightOutlined />
            <span className={styles.runningText}>
              {' '}安装
            </span>
          </>
        )}
      </Button>
    </Space>
    <Terminal
      onInit={ins => {
        if (ins) {
          window.terminal = ins
          setTerminalRefIns('INSTALL', projectId, ins);
        }
      }}
      // defaultValue={'默认值'}
      // onInit={handleInit}
      onResize={handleResize}
      // config={{
      //   cursorBlink: true,
      //   disableStdin: false,
      // }}
    >
    </Terminal></div>
}
export default InstallTerminal;
