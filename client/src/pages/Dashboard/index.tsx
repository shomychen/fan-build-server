import React from 'react';
import {Button, Row, Col, Card, message, Tooltip} from 'antd';
import { history } from 'umi';
import Context from '../../layouts/Context';
import {EditOutlined, DeleteOutlined, SettingOutlined} from '@ant-design/icons';

import styles from './index.less'
import editorSvg from "*.svg";


const Dashboard = () => {
  const projectList = [
    {
      _id: '11',
      name: 'IBMS运维中心',
      filePath: 'D:\\Workerspace\\svn\\gallery\\'
    },
    {
      _id: '22',
      name: '邑通',
      filePath: 'D:\\Workerspace\\svn\\gallery\\'
    }
  ]
  const handleCardAction = (key: String, data: any) => {
    message.info(`点击事件${key}`)
  }
  const handleTitleClick = (data) => {
    history.push(`/project/${data._id}?active=info`)
  }
  return <div className={styles.dashboard}>
    <div className={styles.header}>
      <h1 className={styles.title}>项目列表</h1>
      <div className={styles.control}><Button type="primary" onClick={()=> handleCardAction('create')}>添加项目</Button></div>
    </div>
    <Row className={styles.projectList} gutter={20}>
      {
        projectList.map(item =>
          <Col key={item._id} className={styles.item} md={12} lg={8} xl={6}>
            <Card
              onClick={() => handleTitleClick(item)}
              actions={[
                <a
                  onClick={e => {
                    e.stopPropagation();
                    handleCardAction('edit', { key: item._id });
                  }}
                >
                  <Tooltip title={'编辑'}>
                    <EditOutlined key="edit"/>
                  </Tooltip>
                </a>,
                <a
                  onClick={e => {
                    e.stopPropagation();
                    handleCardAction('delete', { key: item._id });
                  }}
                >
                  <Tooltip title={'删除'}>
                    <DeleteOutlined key="delete"/>
                  </Tooltip>
                </a>,
              ]}
            >
              <div className={styles.itemBlock}>
                <div className={styles.title}>{item.name}</div>
                <div className={styles.subTitle}>{item.filePath}</div>
              </div>
            </Card>
          </Col>)
      }
    </Row>
  </div>
}
export default Dashboard;
