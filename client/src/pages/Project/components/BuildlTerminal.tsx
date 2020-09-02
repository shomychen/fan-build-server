import React, { useEffect, useState } from 'react';
import { Button, Space ,Modal, Form, Select, Badge} from 'antd';
import { CaretRightOutlined, PauseOutlined } from '@ant-design/icons';
import styles from './index.less'
import Terminal from '@/components/Terminal'
import SockJS from 'sockjs-client';
import { send } from '@/socket'
// import request  from 'umi-request';
import { AttachAddon } from 'xterm-addon-attach';
import { getTerminalRefIns, setTerminalRefIns } from '@/utils/terminal.js'
const {Option} = Select

interface CodeProps {
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
const BuildTerminal: React.FC<CodeProps> = (props) => {
  const {title, onAction, projectId, data, npmClients=[]} = props;
  const [isTaskRunning, setTaskRunning] = useState(false);
  const [currentTask, setCurrentTask] = useState();
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const handleControl = (key?: String) => {
    setCurrentTask(key)
    setModalVisible(true)
  }
  const runningTask = (npmClient: string)=> {
    // 执行构建命令
    const terminal = getTerminalRefIns('BUILD', projectId);
    if (terminal) {
      terminal.clear(); // 先清空当前命令
      // terminal.write(`${key}`); // 编辑器打印命令
      send({
        type: `@@actions/${currentTask}`,
        payload: {
          npmClient,
          ...data // 里面有当前项目的目录路径
        },
        key: projectId,
      }); // 会同时将信息发送到服务端
    }
  }
  // 停止任务
  const cancelTask = ()=> {

  }
  const [terminalRef, setTerminalRef] = React.useState();
  const [config, setConfig] = useState({})
  const handleInit = async (xterm, fitAddon) => {
    if (!socket) {
      socket = new SockJS('http://localhost:9999/terminal-socket');
      socket.onclose = () => {
        socket = null;
      };
      socket.onmessage = (e) => {
        console.log('接收服务端返回的消息', e)
      };
      /*
      * attach(socket: WebSocket, bidirectional: Boolean, bufferred: Boolean)
       * // socket socoket实例
       * * // bidirectional 终端是否向套接字发送数据
       * * // bufferred 终端是否缓冲输出获得更好的性能
      * */
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
  const handleOk =()=> {
    form
      .validateFields()
      .then(values => {
        runningTask(values.npmClient)
        if (currentTask === 'BUILD') setTaskRunning(true)
        setModalVisible(false);
      })
      .catch(_ => {});
  }
  const handleCancel =()=> {
    setModalVisible(false)
  }
  return <div className={styles.codeColumn}>
    <div className={styles.headerBar}>{title}</div>
    <Space className={styles.actionBar}>
      <Button type={"primary"} onClick={() => handleControl(isTaskRunning ? 'CANCEL' : 'BUILD')}>
        {isTaskRunning ? (
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
              {' '}构建
            </span>
          </>
        )}
      </Button>
      {/*<Button type={"primary"} onClick={() => handleControl('PUSH')}>发布至SVN</Button>*/}
      <Button type={"primary"} onClick={() => handleControl('BUILDAndDEPLOY')}><CaretRightOutlined /> 构建并部署</Button>
      <Button type={"primary"} onClick={() => handleControl('TESTCOPY')}>测试</Button>
      <Button >预留菜单配置</Button>
      {/*<Button  onClick={() => setModalVisible(true)}>运行环境配置</Button>*/}
    </Space>
    <Terminal
      // defaultValue={'默认值'}
      // onInit={handleInit}
      // onResize={handleResize}
      onInit={ins => {
        if (ins) {
          window.terminal = ins
          setTerminalRefIns('BUILD', projectId, ins);
        }
      }}
      config={config}
      // config={{
      //   cursorBlink: true,
      //   disableStdin: false,
      // }}
    >
    </Terminal>
    <Modal
      visible={modalVisible}
      title={'环境配置'}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <div className={styles.modalContainer}>
        <Form name="BuildEnv" form={form}>
          <Form.Item
            label={'使用客户端'}
            name="npmClient"
            initialValue={'npm'}
          >
            <Select style={{ width: 120 }}>
              {npmClients.map(key => (
                <Option key={key} value={key}>
                  {key}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  </div>
}
export default BuildTerminal;
