import React, { useEffect, useMemo } from 'react';
import { Button, Layout, Space, Form, Input, Row, Col, message } from 'antd';
import { RollbackOutlined } from '@ant-design/icons';
import { history, connect } from 'umi';
import cls from 'classnames';
import styles from './index.less'
import projectList from '@/data/project.list.js'
import request from '../../utils/request';
import BuildlTerminal from "@/pages/Project/components/BuildlTerminal";
import InstallTerminal from "@/pages/Project/components/InstallTerminal";
import InfoForm from "@/pages/Project/components/InfoForm";

const { Sider } = Layout

// @ts-ignore
const Project = connect(({ project }) => ({
  project,
  // queryLoading: loading.effects['systemRole/fetch_role_data'],
}))((props) => {
  const { match: { params }, location: { query }, project, dispatch } = props;
  const { npmClients } = project;
  const { active } = query;
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
    const filterInfo = projectList.filter(item => item._id === params.id)
    return filterInfo.length > 0 ? filterInfo[0] : {}
  }, [params])
  const triggerActive = useMemo(() => {
    const filterActive = triggerList.filter(item => item.key === active);
    return filterActive.length > 0 ? filterActive[0] : {}
  }, [active])
  const onFinish = values => {
    console.log('Received values of form: ', values);
  };

  const callRequest = (url: string, method?: 'GET' | 'POST', params?: object, callback?: () => void) => {
    request(url, Object.assign({
      method: method,
    }, method === 'GET' ? {
      params
    } : {
      data: params,
    })).then((res: any) => {
      if (res.code === 200) callback(res)
    }).catch((err: any) => {
      console.log('请求返回异常', err)
    });
  }
  useEffect(()=> {
    dispatch({
      type: 'project/fetch_npm_clients'
    })
  }, [])
  return <div className={styles.project}>
    <div className={styles.projectBasic}><Button onClick={() => history.push('/')} icon={<RollbackOutlined />}></Button> <strong>{currentInfo.name}</strong></div>
    <div className={styles.projectSide}>
      {
        triggerList.map(item => <div key={item.key} className={cls(styles.trigger, active === item.key ? styles.active : '')}
                                     onClick={() => history.push(`/project/${params.id}?active=${item.key}`)}>
          <div className={styles.title}>{item.title}</div>
          <div className={styles.description}>{item.description}</div>
        </div>)
      }
    </div>
    <div className={styles.projectContent}>
      {
        active === 'info' ? <InfoForm title={triggerActive.title} projectId={params.id} data={currentInfo} />
          :
          <>
            {
              active === 'build' ? <BuildlTerminal title={triggerActive.title} projectId={params.id} data={currentInfo} npmClients={npmClients} />
                : <InstallTerminal title={triggerActive.title} projectId={params.id} data={currentInfo}  npmClients={npmClients} />
            }

          </>
      }
    </div>
  </div>
})
export default Project;
