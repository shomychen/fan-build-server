import React, { useEffect, useState } from 'react';
import { Button, Space, Modal, Form, Select } from 'antd';
import { CaretRightOutlined, PauseOutlined, InfoCircleOutlined } from '@ant-design/icons';
import styles from './index.less'
import Terminal from '@/components/Terminal/index'
import SockJS from 'sockjs-client';
import { send } from '@/socket'
import { AttachAddon } from 'xterm-addon-attach';
import { getTerminalRefIns, setTerminalRefIns } from '@/utils/terminal.js'

const { Option } = Select;

interface InstallProps {
  /** Layout 类型（项目列表、项目详情，loading 页） */
  // type: 'detail' | 'list' | 'loading';
  // className?: string;
  title?: string;
  // active: 'install' | 'build';
  // actions?: Array<{}>;
  data?: object;
  projectId?: string;
  onAction?: (key?: String) => void,
  npmClients?: Array;
}

let socket: any;
const InstallTerminal: React.FC<InstallProps> = (props) => {
  const { title, onAction, projectId, data, npmClients } = props;
  const [form] = Form.useForm()
  const [modalVisible, setModalVisible] = useState(false);
  const [terminalRef, setTerminalRef] = React.useState();

  const handleSubmit = (values: object) => {
    form
      .validateFields()
      .then(values => {
        runningTask('INSTALL', values.npmClient)
      })
      .catch(_ => {
      });
    setModalVisible(false);
  }
  const handleControl = (key?: String) => {
    if (key === 'INSTALL') setModalVisible(true);
    if (key === 'CANCEL') {
      send({
        type: `@@actions/${key}`,
        payload: {
          ...data, // 里面有当前项目的目录路径
        },
        key: projectId,
      });
    }
  }

  const runningTask = (key?: String, client: string) => {
    // 执行打包命令
    const terminal = getTerminalRefIns('INSTALL', projectId);
    if (terminal) {
      terminal.clear(); // 先清空当前命令
      send({
        type: `@@actions/${key}`,
        payload: {
          ...data, // 里面有当前项目的目录路径
          npmClient: client
        },
        key: projectId,
      }); // 会同时将信息发送到服务端
    }
  }
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

  // 执行中的任务类型不为INSTALL，也不包括默认DEFUAT且任务状态等于process
  const isInstallRunning = data && data.taskType === 'INSTALL' && data.taskState === 'process'; // 安装进行中
  const isTaskRunning = data && ['BUILD', 'DEPLOY'].indexOf(data.taskType) > -1 && data.taskState === 'process' // 其他任务执行中

  return <div className={styles.codeColumn}>
    <div className={styles.headerBar}>{title}</div>
    <Space className={styles.actionBar}>
      <Button type={"primary"} onClick={() => handleControl(isInstallRunning ? 'CANCEL' : 'INSTALL')}
              disabled={isTaskRunning}
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
    </Terminal>
    <Modal
      visible={modalVisible}
      title={'环境选择'}
      onOk={handleSubmit}
      onCancel={() => setModalVisible(false)}>
      <div className={styles.modalContainer}>
        <Form name="InstallEnv" form={form}>
          <Form.Item
            label={'使用客户端'}
            name="npmClient"
          >
            <Select style={{ width: 140 }}>
              {npmClients.map(key => (
                <Option key={key} value={key}>
                  {key}
                </Option>
              ))}
            </Select>
          </Form.Item></Form>
      </div>
    </Modal>
  </div>
}
export default InstallTerminal;
