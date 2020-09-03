import React, { useEffect, useMemo } from 'react';
import { Button, Layout, Spin, Form, Input, Row, Col, message, Tag } from 'antd';
import { RollbackOutlined } from '@ant-design/icons';
import { history, connect } from 'umi';
import cls from 'classnames';
import styles from './index.less'
import projectList from '@/data/project.list.js'
import request from '../../utils/request';
import BuildlTerminal from "@/pages/Task/components/BuildlTerminal";
import InstallTerminal from "@/pages/Task/components/InstallTerminal";
import InfoForm from "@/pages/Task/components/InfoForm";

const { Sider } = Layout

// @ts-ignore
const Project = connect(({ task, project, loading }) => ({
  task, project,
  queryLoading: loading.effects['project/fetch_projectInfo'],
}))((props) => {
  const { location: { query }, task, dispatch, project, queryLoading } = props;
  const { npmClients } = task;
  const { active, id } = query;
  const { projectCurrentInfo } = project;
  const triggerList = [
    {
      key: 'info',
      title: '项目配置',
      description: '配置基础信息',
    },
    {
      key: 'install',
      title: '安装依赖',
      description: '安装或重装依赖包',
    },
    {
      key: 'build',
      title: '构建发布',
      description: '执行项目构建及发布',
    }
  ]
  const currentInfo = useMemo(() => {
    const filterInfo = projectList.filter(item => item._id === query.id)
    return filterInfo.length > 0 ? filterInfo[0] : {}
  }, [query])
  const triggerActive = useMemo(() => {
    const filterActive = triggerList.filter(item => item.key === active);
    return filterActive.length > 0 ? filterActive[0] : {}
  }, [active])
  const onFinish = values => {
    console.log('Received values of form: ', values);
  };

  useEffect(() => {
    dispatch({
      type: 'task/fetch_npm_clients'
    })
    queryProjectInfo()
    return () => {
      dispatch({
        type: 'project/saveProjectInfo', // 清空当前存储的信息
        payload: {}
      })
    }
  }, [])
  const queryProjectInfo = () => {
    dispatch({
      type: 'project/fetch_projectInfo',
      payload: {
        id: query.id
      },
      callback: (res) => {
        if (res.code !== 200) return
      }
    })
  }
  const handleUpdate = (values: object) => {
    dispatch({
      type: 'project/update_project',
      payload: {
        ...values,
        status: '1', // 将项目状态设置为 1，表示基础信息已配置，可操作构建与发布任务
        id: query.id
      },
      callback: (res) => {
        if (res.code !== 200) return
        queryProjectInfo() // 重新获取当前数据
      }
    })
  }
  return <div className={styles.project}>
    <Spin spinning={queryLoading} style={{height: '100%'}}>
      <div className={styles.projectBasic}><Button onClick={() => history.push('/')} icon={<RollbackOutlined />}></Button>
        <strong>{projectCurrentInfo.name}</strong>
        {/* 显示任务状态 */}
        {projectCurrentInfo.taskState !== 'init' && (
          <Tag className={`task-tag  ${'tag-' + projectCurrentInfo.taskState}`}>
            {projectCurrentInfo.taskTypeName}{projectCurrentInfo.taskStateName}
          </Tag>
        )}
      </div>
      <div className={styles.projectSide}>
        {
          triggerList.map(item => <div key={item.key} className={cls(styles.trigger, active === item.key ? styles.active : '')}
                                       onClick={() => history.push(`/task/?id=${query.id}&&active=${item.key}`)}>
            <div className={styles.title}>{item.title}</div>
            <div className={styles.description}>{item.description}</div>
          </div>)
        }
      </div>
      <div className={styles.projectContent}>
        {/**/}
        {
          active === 'info' ? <InfoForm title={triggerActive.title} projectId={query.id} data={projectCurrentInfo}
                                        onAction={handleUpdate} />
            :
            <>
              {
                active === 'build' ? <BuildlTerminal title={triggerActive.title} projectId={query.id} data={projectCurrentInfo} npmClients={npmClients} />
                  : <InstallTerminal title={triggerActive.title} projectId={query.id} data={projectCurrentInfo} npmClients={npmClients} />
              }

            </>
        }
        {/*</Spin>*/}
      </div>
    </Spin>
  </div>
})
export default Project;
