const mongoose = require('mongoose');

/**
 * 所有的model都需要继承baseModel, 且需要 getSchema和getName方法，不然会报错
 */

class baseModel {
  constructor() {
    this.schema = new mongoose.Schema(this.getSchema()); // 声明模式类型
    this.name = this.getName();

    this.model = mongoose.model(this.name, this.schema)
  }


  /**
   * 可通过覆盖此方法生成其他自增字段
   */
  getPrimaryKey() {
    return '_id';
  }

  /**
   * 获取collection的schema结构
   */
  getSchema() {
    console.log('Model Class need getSchema function', 'error');
  }

  getName() {
    console.log('Model Class need name', 'error');
  }
}

module.exports = baseModel;
