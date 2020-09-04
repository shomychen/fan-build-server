// 任务类型及状态值
export default {
  'TESTCOPY': {
    name: '测试拷贝',
  },
  'DEFAULT': {
    name: '无任务',
  },
  'BUILD': {
    name: '构建',
    states: {
      'init': '未执行',
      'process': '进行中',
      'failure': '失败',
      'success': '成功',
    }
  },
  'INSTALL': {
    name: '安装包',
    states: {
      'init': '未执行',
      'process': '进行中',
      'failure': '失败',
      'success': '成功',
    }
  },
  'DEPLOY': {
    name: '部署',
    states: {
      'init': '未执行',
      'process': '进行中',
      'failure': '失败',
      'success': '成功',
    }
  },
}
