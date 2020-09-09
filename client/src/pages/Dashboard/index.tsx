import React, { useEffect, useState } from 'react';
import { Button, Row, Col, Card, Spin, Tooltip, Typography, Badge, Popconfirm, Input, Modal, Form, Tag , message } from 'antd';

const { Meta } = Card;
const { Paragraph } = Typography;
const { TextArea } = Input;
import { history, connect } from 'umi';
import { EditOutlined, DeleteOutlined, SettingOutlined, PlusOutlined } from '@ant-design/icons';
import styles from './index.less'


const Dashboard = connect(({ project, loading }) => ({
  project,
  queryLoading: loading.effects['project/fetch_projectData'],
}))((props) => {
  const { project, dispatch, queryLoading } = props;
  const { projectData, projectCurrentInfo } = project;
  const [form] = Form.useForm()
  const [modalConfig, setModalConfig] = useState({
    action: 'create', // or 'edit'
    visible: false,
  })
  useEffect(() => {
    getProjectList()
  }, [])
  const getProjectList = () => {
    dispatch({
      type: 'project/fetch_projectData'
    })
  }
  const handleCardAction = (key: String, data: any) => {
    if (key === 'create' || key === 'edit') {
      const baseConfig = {
        title: `${key === 'create' ? '创建' : '修改'}项目`,
        action: key,
        visible: true,
      }
      if (key === 'create') {
        setModalConfig({ ...baseConfig })
      }
      if (key === 'edit') {
        dispatch({
          type: 'project/fetch_projectInfo',
          payload: {
            id: data.key
          },
          callback: (res) => {
            if (res.code !== 200) return
            setModalConfig({ ...baseConfig })
            form.setFieldsValue(res.data)
          }
        })
      }
    }
    if (key === 'delete') {
      dispatch({
        type: 'project/delete_project',
        payload: {
          id: data.key
        },
        callback: (res) => {
          if (res.code !== 200) return
          getProjectList() // 重新获取列表
        }
      })
    }
  }
  const handleTitleClick = (data) => {
    history.push(`/task?id=${data._id}&&active=info`)
  }
  const handleSubmitProject = () => {
    form
      .validateFields()
      .then(values => {
        if (modalConfig.action === 'edit') {
          values.id = projectCurrentInfo._id
        }
        dispatch({
          type: `project/${modalConfig.action === 'edit' ? 'update_project' : 'create_project'}`,
          payload: {
            ...values
          },
          callback: (res) => {
            if (res.code !== 200) return
            setModalConfig({ ...modalConfig, action: '', visible: false })
            getProjectList() // 重新获取列表
          }
        })
      })
      .catch(_ => {
      });
  }
  return <div className={styles.dashboard}>
    <div className={styles.header}>
      <h1 className={styles.title}>项目列表</h1>
      <div className={styles.control}><Button type="primary" icon={<PlusOutlined />} onClick={() => handleCardAction('create')}>添加项目</Button></div>
    </div>
    <Spin spinning={queryLoading}>
      <Row className={styles.projectList} gutter={20}>
        {
          projectData.map(item =>
            <Col key={item._id} className={styles.item} md={12} lg={8} xl={6}>
              <Card
                onClick={() => handleTitleClick(item)}
                actions={[
                  <a
                    onClick={e => {
                      e.stopPropagation();
                      if (item.taskState  === 'process') {
                        message.warning('任务执行中，无法编辑')
                      } else {
                        handleCardAction('edit', { key: item._id });
                      }
                    }}
                  >
                    <Tooltip title={'编辑'}>
                      <EditOutlined key="edit" />
                    </Tooltip>
                  </a>,
                  <Popconfirm placement="top" title={'是否删除项目'} onConfirm={e => {
                    e.stopPropagation();
                    handleCardAction('delete', { key: item._id });
                  }} okText="确定" cancelText="取消" onCancel={e => e.stopPropagation()}
                  disabled={item.taskState  === 'process'}>
                    <a onClick={e => {
                      e.stopPropagation()
                      if (item.taskState  === 'process') {
                        message.warning('任务执行中，无法删除！')
                      }
                    }}>
                      <Tooltip title={'删除'}>
                        <DeleteOutlined key="delete" />
                      </Tooltip>
                    </a>
                  </Popconfirm>,
                ]}
              >
                <Meta
                  title={
                    <div className={styles.title}>
                      <Badge status={item.status === '0' ? 'warning' : 'success'} /> {/* 显示项目状态 */}
                      <span>{item.name}</span>
                      {/* 显示任务状态 */}
                      {item.taskState && item.taskState !== 'init' && (
                        <Tag className={`task-tag  ${'tag-' + item.taskState}`}>
                          {item.taskTypeName}{item.taskStateName}
                        </Tag>
                      )}
                    </div>
                  }
                  description={
                    <Paragraph
                      className={styles.desc}
                      style={{ marginBottom: 0 }}
                      ellipsis={{ rows: 3, expandable: true }}
                    >
                      {item.filePath}
                    </Paragraph>
                  }
                />

              </Card>
            </Col>)
        }
      </Row>
    </Spin>
    <Modal {...modalConfig} afterClose={() => dispatch({
      type: 'project/saveProjectInfo',
      payload: {}
    })}
           onOk={() => handleSubmitProject()}
           onCancel={() => setModalConfig({ ...modalConfig, visible: false })}
    >
      <div className={styles.modalContainer}>
        <Form name="CreateProject" form={form}>
          <Form.Item
            label={'项目名称'}
            name="name"
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={'项目目录'}
            name="filePath"
          >
            <TextArea />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  </div>
})
export default Dashboard;
