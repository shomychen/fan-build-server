import React, {useState, useMemo, useEffect, useCallback} from 'react';
import {ConfigProvider, Layout, Menu,} from 'antd'
import Helmet from 'react-helmet';
import cls from 'classnames';
import {history} from 'umi';
import Footer from './Footer'
import Context from './Context';
import logo from '@/assets/logo.png'

const {Sider, Content} = Layout;

interface ILayoutProps {
  /** Layout 类型（项目列表、项目详情，loading 页） */
  // type: 'detail' | 'list' | 'loading';
  className?: string;
  title?: string;
}

const PageLayout: React.FC<ILayoutProps> = props => {
  const {className, route, location} = props;
  const {routes} = route;
  // console.log(routes, props, location)
  const [locale, setLocale] = useState<'zh-CN', 'en-US'>('zh-CN');
  const [theme, setTheme] = useState('dark');
  // const [menuActive, setMenuActive] = useState([]);
  const layoutCls = cls(
    locale,
    'fan-layout',
    className,
  );
  const menuActive = useCallback(() => {
    return [location.pathname]
  }, [routes, location])

  const menuData = useMemo(() => {
    return routes.filter(rItem => rItem.path && !rItem.hideInMenu) // 过滤路由菜单
  }, [routes, location])
  return (<ConfigProvider locale={'zh-CN'}>
    <Layout className={layoutCls}>
      <Context.Provider
        value={{
          locale,
          theme
        }}
      >
        <Helmet>
          <html lang={locale === 'zh-CN' ? 'zh' : 'en'} />
          <title>{props.title ? props.title : '前端部署'}</title>
          {/*<link rel="shortcut icon" href={icon} type="image/x-icon" />*/}
        </Helmet>
        <Sider width={100}  className={'fan-layout-sider'}>
          <div  className={'fan-layout-sider-logo'}>
            <a onClick={()=> history.push('/')}><img  alt={props.title ? props.title : '前端部署'} src={logo}/></a>
          </div>
          <Menu onSelect={(item) =>{
            // setMenuActive([item.key])
            history.push(item.key)
          }} selectedKeys={menuActive()}>
            {
              menuData.map(menuItem => <Menu.Item key={menuItem.path}>
                {menuItem.title}
              </Menu.Item>)
            }
          </Menu>
        </Sider>
        <Content className={'fan-layout-content'}>
          {props.children}
        </Content>
        <Footer />
      </Context.Provider>
    </Layout>
  </ConfigProvider>)
}
export default PageLayout;
