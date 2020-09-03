// 任务类型及状态值
export default [
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
