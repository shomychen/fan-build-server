import React from 'react';
import styles from './index.less';
import {Button, message, Space} from 'antd'

import {callTest} from '../../services/test';
import request from '../../utils/request';

export default (props) => {
  console.log(props.routes)
  const handleTest = (method: 'GET' | 'POST', url, params: object) => {
    request(url, Object.assign({
      method: method,
    }, method === 'GET' ? {
      params
    } : {
      data: params,
    })).then(res => {
      if (res.code === 200) message.success(res.msg)
    }).catch((err) => {
      console.log('请求返回异常', err)
    });
  }
  const handleNode = () => {

  }
  const testApiList = [
    {
      path: '/api/test/get',
      method: 'get',
      name: '获取列表'
    },
    {
      path: '/api/test/detail',
      method: 'post',
      name: '查询单个数据'
    },
    {
      path: '/api/test/save',
      method: 'post',
      name: '新增单个数据'
    },
    {
      path: '/api/test/update',
      method: 'post',
      name: '更新单个数据'
    },
    {
      path: '/api/test/delete',
      method: 'post',
      name: '删除单个数据'
    },
  ]
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>一、测试已经做好的</h1>
      <ol className={styles.list}>
        <li><Button disabled onClick={() => handleTest('GET', '/api/test/page')} type="primary">点击</Button>测试下请求:GET普通返回</li>
        <li><Button disabled onClick={() => handleTest('GET', '/api/test/getQueryParam', {name: '这是个测试', param: '请求参数'})} type="primary">点击</Button>测试下请求:GET有传参数</li>
        <li><Button disabled onClick={() => handleTest('POST', '/api/test/getPerson', {username: 'admin'})} type="primary">点击</Button>测试下请求:与数据库绑定(测试下获取用户信息)</li>
        <li><Button disabled onClick={() => handleTest('POST', '/api/test/addPerson', {username: 'admin', password: '123456'})} type="primary">点击</Button>测试下请求: POST 与数据库绑定(新增信息息)</li>
        <li><Button disabled onClick={handleNode} type="primary">点击</Button>让koa服务触发本地node相关事件</li>
      </ol>
      <h1 className={styles.title}>二、规划点</h1>
      <ul className={styles.list}>
        <li> ①前端项目如何统一汇总（数据库管理）</li>
        <li> ②项目中打包前端配置基础信息及如何指定(路由)模块打包</li>
        <li> ③包如何统一管理</li>
        <li> ④前端发出请求后KOA服务触发某些事件，如方案一”node命令行“操作（涉及安装包、打包、发布等），方案二：考虑docker如何使用</li>
        <li>⑤是否做到导入项目内的route.config.js，进行调整并保存到数据库，然后汇总节点数据，在第②点中，可针对性的选择打包对应的菜单</li>
      </ul>
      <h1>三、KOA接口测试</h1>
      <Space>
        {
          testApiList.map(item => <span key={item.path}><Button onClick={() => handleTest(item.method, item.path)} type="primary">{item.name}</Button></span>)
        }
      </Space>
    </div>
  );
}
