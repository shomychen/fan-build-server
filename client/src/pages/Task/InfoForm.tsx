import React, { useEffect } from "react";
import { Button, Input, Form, Row, Col } from "antd";
import styles from './index.less'

const { TextArea } = Input;

interface InfoFormProps {
  // className?: string;
  title?: string;
  data?: object;
  projectId?: string;
  onAction?: (key?: String) => void
}

const InfoForm: React.FC<InfoFormProps> = (props) => {
  const { title, data, onAction } = props;
  const [form] = Form.useForm();
  const onFinish = (values: object) => {
    if (onAction) onAction(values)
  }
  const renderLabel = (name: string, desc: string) => {
    return <div className={styles.controlLable}>
      <div className={styles.title}>{name}</div>
      <div className={styles.description}>{desc}</div>
    </div>
  }
  useEffect(() => {
    form && form.setFieldsValue(data)
  }, [data])
  return <div className={styles.configColumn}>
    <div className={styles.headerBar}>{title}</div>
    <Form layout="vertical" name="config-controls" form={form}
          onFinish={onFinish}>
      <Row gutter={20}>
        <Col xs={24} xl={12}>
          <div className={styles.configGroup}>
            <h2>基础配置</h2>
            <Form.Item name="siteTitle" className={styles.configGroupItem}
                       rules={[{ required: true, message: '请输入站点名称' }]}
                       label={renderLabel('siteTitle 站点名称', '用于页面默认标题设置')}>
              <Input placeholder="请输入" style={{ maxWidth: '410px' }} />
            </Form.Item>
            <Form.Item name="localStorageName"
                       className={styles.configGroupItem}
                       rules={[{ required: true, message: '资源名称' }]}
                       label={renderLabel('资源名称', '资源名称用于存储在本地localStorage相关配置')}>
              <Input placeholder="请输入" style={{ maxWidth: '410px' }} />
            </Form.Item>
            <Form.Item name="filePath"
                       rules={[{ required: true, message: '项目目录' }]}
                       label={renderLabel('项目目录', '当前项目所处的文件目录位置')}
                       className={styles.configGroupItem}>
              <TextArea placeholder="请输入" style={{ maxWidth: '410px' }} />
            </Form.Item>
            <Form.Item name="svnPath"
                       rules={[{ required: true, message: '项目SVN地址' }]}
                       label={renderLabel('项目SVN地址', '当前项目所在的SVN地址')}
                       className={styles.configGroupItem}>
              <TextArea placeholder="请输入" style={{ maxWidth: '410px' }} />
            </Form.Item>
            <Form.Item name="envTestUrl"
                       label={renderLabel('测试环境', '测试环境站点地址')}
                       className={styles.configGroupItem}>
              <Input placeholder="请输入" style={{ maxWidth: '410px' }} />
            </Form.Item>
            <Form.Item name="envProUrl"
                       label={renderLabel('正式环境', '正式环境站点地址')}
                       className={styles.configGroupItem}>
              <Input placeholder="请输入" style={{ maxWidth: '410px' }} />
            </Form.Item>
            <Form.Item name="themeColor" label={renderLabel('主题色', '预留 - 站点主题风格色值')} className={styles.configGroupItem}>
              <Input placeholder="请输入" style={{ maxWidth: '410px' }} disabled />
            </Form.Item>
            <Form.Item name="logo" label={renderLabel('LOGO', '预留站点LOGO')} className={styles.configGroupItem}>
              <Input placeholder="需替换文件上传控件" style={{ maxWidth: '410px' }} disabled />
            </Form.Item>
            <Form.Item name="logoName" label={renderLabel('LOGO标题', '预留 - 站点LOGO描述')} className={styles.configGroupItem}>
              <Input placeholder="请输入" style={{ maxWidth: '410px' }} disabled />
            </Form.Item>
            <Form.Item name="favicon" label={renderLabel('favicon', '预留 - 网站在浏览器上缩略标志')} className={styles.configGroupItem}>
              <Input placeholder="需替换文件上传控件" style={{ maxWidth: '410px' }} disabled />
            </Form.Item>
          </div>
        </Col>
        <Col xs={24} xl={12}>
          <div className={styles.configGroup}>
            <h2>构建及部署配置<span className="text-info">[需要考虑可能有多个部署站点]</span></h2>
            <Form.Item name="buildPath" label={renderLabel('构建目录 buildPath', '设置路由前缀，用于打包及部署到指定目录（设置为 / 则打包后需部署至根目录，否则部署至对应的非根目录）')}
                       rules={[{ required: true, message: '请输入构建目录' }]}
                       className={styles.configGroupItem}>
              <Input placeholder="请输入" style={{ maxWidth: '410px' }} />
            </Form.Item>
            <Form.Item name="buildCommand" label={renderLabel('执行命令', '构建执行的命令')}
                       // rules={[{ required: true, message: '请输入执行命令' }]}
                       className={styles.configGroupItem}>
              <Input placeholder="请输入" style={{ maxWidth: '410px' }} />
            </Form.Item>
            <Form.Item name="deploySvnPath" label={renderLabel('部署站点SVN地址', '项目发布到站点所在的SVN地址')}
                       rules={[{ required: true, message: '请输入部署站点SVN地址' }]}
                       className={styles.configGroupItem}>
              <TextArea placeholder="请输入" style={{ maxWidth: '410px' }} />
            </Form.Item>
            <Form.Item name="deployFilePath" label={renderLabel('部署站点目录', '部署站点SVN文件载入到本地目录')}
                       rules={[{ required: true, message: '请输入部署站点目录' }]}
                       className={styles.configGroupItem}>
              <TextArea placeholder="请输入" style={{ maxWidth: '410px' }} />
            </Form.Item>
          </div>
        </Col>
      </Row>
      <div className={"toolbarControl"}>
        <Button type="primary" htmlType="submit" disabled={data.taskState  === 'process'}>
          保存
        </Button>
      </div>
    </Form>
  </div>
}

export default InfoForm;
