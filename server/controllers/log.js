const logModel = require('../models/log.js');
const baseController = require('./base.js');
const tools = require('../utils/tools.js');

class logController extends baseController {
  constructor(ctx) {
    super(ctx);
    this.Model = tools.getInst(logModel); // 创建实例
  }

  async fetchPage(ctx) {
    // const { projectId } = ctx.params // ctx.request.body;
    let result = await this.Model.list(ctx.params) // 查询列表信息
    if (!result) {
      return (ctx.body = tools.commons.resReturn(null, 400, '数据未查到'));
    }
    return (ctx.body = tools.commons.resReturn(result, 200, '操作成功'));
  }

  async queryById(ctx) {
    const { id } = ctx.params // ctx.request.body;
    if (!id) return (ctx.body = tools.commons.resReturn(null, 400, 'ID不能为空'));
    let result = await this.Model.findById(id) // 查询单个信息
    // result = tools.commons.fieldSelect(result, ['_id', 'username', 'age', 'address']) // 对查询返回的数据进行过滤
    if (!result) {
      return (ctx.body = tools.commons.resReturn(null, 400, '数据未查到'));
    }
    return (ctx.body = tools.commons.resReturn(result, 200, '操作成功'));
  }

  // // 通过项目ID查找数据
  // async queryByProjectId(ctx) {
  //   const { projectId } = ctx.params // ctx.request.body;
  //   if (!projectId) return (ctx.body = tools.commons.resReturn(null, 400, 'projectId不能为空'));
  //   let result = await this.Model.list(projectId) // 查询多个信息
  //   console.log('查找信息', result)
  //   // result = tools.commons.fieldSelect(result, ['_id', 'username', 'age', 'address']) // 对查询返回的数据进行过滤
  //   if (!result) {
  //     return (ctx.body = tools.commons.resReturn(null, 400, '数据未查到'));
  //   }
  //   return (ctx.body = tools.commons.resReturn(result, 200, '操作成功'));
  // }

  // 创建数据
  async createSave(ctx) {
    try {
      let params = ctx.params;
      const { projectName } = params // ctx.request.body;
      if (!projectName) (ctx.body = tools.commons.resReturn(null, 400, '项目名称不能为空'));
      let data = {
        ...params,
        createTime: tools.commons.time(),
        updateTime: tools.commons.time(),
      };
      let result = await this.Model.save(data); // 创建数据
      // console.log('创建成功的结果数据', result)
      ctx.body = tools.commons.resReturn({_id: result._id}, 200, '新增成功');
    } catch (err) {
      ctx.body = tools.commons.resReturn(null, 402, err.message);
    }
  }

  // 更新数据
  async update(ctx) {
    try {
      let params = ctx.params;
      const { id } = params
      if (!id) return (ctx.body = tools.commons.resReturn(null, 400, 'ID不能为空'));
      let data = {
        ...params,
        updateTime: tools.commons.time(),
      };
      await this.Model.update(id, data); // 更新数据
      ctx.body = tools.commons.resReturn(null, 200, '更新数据成功');
    } catch (err) {
      ctx.body = tools.commons.resReturn(null, 400, err.message);
    }
  }

  // 删除指定数据
  async deleteById(ctx) {
    try {
      const { id } = ctx.params;
      if (!id) return (ctx.body = tools.commons.resReturn(null, 401, 'ID不能为空'));
      let result = await this.Model.findById(id) // 查询单个信息
      if (!result) return (ctx.body = tools.commons.resReturn(null, 400, '查无此数据'));
      await this.Model.delete(id); // 删除数据
      ctx.body = tools.commons.resReturn(null, 200, '删除成功');
    } catch (err) {
      ctx.body = tools.commons.resReturn(null, 400, err.message);
    }
  }


  // 更新任务状态
  async updateTask(ctx) {
    try {
      let params = ctx.params;
      const { id } = params
      if (!id) return (ctx.body = tools.commons.resReturn(null, 400, 'ID不能为空'));
      let data = {
        ...params,
        updateTime: tools.commons.time(),
      };
      await this.Model.update(id, data); // 更新数据
      ctx.body = tools.commons.resReturn(null, 200, '更新任务状态成功');
    } catch (err) {
      ctx.body = tools.commons.resReturn(null, 400, err.message);
    }
  }
}

module.exports = logController;
