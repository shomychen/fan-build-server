import React from 'react';
import {ConfigProvider, Button , Space} from 'antd';
import styles from './CodeColumn.less'

interface CodeProps {
  /** Layout 类型（项目列表、项目详情，loading 页） */
  // type: 'detail' | 'list' | 'loading';
  className?: string;
  title?: string;
  actions?: Array<{}>;
}

const CodeColumn: React.FC<CodeProps> = (props) => {
  const {title, actions = []} = props;
  return <div className={styles.codeColumn}>
    <div className={styles.headerBar}>{title}</div>
    {
      actions.length > 0 ?
        <Space className={styles.actionBar}>
          {
            actions.map(item => <Button type="primary" key={item.name} onClick={item.action}>{item.name}</Button>)
          }
        </Space> : null
    }
    <div className={styles.codeContainer}></div>
    <div className={styles.projectContent}  style={{
      backgroundColor: '#15171c', width: '100%;', height: '300px'
    }}>
    </div>
  </div>
}
export default CodeColumn;
