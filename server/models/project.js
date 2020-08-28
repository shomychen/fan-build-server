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
// const projectModal = mongoose.model('Test', testSchma)
// module.exports = projectModal

// 继承baseModel方法
class projectModal extends baseModel {
  // 当前model名称
  getName() {
    return 'project';
  }

  // 当前model内 类型处理
  getSchema() {
    return {
      name: String, // 项目名称
      filePath: String, // 本地目录
      svnPath: String, // SVN 地址
      buildPath: String, // 打包路径，默认是 '/',决定部署指定目录
      deployFilePath: String, // 部署本地目录
      deploySvnPath: String,  // 部署SVN地址
      themeColor: String,     // 主题色
      siteTitle: String, // 站点名称
      localStorageName: String, // 本地存储资源名称
      logo: String, // LOGO图片(预留)
      logoName: String, // LOGO右侧文本(预留)
      favicon: String, // 站点ico(预留)
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
module.exports = projectModal;
