import * as React from 'react';
import { Result, Button } from 'antd';
import DarkNoFound from '@/components/DarkNoFound';

import styles from './404.less';

const NotFound: React.SFC<{}> = props => {

  return (
    <Result
      className={styles.notFound}
      title="404"
      subTitle="抱歉，你访问的页面不存在"
      icon={<DarkNoFound />}
      extra={
        <Button
          type="primary"
          onClick={() => {
            window.location.href = '/';
          }}
        >
          返回首页
        </Button>
      }
    />
  );
};

export default NotFound;
