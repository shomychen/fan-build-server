import { message } from 'antd';

const responseMsg = {
  create: {
    success: '新增成功',
    error: '删除失败',
  },
  delete: {
    success: '删除成功',
    error: '删除失败',
  },
  update: {
    success: '修改成功',
    error: '修改失败',
  },
  send: {
    success: '发送成功',
    error: '发送失败',
  },
  authorize: {
    success: '授权成功',
    error: '授权失败',
  }
}
// 接口返回异常提示语
// @params {String} type 指操作的类型：删除delete 修改update 新增 create
const responseControl = (type, res, callback) => {
  if (res.code === 200) {
    if (typeof type === 'string') {
      message.success(responseMsg[type].success)
    } else if (typeof type === 'object') {
      message.success(type.success)
    } else {
      message.success('操作成功')
    }
  }
  callback && callback(res)
}
const responseQuery = (res, callback) => {
  if (res.code === 200) {
    // 调用回调
    callback && callback(res)
  }
}
export { responseControl, responseQuery }
