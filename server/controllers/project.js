const projectModel = require('../models/project.js');
const baseController = require('./base.js');
const tools = require('../utils/tools.js');

class projectController extends baseController {
  constructor(ctx) {
    super(ctx);
    this.Model = tools.getInst(projectModel); // 创建实例
  }

  async fetchPage(ctx) {
    let result = await this.Model.list() // 查询列表信息
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

  // 创建数据
  async createSave(ctx) {
    try {
      let params = ctx.params;
      const { name, filePath } = params // ctx.request.body;
      if (!name) name (ctx.body = tools.commons.resReturn(null, 400, '项目名称不能为空'));
      if (!filePath) name (ctx.body = tools.commons.resReturn(null, 400, '项目目录不能为空'));
      let checkRepeat = await this.Model.checkNameRepeat(name);
      if (checkRepeat > 0) {
        return (ctx.body = tools.commons.resReturn(null, 400, '已存在的项目名称'));
      }

      let data = {
        ...params,
        create_time: tools.commons.time(),
        update_time: tools.commons.time(),
      };

      await this.Model.save(data); // 创建数据
      ctx.body = tools.commons.resReturn(null, 200, '新增成功');
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
        update_time: tools.commons.time(),
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
        update_time: tools.commons.time(),
      };
      await this.Model.update(id, data); // 更新数据
      ctx.body = tools.commons.resReturn(null, 200, '更新任务状态成功');
    } catch (err) {
      ctx.body = tools.commons.resReturn(null, 400, err.message);
    }
  }
}

module.exports = projectController;
