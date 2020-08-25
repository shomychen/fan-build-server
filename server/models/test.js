// const mongoose = require('mongoose')
const baseModel = require('./base.js');
/**
 * test(tests) Model
 *  测试
 */
// let testSchma = new mongoose.Schema({
//   username: String,
//   password: String,
//   age: Number,
//   address: String
// })
// const testModel = mongoose.model('Test', testSchma)
// module.exports = testModel

// 继承baseModel方法
class testModel extends baseModel {
  // 当前model名称
  getName() {
    return 'Test';
  }

  // 当前model内 类型处理
  getSchema() {
    return {
      username: String,
      password: String,
      age: Number,
      address: String
    }
  }
  // 保存
  save(data) {
    let test = new this.model(data);
    return test.save();
  }

  // 返回列表
  list() {
    return this.model
      .find()
      .select('_id username age address password') // 取指定的字段
      // .exec(); //显示id name email role
  }
  // 通过username名称查找
  findByUsername(name) {
    return this.model.findOne({
      username: name
    });
  }
  // 通过 id 查找
  findById(id) {
    return this.model.findOne({
      _id: id
    });
  }
  // 删除
  delete(id) {
    return this.model.deleteOne({
      _id: id
    });
  }
  // 更新
  update(id, data) {
    return this.model.updateOne(
      {
        _id: id
      },
      data
    );
  }
  // 判断名称是否唯一性
  checkNameRepeat(name) {
    return this.model.countDocuments({
      username: name
    });
  }
}
module.exports = testModel;
