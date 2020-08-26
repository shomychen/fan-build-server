import React from 'react';
import styles from './Footer.less'
import { history } from 'umi';
import {
  FolderFilled,
  ProfileFilled,
  HomeFilled,
  TagOutlined,
  QuestionCircleOutlined,
  CheckOutlined,
  MessageOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import {Tooltip} from 'antd'
import cls from 'classnames';
const Footer = () => {
  const actionCls = cls(styles.section, styles.action);
  const handleBack =()=>{
    history.push('/') // 回到首页
  }
  return(
    <div className={styles.footer}>
      <div className={styles.statusBar}>
        <div className={styles['statusBar-left']}>
          <div
            onClick={() => {
              handleBack();
            }}
            className={actionCls}
          >
            <HomeFilled style={{ marginRight: 4 }} />{' '}返回主页
          </div>
          <div
            className={actionCls}
          >
            <ProfileFilled style={{ marginRight: 4 }} />{' '}日志
          </div>
        </div>
      </div>
    </div>)
}
export default Footer;
