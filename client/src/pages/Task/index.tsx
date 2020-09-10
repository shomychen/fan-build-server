import React, { useEffect, useMemo, useState } from 'react';
import { Button, Layout, Spin, Drawer, Tag, Table,Badge} from 'antd';
import { RollbackOutlined, ProfileOutlined } from '@ant-design/icons';
import { history, connect } from 'umi';
import cls from 'classnames';
import styles from './index.less'
import BuildlTerminal from "./BuildlTerminal";
import InstallTerminal from "./InstallTerminal";
import InfoForm from "./InfoForm";
import {formatTime} from '@/utils/common'

const { Sider } = Layout

// @ts-ignore
const Project = connect(({ task, project, loading }) => ({
  task, project,
  listenTaskResult: task.listenTaskResult,
  taskLogData: task.taskLogData,
  queryLoading: loading.effects['project/fetch_projectInfo'],
}))((props) => {
  const { location: { query }, task, dispatch, project, queryLoading, listenTaskResult, taskLogData } = props;
  const { npmClients } = task;
  const { active, id } = query;
  const { projectCurrentInfo } = project;
  const [drawerVisible, setDrawerVisible] = useState(false);
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
  // 获取当前选中标签的值
  const triggerActive = useMemo(() => {
    const filterActive = triggerList.filter(item => item.key === active);
    return filterActive.length > 0 ? filterActive[0] : {}
  }, [active])

  // 更新任务进行状态
  // const updateTask = (params: object) => {
  //   dispatch({
  //     type: 'project/update_project_task',
  //     payload: params,
  //     callback: (res: any) => {
  //       if (res.code !== 200) return
  //       if (params.id === query.id) queryProjectInfo()  // 是当前项目的任务进度在变化，则更新当前项目信息
  //     }
  //   })
  // }
  useEffect(() => {
    const { projectId } = listenTaskResult;
    if (projectId && projectId === query.id) {
      queryProjectInfo()  // 是当前项目的任务进度在变化，则更新当前项目信息
      // updateTask({
      //   id: projectId,
      //   ...listenTaskResult,
      // })
    }
  }, [listenTaskResult])

  useEffect(() => {
    dispatch({
      type: 'task/fetch_npm_clients'
    })
    dispatch({
      type: 'task/fetch_task_logData',
      payload: {
        projectId: query.id
      }
    })
    queryProjectInfo()
    return () => {
      dispatch({
        type: 'project/saveProjectInfo', // 清空当前存储的信息
        payload: {}
      })
      dispatch({
        type: 'task/updateRunTaskResult',
        payload: {},
      });
      dispatch({
        type: 'task/saveTaskLogData',
        payload: [],
      });
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
        taskType: '', // 将任务初始化
        taskTypeName: '',// 将任务初始化
        taskState: '',// 将任务初始化
        taskStateName: '',// 将任务初始化
        id: query.id
      },
      callback: (res) => {
        if (res.code !== 200) return
        queryProjectInfo() // 重新获取当前数据
      }
    })
  }
  const columns = [
    {
      title: '任务类型',
      dataIndex: 'taskTypeName',
      key: 'taskTypeName',
    },
    {
      title: '执行状态',
      dataIndex: 'taskStateName',
      key: 'taskStateName',
      render: (text, row )=> {
        return <Badge status={row.taskState}>{text}</Badge>
      }
    },
    {
      title: '执行时间',
      dataIndex: 'createTime',
      key: 'createTime',
      render: text=> formatTime(text)
    },
  ]
  return <div className={styles.project}>
    <Spin spinning={queryLoading} style={{ height: '100%' }}>
      <div className={styles.projectBasic}><Button onClick={() => history.push('/')} icon={<RollbackOutlined />}></Button>
        <strong>{projectCurrentInfo.name}</strong>
        {/* 显示任务状态 */}
        {projectCurrentInfo.taskState !== 'init' && (
          <Tag className={`task-tag  ${'tag-' + projectCurrentInfo.taskState}`}>
            {projectCurrentInfo.taskTypeName}{projectCurrentInfo.taskStateName}
          </Tag>
        )}
        <Button style={{ float: 'right' }} icon={<ProfileOutlined />} onClick={() => setDrawerVisible(true)}>操作日志</Button>
      </div>
      <div className={styles.projectSide}>
        {
          triggerList.map(item => <div key={item.key} className={cls(styles.trigger, active === item.key ? styles.active : '')}
                                       onClick={() => history.push(`/task?id=${query.id}&active=${item.key}`)}>
            <div className={styles.title}>{item.title}</div>
            <div className={styles.description}>{item.description}</div>
          </div>)
        }
      </div>
      <div className={styles.projectContent}>
        {
          active === 'info' ? <InfoForm title={triggerActive.title} projectId={query.id} data={projectCurrentInfo}
                                        onAction={handleUpdate} />
            :
            <>
              {
                active === 'build'
                  ? <BuildlTerminal dispatch={dispatch} title={triggerActive.title} projectId={query.id} data={projectCurrentInfo} npmClients={npmClients} />
                  : <InstallTerminal dispatch={dispatch} title={triggerActive.title} projectId={query.id} data={projectCurrentInfo} npmClients={npmClients} />
              }

            </>
        }
      </div>
    </Spin>
    <Drawer visible={drawerVisible} title="操作日志" width={500}>
      <Table rowKey={'_id'} dataSource={taskLogData} columns={columns} size="small" />
    </Drawer>
  </div>
})
export default Project;
