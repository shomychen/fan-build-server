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

const InstallTerminal: React.FC<InstallProps> = (props) => {
  const { title, onAction, projectId, data, npmClients } = props;
  const [form] = Form.useForm()
  const [modalVisible, setModalVisible] = useState(false);

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
    if (key === 'INSTALL') {
      setModalVisible(true);
      form.setFieldsValue({
        npmClient: 'npm'
      })
    }
    if (key === 'CANCEL') {
      send({
        type: `@@actions/${key}`,
        payload: {
          ...data, // 里面有当前项目的目录路径
        },
        key: projectId,
      });
      onAction && onAction('CANCEL')
    }
  }

  const runningTask = (key?: String, client: string) => {
    // 执行打包命令
    console.log('执行打包命令，参数：', {
      ...data, // 里面有当前项目的目录路径
      npmClient: client
    })
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
      onAction && onAction('INSTALL') // 当前执行项目
    }
  }

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
    >
    </Terminal>
    <Modal
      visible={modalVisible}
      title="环境选择"
      onOk={handleSubmit}
      onCancel={() => setModalVisible(false)}>
      <div className={styles.modalContainer}>
        <Form name="InstallEnv" form={form}>
          <Form.Item
            label={'使用客户端'}
            name="npmClient"
            initialvalue={'npm'}
          >
            <Select style={{ width: 140 }}>
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
export default InstallTerminal;
