// const mongoose = require('mongoose')
const baseModel = require('./base.js');

// 继承baseModel方法
class logModel extends baseModel {
  // 当前model名称
  getName() {
    return 'Log';
  }

  // 当前model内 类型处理
  getSchema() {
    return {
      "name": String, // 项目名称
      "projectId": String,// 项目ID
      "taskType": String, // 任务类型： 'BUILD'表示项目处理构建中，'DEFAULT'表示项目无任务状态 ， 'INSTALL'表示项目执行安装包中， 'DEPLOY'表示项目执行发布中
      "taskTypeName": String, // 任务类型描述名： '构建'表示项目处理构建中，'默认'表示项目无任务状态 ， '包安装'表示项目执行安装包中， '发布'表示项目执行发布中
      "taskState": String, // 任务执行状态：  'init'表示任务执行无状态, 'ing' 表示任务进行中，'success'表示任务执行成功， 'fail'表示任务执行失败
      "taskStateName": String,  // 任务执行状态描述名： '无状态', '进行中','执行成功'， 'fail执行失败 '，
      "createTime": String, // 任务创建时间
      "updateTime": String, // 任务更新时间
    }
  }

  // 保存
  save(data) {
    let test = new this.model(data);
    return test.save();
  }

  // 返回列表
  list(data) {
    return this.model
      .find(data)
      .select('_id name projectId  taskType taskTypeName taskState taskStateName createTime') // 取指定的字段
    // .exec(); //显示id name email role
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
      name: name
    });
  }
}

module.exports = logModel;
