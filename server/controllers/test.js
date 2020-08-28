const testModel = require('../models/test.js');
const baseController = require('./base.js');
const tools = require('../utils/tools.js');

class testController extends baseController {
  constructor(ctx) {
    super(ctx);
    this.Model = tools.getInst(testModel); // 创建实例
  }

  async testGet(ctx) {
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
    result = tools.commons.fieldSelect(result, ['_id', 'username', 'age', 'address'])
    if (!result) {
      return (ctx.body = tools.commons.resReturn(null, 400, '数据未查到'));
    }
    return (ctx.body = tools.commons.resReturn(result, 200, '操作成功'));
  }

  // 创建数据
  async createSave(ctx) {
    try {
      let params = ctx.params;
      const { username } = params // ctx.request.body;
      if (!username) return (ctx.body = tools.commons.resReturn(null, 400, '用户名不能为空'));
      let checkRepeat = await this.Model.checkNameRepeat(username);
      if (checkRepeat > 0) {
        return (ctx.body = tools.commons.resReturn(null, 400, '已存在的用户名'));
      }

      let data = {
        ...params,
        create_time: tools.commons.time(),
        update_time: tools.commons.time(),
      };

      await this.Model.save(data); // 创建数据
      ctx.body = tools.commons.resReturn({});
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
      ctx.body = tools.commons.resReturn({});
    } catch (err) {
      ctx.body = tools.commons.resReturn(null, 400, err.message);
    }
  }

  // 删除指定数据
  async deleteById(ctx) {
    try {
      const { id } = ctx.params;
      if (!id) return (ctx.body = tools.commons.resReturn(null, 401, 'ID不能为空'));
      await this.Model.delete(id); // 删除数据
      ctx.body = tools.commons.resReturn({});
    } catch (err) {
      ctx.body = tools.commons.resReturn(null, 402, err.message);
    }
  }
}

module.exports = testController;
