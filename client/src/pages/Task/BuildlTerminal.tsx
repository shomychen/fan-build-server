import React, { useEffect, useState } from 'react';
import { Button, Space, Steps } from 'antd';
import { CaretRightOutlined, PauseOutlined, InfoCircleOutlined } from '@ant-design/icons';
import styles from './index.less'
import Terminal from '@/components/Terminal/index'
import { send } from '@/socket'
import { getTerminalRefIns, setTerminalRefIns } from '@/utils/terminal.js'
import { useInit } from '@/hooks'
import BuildModal from './components/BuildModal';

const { Step } = Steps;

interface CodeProps {
  /** Layout 类型（项目列表、项目详情，loading 页） */
  // type: 'detail' | 'list' | 'loading';
  // className?: string;
  title?: string;
  // active: 'install' | 'build';
  // actions?: Array<{}>;
  dispatch: any;
  data?: object;
  projectId?: string;
  onAction?: (key?: String) => void,
  npmClients?: Array;
}

const BuildTerminal: React.FC<CodeProps> = (props) => {
  const { title, projectId, data, npmClients = [], dispatch } = props;
  const { taskType, taskState, filePath } = data;
  const [init] = useInit(data);
  // const [isBuildRunning, setBuildRunning] = useState(false);
  const [currentTask, setCurrentTask] = useState();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('环境配置');
  const [log, setLog] = useState('');
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
    if (terminal) {
      // terminal.clear(); // 先清空当前命令
      send({
        type: `@@actions/${currentTask}`,
        payload: {
          ...data, // 里面有当前项目的目录路径
          ...values, // 里面的 buildPath 将被覆盖
        },
        key: projectId,
        taskType: currentTask, // 当前执行任务类型
      }); // 会同时将信息发送到服务端
    }
  }
  const handleOk = (values: object) => {
    console.log('弹窗的表单', values)
    runningTask(values)
    setModalVisible(false);
    // if (currentTask === 'BUILD') setBuildRunning(true)
  }
  const handleCancel = () => {
    setModalVisible(false)
  }

  useEffect(() => {
    if (!init) {
      return () => {
      };
    }
    dispatch({
      type: `task/getTaskDetail`,
      payload: {
        taskType,
        log: true,
        dbPath: filePath,
        key: projectId,
        callback: ({ log }) => {
          console.log('初始化日志', log)
          setLog('需要赋值初始化日志');
        },
      },
    });

    return () => {
      // const terminal = getTerminalRefIns(taskType, projectId);
      // if (terminal) {
      //   terminal.clear();
      // }
    };
  }, [init]);
  useEffect(() => {
    setCurrentTask(data.taskType)
  }, [data])
  // 执行中的任务类型不为INSTALL，也不包括默认DEFUAT且任务状态等于process
  const isBuildRunning = data && data.taskType === 'BUILD' && data.taskState === 'process'; // 构建进行中
  const isTaskRunning = data && ['INSTALL'].indexOf(data.taskType) > -1 && data.taskState === 'process' // 安装包任务执行中
  const isDeployRunning = data && data.taskType === 'DEPLOY' && data.taskState === 'process'; // 发布进行中
  const isBuAndDeRunning = data && data.taskType === 'BUILDANDDEPLOY' && data.taskState === 'process'; // 构建进行中
  return <div className={styles.codeColumn}>
    <div className={styles.headerBar}>
      <span>{title}</span>
      {/*<span className={'text-info'}>当前任务：{data.taskType}当前进度{data.taskState} </span>*/}
      {data.status !== '1' && <span className={'text-warning'} style={{ marginLeft: '5px', fontSize: '12px' }}>请先完善项目配置信息</span>}
      <Steps size="small" current={1} className={styles.actionBarStep}>
        <Step title="构建中" />
        <Step title="发布中" />
        <Step title="部署完成" />
      </Steps>
    </div>

    <Space className={styles.actionBar}>
      <Button type={"primary"} onClick={() => handleControl(isBuildRunning ? 'CANCEL' : 'BUILD', '构建')}
              disabled={data.status !== '1' || isTaskRunning || isDeployRunning}
      >
        {isBuildRunning ? (
          <>
            <PauseOutlined /><span className={styles.runningText}>停止</span>
          </>
        ) : (
          <>
            <CaretRightOutlined /><span className={styles.runningText}>构建</span>
          </>
        )}
      </Button>
      <Button type={"primary"} onClick={() => handleControl(isDeployRunning ? 'CANCEL' : 'DEPLOY', '发布')} disabled={data.status !== '1' || isTaskRunning || isBuildRunning}>
        {isDeployRunning ? (
          <>
            <PauseOutlined />
            <span className={styles.runningText}>停止</span>
          </>
        ) : (
          <>
            <CaretRightOutlined /><span className={styles.runningText}>发布</span>
          </>
        )}</Button>
      <Button>预留菜单配置 </Button>
      <Button type={"primary"} onClick={() => handleControl('TESTCOPY', '测试')}>测试</Button>
      <Button type={"primary"} onClick={() => handleControl('CANCEL', '停止')}>停止</Button>
      <Button type={"primary"} onClick={() => handleControl('BUILDAndDEPLOY', '构建并发布')} disabled={isBuildRunning || data.status !== '1'}><CaretRightOutlined />预留 构建并发布</Button>
    </Space>
    <Terminal
      defaultValue={log}
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
