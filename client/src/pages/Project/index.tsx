import React, { useEffect, useMemo } from 'react';
import { Button, ConfigProvider, Layout, Space, Form, Input, Row, Col, message } from 'antd';
import { RollbackOutlined } from '@ant-design/icons';
import { history } from 'umi';
import cls from 'classnames';
import styles from './index.less'
import projectList from '@/data/project.list.js'
import request from '../../utils/request';
import CodeColumns from './components/CodeColumn'
import BuildlTerminal from "@/pages/Project/components/BuildlTerminal";
import InstallTerminal from "@/pages/Project/components/InstallTerminal";
const {Sider} = Layout

const Project = (props) => {
  const [form] = Form.useForm();
  const {match: {params}, location: {query}} = props;
  const {active} = query;
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
      title: '打包构建',
      description: '执行项目打包构建',
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

  const callRequest = (url: string, method?: 'GET' | 'POST', params?: object, callback?: () => void )=>{
    request(url, Object.assign({
      method: method,
    }, method === 'GET' ? {
      params
    } : {
      data: params,
    })).then((res:any) => {
      if (res.code === 200) callback(res)
    }).catch((err:any) => {
      console.log('请求返回异常', err)
    });
  }
  const handleControl =(key?:String) => {
    // 执行构建命令
    if (key === 'build') {
      // callRequest()
    }
    if (key === 'buildAndPush') {

    }
    if (key === 'install') {

    }
  }

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
        active === 'info' ? <div className={styles.configColumn}>
          <div className={styles.headerBar}>{triggerActive.title}</div>
          <Form layout="vertical" name="config-controls" form={form} initialValues={{...currentInfo}}
                onFinish={onFinish}>
            <div className={styles.configGroup}>
              <h2>基础配置</h2>
              <Form.Item name="themeColor" label={<div>
                <div className={styles.title}>主题色</div>
                <div className={styles.description}>描述性文本</div>
              </div>} className={styles.configGroupItem}>
                <Input placeholder="请输入" style={{maxWidth: '320px'}} />
              </Form.Item>
              <Form.Item name="siteTitle" label={<div>
                <div className={styles.title}>站点名称</div>
                <div className={styles.description}>用于页面默认标题设置</div>
              </div>} className={styles.configGroupItem}>
                <Input placeholder="请输入" style={{maxWidth: '320px'}} />
              </Form.Item>
              <Form.Item name="localStorageName" label={<div>
                <div className={styles.title}>资源名称</div>
                <div className={styles.description}>资源名称用于存储在本地localStorage相关配置</div>
              </div>} className={styles.configGroupItem}>
                <Input placeholder="请输入" style={{maxWidth: '320px'}} />
              </Form.Item>
            </div>
            <div className={styles.configGroup}>
              <h2>构建配置</h2>
              <Form.Item label={<div>
                <div className={styles.title}>主题色</div>
                <div className={styles.description}>描述性文本</div>
              </div>} className={styles.configGroupItem}>
                <Input placeholder="请输入" style={{maxWidth: '320px'}} />
              </Form.Item>
              <Form.Item label={<div>
                <div className={styles.title}>站点名称</div>
                <div className={styles.description}>用于页面默认标题设置</div>
              </div>} className={styles.configGroupItem}>
                <Input placeholder="请输入" style={{maxWidth: '320px'}} />
              </Form.Item>
              <Form.Item label={<div>
                <div className={styles.title}>资源名称</div>
                <div className={styles.description}>资源名称用于存储在本地localStorage相关配置</div>
              </div>} className={styles.configGroupItem}>
                <Input placeholder="请输入" style={{maxWidth: '320px'}} />
              </Form.Item>
            </div>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Form.Item>
          </Form>
        </div> :
          <>
            {
              active === 'build' ? <BuildlTerminal projectId={params.id} data={currentInfo}/> : <InstallTerminal projectId={params.id}  data={currentInfo}/>
            }

            {/*<CodeColumns data={triggerActive} title={triggerActive.title} active={active} onAction={(key)=> handleControl(key)}/>*/}
            </>
      }
    </div>
  </div>
}
export default Project;
