import React, {useMemo} from 'react';
import {Button, ConfigProvider, Layout, Space} from 'antd';
import {history} from 'umi';
import cls from 'classnames';
import styles from './index.less'

const {Sider} = Layout

const Project = (props) => {
  const {match: {params}, location: {query}} = props;
  const {active} = query;

  console.log(params, query)
  const triggerList = [
    {
      key: 'info',
      title: '项目配置',
      description: '配置基础信息',
    },
    {
      key: 'build',
      title: '打包构建',
      description: '执行项目打包构建',
    },
    {
      key: 'install',
      title: '安装依赖',
      description: '安装或重装依赖包',
    }
  ]
  const triggerActive = useMemo(() => {
    const filter = triggerList.filter(item => item.key === active);
    return filter.length > 0 ? filter[0] : {}
  }, [active])

  return <div className={styles.project}>
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
      <div className={styles.codeColumn}>
        <div className={styles.headerBar}>{triggerActive.title}</div>
        {
          active === 'info' ? <div>
            <div>基础配置</div>
            <div>
              <h3>主题色</h3>
              <h3>站点名称</h3>
              <h3>资源名称<span>用于存储在本地localStorage相关配置</span></h3>
            </div>
            <div>部署配置</div>
          </div> : <>
            <div className={styles.actionBar}>
              <Space><Button type={"primary"}>构建</Button> <Button type={"primary"}>构建并发布</Button> <Button type={"primary"}>打包</Button></Space>
            </div>
            <div className={styles.codeContainer} style={{
              backgroundColor: '#15171c', width: '100%', height: '300px'
            }}>
            </div>
          </>
        }
      </div>
    </div>
  </div>
}
export default Project;
