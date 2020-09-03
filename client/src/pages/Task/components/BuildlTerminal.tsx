import React, { useEffect, useState } from 'react';
import { Button, Space, Modal, Form, Select, Input, Badge } from 'antd';
import { CaretRightOutlined, PauseOutlined, InfoCircleOutlined } from '@ant-design/icons';
import styles from './index.less'
import Terminal from '@/components/Terminal'
import { send } from '@/socket'
// import request  from 'umi-request';
import SockJS from 'sockjs-client';
import { AttachAddon } from 'xterm-addon-attach';
import { getTerminalRefIns, setTerminalRefIns } from '@/utils/terminal.js'

const { Option } = Select

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
  const { title, onAction, projectId, data, npmClients = [] } = props;
  const [isBuildRunning, setBuildRunning] = useState(false);
  const [currentTask, setCurrentTask] = useState();
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const handleControl = (key?: String) => {
    setCurrentTask(key)
    setModalVisible(true)
    form && form.setFieldsValue({
      npmClient: 'npm',
      buildPath: data.buildPath,
      deploySvnPath: data.deploySvnPath,
      deployFilePath: data.deployFilePath,
    })
  }
  const runningTask = (values: object) => {
    // 执行构建命令
    const terminal = getTerminalRefIns('BUILD', projectId);
    if (terminal) {
      terminal.clear(); // 先清空当前命令
      // terminal.write(`${key}`); // 编辑器打印命令
      send({
        type: `@@actions/${currentTask}`,
        payload: {
          ...data, // 里面有当前项目的目录路径
          ...values, // 里面的 buildPath 将被覆盖
        },
        key: projectId,
      }); // 会同时将信息发送到服务端
    }
  }
  // 停止任务
  const cancelTask = () => {

  }
  const handleOk = () => {
    form
      .validateFields()
      .then(values => {
        // runningTask(values)
        if (currentTask === 'BUILD') setBuildRunning(true)
        setModalVisible(false);
      })
      .catch(_ => {
      });
  }
  const handleCancel = () => {
    setModalVisible(false)
  }
  const renderRunningInfo = ({ state }) => {
    if (!state || state === 'INIT') {
      return null;
    }
    const map = {
      ING: {
        status: 'process',
        text: (
          <span>
            {hasError
              ? '启动失败'
              : '启动中...'}
          </span>
        ),
      },
      SUCCESS: {
        status: 'success',
        text: (
          <span>
           构建成功
          </span>
        ),
      },
      FAIL: {
        status: 'error',
        text: <span>构建失败</span>,
      },
    };
    return (
      <div className={styles.runningInfo}>
        <Badge status={map[state].status} />
        <span>{map[state].text}</span>
      </div>
    );
  };

  return <div className={styles.codeColumn}>
    <div className={styles.headerBar}>{title} {data.status === '0' && <span className={'text-warning'} style={{ fontSize: '12px' }}>请先完善配置信息</span>}</div>
    <Space className={styles.actionBar}>
      <Button type={"primary"} onClick={() => handleControl(isBuildRunning ? 'CANCEL' : 'BUILD')}
              disabled={data.status === '0'}
      >
        {isBuildRunning ? (
          <>
            <PauseOutlined />
            <span className={styles.runningText}>
              {' '}停止构建
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
      <Button type={"primary"} onClick={() => handleControl('BUILDAndDEPLOY')} disabled={isBuildRunning || data.status === '0'}><CaretRightOutlined /> 构建并发布</Button>
      <div className={styles.runningInfo}>
        <Badge status="processing" />
        <span>进行中...</span>
      </div>
      <Button type={"primary"} onClick={() => handleControl('TESTCOPY')}>测试</Button>
      <Button>预留菜单配置</Button>
      {/*<Button  onClick={() => setModalVisible(true)}>运行环境配置</Button>*/}
    </Space>
    <Terminal
      // defaultValue={'默认值'}
      onInit={ins => {
        if (ins) {
          window.terminal = ins // 初始到的window
          setTerminalRefIns('BUILD', projectId, ins);
        }
      }}
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
            <Select style={{ width: 140 }}>
              {npmClients.map(key => (
                <Option key={key} value={key}>
                  {key}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label={'构建目录'}
          >
            {/*<InfoCircleOutlined />*/}
            <Form.Item
              noStyle
              name="buildPath"
              initialValue={data.buildPath}
              rules={[{ required: true, message: '请输入构建目录' }]}
            >
              <Input style={{ width: 140 }} />
            </Form.Item>
            <span className="text-warning" style={{ marginLeft: ' 5px' }}> 为空或‘/’时，构建后需部署至根路径</span>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  </div>
}
export default BuildTerminal;
