import React, { useEffect, useState } from "react";
import { Input, Modal, Select, Form } from "antd";
import styles from './index.less';

const { Option } = Select;
const { TextArea } = Input;


interface BuildModalProps {
  title?: string;
  taskType?: string;
  visible?: boolean;
  data?: object;
  projectId?: string;
  onOk?: (value?: object) => void,
  onCancel?: () => void,
  npmClients?: Array;
}

const BuildModal: React.FC<BuildModalProps> = (props) => {
  const { visible, title, onOk, onCancel, data, taskType } = props;
  const [commandDisabled, setCommandDisabled] = useState(false);
  const [form] = Form.useForm()
  useEffect(() => {
    if (visible) {
      form && form.setFieldsValue({
        ...data
      })
    }
  }, [visible])
  const handleOk = () => {
    form
      .validateFields()
      .then(values => {
        onOk && onOk(values)
      })
      .catch(_ => {
      });
  }
  return <Modal
    visible={visible}
    title={title}
    onOk={handleOk}
    onCancel={onCancel}
  >
    <div className={styles.modalContainer}>
      <Form name="BuildEnv" form={form}>

        {/*    <Form.Item
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
          </Form.Item>
          <Form.Item
            label={'是否指定站点'}
            name="target"
          >
            <Radio.Group>
              <Radio value={1}>是</Radio>
              <Radio value={2}>否</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            label={'选择站点'}
          >
          </Form.Item>*/}
        <Form.Item label={'构建目录'} required>
          <Form.Item
            noStyle
            name="buildPath"
            rules={[{ required: true, message: '请输入构建目录' }]}
          >
            <Input style={{ width: 140 }} onChange={(e) => {
              if (e.target.value === '/') {
                form.setFieldsValue({
                  buildCommand: 'build'
                })
                setCommandDisabled(true)
              } else {
                form.setFieldsValue({
                  buildCommand: ''
                })
                if (commandDisabled) setCommandDisabled(false)
              }
            }} />
          </Form.Item>
          <span className="text-warning" style={{ marginLeft: ' 5px' }}> 为‘/’时，构建后需部署至根路径</span>
        </Form.Item>
        <Form.Item label={'构建运行命令'} required>
          <Form.Item
            noStyle
            name="buildCommand"
            rules={[{ required: true, message: '请输入运行命令' }]}
          >
            <Input style={{ width: 140 }} disabled={commandDisabled} />
          </Form.Item>
          <span className="text-warning" style={{ marginLeft: ' 5px' }}> 构建目录为‘/’时，默认命令为'build',</span>
        </Form.Item>
        {
          taskType === 'DEPLOY' ||  taskType === 'BUILDAndDEPLOY' ? <>
            <Form.Item label={'站点目录'}
                       name="deployFilePath"
                       rules={[{ required: true, message: '请输入部署站点目录' }]}>
              <TextArea />
            </Form.Item>
            <Form.Item label={'站点SVN路径'}
                       name="deploySvnPath"
                       rules={[{ required: true, message: '请输入部署站点SVN路径' }]}>
              <TextArea />
            </Form.Item>
            <Form.Item label={'发布运行命令'}
                       name="deployCommand"
                       rules={[{ required: true, message: '请输入发布运行命令' }]}>
                <Input style={{ width: 140 }} />
            </Form.Item>
          </> : null
        }
      </Form>
    </div>
  </Modal>
}

export default BuildModal;
