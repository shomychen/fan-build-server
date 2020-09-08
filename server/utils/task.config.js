// 任务类型及状态值
module.exports = {
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
  'BUILDAndDEPLOY' : {
    name: '部署与发布',
    states: {
      'init': '未执行',
      'process': '进行中',
      'failure': '失败',
      'success': '成功',
    }
  }
}

module.taskArray = () => {
  return [
    {
      name: '无任务',
      value: 'DEFAULT',
    },
    {
      name: '构建',
      value: 'BUILD',
      states: [
        {
          name: '未执行',
          value: 'init'
        },
        {
          name: '进行中',
          value: 'process'
        },

        {
          name: '失败',
          value: 'failure'
        },

        {
          name: '成功',
          value: 'success'
        },
      ]
    },
    {
      name: '安装包',
      value: 'INSTALL',
      states: [
        {
          name: '未执行',
          value: 'init'
        },
        {
          name: '进行中',
          value: 'process'
        },

        {
          name: '失败',
          value: 'failure'
        },

        {
          name: '成功',
          value: 'success'
        },
      ]
    },
    {
      name: '打包部署',
      value: 'DEPLOY',
      states: [
        {
          name: '未执行',
          value: 'init'
        },
        {
          name: '进行中',
          value: 'process'
        },

        {
          name: '失败',
          value: 'failure'
        },

        {
          name: '成功',
          value: 'success'
        },
      ]
    }
  ]

}
