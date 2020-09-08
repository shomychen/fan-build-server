import React, { useEffect, useState } from 'react';
import { Button, Space, Modal, Form, Select, Input, Badge, Steps } from 'antd';
import { CaretRightOutlined, PauseOutlined, InfoCircleOutlined } from '@ant-design/icons';
import styles from './index.less'
import Terminal from '@/components/Terminal/index'
import { send } from '@/socket'
import { getTerminalRefIns, setTerminalRefIns } from '@/utils/terminal.js'
import BuildModal from './components/BuildModal';
import { currentSockRemote } from '../../socket';

const { Option } = Select
const { Step } = Steps;

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
  const { taskType, taskState } = data;
  // const [isBuildRunning, setBuildRunning] = useState(false);
  const [currentTask, setCurrentTask] = useState();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('环境配置');
  const handleControl = (key?: String, name ?: String) => {
    setCurrentTask(key)
    if (key === 'CANCEL') {
      console.log('需要执行取消操作')
      send({
        type: `@@actions/${'CANCEL'}`,
        payload: {
          ...data, // 里面有当前项目的目录路径
        },
        key: projectId,
        taskType: currentTask, // 当前执行任务类型
      }); // 会同时将信息发送到服务端
    } else {
      setModalVisible(true)
      setModalTitle(`${name}环境配置`)
    }
  }
  const runningTask = (values: object) => {
    // 执行构建命令
    const terminal = getTerminalRefIns('BUILD', projectId);
    console.log(terminal, currentTask)
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
        taskType: currentTask, // 当前执行任务类型
      }); // 会同时将信息发送到服务端
      console.log('有执行下来吗') // TODO启动进程后才执行更新任务状态
      onAction && onAction(currentTask) // 当前执行项目
    }
  }
  const handleOk = (values: object) => {
    console.log('弹窗的表单',  values )
    runningTask(values)
    setModalVisible(false);
    // if (currentTask === 'BUILD') setBuildRunning(true)
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

  useEffect(() => {
    setCurrentTask(data.taskType)
  }, [data])
  // 执行中的任务类型不为INSTALL，也不包括默认DEFUAT且任务状态等于process
  const isBuildRunning = data && data.taskType === 'BUILD' && data.taskState === 'process'; // 构建进行中
  const isTaskRunning = data && ['INSTALL'].indexOf(data.taskType) > -1 && data.taskState === 'process' // 安装包任务执行中
  const isDeployRunning = data && data.taskType === 'DEPLOY' && data.taskState === 'process'; // 发布进行中
  const isBuAndDeRunning = data && data.taskType === 'BUILDANDDEPLOY' && data.taskState === 'process'; // 构建进行中
  console.log('isTaskRunning', isTaskRunning, 'isDeployRunning', isDeployRunning,'isBuAndDeRunning:', isBuAndDeRunning)
  return <div className={styles.codeColumn}>
    <div className={styles.headerBar}>
      <span>{title}</span>
      <span className={'text-info'}>当前任务：{data.taskType}当前进度{data.taskState} </span>
      {data.status === '0' && <span className={'text-warning'} style={{ fontSize: '12px' }}>请先完善配置信息</span>}
      <Steps size="small" current={1} className={styles.actionBarStep}>
        <Step title="构建中" />
        <Step title="发布中" />
        <Step title="部署完成" />
      </Steps>
    </div>

    <Space className={styles.actionBar}>
      <Button type={"primary"} onClick={() => handleControl(isBuildRunning ? 'CANCEL' : 'BUILD', '构建')}
              disabled={data.status === '0' || isTaskRunning || isDeployRunning}
      >
        {isBuildRunning ? (
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
      <Button type={"primary"} onClick={() => handleControl(isDeployRunning ? 'CANCEL' : 'DEPLOY',  '发布')} disabled={data.status === '0' || isTaskRunning || isBuildRunning}>
        {isDeployRunning ? (
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
              {' '}发布
            </span>
          </>
        )}</Button>
      <Button>预留菜单配置</Button>
      <Button type={"primary"} onClick={() => handleControl('TESTCOPY', '测试')}>测试</Button>
      <Button type={"primary"} onClick={() => handleControl('CANCEL', '停止')}>停止</Button>
      <Button type={"primary"} onClick={() => handleControl('BUILDAndDEPLOY', '构建并发布')} disabled={isBuildRunning || data.status === '0'}><CaretRightOutlined />预留 构建并发布</Button>
    </Space>
    <Terminal
      // defaultValue={'默认值'}
      onInit={ins => {
        if (ins) {
          // window.terminal = ins // 初始到的window
          setTerminalRefIns('BUILD', projectId, ins);
        }
      }}
      // config={{
      //   cursorBlink: true,
      //   disableStdin: false,
      // }}
    >
    </Terminal>
    <BuildModal
      visible={modalVisible}
      title={modalTitle}
      onOk={handleOk}
      onCancel={handleCancel}
      data={data}
      npmClients={npmClients}
      taskType={currentTask}
    />
  </div>
}
export default BuildTerminal;
